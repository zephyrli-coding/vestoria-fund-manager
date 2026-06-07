#!/usr/bin/env python3
"""
测试用例 1: 基础申购和净值更新场景

场景:
1. 创建基金A
2. 投资者aa投入100
3. 更新净值（资金→150）
4. 投资者bb投入100
5. 更新净值（资金→200）
6. 验证: aa赚钱，bb亏钱

预期结果:
- aa 投入100元 → 获得100份 → 最终120元 (赚20元)
- bb 投入100元 → 获得66.67份 → 最终80元 (亏20元)
"""

import sys
sys.path.insert(0, '.')
from app.db import SessionLocal
from app.services.fund_service import FundService
from app.services.investor_service import InvestorService
from sqlalchemy import text


def clean_database(db):
    """清空测试数据"""
    db.execute(text("DELETE FROM operations"))
    db.execute(text("DELETE FROM investors"))
    db.execute(text("DELETE FROM fund_history"))
    db.execute(text("DELETE FROM funds"))
    db.commit()
    print("✅ 数据库已清空")


def run_test():
    db = SessionLocal()
    
    # 使用不同日期
    date1 = "2026-03-01"
    date2 = "2026-03-02"
    date3 = "2026-03-03"
    
    try:
        # 清理数据
        clean_database(db)
        
        # 步骤1: 创建基金A
        print("\n" + "="*50)
        print("📌 步骤1: 创建基金A")
        print("="*50)
        fund_service = FundService(db)
        fund = fund_service.create_fund(name="基金A", start_date=date1)
        print(f"   基金ID: {fund.id}")
        print(f"   初始NAV: {fund.net_asset_value}")
        print(f"   总份额: {fund.total_share}")
        
        # 步骤2: 添加投资者aa并投入100
        print("\n" + "="*50)
        print("📌 步骤2: 投资者aa投入100")
        print("="*50)
        investor_service = InvestorService(db)
        investor_aa = investor_service.add_investor(fund_id=fund.id, name="aa", date=date1)
        result_aa = investor_service.invest(fund_id=fund.id, investor_id=investor_aa.id, amount=100, date=date1)
        print(f"   aa 投入: 100元")
        print(f"   获得份额: {result_aa['new_share']:.4f}")
        print(f"   当前NAV: {result_aa['fund_nav']}")
        
        # 步骤3: 更新NAV，使资金变成150
        print("\n" + "="*50)
        print("📌 步骤3: 更新净值（资金→150）")
        print("="*50)
        result_nav1 = fund_service.update_nav(fund_id=fund.id, capital=150, date=date2)
        print(f"   新NAV: {result_nav1['new_nav']:.4f}")
        aa_info = investor_service.get_investor(fund_id=fund.id, investor_id=investor_aa.id)
        aa_value = aa_info.share * result_nav1['new_nav']
        print(f"   aa 持仓价值: {aa_value:.2f} 元")
        print(f"   aa 当前盈亏: +{aa_value-100:.2f} 元")
        
        # 步骤4: bb投入100
        print("\n" + "="*50)
        print("📌 步骤4: 投资者bb投入100")
        print("="*50)
        investor_bb = investor_service.add_investor(fund_id=fund.id, name="bb", date=date2)
        result_bb = investor_service.invest(fund_id=fund.id, investor_id=investor_bb.id, amount=100, date=date2)
        print(f"   bb 投入: 100元")
        print(f"   获得份额: {result_bb['new_share']:.4f}")
        print(f"   申购时NAV: {result_nav1['new_nav']:.4f}")
        fund = fund_service.get_fund(fund.id)
        print(f"   基金总份额: {fund.total_share:.4f}")
        
        # 步骤5: 更新NAV，使资金变成200（总资产缩水）
        print("\n" + "="*50)
        print("📌 步骤5: 更新净值（资金→200，总资产缩水）")
        print("="*50)
        result_nav2 = fund_service.update_nav(fund_id=fund.id, capital=200, date=date3)
        print(f"   新NAV: {result_nav2['new_nav']:.4f} (=200/{fund.total_share:.4f})")
        
        # 步骤6: 最终结果
        print("\n" + "="*50)
        print("📊 最终结果")
        print("="*50)
        aa_info = investor_service.get_investor(fund_id=fund.id, investor_id=investor_aa.id)
        bb_info = investor_service.get_investor(fund_id=fund.id, investor_id=investor_bb.id)
        
        aa_value = aa_info.share * result_nav2['new_nav']
        bb_value = bb_info.share * result_nav2['new_nav']
        
        print(f"\n💰 aa:")
        print(f"   持仓: {aa_info.share:.4f} 份 × {result_nav2['new_nav']:.4f} = {aa_value:.2f} 元")
        print(f"   投入: 100元 → 当前: {aa_value:.2f}元")
        print(f"   盈亏: {'+' if aa_value > 100 else ''}{aa_value-100:.2f} 元 ({((aa_value/100-1)*100):+.1f}%)")
        
        print(f"\n💰 bb:")
        print(f"   持仓: {bb_info.share:.4f} 份 × {result_nav2['new_nav']:.4f} = {bb_value:.2f} 元")
        print(f"   投入: 100元 → 当前: {bb_value:.2f}元")
        print(f"   盈亏: {'+' if bb_value > 100 else ''}{bb_value-100:.2f} 元 ({((bb_value/100-1)*100):+.1f}%)")
        
        # 验证预期
        print("\n" + "="*50)
        print("✅ 验证结果")
        print("="*50)
        aa_correct = aa_value > 100  # aa 应该赚钱
        bb_correct = bb_value < 100  # bb 应该亏钱
        
        print(f"\n   aa 赚钱? {'✅ PASS' if aa_correct else '❌ FAIL'} (实际 {aa_value:.2f} > 100)")
        print(f"   bb 亏钱? {'✅ PASS' if bb_correct else '❌ FAIL'} (实际 {bb_value:.2f} < 100)")
        
        if aa_correct and bb_correct:
            print("\n🎉 测试通过！程序逻辑正确。")
            return True
        else:
            print("\n❌ 测试未通过！")
            return False
            
    finally:
        db.close()


if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
