#!/usr/bin/env python3
"""
Debug script to track import process
"""
import sys
import json

sys.path.insert(0, 'data/old_records_migration')
sys.path.insert(0, '/home/linuxuser/projects/fund-manager/backend')

from app.db import SessionLocal
from app.models import Fund, Investor
from app.services.operation_history_service import OperationHistoryService
from app.services.fund_service import FundService
from app.services.investor_service import InvestorService

def debug_import():
    # Read JSONL
    with open('data/old_records_migration/BalancedArk.jsonl', 'r') as f:
        lines = f.readlines()
    
    db = SessionLocal()
    
    try:
        # Parse operations manually
        fund_meta = json.loads(lines[0])
        print(f"Fund: {fund_meta['name']}, start_date: {fund_meta['start_date']}")
        
        # Create fund with unique name
        import datetime
        unique_name = f"Debug_{datetime.datetime.now().strftime('%H%M%S')}"
        fund = fund_service.create_fund(unique_name, fund_meta['start_date'], fund_meta.get('currency', 'CNY'))
        print(f"Created fund ID: {fund.id}")
        
        investor_service = InvestorService(db)
        
        # Process operations line by line
        for i, line in enumerate(lines[1:], 2):  # Start from line 2
            data = json.loads(line)
            op_type = data.get('operation_type')
            
            # Track huangshuiying state before transfer
            if i == 115 and op_type == 'transfer' and data.get('from_investor') == 'huangshuiying':
                # Get current state
                db.refresh(fund)
                hsy = db.query(Investor).filter(Investor.fund_id == fund.id, Investor.name == 'huangshuiying').first()
                if hsy:
                    print(f"\n=== Line {i} (transfer huangshuiying -> Family) ===")
                    print(f"Fund NAV: {fund.net_asset_value}")
                    print(f"huangshuiying share: {hsy.share}")
                    print(f"huangshuiying balance: {hsy.balance}")
                    print(f"Need to transfer: {data['amount']} {data['amount_type']}")
                    print(f"nav_at_op in JSON: {data.get('nav_at_op')}")
            
            if i > 115:
                break
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_import()
