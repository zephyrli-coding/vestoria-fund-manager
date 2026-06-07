#!/usr/bin/env python3
"""
批量转换 FundRecord 中的所有 pickle 基金为 JSONL 并导入
"""
import sys
import os
import json
import pickle

# Add paths
sys.path.insert(0, '/home/linuxuser/projects/fund-manager/backend/data/old_records_migration')
sys.path.insert(0, '/home/linuxuser/projects/fund-manager/backend')

def convert_pkl_to_jsonl(pkl_path, output_path):
    """Convert a single pickle fund to JSONL format."""
    
    with open(pkl_path, 'rb') as f:
        fund = pickle.load(f)
    
    lines = []
    
    # Fund metadata
    meta = {
        "_type": "fund_meta",
        "name": fund.name,
        "start_date": fund.start_date,
        "currency": "CNY"
    }
    lines.append(json.dumps(meta, ensure_ascii=False))
    
    # Convert operations
    for op in fund.history_operation:
        op_type = op[0]
        params = op[1]
        state = op[2] if len(op) > 2 else {}
        nav_at_op = state.get('net_asset_value')
        
        record = {"_type": "operation"}
        
        if op_type == "Add":
            record["operation_type"] = "add_investor"
            record["operation_date"] = params["date"]
            record["investor_name"] = params["investor_name"]
            
        elif op_type == "Invest":
            record["operation_type"] = "invest"
            record["operation_date"] = params["date"]
            record["investor_name"] = params["investor_name"]
            record["amount"] = params["amount"]
            if nav_at_op:
                record["nav_at_op"] = nav_at_op
            
        elif op_type == "Redeem":
            record["operation_type"] = "redeem"
            record["operation_date"] = params["date"]
            record["investor_name"] = params["investor_name"]
            record["amount"] = params["amount"]
            record["amount_type"] = params.get("amount_type", "balance")
            if nav_at_op:
                record["nav_at_op"] = nav_at_op
            
        elif op_type == "Transfer":
            record["operation_type"] = "transfer"
            record["operation_date"] = params["date"]
            record["from_investor"] = params["investor_A_name"]
            record["to_investor"] = params["investor_B_name"]
            record["amount"] = params["amount"]
            record["amount_type"] = params.get("amount_type", "balance")
            if nav_at_op:
                record["nav_at_op"] = nav_at_op
            if params.get("amount_type") == "share":
                record["share"] = params["amount"]
            
        elif op_type == "Update":
            record["operation_type"] = "update_nav"
            record["operation_date"] = params["date"]
            nav_after = state.get('net_asset_value')
            if nav_after:
                record["target_nav"] = nav_after
            else:
                record["amount"] = params["capital"]
        
        lines.append(json.dumps(record, ensure_ascii=False))
    
    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    return len(fund.history_operation)

def process_all_funds():
    """Process all pkl files in fund_data directory."""
    
    fund_data_dir = '/home/linuxuser/projects/fund-manager/backend/data/old_records_migration/fund_data_pkl'
    output_dir = '/home/linuxuser/projects/fund-manager/backend/data/old_records_migration/fund_data_jsonl'
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all pkl files
    pkl_files = [f for f in os.listdir(fund_data_dir) if f.endswith('.pkl')]
    pkl_files.sort()
    
    print(f"Found {len(pkl_files)} pkl files to convert\n")
    
    results = []
    for i, pkl_file in enumerate(pkl_files, 1):
        pkl_path = os.path.join(fund_data_dir, pkl_file)
        jsonl_name = pkl_file.replace('.pkl', '.jsonl')
        jsonl_path = os.path.join(output_dir, jsonl_name)
        
        try:
            op_count = convert_pkl_to_jsonl(pkl_path, jsonl_path)
            print(f"{i:3d}/{len(pkl_files)}: {pkl_file} -> {jsonl_name} ({op_count} ops)")
            results.append((jsonl_name, jsonl_path, True, None))
        except Exception as e:
            print(f"{i:3d}/{len(pkl_files)}: {pkl_file} -> ERROR: {e}")
            results.append((jsonl_name, None, False, str(e)))
    
    print(f"\n✅ Converted {sum(1 for r in results if r[2])}/{len(results)} files")
    print(f"Output directory: {output_dir}")
    
    return results

if __name__ == "__main__":
    process_all_funds()
