"""Admin model."""
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db import Base


class Admin(Base):
    """Admin model."""

    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
