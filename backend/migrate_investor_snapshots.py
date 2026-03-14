"""
Migration script: Generate historical investor return snapshots.

This script generates InvestorReturnSnapshot records based on:
1. Fund NAV history (from fund_history table)
2. Investor cumulative fields (total_invested, total_redeemed)
3. Historical operations (to reconstruct share at each date)

This is a one-time migration to populate historical data.
New snapshots will be generated automatically when NAV is updated.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.models import Fund, FundHistory, Investor, Operation, InvestorReturnSnapshot
from collections import defaultdict

settings = get_settings()
DATABASE_URL = settings.DATABASE_URL


def get_investor_share_at_date(investor_id: int, operations: list, target_date: str) -> float:
    """Calculate investor's share at a specific date based on operations."""
    share = 0.0
    
    for op in operations:
        if op.operation_date > target_date:
            break
            
        if op.operation_type == 'invest' and op.investor_id == investor_id:
            share += op.share or 0
        elif op.operation_type == 'redeem' and op.investor_id == investor_id:
            share -= op.share or 0
        elif op.operation_type == 'transfer':
            if op.transfer_from_id == investor_id:
                share -= op.share or 0
            elif op.transfer_to_id == investor_id:
                share += op.share or 0
    
    return round(share, 6)


def generate_historical_snapshots():
    """Generate historical snapshots for all investors."""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Get all funds
        funds = db.query(Fund).all()
        print(f"Found {len(funds)} funds to process\n")
        
        for fund in funds:
            print(f"Processing fund: {fund.name} (ID: {fund.id})")
            
            # Get NAV history for this fund
            nav_history = db.query(FundHistory).filter(
                FundHistory.fund_id == fund.id
            ).order_by(FundHistory.history_date).all()
            
            if not nav_history:
                print(f"  No NAV history found, skipping")
                continue
            
            print(f"  NAV history records: {len(nav_history)}")
            
            # Get all operations for this fund
            operations = db.query(Operation).filter(
                Operation.fund_id == fund.id
            ).order_by(Operation.operation_date).all()
            
            # Group operations by investor
            investor_operations = defaultdict(list)
            for op in operations:
                if op.investor_id:
                    investor_operations[op.investor_id].append(op)
            
            # Get all investors in this fund
            investors = db.query(Investor).filter(Investor.fund_id == fund.id).all()
            
            for investor in investors:
                ops = investor_operations.get(investor.id, [])
                
                for history in nav_history:
                    date = history.history_date
                    nav = history.net_asset_value
                    
                    # Calculate share at this date
                    share = get_investor_share_at_date(investor.id, ops, date)
                    
                    # Only create snapshot if investor had shares
                    if share > 0:
                        # Calculate total return at this point
                        # Note: total_invested and total_redeemed are cumulative
                        # but at historical dates, we need to calculate based on operations up to that date
                        total_invested = 0.0
                        total_redeemed = 0.0
                        
                        for op in ops:
                            if op.operation_date > date:
                                break
                                
                            if op.operation_type == 'invest':
                                total_invested += op.amount or 0
                            elif op.operation_type == 'redeem':
                                total_redeemed += op.amount or 0
                            elif op.operation_type == 'transfer':
                                if op.transfer_from_id == investor.id:
                                    total_redeemed += op.amount or 0
                                elif op.transfer_to_id == investor.id:
                                    total_invested += op.amount or 0
                        
                        total_return = round(share * nav + total_redeemed - total_invested, 6)
                        
                        # Check if snapshot already exists
                        existing = db.query(InvestorReturnSnapshot).filter(
                            InvestorReturnSnapshot.investor_id == investor.id,
                            InvestorReturnSnapshot.date == date
                        ).first()
                        
                        if not existing:
                            snapshot = InvestorReturnSnapshot(
                                investor_id=investor.id,
                                fund_id=fund.id,
                                date=date,
                                nav=nav,
                                share=share,
                                total_invested=round(total_invested, 6),
                                total_redeemed=round(total_redeemed, 6),
                                total_return=total_return
                            )
                            db.add(snapshot)
                
                db.commit()
            
            print(f"  Snapshots generated for {len(investors)} investors")
        
        print("\n" + "=" * 60)
        print("Historical snapshot generation completed!")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\nError during migration: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Investor Return Snapshot Migration")
    print("=" * 60)
    print()
    print("This will generate historical snapshots based on:")
    print("- Fund NAV history")
    print("- Investor operations")
    print()
    
    # Backup reminder
    print("⚠️  IMPORTANT: Make sure you have backed up your database!")
    print()
    
    response = input("Continue with migration? (yes/no): ")
    if response.lower() != 'yes':
        print("Migration cancelled.")
        sys.exit(0)
    
    print()
    generate_historical_snapshots()
