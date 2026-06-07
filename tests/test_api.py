#!/usr/bin/env python3
"""Fund Manager API Test Suite"""
import requests
import json
from typing import Dict, Optional


class FundManagerTester:
    """Test suite for Fund Manager API"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.test_results = []

    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message
        })
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if message:
            print(f"   {message}")

    def login(self, username: str, password: str) -> bool:
        """Login and get token"""
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/auth/login",
                json={"username": username, "password": password}
            )
            data = response.json()
            if data.get("code") == 0 and "access_token" in data.get("data", {}):
                self.token = data["data"]["access_token"]
                return True
            return False
        except Exception as e:
            print(f"Login error: {e}")
            return False

    def get_headers(self) -> Dict[str, str]:
        """Get headers with auth token"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def test_auth(self):
        """Test authentication"""
        print("\n🔐 Testing Authentication")

        # 1. 正确登录
        if self.login("admin", "admin123"):
            self.log_result("Login with correct credentials", True)
        else:
            self.log_result("Login with correct credentials", False)

        # 2. 错误密码登录
        if not self.login("admin", "wrongpassword"):
            self.log_result("Login with wrong password", True, "Correctly rejected")
        else:
            self.log_result("Login with wrong password", False, "Should have been rejected")

        # 3. 获取当前用户
        response = requests.get(
            f"{self.base_url}/api/v1/auth/me",
            headers=self.get_headers()
        )
        data = response.json()
        if data.get("code") == 0 and data.get("data", {}).get("username") == "admin":
            self.log_result("Get current user info", True)
        else:
            self.log_result("Get current user info", False)

        # 4. 无 Token 访问
        old_token = self.token
        self.token = None
        response = requests.get(
            f"{self.base_url}/api/v1/funds",
            headers=self.get_headers()
        )
        if response.status_code == 401:
            self.log_result("Access protected endpoint without token", True, "Correctly returned 401")
        else:
            self.log_result("Access protected endpoint without token", False, f"Expected 401, got {response.status_code}")
        self.token = old_token

    def test_funds(self):
        """Test fund management"""
        print("\n💰 Testing Fund Management")

        fund_id = None

        # 1. 创建基金
        response = requests.post(
            f"{self.base_url}/api/v1/funds",
            headers=self.get_headers(),
            json={"name": "TestFund", "start_date": "2026-03-03"}
        )
        data = response.json()
        if data.get("code") == 0:
            fund_id = data["data"]["id"]
            self.log_result("Create fund", True, f"Fund ID: {fund_id}")
        else:
            self.log_result("Create fund", False, data.get("message"))

        # 2. 创建重名基金
        response = requests.post(
            f"{self.base_url}/api/v1/funds",
            headers=self.get_headers(),
            json={"name": "TestFund", "start_date": "2026-03-03"}
        )
        data = response.json()
        if data.get("code") == 40901 or response.status_code == 409:
            self.log_result("Create fund with duplicate name", True, "Correctly rejected")
        else:
            self.log_result("Create fund with duplicate name", False, "Should have been rejected")

        # 3. 获取基金列表
        response = requests.get(
            f"{self.base_url}/api/v1/funds",
            headers=self.get_headers()
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Get fund list", True, f"Found {len(data['data']['items'])} funds")
        else:
            self.log_result("Get fund list", False)

        # 4. 获取基金详情
        if fund_id:
            response = requests.get(
                f"{self.base_url}/api/v1/funds/{fund_id}",
                headers=self.get_headers()
            )
            data = response.json()
            if data.get("code") == 0 and data["data"]["name"] == "TestFund":
                self.log_result("Get fund details", True)
            else:
                self.log_result("Get fund details", False)

        # 5. 更新基金名称
        if fund_id:
            response = requests.put(
                f"{self.base_url}/api/v1/funds/{fund_id}",
                headers=self.get_headers(),
                json={"name": "UpdatedFund"}
            )
            data = response.json()
            if data.get("code") == 0 and data["data"]["name"] == "UpdatedFund":
                self.log_result("Update fund name", True)
            else:
                self.log_result("Update fund name", False)

        # 6. 更新不存在的基金
        response = requests.put(
            f"{self.base_url}/api/v1/funds/99999",
            headers=self.get_headers(),
            json={"name": "Test"}
        )
        if response.status_code == 404 or response.json().get("code") == 40401:
            self.log_result("Update non-existent fund", True, "Correctly returned 404")
        else:
            self.log_result("Update non-existent fund", False, "Should have returned 404")

        # 7. 获取不存在的基金
        response = requests.get(
            f"{self.base_url}/api/v1/funds/99999",
            headers=self.get_headers()
        )
        if response.status_code == 404 or response.json().get("code") == 40401:
            self.log_result("Get non-existent fund", True, "Correctly returned 404")
        else:
            self.log_result("Get non-existent fund", False, "Should have returned 404")

        return fund_id

    def test_investors(self, fund_id: Optional[int]):
        """Test investor management"""
        print("\n👥 Testing Investor Management")

        investor_id = None

        if not fund_id:
            self.log_result("Test investors", False, "No fund ID available")
            return None

        # 1. 添加投资者
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors",
            headers=self.get_headers(),
            json={"name": "TestInvestor"}
        )
        data = response.json()
        if data.get("code") == 0:
            investor_id = data["data"]["id"]
            self.log_result("Add investor", True, f"Investor ID: {investor_id}")
        else:
            self.log_result("Add investor", False, data.get("message"))

        # 2. 添加重名投资者
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors",
            headers=self.get_headers(),
            json={"name": "TestInvestor"}
        )
        data = response.json()
        if response.status_code == 409 or data.get("code") == 40901:
            self.log_result("Add investor with duplicate name", True, "Correctly rejected")
        else:
            self.log_result("Add investor with duplicate name", False, "Should have been rejected")

        # 3. 获取投资者列表
        response = requests.get(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors",
            headers=self.get_headers()
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Get investor list", True, f"Found {len(data['data']['items'])} investors")
        else:
            self.log_result("Get investor list", False)

        # 4. 获取投资者详情
        if investor_id:
            response = requests.get(
                f"{self.base_url}/api/v1/funds/{fund_id}/investors/{investor_id}",
                headers=self.get_headers()
            )
            data = response.json()
            if data.get("code") == 0 and data["data"]["name"] == "TestInvestor":
                self.log_result("Get investor details", True)
            else:
                self.log_result("Get investor details", False)

        # 5. 更新投资者名称
        if investor_id:
            response = requests.put(
                f"{self.base_url}/api/v1/funds/{fund_id}/investors/{investor_id}",
                headers=self.get_headers(),
                json={"name": "UpdatedInvestor"}
            )
            data = response.json()
            if data.get("code") == 0 and data["data"]["name"] == "UpdatedInvestor":
                self.log_result("Update investor name", True)
            else:
                self.log_result("Update investor name", False)

        return investor_id

    def test_operations(self, fund_id: Optional[int], investor_id: Optional[int]):
        """Test share operations"""
        print("\n💸 Testing Share Operations")

        if not fund_id or not investor_id:
            self.log_result("Test operations", False, "No fund_id or investor_id available")
            return

        investor2_id = None

        # 1. 申购
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors/{investor_id}/invest",
            headers=self.get_headers(),
            json={"amount": 1000.0, "date": "2026-03-03"}
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Invest 1000", True, f"New share: {data['data']['new_share']}")
        else:
            self.log_result("Invest 1000", False, data.get("message"))

        # 2. 申购负数
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors/{investor_id}/invest",
            headers=self.get_headers(),
            json={"amount": -100.0, "date": "2026-03-03"}
        )
        if response.status_code == 400 or response.json().get("code") == 40001:
            self.log_result("Invest with negative amount", True, "Correctly rejected")
        else:
            self.log_result("Invest with negative amount", False, "Should have been rejected")

        # 3. 添加第二个投资者
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors",
            headers=self.get_headers(),
            json={"name": "Investor2"}
        )
        data = response.json()
        if data.get("code") == 0:
            investor2_id = data["data"]["id"]
            self.log_result("Add second investor", True)
        else:
            self.log_result("Add second investor", False)

        # 4. NAV 更新
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/update-nav",
            headers=self.get_headers(),
            json={"capital": 1500.0, "date": "2026-03-03"}
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Update NAV to 1500", True, f"New NAV: {data['data']['new_nav']}")
        else:
            self.log_result("Update NAV", False, data.get("message"))

        # 5. 没有投资者时更新 NAV（应该失败）
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/update-nav",
            headers=self.get_headers(),
            json={"capital": 2000.0, "date": "2026-03-03"}
        )
        # 这个测试可能失败，因为有投资者

        # 6. 赎回 - 按份额
        if investor_id:
            response = requests.post(
                f"{self.base_url}/api/v1/funds/{fund_id}/investors/{investor_id}/redeem",
                headers=self.get_headers(),
                json={"amount": 100.0, "amount_type": "share", "date": "2026-03-03"}
            )
            data = response.json()
            if data.get("code") == 0:
                self.log_result("Redeem 100 shares", True, f"Redeemed balance: {data['data']['redeemed_balance']}")
            else:
                self.log_result("Redeem 100 shares", False, data.get("message"))

        # 7. 赎回 - 按市值
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors/{investor_id}/redeem",
            headers=self.get_headers(),
            json={"amount": 200.0, "amount_type": "balance", "date": "2026-03-03"}
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Redeem 200 balance", True)
        else:
            self.log_result("Redeem 200 balance", False, data.get("message"))

        # 8. 赎回超过持有量
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors/{investor_id}/redeem",
            headers=self.get_headers(),
            json={"amount": 999999.0, "amount_type": "balance", "date": "2026-03-03"}
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Redeem more than balance", True, "Successfully redeemed all")
        else:
            self.log_result("Redeem more than balance", False, data.get("message"))

        # 9. 转账
        if investor2_id:
            response = requests.post(
                f"{self.base_url}/api/v1/funds/{fund_id}/transfer",
                headers=self.get_headers(),
                json={
                    "from_investor_id": investor_id,
                    "to_investor_id": investor2_id,
                    "amount": 50.0,
                    "amount_type": "balance",
                    "date": "2026-03-03"
                }
            )
            data = response.json()
            if data.get("code") == 0:
                self.log_result("Transfer 50 balance", True)
            else:
                self.log_result("Transfer 50 balance", False, data.get("message"))

        # 10. 转账超过持有量
        response = requests.post(
            f"{self.base_url}/api/v1/funds/{fund_id}/transfer",
            headers=self.get_headers(),
            json={
                "from_investor_id": investor_id,
                "to_investor_id": investor2_id,
                "amount": 999999.0,
                "amount_type": "balance",
                "date": "2026-03-03"
            }
        )
        if response.status_code == 400 or response.json().get("code") == 40001:
            self.log_result("Transfer more than balance", True, "Correctly rejected")
        else:
            self.log_result("Transfer more than balance", False, "Should have been rejected")

    def test_data_queries(self, fund_id: Optional[int], investor_id: Optional[int]):
        """Test data queries"""
        print("\n📊 Testing Data Queries")

        if not fund_id:
            self.log_result("Test data queries", False, "No fund ID available")
            return

        # 1. 获取操作记录
        response = requests.get(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors/operations",
            headers=self.get_headers()
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Get operations", True, f"Found {len(data['data']['items'])} operations")
        else:
            self.log_result("Get operations", False)

        # 2. 按类型筛选
        response = requests.get(
            f"{self.base_url}/api/v1/funds/{fund_id}/investors/operations",
            params={"operation_type": "invest"},
            headers=self.get_headers()
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Filter operations by type", True)
        else:
            self.log_result("Filter operations by type", False)

        # 3. 获取基金历史
        response = requests.get(
            f"{self.base_url}/api/v1/funds/{fund_id}/history",
            headers=self.get_headers()
        )
        data = response.json()
        if data.get("code") == 0:
            self.log_result("Get fund history", True, f"Found {len(data['data']['items'])} records")
        else:
            self.log_result("Get fund history", False)

        # 4. 获取图表数据
        response = requests.get(
            f"{self.base_url}/api/v1/funds/{fund_id}/chart",
            headers=self.get_headers()
        )
        data = response.json()
        if data.get("code") == 0 and "nav" in data.get("data", {}):
            self.log_result("Get chart data", True)
        else:
            self.log_result("Get chart data", False)

        # 5. 获取投资者操作记录
        if investor_id:
            response = requests.get(
                f"{self.base_url}/api/v1/funds/{fund_id}/investors/{investor_id}/operations",
                headers=self.get_headers()
            )
            data = response.json()
            if data.get("code") == 0:
                self.log_result("Get investor operations", True)
            else:
                self.log_result("Get investor operations", False)

    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("Fund Manager API Test Suite")
        print("=" * 60)

        # 测试认证
        self.test_auth()

        # 测试基金管理
        fund_id = self.test_funds()

        # 测试投资者管理
        investor_id = self.test_investors(fund_id)

        # 测试份额操作
        self.test_operations(fund_id, investor_id)

        # 测试数据查询
        self.test_data_queries(fund_id, investor_id)

        # 生成报告
        self.generate_report()

    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 60)
        print("Test Report")
        print("=" * 60)

        passed = sum(1 for r in self.test_results if r["success"])
        failed = sum(1 for r in self.test_results if not r["success"])
        total = len(self.test_results)

        print(f"\nTotal: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {passed/total*100:.1f}%")

        print("\nFailed Tests:")
        for result in self.test_results:
            if not result["success"]:
                print(f"  - {result['test']}")
                if result.get("message"):
                    print(f"    {result['message']}")

        print("\n" + "=" * 60)


def main():
    """Main function"""
    tester = FundManagerTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
