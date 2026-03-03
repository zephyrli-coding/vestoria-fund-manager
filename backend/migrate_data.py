"""Migrate data from pickle to SQLite."""
import pickle as pkl
import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Fund, Investor, Operation, FundHistory

# Add parent directory to path for importing manage.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils.manage import PrivateFund


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
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
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
