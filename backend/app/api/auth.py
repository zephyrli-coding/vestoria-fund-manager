"""Authentication API routes."""
import os
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.auth import CallbackResponse, MeResponse
from app.schemas.common import ResponseModel
from app.auth_client import get_auth_user_id
from app.models.admin import Admin

router = APIRouter()

http_bearer = HTTPBearer(auto_error=False)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:20263")
AUTH_CLIENT_ID = os.getenv("AUTH_CLIENT_ID", "vestoria")
AUTH_CLIENT_SECRET = os.getenv("AUTH_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:20260")


def get_current_admin(
    token: HTTPAuthorizationCredentials = Security(http_bearer),
    db: Session = Depends(get_db),
) -> Admin:
    """Get current admin from auth-service JWT token."""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_user_id = get_auth_user_id(token.credentials)
    if auth_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin = db.query(Admin).filter(Admin.auth_user_id == str(auth_user_id)).first()
    if admin is None or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
        )
    return admin


@router.post("/callback", response_model=ResponseModel[CallbackResponse])
def auth_callback(code: str, db: Session = Depends(get_db)):
    """Exchange OAuth authorization code for tokens and upsert local admin."""
    if not AUTH_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth client secret not configured",
        )

    redirect_uri = f"{FRONTEND_URL}/auth/callback"
    token_res = httpx.post(
        f"{AUTH_SERVICE_URL}/oauth/token",
        json={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": AUTH_CLIENT_ID,
            "client_secret": AUTH_CLIENT_SECRET,
        },
        timeout=10.0,
    )
    if token_res.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code",
        )

    tokens = token_res.json()
    access_token = tokens["access_token"]

    userinfo_res = httpx.get(
        f"{AUTH_SERVICE_URL}/oauth/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10.0,
    )
    if userinfo_res.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch user info",
        )

    userinfo = userinfo_res.json()
    auth_user_id = UUID(userinfo["sub"])
    email = userinfo["email"]
    nickname = userinfo.get("nickname")

    admin = db.query(Admin).filter(Admin.auth_user_id == str(auth_user_id)).first()
    if not admin:
        username = nickname or f"{email.split('@')[0]}-{uuid4().hex[:6]}"
        admin = Admin(
            auth_user_id=str(auth_user_id),
            username=username,
            email=email,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    else:
        if admin.email != email:
            admin.email = email
            db.commit()
            db.refresh(admin)

    return ResponseModel(
        data=CallbackResponse(
            access_token=access_token,
            refresh_token=tokens.get("refresh_token"),
            token_type=tokens.get("token_type", "bearer"),
            expires_in=tokens.get("expires_in", 1800),
            user=MeResponse(
                id=admin.id,
                username=admin.username,
                email=admin.email,
                created_at=admin.created_at.isoformat(),
            ),
        )
    )


@router.get("/me", response_model=ResponseModel[MeResponse])
def get_me(current_admin: Admin = Depends(get_current_admin)):
    """Get current admin info."""
    return ResponseModel(
        data=MeResponse(
            id=current_admin.id,
            username=current_admin.username,
            email=current_admin.email,
            created_at=current_admin.created_at.isoformat(),
        )
    )


@router.post("/logout")
def logout():
    """Logout (client-side token removal)."""
    return ResponseModel(data={"message": "Logged out"})
