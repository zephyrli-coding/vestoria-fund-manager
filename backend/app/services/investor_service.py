"""Investor business logic service."""
from typing import Optional, List, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.fund import Fund
from app.models.investor import Investor
from app.models.operation import Operation
from app.repositories.investor_repo import InvestorRepository
from app.repositories.fund_repo import FundRepository
from app.repositories.operation_repo import OperationRepository


class InvestorService:
    """Service for investor business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.investor_repo = InvestorRepository(db)
        self.fund_repo = FundRepository(db)
        self.operation_repo = OperationRepository(db)

    def add_investor(self, fund_id: int, name: str, date: str) -> Investor:
        """Add a new investor to a fund."""
        # Check if fund exists
        fund = self.fund_repo.get_by_id(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        # Check if investor name exists in this fund
        existing = self.investor_repo.get_by_fund_and_name(fund_id, name)
        if existing:
            raise ValueError(f"Investor '{name}' already exists in this fund")

        # Create investor
        investor = self.investor_repo.create(fund_id, name)
        investor.balance = round(investor.share * fund.net_asset_value, 6)
        self.db.commit()

        # Record operation
        self.operation_repo.create(
            fund_id=fund_id,
            investor_id=investor.id,
            operation_type="add_investor",
            operation_date=date
        )

        return investor

    def get_investor(self, fund_id: int, investor_id: int) -> Optional[Investor]:
        """Get investor by ID."""
        investor = self.investor_repo.get_by_id(investor_id)
        if not investor or investor.fund_id != fund_id:
            return None
        return investor

    def list_investors(self, fund_id: int, skip: int = 0, limit: int = 20) -> Dict[str, any]:
        """List all investors in a fund."""
        investors = self.investor_repo.get_by_fund(fund_id, skip=skip, limit=limit)
        total = self.investor_repo.count_by_fund(fund_id)
        return {
            "items": investors,
            "total": total,
            "page": skip // limit + 1,
            "page_size": limit
        }

    def update_investor(self, fund_id: int, investor_id: int, name: str) -> Investor:
        """Update investor name."""
        investor = self.get_investor(fund_id, investor_id)
        if not investor:
            raise ValueError("Investor not found")

        # Check if name already exists
        existing = self.investor_repo.get_by_fund_and_name(fund_id, name)
        if existing and existing.id != investor_id:
            raise ValueError(f"Investor '{name}' already exists in this fund")

        return self.investor_repo.update(investor, name=name)

    def invest(self, fund_id: int, investor_id: int, amount: float, date: str) -> Dict[str, any]:
        """Investor invests in the fund."""
        # Get fund and investor
        fund = self.fund_repo.get_by_id(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        investor = self.get_investor(fund_id, investor_id)
        if not investor:
            raise ValueError("Investor not found")

        # Calculate shares
        nav = fund.net_asset_value
        share = round(amount / nav, 6) if fund.total_share != 0 else round(amount, 6)

        # Update investor
        new_share = round(investor.share + share, 6)
        self.investor_repo.update_share(investor, new_share)

        # Update fund total share
        new_fund_total_share = round(fund.total_share + share, 6)
        self.fund_repo.update(fund, total_share=new_fund_total_share)

        # Update investor balance
        investor.balance = round(new_share * nav, 6)
        self.db.commit()

        # Record operation
        self.operation_repo.create(
            fund_id=fund_id,
            investor_id=investor_id,
            operation_type="invest",
            operation_date=date,
            amount=amount,
            share=share,
            nav_before=nav,
            nav_after=nav,
            total_share_before=fund.total_share,
            total_share_after=new_fund_total_share,
            balance_before=fund.balance,
            balance_after=fund.balance
        )

        return {
            "investor_id": investor_id,
            "fund_id": fund_id,
            "investor_name": investor.name,
            "invested_amount": amount,
            "new_share": new_share,
            "fund_total_share": new_fund_total_share,
            "fund_nav": nav
        }

    def redeem(
        self,
        fund_id: int,
        investor_id: int,
        amount: float,
        amount_type: str,
        date: str
    ) -> Dict[str, any]:
        """Investor redeems shares or balance."""
        # Get fund and investor
        fund = self.fund_repo.get_by_id(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        investor = self.get_investor(fund_id, investor_id)
        if not investor:
            raise ValueError("Investor not found")

        if investor.share <= 0:
            raise ValueError("Investor has no shares to redeem")

        nav = fund.net_asset_value
        investor_balance = investor.share * nav

        # Calculate redemption
        if amount_type == "share":
            if investor.share < amount:
                amount = investor.share
            redeem_share = amount
            redeem_balance = round(redeem_share * nav, 6)
        else:  # balance
            if investor_balance < amount:
                amount = investor_balance
            redeem_balance = amount
            redeem_share = round(redeem_balance / nav, 6)

        # Update investor
        new_investor_share = round(investor.share - redeem_share, 6)
        self.investor_repo.update_share(investor, new_investor_share)

        # Update fund total share
        new_fund_total_share = round(fund.total_share - redeem_share, 6)
        self.fund_repo.update(fund, total_share=new_fund_total_share)

        # Update investor balance
        investor.balance = round(new_investor_share * nav, 6)
        self.db.commit()

        # Record operation
        self.operation_repo.create(
            fund_id=fund_id,
            investor_id=investor_id,
            operation_type="redeem",
            operation_date=date,
            amount=redeem_balance,
            amount_type=amount_type,
            share=redeem_share,
            nav_before=nav,
            nav_after=nav,
            total_share_before=fund.total_share,
            total_share_after=new_fund_total_share,
            balance_before=fund.balance,
            balance_after=fund.balance
        )

        return {
            "investor_id": investor_id,
            "fund_id": fund_id,
            "investor_name": investor.name,
            "redeemed_share": redeem_share,
            "redeemed_balance": redeem_balance,
            "new_share": new_investor_share,
            "fund_total_share": new_fund_total_share,
            "fund_nav": nav
        }

    def transfer(
        self,
        fund_id: int,
        from_investor_id: int,
        to_investor_id: int,
        amount: float,
        amount_type: str,
        date: str
    ) -> Dict[str, any]:
        """Transfer shares between investors."""
        # Get fund
        fund = self.fund_repo.get_by_id(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        # Get investors
        from_investor = self.get_investor(fund_id, from_investor_id)
        if not from_investor:
            raise ValueError("Source investor not found")

        to_investor = self.get_investor(fund_id, to_investor_id)
        if not to_investor:
            raise ValueError("Target investor not found")

        nav = fund.net_asset_value
        from_balance = from_investor.share * nav

        # Calculate transfer
        if amount_type == "share":
            if from_investor.share < amount:
                raise ValueError("Insufficient shares to transfer")
            transfer_share = amount
            transfer_balance = round(transfer_share * nav, 6)
        else:  # balance
            if from_balance < amount:
                raise ValueError("Insufficient balance to transfer")
            transfer_balance = amount
            transfer_share = round(transfer_balance / nav, 6)

        # Update investors
        from_new_share = round(from_investor.share - transfer_share, 6)
        to_new_share = round(to_investor.share + transfer_share, 6)

        self.investor_repo.update_share(from_investor, from_new_share)
        self.investor_repo.update_share(to_investor, to_new_share)

        # Update balances
        from_investor.balance = round(from_new_share * nav, 6)
        to_investor.balance = round(to_new_share * nav, 6)
        self.db.commit()

        # Record operation
        self.operation_repo.create(
            fund_id=fund_id,
            investor_id=from_investor_id,
            operation_type="transfer",
            operation_date=date,
            amount=transfer_balance,
            amount_type=amount_type,
            share=transfer_share,
            nav_before=nav,
            nav_after=nav,
            total_share_before=fund.total_share,
            total_share_after=fund.total_share,
            balance_before=fund.balance,
            balance_after=fund.balance,
            transfer_from_id=from_investor_id,
            transfer_to_id=to_investor_id
        )

        return {
            "fund_id": fund_id,
            "from_investor_id": from_investor_id,
            "from_investor_name": from_investor.name,
            "to_investor_id": to_investor_id,
            "to_investor_name": to_investor.name,
            "transferred_share": transfer_share,
            "transferred_balance": transfer_balance,
            "from_new_share": from_new_share,
            "to_new_share": to_new_share
        }

    def get_operations(
        self,
        fund_id: int,
        investor_id: Optional[int] = None,
        operation_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, any]:
        """Get operations with filters."""
        operations = self.operation_repo.get_by_fund(
            fund_id=fund_id,
            operation_type=operation_type,
            investor_id=investor_id,
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=limit
        )
        total = self.operation_repo.count_by_fund(
            fund_id=fund_id,
            operation_type=operation_type,
            investor_id=investor_id
        )
        return {
            "items": operations,
            "total": total,
            "page": skip // limit + 1,
            "page_size": limit
        }
