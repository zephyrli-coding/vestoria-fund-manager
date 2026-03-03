"""Operation model."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class Operation(Base):
    """Operation model for recording fund operations."""

    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    investor_id = Column(Integer, ForeignKey("investors.id"), nullable=True)
    operation_type = Column(String(20), nullable=False, index=True)  # invest, redeem, transfer, update_nav, add_investor
    operation_date = Column(String(10), nullable=False)
    amount = Column(Float, nullable=True)
    amount_type = Column(String(10), nullable=True)  # share, balance
    share = Column(Float, nullable=True)
    nav_before = Column(Float, nullable=True)
    nav_after = Column(Float, nullable=True)
    total_share_before = Column(Float, nullable=True)
    total_share_after = Column(Float, nullable=True)
    balance_before = Column(Float, nullable=True)
    balance_after = Column(Float, nullable=True)
    transfer_from_id = Column(Integer, ForeignKey("investors.id"), nullable=True)
    transfer_to_id = Column(Integer, ForeignKey("investors.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    fund = relationship("Fund", back_populates="operations")
    investor = relationship("Investor", foreign_keys=[investor_id])
    transfer_from = relationship("Investor", foreign_keys=[transfer_from_id])
    transfer_to = relationship("Investor", foreign_keys=[transfer_to_id])
