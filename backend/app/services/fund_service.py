"""Fund business logic service."""
from typing import Optional, List, Dict
from decimal import Decimal
from datetime import date
from app.services.exchange_rates import get_rate_snapshot, converted, money_value
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.transactions import atomic, commit_or_flush
from app.services.validation import validate_day, validate_name, validate_currency, positive_number, rounded
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

    @atomic
    def create_fund(self, name: str, start_date: str, currency: str = 'CNY', tags: str = '') -> Fund:
        """Create a new fund."""
        validate_name(name, "Fund name")
        validate_day(start_date, "Start date")
        validate_currency(currency)
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
        from app.models.investor import Investor
        
        funds = self.fund_repo.get_all(skip=skip, limit=limit, tag=tag)
        
        # Load counts once for this page rather than issuing one query per fund.
        counts = dict(self.db.query(Investor.fund_id, func.count(Investor.id))
                      .filter(Investor.fund_id.in_([fund.id for fund in funds]))
                      .group_by(Investor.fund_id).all()) if funds else {}
        for fund in funds:
            fund.investor_count = counts.get(fund.id, 0)

        total = self.fund_repo.count(tag=tag)
        return {
            "items": funds,
            "total": total,
            "page": skip // limit + 1,
            "page_size": limit
        }

    @atomic
    def update_fund(self, fund_id: int, name: str, currency: str = None, tags: str = None, start_date: str = None) -> Fund:
        """Update fund metadata without changing recorded balances."""
        validate_name(name, "Fund name")
        if start_date is not None:
            validate_day(start_date, "Start date")
        if currency is not None:
            validate_currency(currency)
        fund = self.get_fund(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        if currency is not None and currency != fund.currency:
            # A metadata edit must never relabel an existing ledger retrospectively.
            recorded = any((
                self.db.query(model).filter(model.fund_id == fund_id).first() is not None
                for model in (FundHistory, Operation, InvestorReturnSnapshot)
            ))
            if recorded or fund.balance != 0 or fund.total_share != 0:
                raise ValueError("已有账务记录的基金不能更改记账币种；请新建另一币种基金")

        # Check if name already exists
        if name != fund.name:
            existing = self.fund_repo.get_by_name(name)
            if existing and existing.id != fund_id:
                raise ValueError(f"Fund with name '{name}' already exists")

        # Build update kwargs
        kwargs = {'name': name}
        if start_date is not None:
            kwargs['start_date'] = start_date
        if currency is not None:
            kwargs['currency'] = currency
        if tags is not None:
            kwargs['tags'] = tags

        return self.fund_repo.update(fund, **kwargs)

    @atomic
    def delete_fund(self, fund_id: int) -> None:
        """Delete a fund."""
        fund = self.get_fund(fund_id)
        if not fund:
            raise ValueError("Fund not found")
        self.fund_repo.delete(fund)

    @atomic
    def update_nav(self, fund_id: int, capital: float, date: str, target_nav: float = None) -> Dict[str, any]:
        """Update fund NAV and create history record.
        
        Args:
            fund_id: Fund ID
            capital: Total capital (used to calculate balance)
            date: Date string
            target_nav: If provided, use this NAV directly instead of calculating from capital
        """
        from app.models.investor import Investor

        validate_day(date)
        if target_nav is not None:
            positive_number(target_nav, "NAV")
        else:
            positive_number(capital, "Capital")

        fund = self.get_fund(fund_id)
        if not fund:
            raise ValueError("Fund not found")

        if capital <= 0 and target_nav is None:
            raise ValueError("Capital must be greater than 0")

        # Query explicitly: an import can add investors after an earlier NAV update.
        investors = self.db.query(Investor).filter(Investor.fund_id == fund_id).all()
        if not investors or fund.total_share <= 0:
            raise ValueError("Cannot update NAV: Fund has no investors or total shares is 0")

        old_nav = fund.net_asset_value
        old_balance = fund.balance

        # Calculate new NAV
        if target_nav is not None:
            # Use provided target_nav directly
            new_nav = rounded(target_nav)
            new_balance = rounded(fund.total_share * new_nav)
        else:
            # Calculate from capital
            new_nav = rounded(capital / fund.total_share)
            new_balance = capital

        positive_number(new_nav, "NAV at six-decimal precision")

        # Update fund
        self.fund_repo.update_nav(fund, new_nav, new_balance)

        # Update all investor balances
        for investor in investors:
            investor.balance = rounded(investor.share * new_nav)
        commit_or_flush(self.db)

        # Create history record
        self.fund_repo.create_history(
            fund_id=fund_id,
            history_date=date,
            total_share=fund.total_share,
            nav=new_nav,
            balance=new_balance
        )

        # Match FundHistory semantics: one closing snapshot per investor/date.
        self.db.query(InvestorReturnSnapshot).filter(
            InvestorReturnSnapshot.fund_id == fund_id,
            InvestorReturnSnapshot.date == date
        ).delete(synchronize_session="fetch")

        # Create investor return snapshots
        for investor in investors:
            total_return = rounded(investor.share * new_nav + investor.total_redeemed - investor.total_invested)
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
        commit_or_flush(self.db)

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
        total = self.fund_repo.count_history(fund_id, start_date, end_date)
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

    def get_aggregated_chart_data(
        self,
        tag: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, List[Dict]]:
        """Get aggregated chart data across funds (optionally filtered by tag)."""
        for value in (start_date, end_date):
            if value:
                date.fromisoformat(value)
        if start_date and end_date and start_date > end_date:
            raise ValueError("开始日期不能晚于结束日期")
        results = self.fund_repo.get_aggregated_chart_data(tag, start_date, end_date)
        rates = get_rate_snapshot()
        output = {"nav": [], "balance": [], "balance_usd": [], "share": [],
                  "fx": rates.metadata(), "missing_rate_dates": [], "rate_dates": {}}
        for row in results:
            reference = rates.on_or_before(row['date'])
            rate = Decimal(reference['rate']) if reference else None
            cny = Decimal(str(row['balance_cny']))
            usd = Decimal(str(row['balance_usd']))
            usd_as_cny = converted(usd, 'USD', 'CNY', rate)
            cny_as_usd = converted(cny, 'CNY', 'USD', rate)
            output['balance'].append({'date': row['date'], 'value': money_value(cny + usd_as_cny) if usd_as_cny is not None else None})
            output['balance_usd'].append({'date': row['date'], 'value': money_value(usd + cny_as_usd) if cny_as_usd is not None else None})
            if reference:
                output['rate_dates'][row['date']] = reference['rate_date']
            elif cny != 0 or usd != 0:
                output['missing_rate_dates'].append(row['date'])
        return output

    def get_valuation(self, tag=None):
        rates = get_rate_snapshot()
        latest = rates.rows[-1] if rates.rows else None
        rate = Decimal(latest['rate']) if latest else None
        funds = self.fund_repo.get_all(limit=self.fund_repo.count(), tag=tag)
        items = []
        totals = {'CNY': Decimal(0), 'USD': Decimal(0)}
        native = {'CNY': Decimal(0), 'USD': Decimal(0)}
        for fund in funds:
            native[fund.currency] += Decimal(str(fund.balance))
            item = {'id': fund.id}
            for target in ('CNY', 'USD'):
                value = converted(fund.balance, fund.currency, target, rate)
                item[target] = money_value(value)
                if value is None:
                    totals[target] = None
                elif totals[target] is not None:
                    totals[target] += Decimal(str(item[target]))
            items.append(item)
        return {'fx': rates.metadata(), 'items': items,
                'totals': {k: money_value(v) for k, v in totals.items()},
                'native_totals': {k: money_value(v) for k, v in native.items()}}
