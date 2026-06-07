#!/usr/bin/env python3
"""Test import/export consistency after fix."""
import os
import json
import requests
from datetime import datetime

BASE_URL = "http://localhost:8000"

def get_token():
    """Get auth token."""
    username = os.environ.get("FUND_API_USERNAME", "admin")
    password = os.environ.get("FUND_API_PASSWORD", "")
    if not password:
        raise ValueError("FUND_API_PASSWORD environment variable is required")
    resp = requests.post(f"{BASE_URL}/api/v1/auth/login",
                        json={"username": username, "password": password})
    assert resp.status_code == 200
    return resp.json()["data"]["access_token"]

def test_redeem_with_nav_replay():
    """Test that redeem operation can be replayed with correct NAV."""
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Use unique fund name
    timestamp = datetime.now().strftime("%H%M%S")
    fund_name = f"测试赎回NAV一致性_{timestamp}"
    
    # 1. Create a test fund
    fund_data = {
        "name": fund_name,
        "start_date": "2024-01-01",
        "currency": "CNY"
    }
    resp = requests.post(f"{BASE_URL}/api/v1/funds", json=fund_data, headers=headers)
    assert resp.status_code in [200, 201], f"Create fund failed: {resp.text}"
    fund = resp.json()["data"]
    fund_id = fund["id"]
    print(f"✅ Created fund: {fund['name']} (ID: {fund_id})")
    
    # 2. Add investor
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors", 
                        json={"name": "测试投资者", "date": "2024-01-01"},
                        headers=headers)
    assert resp.status_code in [200, 201]
    investor = resp.json()["data"]
    investor_id = investor["id"]
    print(f"✅ Added investor: {investor['name']}")
    
    # 3. Invest 10000 at NAV=1.0
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors/{investor_id}/invest",
                        json={"amount": 10000, "date": "2024-01-02"},
                        headers=headers)
    assert resp.status_code in [200, 201]
    invest_result = resp.json()["data"]
    print(f"✅ Invested 10000, got {invest_result['new_share']} shares at NAV={invest_result['fund_nav']}")
    
    # 4. Update NAV to 2.0
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/update-nav",
                        json={"capital": 20000, "date": "2024-01-03"},
                        headers=headers)
    assert resp.status_code in [200, 201]
    nav_result = resp.json()["data"]
    print(f"✅ Updated NAV from {nav_result['old_nav']} to {nav_result['new_nav']}")
    
    # 5. Redeem by balance (5000) at NAV=2.0
    resp = requests.post(f"{BASE_URL}/api/v1/funds/{fund_id}/investors/{investor_id}/redeem",
                        json={"amount": 5000, "amount_type": "balance", "date": "2024-01-04"},
                        headers=headers)
    assert resp.status_code in [200, 201]
    redeem_result = resp.json()["data"]
    print(f"✅ Redeemed 5000 (balance) at NAV=2.0, got {redeem_result['redeemed_share']} shares")
    
    # 6. Get fund state before export
    resp = requests.get(f"{BASE_URL}/api/v1/funds/{fund_id}", headers=headers)
    assert resp.status_code in [200, 201]
    fund_before = resp.json()["data"]
    print(f"\n📊 Fund state before export:")
    print(f"   Total share: {fund_before['total_share']}")
    print(f"   NAV: {fund_before['net_asset_value']}")
    print(f"   Balance: {fund_before['balance']}")
    
    # 7. Export operations
    resp = requests.get(f"{BASE_URL}/api/v1/funds/{fund_id}/operations/export", headers=headers)
    assert resp.status_code in [200, 201]
    export_content = resp.text  # API returns raw JSONL, not JSON
    print(f"\n📤 Exported operations:")
    for line in export_content.strip().split('\n'):
        data = json.loads(line)
        if data.get('_type') == 'operation':
            print(f"   {data['operation_type']}: amount={data.get('amount')} type={data.get('amount_type')} nav_at_op={data.get('nav_at_op')}")
    
    # 8. Import to new fund
    resp = requests.post(f"{BASE_URL}/api/v1/funds/import",
                        json={"content": export_content},
                        headers=headers)
    assert resp.status_code in [200, 201]
    import_result = resp.json()["data"]
    new_fund_id = import_result["fund_id"]
    print(f"\n📥 Imported to new fund: {import_result['fund_name']} (ID: {new_fund_id})")
    print(f"   Success: {import_result['success']}, Failed: {import_result['failed']}")
    
    # 9. Get fund state after import
    resp = requests.get(f"{BASE_URL}/api/v1/funds/{new_fund_id}", headers=headers)
    assert resp.status_code in [200, 201]
    fund_after = resp.json()["data"]
    print(f"\n📊 Fund state after import:")
    print(f"   Total share: {fund_after['total_share']}")
    print(f"   NAV: {fund_after['net_asset_value']}")
    print(f"   Balance: {fund_after['balance']}")
    
    # 10. Compare
    print(f"\n🔍 Comparison:")
    share_match = abs(fund_before['total_share'] - fund_after['total_share']) < 0.01
    nav_match = abs(fund_before['net_asset_value'] - fund_after['net_asset_value']) < 0.01
    balance_match = abs(fund_before['balance'] - fund_after['balance']) < 0.01
    
    print(f"   Total share: {fund_before['total_share']} vs {fund_after['total_share']} {'✅' if share_match else '❌'}")
    print(f"   NAV: {fund_before['net_asset_value']} vs {fund_after['net_asset_value']} {'✅' if nav_match else '❌'}")
    print(f"   Balance: {fund_before['balance']} vs {fund_after['balance']} {'✅' if balance_match else '❌'}")
    
    if share_match and nav_match and balance_match:
        print("\n🎉 SUCCESS: Import/export is consistent!")
        return True
    else:
        print("\n❌ FAILURE: Import/export is NOT consistent!")
        return False

if __name__ == "__main__":
    success = test_redeem_with_nav_replay()
    exit(0 if success else 1)
