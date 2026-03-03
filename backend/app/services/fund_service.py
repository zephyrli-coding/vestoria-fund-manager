    def update_nav(self, fund_id: int, capital: float, date: str) -> Dict[str, any]:
        """Update fund NAV and create history record."""
        from app.repositories.investor_repo import InvestorRepository

        fund = self.get_fund(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        if capital <= 0:
            raise ValueError("Capital must be greater than 0")

        # Check if fund has investors and shares
        if not fund.investors or fund.total_share == 0:
            raise ValueError("Cannot update NAV: Fund has no investors or total shares is 0")

        old_nav = fund.net_asset_value
        old_balance = fund.balance

        # Calculate new NAV
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