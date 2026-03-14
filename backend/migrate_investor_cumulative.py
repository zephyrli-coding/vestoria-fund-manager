"""
Migration script: Initialize investor cumulative fields.

This script:
1. Adds total_invested and total_redeemed columns to investors table
2. Calculates and populates these fields based on historical operations

Run this after updating the model but before running the app.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, Column, Float, inspect, text
from sqlalchemy.orm import sessionmaker
from app.db import Base
from app.config import get_settings
from app.models import Operation, Investor

settings = get_settings()
DATABASE_URL = settings.DATABASE_URL


def add_columns_if_not_exist(engine):
    """Add new columns if they don't exist."""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('investors')]
    
    with engine.connect() as conn:
        if 'total_invested' not in columns:
            print("Adding total_invested column...")
            conn.execute(text("ALTER TABLE investors ADD COLUMN total_invested FLOAT DEFAULT 0.0"))
            conn.commit()
        else:
            print("total_invested column already exists")
            
        if 'total_redeemed' not in columns:
            print("Adding total_redeemed column...")
            conn.execute(text("ALTER TABLE investors ADD COLUMN total_redeemed FLOAT DEFAULT 0.0"))
            conn.commit()
        else:
            print("total_redeemed column already exists")


def migrate_investor_cumulative_fields():
    """Calculate and populate cumulative fields for all investors."""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Add columns first
        add_columns_if_not_exist(engine)
        
        # Get all investors
        investors = db.query(Investor).all()
        print(f"\nFound {len(investors)} investors to process")
        
        for investor in investors:
            # Reset cumulative fields
            total_invested = 0.0
            total_redeemed = 0.0
            
            # Get all operations for this investor
            operations = db.query(Operation).filter(
                Operation.investor_id == investor.id
            ).order_by(Operation.operation_date).all()
            
            for op in operations:
                if op.operation_type == 'invest':
                    total_invested += op.amount or 0
                elif op.operation_type == 'redeem':
                    total_redeemed += op.amount or 0
                elif op.operation_type == 'transfer':
                    if op.transfer_from_id == investor.id:
                        # This investor transferred out (redeem)
                        total_redeemed += op.amount or 0
                    elif op.transfer_to_id == investor.id:
                        # This investor received transfer (invest)
                        total_invested += op.amount or 0
            
            # Update investor
            investor.total_invested = round(total_invested, 6)
            investor.total_redeemed = round(total_redeemed, 6)
            
            print(f"Investor '{investor.name}' (ID: {investor.id}): "
                  f"invested={total_invested:.2f}, redeemed={total_redeemed:.2f}")
        
        db.commit()
        print("\nMigration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"\nError during migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Investor Cumulative Fields Migration")
    print("=" * 60)
    print()
    
    # Backup reminder
    print("⚠️  IMPORTANT: Make sure you have backed up your database!")
    print()
    
    response = input("Continue with migration? (yes/no): ")
    if response.lower() != 'yes':
        print("Migration cancelled.")
        sys.exit(0)
    
    print()
    migrate_investor_cumulative_fields()
