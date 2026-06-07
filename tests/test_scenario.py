#!/usr/bin/env python3
"""
测试场景：
1. 创建基金A
2. 添加投资者 aa 和 bb
3. aa 投入 100
4. 更新净值（基金金额=150）
5. bb 投入 50
6. 更新净值（基金金额=180）
7. aa 转移 30 元给 bb（按金额）
8. 更新净值（基金金额=240）
9. bb 转移 20 份额给 aa（按份额）
10. 更新净值为 300（金额）

计算累计收益和基金整体情况
"""
import requests

BASE_URL = "http://localhost:8000"

def get_token():
    resp = requests.post(f"{BASE_URL}/api/v1/auth/login", 
                        json={"username": "admin", "password": "admin123"})
    return resp.json()["data"]["access_token"]

def print_fund_state(fund_id, headers, label=""):
    """Print fund and investor state."""
    resp = requests.get(f"{BASE_URL}/api/v1/funds/{fund_id}", headers=headers)
    fund = resp.json()["data"]
    
    print(f"\n{'='*60}")
    if label:
        print(f"📊 {label}")
    print(f"   总份额: {fund['total_share']:.6f}")
    print(f"   净值 (NAV): {fund['net_asset_value']:.6f}")
    print(f"   总资产: {fund['balance']:.6f}")
    
    # Get investors
    resp = requests.get(f"{BASE_URL}/api/v1/funds/{fund_id}/investors", headers=headers)
    investors = resp.json()["data"]["items"]
    
    print(f"\n   投资者情况:")
    for inv in investors:
        # Calculate return
        invested = inv['total_invested']
        redeemed = inv['total_redeemed']
        current_balance = inv['balance']
        # 累计收益 = 当前余额 + 已赎回 - 总投入
        total_return = current_balance + redeemed - invested
        return_pct = (total_return / invested * 100) if invested > 0 else 0
        
        print(f"     {inv['name']}:")
        print(f"       份额: {inv['share']:.6f}")
        print(f"       当前余额: {inv['balance']:.6f}")
        print(f"       总投入: {inv['total_invested']:.6f}")
        print(f"       总赎回: {inv['total_redeemed']:.6f}")
        print(f"       累计收益: {total_return:.6f} ({return_pct:.2f}%)")
    
    return fund, investors

def run_test():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("="*60)
    print("🧪 开始测试场景")
    print("="*60)
    
    # 1. 创建基金A
    resp = requests.post(f"{BASE_URL}/api/v1/funds",
                        json={"name": "测试基金A", "start_date": "2024-01-01", "currency": "CNY"},
                        headers=headers)
    fund_id = resp.json()["data"]["id"]
    print(f"\n✅ 步骤1: 创建基金A (ID={fund_id})")
    
    # 2. 添加投资者 aa 和 bb
    resp_aa = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors",
                           json={"name": "aa", "date": "2024-01-01"},
                           headers=headers)
    aa_id = resp_aa.json()["data"]["id"]
    
    resp_bb = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors",
                           json={"name": "bb", "date": "2024-01-01"},
                           headers=headers)
    bb_id = resp_bb.json()["data"]["id"]
    print(f"✅ 步骤2: 添加投资者 aa (ID={aa_id}) 和 bb (ID={bb_id})")
    
    # 3. aa 投入 100
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors/{aa_id}/invest",
                        json={"amount": 100, "date": "2024-01-02"},
                        headers=headers)
    result = resp.json()["data"]
    print(f"✅ 步骤3: aa 投入 100 → 获得 {result['new_share']:.6f} 份额 (NAV={result['fund_nav']})")
    
    print_fund_state(fund_id, headers, "步骤3后状态")
    
    # 4. 更新净值（基金金额=150）
    # 当前份额是 100，目标金额 150，所以 NAV = 150/100 = 1.5
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/update-nav",
                        json={"capital": 150, "date": "2024-01-03"},
                        headers=headers)
    result = resp.json()["data"]
    print(f"\n✅ 步骤4: 更新净值 {result['old_nav']:.6f} → {result['new_nav']:.6f} (金额=150)")
    
    print_fund_state(fund_id, headers, "步骤4后状态")
    
    # 5. bb 投入 50
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors/{bb_id}/invest",
                        json={"amount": 50, "date": "2024-01-04"},
                        headers=headers)
    result = resp.json()["data"]
    print(f"\n✅ 步骤5: bb 投入 50 → 获得 {result['new_share']:.6f} 份额 (NAV={result['fund_nav']})")
    
    print_fund_state(fund_id, headers, "步骤5后状态")
    
    # 6. 更新净值（基金金额=180）
    # 当前总份额 = 100 + 33.333... = 133.333...
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/update-nav",
                        json={"capital": 180, "date": "2024-01-05"},
                        headers=headers)
    result = resp.json()["data"]
    print(f"\n✅ 步骤6: 更新净值 {result['old_nav']:.6f} → {result['new_nav']:.6f} (金额=180)")
    
    print_fund_state(fund_id, headers, "步骤6后状态")
    
    # 7. aa 转移 30 元给 bb（按金额）
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors/transfer",
                        json={
                            "from_investor_id": aa_id,
                            "to_investor_id": bb_id,
                            "amount": 30,
                            "amount_type": "balance",
                            "date": "2024-01-06"
                        },
                        headers=headers)
    result = resp.json()["data"]
    print(f"\n✅ 步骤7: aa 转移 30 元给 bb → 转移 {result['transferred_share']:.6f} 份额")
    print(f"      aa: {result['from_new_share']:.6f} 份额")
    print(f"      bb: {result['to_new_share']:.6f} 份额")
    
    print_fund_state(fund_id, headers, "步骤7后状态")
    
    # 8. 更新净值（基金金额=240）
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/update-nav",
                        json={"capital": 240, "date": "2024-01-07"},
                        headers=headers)
    result = resp.json()["data"]
    print(f"\n✅ 步骤8: 更新净值 {result['old_nav']:.6f} → {result['new_nav']:.6f} (金额=240)")
    
    print_fund_state(fund_id, headers, "步骤8后状态")
    
    # 9. bb 转移 20 份额给 aa（按份额）
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors/transfer",
                        json={
                            "from_investor_id": bb_id,
                            "to_investor_id": aa_id,
                            "amount": 20,
                            "amount_type": "share",
                            "date": "2024-01-08"
                        },
                        headers=headers)
    result = resp.json()["data"]
    print(f"\n✅ 步骤9: bb 转移 20 份额给 aa → 转移 {result['transferred_balance']:.6f} 元")
    print(f"      bb: {result['from_new_share']:.6f} 份额")
    print(f"      aa: {result['to_new_share']:.6f} 份额")
    
    print_fund_state(fund_id, headers, "步骤9后状态")
    
    # 10. 更新净值为 300（金额）
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/update-nav",
                        json={"capital": 300, "date": "2024-01-09"},
                        headers=headers)
    result = resp.json()["data"]
    print(f"\n✅ 步骤10: 更新净值 {result['old_nav']:.6f} → {result['new_nav']:.6f} (金额=300)")
    
    # 最终结果
    fund, investors = print_fund_state(fund_id, headers, "最终结果")
    
    # 打印汇总
    print(f"\n{'='*60}")
    print("📊 最终汇总")
    print(f"{'='*60}")
    print(f"基金整体情况:")
    print(f"   总份额: {fund['total_share']:.6f}")
    print(f"   净值 (NAV): {fund['net_asset_value']:.6f}")
    print(f"   总资产: {fund['balance']:.6f}")
    
    print(f"\n投资者累计收益:")
    total_invested = 0
    total_redeemed = 0
    total_current = 0
    
    for inv in investors:
        invested = inv['total_invested']
        redeemed = inv['total_redeemed']
        current = inv['balance']
        total_return = current + redeemed - invested
        return_pct = (total_return / invested * 100) if invested > 0 else 0
        
        print(f"   {inv['name']}:")
        print(f"      份额: {inv['share']:.6f}")
        print(f"      当前余额: {current:.6f}")
        print(f"      总投入: {invested:.6f}")
        print(f"      累计收益: {total_return:.6f} ({return_pct:.2f}%)")
        
        total_invested += invested
        total_redeemed += redeemed
        total_current += current
    
    print(f"\n基金总投入: {total_invested:.6f}")
    print(f"基金总赎回: {total_redeemed:.6f}")
    print(f"基金当前总资产: {total_current:.6f}")
    print(f"基金总收益: {total_current - total_invested:.6f}")

if __name__ == "__main__":
    run_test()
