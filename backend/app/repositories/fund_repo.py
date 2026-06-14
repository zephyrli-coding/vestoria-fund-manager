"""Fund repository for database operations."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, case
from app.models.fund import Fund, FundHistory
from datetime import datetime


class FundRepository:
    """Repository for Fund and FundHistory models."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, name: str, start_date: str, currency: str = 'CNY', tags: str = '') -> Fund:
        """Create a new fund."""
        fund = Fund(name=name, start_date=start_date, currency=currency, tags=tags)
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

    def get_aggregated_chart_data(
        self,
        tag: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[dict]:
        """Get aggregated chart data across all funds (or filtered by tag).

        Uses forward-fill logic: if a fund has no history record for a given date,
        its last known balance is carried forward. This prevents jumps in the
        aggregate chart caused by sparse per-fund history records.
        """
        from collections import defaultdict

        # 1. Get funds matching the tag filter
        funds_query = self.db.query(Fund)
        if tag:
            funds_query = funds_query.filter(Fund.tags.like(f'%{tag}%'))
        funds = funds_query.all()

        if not funds:
            return []

        fund_ids = [f.id for f in funds]
        fund_map = {f.id: f for f in funds}

        # 2. Get all history records for these funds
        hist_query = self.db.query(FundHistory).filter(
            FundHistory.fund_id.in_(fund_ids)
        )
        if start_date:
            hist_query = hist_query.filter(FundHistory.history_date >= start_date)
        if end_date:
            hist_query = hist_query.filter(FundHistory.history_date <= end_date)

        histories = hist_query.order_by(FundHistory.fund_id, FundHistory.history_date).all()

        if not histories:
            return []

        # 3. Build per-fund history lookup and find all dates
        fund_histories: dict[int, list[FundHistory]] = defaultdict(list)
        for h in histories:
            fund_histories[h.fund_id].append(h)

        all_dates = sorted({h.history_date for h in histories})

        # 4. Forward-fill: for each fund, compute balance for every date
        #    fund_id -> {date -> balance_in_cny}
        fund_balance_by_date: dict[int, dict[str, float]] = {}

        for fund_id, fh_list in fund_histories.items():
            fund = fund_map[fund_id]
            # Convert raw balance to CNY upfront
            rate = 6.9 if fund.currency == 'USD' else 1.0

            # Build date -> raw_balance lookup for this fund's explicit records
            explicit: dict[str, float] = {}
            for h in fh_list:
                explicit[h.history_date] = h.balance * rate

            # Forward-fill across all_dates
            filled: dict[str, float] = {}
            last_balance = 0.0
            for date in all_dates:
                if date in explicit:
                    last_balance = explicit[date]
                filled[date] = last_balance

            fund_balance_by_date[fund_id] = filled

        # 5. Also handle funds that have ZERO history records
        #    (they contribute 0 on every date)
        for fund in funds:
            if fund.id not in fund_balance_by_date:
                fund_balance_by_date[fund.id] = {d: 0.0 for d in all_dates}

        # 6. Aggregate by date
        results = []
        for date in all_dates:
            total_cny = sum(fund_balance_by_date[f.id][date] for f in funds)
            results.append({
                "date": date,
                "balance_cny": total_cny,
                "balance_usd": total_cny / 6.9,
                "total_share": 0.0,
            })

        return results
