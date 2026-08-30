"""Authentication API routes using server-side BFF sessions."""
import os
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.auth_client import decode_auth_token
from app.db import get_db
from app.models.admin import Admin
from app.schemas.auth import CallbackResponse, MeResponse
from app.schemas.common import ResponseModel
from app.session import (
    SESSION_COOKIE_NAME,
    clear_session_cookies,
    require_csrf,
    session_store,
    set_session_cookies,
)

router = APIRouter()

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:20263")
AUTH_CLIENT_ID = os.getenv("AUTH_CLIENT_ID", "vestoria")
AUTH_CLIENT_SECRET = os.getenv("AUTH_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:20260")
GLOBAL_ADMIN = "auth-service:admin"
VIEWER_ROLES = {"vestoria:viewer", "vestoria:editor", "vestoria:user", "vestoria:admin"}
EDITOR_ROLES = {"vestoria:editor", "vestoria:admin"}


def _role_flags(userinfo: dict) -> tuple[bool, bool]:
    roles = set(userinfo.get("roles", []))
    global_admin = GLOBAL_ADMIN in roles or userinfo.get("is_superuser", False)
    return global_admin or bool(roles & VIEWER_ROLES), global_admin or bool(roles & EDITOR_ROLES)


def _refresh_session(session_id: str, session_data: dict) -> dict:
    if not session_data.get("refresh_token"):
        session_store.delete(session_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    try:
        response = httpx.post(
            f"{AUTH_SERVICE_URL}/oauth/token",
            json={
                "grant_type": "refresh_token",
                "refresh_token": session_data["refresh_token"],
                "client_id": AUTH_CLIENT_ID,
                "client_secret": AUTH_CLIENT_SECRET,
            },
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        ) from exc
    if response.status_code != 200:
        session_store.delete(session_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    tokens = response.json()
    session_data["access_token"] = tokens["access_token"]
    session_data["refresh_token"] = tokens.get("refresh_token", session_data["refresh_token"])
    session_store.save(session_id, session_data)
    return session_data


def _load_userinfo(request: Request) -> tuple[str, dict, dict]:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    session_data = session_store.get(session_id)
    if not session_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    try:
        payload = decode_auth_token(session_data["access_token"])
    except (JWTError, KeyError):
        session_data = _refresh_session(session_id, session_data)
        try:
            payload = decode_auth_token(session_data["access_token"])
        except (JWTError, KeyError) as exc:
            session_store.delete(session_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            ) from exc

    def fetch_userinfo() -> httpx.Response:
        try:
            return httpx.get(
                f"{AUTH_SERVICE_URL}/oauth/userinfo",
                headers={"Authorization": f"Bearer {session_data['access_token']}"},
                timeout=10.0,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            ) from exc

    userinfo_response = fetch_userinfo()
    if userinfo_response.status_code == 401:
        session_data = _refresh_session(session_id, session_data)
        payload = decode_auth_token(session_data["access_token"])
        userinfo_response = fetch_userinfo()
    if userinfo_response.status_code != 200:
        if userinfo_response.status_code < 500:
            session_store.delete(session_id)
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
                if userinfo_response.status_code < 500
                else status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail="Unable to validate session",
        )

    userinfo = userinfo_response.json()
    if str(payload.get("sub")) != str(userinfo.get("sub")):
        session_store.delete(session_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return session_id, session_data, userinfo


def get_current_admin(
    request: Request,
    db: Session = Depends(get_db),
) -> Admin:
    """Resolve a local user and enforce viewer/editor permissions."""
    _, session_data, userinfo = _load_userinfo(request)
    if not userinfo.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required",
        )

    can_view, can_edit = _role_flags(userinfo)
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Fund access required")
    if request.method not in {"GET", "HEAD", "OPTIONS"} and not can_edit:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Fund editor role required")
    require_csrf(request, session_data)

    admin = db.query(Admin).filter(Admin.auth_user_id == str(userinfo["sub"])).first()
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    admin.role = "editor" if can_edit else "viewer"
    admin.can_edit = can_edit
    return admin


@router.post("/callback", response_model=ResponseModel[CallbackResponse])
def auth_callback(code: str, response: Response, db: Session = Depends(get_db)):
    """Exchange an OAuth code server-side and establish a BFF session."""
    if not AUTH_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth client secret not configured",
        )

    redirect_uri = f"{FRONTEND_URL}/auth/callback"
    try:
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
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        ) from exc
    if token_res.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth exchange failed")

    tokens = token_res.json()
    try:
        userinfo_res = httpx.get(
            f"{AUTH_SERVICE_URL}/oauth/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        ) from exc
    if userinfo_res.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to load user")

    userinfo = userinfo_res.json()
    if not userinfo.get("email_verified", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email verification required")
    can_view, can_edit = _role_flags(userinfo)
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Fund access required")

    auth_user_id = UUID(userinfo["sub"])
    email = userinfo["email"]
    nickname = userinfo.get("nickname")
    claimed_by_email = False
    admin = db.query(Admin).filter(Admin.auth_user_id == str(auth_user_id)).first()
    if not admin:
        admin = db.query(Admin).filter(Admin.email == userinfo["email"]).first()
        if admin:
            admin.auth_user_id = str(auth_user_id)
            claimed_by_email = True
    if not admin:
        base = nickname or email.split("@")[0]
        admin = Admin(
            auth_user_id=str(auth_user_id),
            username=f"{base}-{uuid4().hex[:6]}",
            email=email,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    elif claimed_by_email or admin.email != email:
        if admin.email != email:
            admin.email = email
        db.commit()
        db.refresh(admin)

    session_id, csrf_token = session_store.create(tokens)
    set_session_cookies(response, session_id, csrf_token)
    return ResponseModel(
        data=CallbackResponse(
            user=MeResponse(
                id=admin.id,
                username=admin.username,
                email=admin.email,
                created_at=admin.created_at.isoformat(),
                role="editor" if can_edit else "viewer",
                can_edit=can_edit,
            )
        )
    )


@router.get("/me", response_model=ResponseModel[MeResponse])
def get_me(current_admin: Admin = Depends(get_current_admin)):
    return ResponseModel(
        data=MeResponse(
            id=current_admin.id,
            username=current_admin.username,
            email=current_admin.email,
            created_at=current_admin.created_at.isoformat(),
            role=current_admin.role,
            can_edit=current_admin.can_edit,
        )
    )


@router.post("/logout")
def logout(request: Request, response: Response):
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        session_data = session_store.get(session_id)
        if session_data:
            require_csrf(request, session_data)
        session_store.delete(session_id)
    clear_session_cookies(response)
    return ResponseModel(data={"message": "Logged out"})
