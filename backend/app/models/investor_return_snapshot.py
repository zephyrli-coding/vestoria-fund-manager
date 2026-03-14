"""Investor return snapshot model for tracking historical returns."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class InvestorReturnSnapshot(Base):
    """Snapshot of investor's return at a specific date.
    
    Generated when NAV is updated to track historical performance.
    """
    __tablename__ = "investor_return_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investor_id = Column(Integer, ForeignKey("investors.id"), nullable=False, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    
    # Investor state at this date
    nav = Column(Float, nullable=False)  # Fund NAV on this date
    share = Column(Float, nullable=False)  # Investor's shares
    total_invested = Column(Float, nullable=False, default=0.0)  # Cumulative invested
    total_redeemed = Column(Float, nullable=False, default=0.0)  # Cumulative redeemed
    
    # Calculated return
    total_return = Column(Float, nullable=False, default=0.0)  # share * nav + total_redeemed - total_invested
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    investor = relationship("Investor", back_populates="return_snapshots")
    fund = relationship("Fund", back_populates="investor_snapshots")

    # Composite index for efficient queries
    __table_args__ = (
        Index('ix_snapshot_investor_date', 'investor_id', 'date'),
        Index('ix_snapshot_fund_date', 'fund_id', 'date'),
    )
