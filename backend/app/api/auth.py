"""Authentication API routes."""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse
from app.schemas.common import ResponseModel
from app.services.auth_service import AuthService
from app.models.admin import Admin

router = APIRouter()

# OAuth2PasswordBearer for Swagger UI authorization flow
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)
# HTTPBearer for direct Bearer token input in Swagger UI
http_bearer = HTTPBearer(auto_error=False)


def get_current_admin(
    token: HTTPAuthorizationCredentials = Security(http_bearer),
    db: Session = Depends(get_db)
) -> Admin:
    """Get current admin from JWT token."""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = AuthService.verify_token(token.credentials)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
        )
    return admin


@router.post("/login", response_model=ResponseModel[LoginResponse])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Admin login."""
    admin = AuthService.authenticate(db, request.username, request.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = AuthService.create_access_token(data={"sub": admin.username})

    return ResponseModel(
        data=LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=604800  # 7 days
        )
    )


@router.get("/me", response_model=ResponseModel[MeResponse])
def get_me(current_admin: Admin = Depends(get_current_admin)):
    """Get current admin info."""
    return ResponseModel(
        data=MeResponse(
            id=current_admin.id,
            username=current_admin.username,
            created_at=current_admin.created_at.isoformat()
        )
    )
