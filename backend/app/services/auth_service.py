"""Authentication service."""
from datetime import datetime, timedelta
from typing import Optional
import bcrypt as _bcrypt
from jose import JWTError, jwt
from app.config import get_settings
from app.models.admin import Admin
from sqlalchemy.orm import Session

settings = get_settings()


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        try:
            return _bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except:
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password."""
        salt = _bcrypt.gensalt()
        hashed = _bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def create_access_token(data: dict) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """Verify JWT token and return username."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                return None
            return username
        except JWTError:
            return None

    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[Admin]:
        """Authenticate user by username and password."""
        admin = db.query(Admin).filter(Admin.username == username).first()
        if not admin:
            return None
        if not AuthService.verify_password(password, admin.password_hash):
            return None
        return admin
