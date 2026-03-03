"""Fund and FundHistory models."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class Fund(Base):
    """Fund model."""

    __tablename__ = "funds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    start_date = Column(String(10), nullable=False)
    total_share = Column(Float, nullable=False, default=0.0)
    net_asset_value = Column(Float, nullable=False, default=1.0)
    balance = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    investors = relationship("Investor", back_populates="fund", cascade="all, delete-orphan")
    operations = relationship("Operation", back_populates="fund", cascade="all, delete-orphan")
    history = relationship("FundHistory", back_populates="fund", cascade="all, delete-orphan")


class FundHistory(Base):
    """Fund history model for historical snapshots."""

    __tablename__ = "fund_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    history_date = Column(String(10), nullable=False)
    total_share = Column(Float, nullable=False)
    net_asset_value = Column(Float, nullable=False)
    balance = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    fund = relationship("Fund", back_populates="history")

    # Unique constraint: one record per fund per date
    __table_args__ = (UniqueConstraint("fund_id", "history_date", name="uq_fund_date"),)
