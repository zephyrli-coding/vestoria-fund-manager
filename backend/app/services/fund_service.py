"""Fund business logic service."""
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.models.fund import Fund, FundHistory
from app.models.operation import Operation
from app.models.investor_return_snapshot import InvestorReturnSnapshot
from app.repositories.fund_repo import FundRepository
from app.repositories.operation_repo import OperationRepository
from app.schemas.fund import UpdateNavRequest


class FundService:
    """Service for fund business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.fund_repo = FundRepository(db)
        self.operation_repo = OperationRepository(db)

    def create_fund(self, name: str, start_date: str, currency: str = 'CNY', tags: str = '') -> Fund:
        """Create a new fund."""
        # Check if fund name exists
        existing = self.fund_repo.get_by_name(name)
        if existing:
            raise ValueError(f"Fund with name '{name}' already exists")

        return self.fund_repo.create(name, start_date, currency, tags)

    def get_fund(self, fund_id: int) -> Optional[Fund]:
        """Get fund by ID."""
        return self.fund_repo.get_by_id(fund_id)

    def list_funds(self, skip: int = 0, limit: int = 20, tag: str = None) -> Dict[str, any]:
        """List all funds with pagination and optional tag filter."""
        funds = self.fund_repo.get_all(skip=skip, limit=limit, tag=tag)
        total = self.fund_repo.count()
        return {
            "items": funds,
            "total": total,
            "page": skip // limit + 1,
            "page_size": limit
        }

    def update_fund(self, fund_id: int, name: str, currency: str = None, tags: str = None) -> Fund:
        """Update fund name, currency, and/or tags."""
        fund = self.get_fund(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        # Check if name already exists
        if name != fund.name:
            existing = self.fund_repo.get_by_name(name)
            if existing and existing.id != fund_id:
                raise ValueError(f"Fund with name '{name}' already exists")

        # Build update kwargs
        kwargs = {'name': name}
        if currency is not None:
            kwargs['currency'] = currency
        if tags is not None:
            kwargs['tags'] = tags

        return self.fund_repo.update(fund, **kwargs)

    def delete_fund(self, fund_id: int) -> None:
        """Delete a fund."""
        fund = self.get_fund(fund_id)
        if not fund:
            raise ValueError("Fund not found")
        self.fund_repo.delete(fund)

    def update_nav(self, fund_id: int, capital: float, date: str, target_nav: float = None) -> Dict[str, any]:
        """Update fund NAV and create history record.
        
        Args:
            fund_id: Fund ID
            capital: Total capital (used to calculate balance)
            date: Date string
            target_nav: If provided, use this NAV directly instead of calculating from capital
        """
        from app.repositories.investor_repo import InvestorRepository

        fund = self.get_fund(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        if capital <= 0 and target_nav is None:
            raise ValueError("Capital must be greater than 0")

        # Check if fund has investors and shares
        if not fund.investors or fund.total_share == 0:
            raise ValueError("Cannot update NAV: Fund has no investors or total shares is 0")

        old_nav = fund.net_asset_value
        old_balance = fund.balance

        # Calculate new NAV
        if target_nav is not None:
            # Use provided target_nav directly
            new_nav = round(target_nav, 6)
            new_balance = round(fund.total_share * new_nav, 6)
        else:
            # Calculate from capital
            new_nav = round(capital / fund.total_share, 6)
            new_balance = capital

        # Update fund
        self.fund_repo.update_nav(fund, new_nav, new_balance)

        # Update all investor balances
        investor_repo = InvestorRepository(self.db)
        for investor in fund.investors:
            investor.balance = round(investor.share * new_nav, 6)
        self.db.commit()

        # Create history record
        self.fund_repo.create_history(
            fund_id=fund_id,
            history_date=date,
            total_share=fund.total_share,
            nav=new_nav,
            balance=new_balance
        )

        # Create investor return snapshots
        for investor in fund.investors:
            total_return = round(investor.share * new_nav + investor.total_redeemed - investor.total_invested, 6)
            snapshot = InvestorReturnSnapshot(
                investor_id=investor.id,
                fund_id=fund_id,
                date=date,
                nav=new_nav,
                share=investor.share,
                total_invested=investor.total_invested,
                total_redeemed=investor.total_redeemed,
                total_return=total_return
            )
            self.db.add(snapshot)
        self.db.commit()

        # Record operation
        self.operation_repo.create(
            fund_id=fund_id,
            investor_id=None,
            operation_type="update_nav",
            operation_date=date,
            nav_before=old_nav,
            nav_after=new_nav,
            balance_before=old_balance,
            balance_after=new_balance,
            total_share_before=fund.total_share,
            total_share_after=fund.total_share
        )

        return {
            "fund_id": fund_id,
            "old_nav": old_nav,
            "new_nav": new_nav,
            "old_balance": old_balance,
            "new_balance": new_balance,
            "total_share": fund.total_share
        }

    def get_history(
        self,
        fund_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, any]:
        """Get fund history."""
        histories = self.fund_repo.get_history(
            fund_id=fund_id,
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=limit
        )
        total = self.fund_repo.count_history(fund_id)
        return {
            "items": histories,
            "total": total,
            "page": skip // limit + 1,
            "page_size": limit
        }

    def get_chart_data(
        self,
        fund_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, List[Dict]]:
        """Get chart data for visualization."""
        histories = self.fund_repo.get_chart_data(fund_id, start_date, end_date)

        return {
            "nav": [{"date": h.history_date, "value": h.net_asset_value} for h in histories],
            "balance": [{"date": h.history_date, "value": h.balance} for h in histories],
            "share": [{"date": h.history_date, "value": h.total_share} for h in histories]
        }
