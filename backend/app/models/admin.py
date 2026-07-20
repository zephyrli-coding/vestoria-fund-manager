"""Admin model."""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.db import Base


class Admin(Base):
    """Admin model."""

    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    auth_user_id = Column(String(36), nullable=True, unique=True, index=True)
    username = Column(String(50), nullable=True, unique=True, index=True)
    email = Column(String(255), nullable=True, unique=True, index=True)
    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
