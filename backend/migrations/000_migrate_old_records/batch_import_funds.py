#!/usr/bin/env python3
"""
批量导入所有 JSONL 基金文件
"""
import os
import requests

BASE_URL = "http://localhost:8000"

# 本地测试账号，仅用于开发环境
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

def login():
    """Login and get token."""
    resp = requests.post(f"{BASE_URL}/api/v1/auth/login", 
                        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    return resp.json()["data"]["access_token"]

def import_fund(jsonl_path, headers):
    """Import a single fund."""
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    resp = requests.post(f"{BASE_URL}/api/v1/funds/import",
                        json={"content": content},
                        headers=headers)
    return resp.json()

def batch_import():
    """Import all JSONL files."""
    jsonl_dir = '/home/linuxuser/projects/fund-manager/backend/data/old_records_migration/fund_data_jsonl'
    
    # Login
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get all JSONL files
    jsonl_files = [f for f in os.listdir(jsonl_dir) if f.endswith('.jsonl')]
    jsonl_files.sort()
    
    print(f"Found {len(jsonl_files)} JSONL files to import\n")
    
    results = []
    for i, jsonl_file in enumerate(jsonl_files, 1):
        jsonl_path = os.path.join(jsonl_dir, jsonl_file)
        
        try:
            result = import_fund(jsonl_path, headers)
            data = result.get('data', {})
            fund_id = data.get('fund_id', 'N/A')
            success = data.get('success', 0)
            failed = data.get('failed', 0)
            fund_name = data.get('fund_name', 'Unknown')
            
            status = "✅" if failed == 0 else "⚠️"
            print(f"{i:3d}/{len(jsonl_files)}: {jsonl_file} -> ID={fund_id}, ops={success}/{success+failed} {status}")
            
            results.append({
                'file': jsonl_file,
                'fund_id': fund_id,
                'fund_name': fund_name,
                'success': success,
                'failed': failed,
                'error': None
            })
        except Exception as e:
            print(f"{i:3d}/{len(jsonl_files)}: {jsonl_file} -> ERROR: {e}")
            results.append({
                'file': jsonl_file,
                'fund_id': None,
                'fund_name': None,
                'success': 0,
                'failed': 0,
                'error': str(e)
            })
    
    # Summary
    total_funds = len(results)
    successful = sum(1 for r in results if r['error'] is None)
    with_failures = sum(1 for r in results if r['failed'] > 0)
    
    print(f"\n{'='*60}")
    print(f"导入汇总:")
    print(f"  总基金数: {total_funds}")
    print(f"  成功导入: {successful}")
    print(f"  有失败操作: {with_failures}")
    print(f"{'='*60}")
    
    # List funds with failures
    if with_failures > 0:
        print(f"\n有失败操作的基金:")
        for r in results:
            if r['failed'] > 0:
                print(f"  {r['fund_name']}: {r['failed']} 个操作失败")
    
    return results

if __name__ == "__main__":
    batch_import()
