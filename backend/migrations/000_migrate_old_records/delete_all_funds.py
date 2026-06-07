#!/usr/bin/env python3
"""
删除所有基金，然后导入每个基金的最新版本
"""
import requests
import os
import re
from collections import defaultdict

BASE_URL = "http://localhost:8000"

# 本地测试账号，仅用于开发环境
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

def login():
    resp = requests.post(f"{BASE_URL}/api/v1/auth/login", 
                        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    return resp.json()["data"]["access_token"]

def delete_all_funds(headers):
    """删除所有现有基金"""
    resp = requests.get(f"{BASE_URL}/api/v1/funds", headers=headers)
    funds = resp.json()["data"]["items"]
    print(f"找到 {len(funds)} 个现有基金，正在删除...")
    
    for fund in funds:
        fund_id = fund["id"]
        fund_name = fund["name"]
        resp = requests.delete(f"{BASE_URL}/api/v1/funds/{fund_id}", headers=headers)
        if resp.status_code in [200, 204]:
            print(f"  已删除: {fund_name}")
        else:
            print(f"  删除失败: {fund_name}: {resp.text}")
    
    print("\n删除完成！")

def get_latest_versions():
    """分析 JSONL 文件，找出每个基金最新的版本"""
    jsonl_dir = "data/old_records_migration/fund_data_jsonl"
    jsonl_files = [f for f in os.listdir(jsonl_dir) if f.endswith(".jsonl")]
    
    print(f"找到 {len(jsonl_files)} 个 JSONL 文件")
    
    # 按基金名分组
    fund_versions = defaultdict(list)
    for f in jsonl_files:
        match = re.match(r"(.+)\.(\d{4}-\d{2}-\d{2})\.jsonl", f)
        if match:
            fund_name = match.group(1)
            date = match.group(2)
            fund_versions[fund_name].append((date, f))
    
    print(f"找到 {len(fund_versions)} 个不同基金")
    
    # 取每个基金的最新版本
    latest = {}
    for fund_name, versions in fund_versions.items():
        versions.sort(key=lambda x: x[0], reverse=True)
        latest_date, latest_file = versions[0]
        latest[fund_name] = (latest_date, latest_file)
    
    return latest, jsonl_dir

def import_fund(jsonl_path, headers):
    """导入单个基金"""
    with open(jsonl_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    resp = requests.post(f"{BASE_URL}/api/v1/funds/import",
                        json={"content": content},
                        headers=headers)
    return resp.json()

def main():
    # Login
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. 删除所有基金
    delete_all_funds(headers)
    
    # # 2. 获取每个基金的最新版本
    # latest, jsonl_dir = get_latest_versions()
    
    # print(f"\n找到 {len(latest)} 个基金，准备导入最新版本:\n")
    
    # # 3. 导入最新版本
    # results = []
    # for i, (fund_name, (date, filename)) in enumerate(sorted(latest.items()), 1):
    #     jsonl_path = os.path.join(jsonl_dir, filename)
    #     print(f"{i:2d}/{len(latest)}: 导入 {fund_name} ({date})...", end=" ", flush=True)
        
    #     try:
    #         result = import_fund(jsonl_path, headers)
    #         data = result.get("data", {})
    #         fund_id = data.get("fund_id", "N/A")
    #         success = data.get("success", 0)
    #         failed = data.get("failed", 0)
            
    #         status = "✅" if failed == 0 else "⚠️"
    #         print(f"ID={fund_id}, ops={success}/{success+failed} {status}")
            
    #         results.append({
    #             "fund_name": fund_name,
    #             "date": date,
    #             "fund_id": fund_id,
    #             "success": success,
    #             "failed": failed
    #         })
    #     except Exception as e:
    #         print(f"ERROR: {e}")
    #         results.append({
    #             "fund_name": fund_name,
    #             "date": date,
    #             "fund_id": None,
    #             "success": 0,
    #             "failed": 0,
    #             "error": str(e)
    #         })
    
    # # 汇总
    # print(f"\n{'='*60}")
    # print(f"导入汇总:")
    # print(f"  总基金数: {len(results)}")
    # successful = sum(1 for r in results if r.get("failed", 0) == 0)
    # with_failures = sum(1 for r in results if r.get("failed", 0) > 0)
    # print(f"  完全成功: {successful}")
    # print(f"  有失败操作: {with_failures}")
    # print(f"{'='*60}")
    
    # if with_failures > 0:
    #     print(f"\n有失败操作的基金:")
    #     for r in results:
    #         if r.get("failed", 0) > 0:
    #             print(f"  {r['fund_name']}: {r['failed']} 个操作失败")

if __name__ == "__main__":
    main()
