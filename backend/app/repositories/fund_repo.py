"""Fund repository for database operations."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.fund import Fund, FundHistory
from datetime import datetime


class FundRepository:
    """Repository for Fund and FundHistory models."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, name: str, start_date: str, currency: str = 'CNY') -> Fund:
        """Create a new fund."""
        fund = Fund(name=name, start_date=start_date, currency=currency)
        self.db.add(fund)
        self.db.commit()
        self.db.refresh(fund)
        return fund

    def get_by_id(self, fund_id: int) -> Optional[Fund]:
        """Get fund by ID."""
        return self.db.query(Fund).filter(Fund.id == fund_id).first()

    def get_by_name(self, name: str) -> Optional[Fund]:
        """Get fund by name."""
        return self.db.query(Fund).filter(Fund.name == name).first()

    def get_all(self, skip: int = 0, limit: int = 20, tag: str = None) -> List[Fund]:
        """Get all funds with pagination and optional tag filter."""
        query = self.db.query(Fund)
        if tag:
            query = query.filter(Fund.tags.like(f'%{tag}%'))
        return query.offset(skip).limit(limit).all()

    def count(self) -> int:
        """Count total funds."""
        return self.db.query(Fund).count()

    def update(self, fund: Fund, **kwargs) -> Fund:
        """Update fund."""
        for key, value in kwargs.items():
            if hasattr(fund, key):
                setattr(fund, key, value)
        fund.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(fund)
        return fund

    def delete(self, fund: Fund) -> None:
        """Delete fund."""
        self.db.delete(fund)
        self.db.commit()

    def update_nav(self, fund: Fund, nav: float, balance: float) -> Fund:
        """Update fund NAV and balance."""
        fund.net_asset_value = nav
        fund.balance = balance
        fund.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(fund)
        return fund

    # Fund History methods

    def create_history(
        self,
        fund_id: int,
        history_date: str,
        total_share: float,
        nav: float,
        balance: float
    ) -> FundHistory:
        """Create fund history record. If date already exists, update it."""
        # Check if history record already exists for this date
        existing = self.db.query(FundHistory).filter(
            FundHistory.fund_id == fund_id,
            FundHistory.history_date == history_date
        ).first()
        
        if existing:
            # Update existing record
            existing.total_share = total_share
            existing.net_asset_value = nav
            existing.balance = balance
            self.db.commit()
            self.db.refresh(existing)
            return existing
        
        # Create new record
        history = FundHistory(
            fund_id=fund_id,
            history_date=history_date,
            total_share=total_share,
            net_asset_value=nav,
            balance=balance
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)
        return history

    def get_history(
        self,
        fund_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[FundHistory]:
        """Get fund history with filters."""
        query = self.db.query(FundHistory).filter(FundHistory.fund_id == fund_id)

        if start_date:
            query = query.filter(FundHistory.history_date >= start_date)
        if end_date:
            query = query.filter(FundHistory.history_date <= end_date)

        return query.order_by(FundHistory.history_date).offset(skip).limit(limit).all()

    def count_history(self, fund_id: int) -> int:
        """Count fund history records."""
        return self.db.query(FundHistory).filter(FundHistory.fund_id == fund_id).count()

    def get_chart_data(
        self,
        fund_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[FundHistory]:
        """Get chart data for a fund."""
        query = self.db.query(FundHistory).filter(FundHistory.fund_id == fund_id)

        if start_date:
            query = query.filter(FundHistory.history_date >= start_date)
        if end_date:
            query = query.filter(FundHistory.history_date <= end_date)

        return query.order_by(FundHistory.history_date).all()
