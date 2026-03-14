"""Investor model."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class Investor(Base):
    """Investor model."""

    __tablename__ = "investors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    name = Column(String(100), nullable=False)
    share = Column(Float, nullable=False, default=0.0)
    balance = Column(Float, nullable=False, default=0.0)
    total_invested = Column(Float, nullable=False, default=0.0)  # 累计投入
    total_redeemed = Column(Float, nullable=False, default=0.0)  # 累计赎回
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    fund = relationship("Fund", back_populates="investors")
    return_snapshots = relationship("InvestorReturnSnapshot", back_populates="investor", cascade="all, delete-orphan")

    # Unique constraint: one investor name per fund
    __table_args__ = (UniqueConstraint("fund_id", "name", name="uq_fund_investor"),)
