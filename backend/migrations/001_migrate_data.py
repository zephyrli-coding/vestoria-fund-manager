"""Migrate data from pickle to SQLite."""
import pickle as pkl
import sys
import os
from datetime import datetime
from typing import Dict, List, Optional, Literal
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Fund, Investor, Operation, FundHistory


# ==================== Copied from utils/manage.py ====================
class Investor:
    def __init__(self, name: str):
        self.name = name
        self.share = 0.0


class PrivateFund:
    def __init__(self, name: str, date: str = None):
        self.name = name
        self.start_date = date if date else datetime.now().strftime('%Y-%m-%d')
        self.total_share = 0.0
        self.net_asset_value = 1.0
        self.investors: Dict[str, Investor] = {}
        self.history_operation = []

    def list_investor(self) -> List[str]:
        return list(self.investors.keys())
    
    def get_investor(self, name: str) -> Optional[Investor]:
        return self.investors.get(name, None)

    def add_investor(self, investor_name: str, date: str=None) -> None:
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        investor = Investor(investor_name)
        self.investors[investor.name] = investor
        self.history_operation.append(['Add', {'investor_name': investor_name, 'date': date}, {}])

    def invest(self, investor_name: str, amount: float, date: str = None) -> None:
        if investor_name not in self.investors:
            self.add_investor(investor_name, date)
        investor = self.investors[investor_name]

        if not date:
            date = datetime.now().strftime('%Y-%m-%d')

        share = round(amount / self.net_asset_value, 6) if self.total_share != 0 else round(amount, 6)
        investor.share += share
        self.total_share = round(self.total_share + share, 6)

        self.history_operation.append(['Invest', {'investor_name': investor_name, 'amount': amount, "date": date}, {}])

    def redeem(self, investor_name: str, amount: float, amount_type: Literal['share', 'balance'] = 'share', date: str = None) -> int:
        investor = self.investors.get(investor_name)
        if not investor or investor.share <= 0:
            return 1

        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        if amount_type == 'share':
            if investor.share < amount:
                amount = investor.share
            redeem_share = amount
        elif amount_type == 'balance':
            investor_balance = investor.share * self.net_asset_value
            if investor_balance < amount:
                amount = investor_balance
            redeem_share = round(amount / self.net_asset_value, 6)
        
        investor.share = round(investor.share - redeem_share, 6)
        self.total_share = round(self.total_share - redeem_share, 6)

        self.history_operation.append(['Redeem', {
            'investor_name': investor_name, 
            'amount': amount, 
            'amount_type': amount_type,
            'date': date,
            'share': redeem_share
        }, {}])
        return 0

    def transfer(self, from_investor: str, to_investor: str, amount: float, amount_type: Literal['share', 'balance'] = 'share', date: str = None) -> int:
        if from_investor not in self.investors or to_investor not in self.investors:
            return 1

        if not date:
            date = datetime.now().strftime('%Y-%m-%d')

        if amount_type == 'balance':
            amount = round(amount / self.net_asset_value, 6)

        from_inv = self.investors[from_investor]
        to_inv = self.investors[to_investor]

        if from_inv.share < amount:
            return 1

        from_inv.share = round(from_inv.share - amount, 6)
        to_inv.share = round(to_inv.share + amount, 6)

        self.history_operation.append(['Transfer', {
            'from_investor': from_investor,
            'to_investor': to_investor,
            'amount': amount,
            'amount_type': amount_type,
            'date': date,
            'share': amount
        }, {}])
        return 0

    def get_fund_info(self):
        return {
            'total_share': self.total_share,
            'net_asset_value': self.net_asset_value
        }
# ==================== End of copied code ====================


def migrate_fund(private_fund: PrivateFund, db: Session) -> Fund:
    """Migrate a PrivateFund to database."""
    # Create fund
    fund = Fund(
        name=private_fund.name,
        start_date=private_fund.start_date,
        total_share=private_fund.total_share,
        net_asset_value=private_fund.net_asset_value,
        balance=private_fund.total_share * private_fund.net_asset_value
    )
    db.add(fund)
    db.flush()  # Get fund.id

    # Create investors
    investor_map = {}  # name -> id mapping
    for name, investor in private_fund.investors.items():
        db_investor = Investor(
            fund_id=fund.id,
            name=name,
            share=investor.share,
            balance=round(investor.share * private_fund.net_asset_value, 6)
        )
        db.add(db_investor)
        db.flush()
        investor_map[name] = db_investor.id

    # Create operations
    for op in private_fund.history_operation:
        op_type = op[0]
        op_data = op[1]

        # Determine operation type
        if op_type == "Add":
            operation_type = "add_investor"
            investor_name = op_data.get("investor_name")
            investor_id = investor_map.get(investor_name)
        elif op_type == "Invest":
            operation_type = "invest"
            investor_name = op_data.get("investor_name")
            investor_id = investor_map.get(investor_name)
        elif op_type == "Redeem":
            operation_type = "redeem"
            investor_name = op_data.get("investor_name")
            investor_id = investor_map.get(investor_name)
        elif op_type == "Transfer":
            operation_type = "transfer"
            investor_name = op_data.get("from_investor")
            investor_id = investor_map.get(investor_name)
        else:
            operation_type = "update_nav"
            investor_id = None
            investor_name = None

        # Create operation record
        operation = Operation(
            fund_id=fund.id,
            investor_id=investor_id,
            operation_type=operation_type,
            operation_date=op_data.get("date", datetime.now().strftime('%Y-%m-%d')),
            amount=op_data.get("amount"),
            amount_type=op_data.get("amount_type"),
            share=op_data.get("share"),
        )

        if op_type == "Transfer":
            to_investor_name = op_data.get("to_investor")
            operation.transfer_to_id = investor_map.get(to_investor_name)
            operation.transfer_from_id = investor_id

        db.add(operation)

    db.commit()
    db.refresh(fund)
    return fund


def main():
    """Main migration function."""
    # Find pickle files in data directory
    data_dir = os.path.join(os.path.dirname(__file__), "../../..", "data")
    pickle_files = [f for f in os.listdir(data_dir) if f.endswith(".pkl")]

    if not pickle_files:
        print("❌ No pickle files found in data directory")
        return

    print(f"📦 Found {len(pickle_files)} pickle file(s)")

    db = SessionLocal()
    try:
        for pickle_file in pickle_files:
            pickle_path = os.path.join(data_dir, pickle_file)
            print(f"\n📄 Processing: {pickle_file}")

            # Load pickle data
            with open(pickle_path, "rb") as f:
                private_fund = pkl.load(f)

            # Check if fund already exists
            existing = db.query(Fund).filter(Fund.name == private_fund.name).first()
            if existing:
                print(f"⚠️  Fund '{private_fund.name}' already exists, skipping...")
                continue

            # Migrate
            fund = migrate_fund(private_fund, db)
            print(f"✅ Migrated fund: {fund.name}")
            print(f"   - Investors: {len(fund.investors)}")
            print(f"   - Operations: {len(fund.operations)}")

        print("\n🎉 Migration completed!")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
