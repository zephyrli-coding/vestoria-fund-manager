"""Investor repository for database operations."""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.investor import Investor


class InvestorRepository:
    """Repository for Investor model."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, fund_id: int, name: str) -> Investor:
        """Create a new investor."""
        investor = Investor(fund_id=fund_id, name=name)
        self.db.add(investor)
        self.db.commit()
        self.db.refresh(investor)
        return investor

    def get_by_id(self, investor_id: int) -> Optional[Investor]:
        """Get investor by ID."""
        return self.db.query(Investor).filter(Investor.id == investor_id).first()

    def get_by_fund_and_name(self, fund_id: int, name: str) -> Optional[Investor]:
        """Get investor by fund ID and name."""
        return self.db.query(Investor).filter(
            Investor.fund_id == fund_id,
            Investor.name == name
        ).first()

    def get_by_fund(self, fund_id: int, skip: int = 0, limit: int = 20) -> List[Investor]:
        """Get all investors in a fund with pagination."""
        return self.db.query(Investor).filter(
            Investor.fund_id == fund_id
        ).offset(skip).limit(limit).all()

    def count_by_fund(self, fund_id: int) -> int:
        """Count investors in a fund."""
        return self.db.query(Investor).filter(Investor.fund_id == fund_id).count()

    def update(self, investor: Investor, **kwargs) -> Investor:
        """Update investor."""
        for key, value in kwargs.items():
            if hasattr(investor, key):
                setattr(investor, key, value)
        self.db.commit()
        self.db.refresh(investor)
        return investor

    def update_share(self, investor: Investor, share: float) -> Investor:
        """Update investor share and balance."""
        investor.share = share
        self.db.commit()
        self.db.refresh(investor)
        return investor

    def delete(self, investor: Investor) -> None:
        """Delete investor."""
        self.db.delete(investor)
        self.db.commit()
