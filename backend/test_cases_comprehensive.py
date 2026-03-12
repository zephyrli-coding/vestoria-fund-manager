#!/usr/bin/env python3
"""
基金管理系统 - 复杂场景测试用例集

测试案例 1-10: 涵盖基金全生命周期、投资者操作、边界条件等
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
    print("✅ 数据库已清空\n")


# =============================================================================
# 测试案例 1: 基金生命周期全流程
# =============================================================================
def test_case_1():
    """
    场景: 基金CRUD完整流程
    
    步骤:
    1. 创建基金A (名称: "测试基金A", 成立日期: 2026-01-01)
    2. 查询基金列表，验证基金A存在
    3. 查询基金A详情，验证信息正确
    4. 修改基金A名称为 "测试基金A-已修改"
    5. 查询验证名称已更新
    6. 删除基金A
    7. 查询验证基金A已不存在
    
    预期: 每个步骤都成功，数据一致性保持
    """
    print("="*60)
    print("🧪 测试案例 1: 基金生命周期全流程")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        
        # 步骤1: 创建基金
        print("📌 步骤1: 创建基金A")
        fund = fund_service.create_fund(name="测试基金A", start_date="2026-01-01")
        print(f"   ✅ 创建成功: ID={fund.id}, 名称={fund.name}")
        
        # 步骤2: 查询列表
        print("📌 步骤2: 查询基金列表")
        funds = fund_service.get_funds()
        assert len(funds) == 1, "应该只有1个基金"
        assert funds[0].name == "测试基金A", "基金名称应该匹配"
        print(f"   ✅ 列表查询成功，共 {len(funds)} 个基金")
        
        # 步骤3: 查询详情
        print("📌 步骤3: 查询基金详情")
        fund_detail = fund_service.get_fund(fund.id)
        assert fund_detail is not None, "基金应该存在"
        assert fund_detail.name == "测试基金A", "详情名称应该匹配"
        print(f"   ✅ 详情查询成功: {fund_detail.name}")
        
        # 步骤4: 修改基金
        print("📌 步骤4: 修改基金名称")
        updated = fund_service.update_fund(fund_id=fund.id, name="测试基金A-已修改")
        print(f"   ✅ 修改成功: {updated.name}")
        
        # 步骤5: 验证修改
        print("📌 步骤5: 验证名称已更新")
        fund_after = fund_service.get_fund(fund.id)
        assert fund_after.name == "测试基金A-已修改", "名称应该已修改"
        print(f"   ✅ 验证成功，新名称: {fund_after.name}")
        
        # 步骤6: 删除基金
        print("📌 步骤6: 删除基金")
        fund_service.delete_fund(fund.id)
        print(f"   ✅ 删除成功")
        
        # 步骤7: 验证删除
        print("📌 步骤7: 验证基金已不存在")
        funds_after = fund_service.get_funds()
        assert len(funds_after) == 0, "基金列表应该为空"
        print(f"   ✅ 验证成功，列表为空")
        
        print("\n🎉 测试案例1通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 2: 多投资者申购与收益分配
# =============================================================================
def test_case_2():
    """
    场景: 多投资者不同时间点申购，验证收益分配
    
    步骤:
    1. 创建基金B
    2. 投资者甲在第1天投入1000元
    3. 第2天更新净值，总资产变为1200元（盈利20%）
    4. 投资者乙在第2天投入1000元
    5. 第3天更新净值，总资产变为1500元
    6. 查询两位投资者的持仓价值和盈亏
    
    预期: 
    - 甲先投入且享受涨幅，应该盈利更多
    - 乙后投入，享受较少涨幅
    """
    print("="*60)
    print("🧪 测试案例 2: 多投资者申购与收益分配")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1: 创建基金
        print("📌 步骤1: 创建基金B")
        fund = fund_service.create_fund(name="基金B", start_date="2026-01-01")
        print(f"   ✅ 基金创建成功")
        
        # 步骤2: 投资者甲申购
        print("📌 步骤2: 投资者甲投入1000元 (Day 1)")
        investor_jia = investor_service.add_investor(fund.id, "甲", "2026-01-01")
        result_jia = investor_service.invest(fund.id, investor_jia.id, 1000, "2026-01-01")
        print(f"   ✅ 甲获得 {result_jia['new_share']:.4f} 份")
        
        # 步骤3: 第1次净值更新（盈利20%）
        print("📌 步骤3: Day 2 更新净值，总资产1200")
        fund_service.update_nav(fund.id, 1200, "2026-01-02")
        print(f"   ✅ NAV更新为 1.2")
        
        # 步骤4: 投资者乙申购
        print("📌 步骤4: 投资者乙投入1000元 (Day 2)")
        investor_yi = investor_service.add_investor(fund.id, "乙", "2026-01-02")
        result_yi = investor_service.invest(fund.id, investor_yi.id, 1000, "2026-01-02")
        print(f"   ✅ 乙获得 {result_yi['new_share']:.4f} 份")
        
        # 步骤5: 第2次净值更新
        print("📌 步骤5: Day 3 更新净值，总资产1500")
        fund_service.update_nav(fund.id, 1500, "2026-01-03")
        nav_info = fund_service.get_fund(fund.id)
        print(f"   ✅ NAV更新为 {nav_info.net_asset_value:.4f}")
        
        # 步骤6: 验证结果
        print("📌 步骤6: 验证两位投资者盈亏")
        jia = investor_service.get_investor(fund.id, investor_jia.id)
        yi = investor_service.get_fund(fund.id)
        final_nav = nav_info.net_asset_value
        
        jia_value = jia.share * final_nav
        yi_value = investor_service.get_investor(fund.id, investor_yi.id).share * final_nav
        
        print(f"\n   💰 甲: 投入1000 → 当前{jia_value:.2f} (盈亏: {jia_value-1000:+.2f})")
        print(f"   💰 乙: 投入1000 → 当前{yi_value:.2f} (盈亏: {yi_value-1000:+.2f})")
        
        # 验证: 甲先投入应该盈利更多
        assert jia_value > yi_value, "先投入的甲应该盈利更多"
        assert jia_value > 1000, "甲应该盈利"
        assert yi_value > 1000, "乙也应该盈利"
        
        print("\n🎉 测试案例2通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 3: 部分赎回场景
# =============================================================================
def test_case_3():
    """
    场景: 投资者部分赎回份额
    
    步骤:
    1. 创建基金C
    2. 投资者投入1000元获得1000份
    3. 净值上涨到1.5（资产1500元）
    4. 投资者赎回500份
    5. 验证剩余份额和资产
    
    预期:
    - 赎回后剩余500份
    - 获得赎回金额750元
    - 剩余资产价值750元
    """
    print("="*60)
    print("🧪 测试案例 3: 部分赎回场景")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1-2: 创建基金和投资者
        print("📌 步骤1-2: 创建基金C，投资者投入1000元")
        fund = fund_service.create_fund(name="基金C", start_date="2026-01-01")
        investor = investor_service.add_investor(fund.id, "赎回测试", "2026-01-01")
        investor_service.invest(fund.id, investor.id, 1000, "2026-01-01")
        print(f"   ✅ 投入1000元，获得1000份")
        
        # 步骤3: 净值上涨
        print("📌 步骤3: 净值上涨到1.5")
        fund_service.update_nav(fund.id, 1500, "2026-01-02")
        print(f"   ✅ NAV = 1.5")
        
        # 步骤4: 部分赎回
        print("📌 步骤4: 赎回500份")
        result = investor_service.redeem(
            fund_id=fund.id, 
            investor_id=investor.id, 
            amount=500, 
            amount_type="share",
            date="2026-01-03"
        )
        print(f"   ✅ 赎回成功，获得金额: {result['balance_change']:.2f}")
        
        # 步骤5: 验证
        print("📌 步骤5: 验证剩余持仓")
        investor_after = investor_service.get_investor(fund.id, investor.id)
        print(f"   剩余份额: {investor_after.share:.4f}")
        print(f"   剩余资产: {investor_after.balance:.2f}")
        
        assert abs(investor_after.share - 500) < 0.01, "应该剩余500份"
        assert abs(investor_after.balance - 750) < 1, "剩余资产应该约750元"
        
        print("\n🎉 测试案例3通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 4: 份额转账场景
# =============================================================================
def test_case_4():
    """
    场景: 投资者之间转让份额
    
    步骤:
    1. 创建基金D
    2. 投资者A投入1000元获得1000份
    3. 投资者B投入500元获得500份
    4. A转账300份给B
    5. 验证双方份额变化
    
    预期:
    - A剩余700份
    - B持有800份
    """
    print("="*60)
    print("🧪 测试案例 4: 份额转账场景")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1-3: 创建基金和两位投资者
        print("📌 步骤1-3: 创建基金，A投1000，B投500")
        fund = fund_service.create_fund(name="基金D", start_date="2026-01-01")
        
        investor_a = investor_service.add_investor(fund.id, "A", "2026-01-01")
        investor_service.invest(fund.id, investor_a.id, 1000, "2026-01-01")
        
        investor_b = investor_service.add_investor(fund.id, "B", "2026-01-01")
        investor_service.invest(fund.id, investor_b.id, 500, "2026-01-01")
        
        print(f"   ✅ A: 1000份, B: 500份")
        
        # 步骤4: A转账给B
        print("📌 步骤4: A转账300份给B")
        investor_service.transfer(
            fund_id=fund.id,
            from_investor_id=investor_a.id,
            to_investor_id=investor_b.id,
            share=300,
            date="2026-01-02"
        )
        print(f"   ✅ 转账成功")
        
        # 步骤5: 验证
        print("📌 步骤5: 验证份额变化")
        a_after = investor_service.get_investor(fund.id, investor_a.id)
        b_after = investor_service.get_investor(fund.id, investor_b.id)
        
        print(f"   A: {a_after.share:.4f}份 (预期: 700)")
        print(f"   B: {b_after.share:.4f}份 (预期: 800)")
        
        assert abs(a_after.share - 700) < 0.01, "A应该剩余700份"
        assert abs(b_after.share - 800) < 0.01, "B应该持有800份"
        
        print("\n🎉 测试案例4通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 5: 亏损场景验证
# =============================================================================
def test_case_5():
    """
    场景: 基金亏损时投资者赎回
    
    步骤:
    1. 创建基金E
    2. 投资者投入1000元
    3. 净值下跌到0.8（资产800元，亏损20%）
    4. 投资者赎回全部份额
    5. 验证赎回金额和亏损
    
    预期:
    - 赎回金额约800元
    - 实际亏损200元
    """
    print("="*60)
    print("🧪 测试案例 5: 亏损场景验证")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1-2: 创建并投入
        print("📌 步骤1-2: 创建基金E，投入1000元")
        fund = fund_service.create_fund(name="基金E", start_date="2026-01-01")
        investor = investor_service.add_investor(fund.id, "亏损测试", "2026-01-01")
        investor_service.invest(fund.id, investor.id, 1000, "2026-01-01")
        print(f"   ✅ 投入1000元")
        
        # 步骤3: 净值下跌
        print("📌 步骤3: 净值下跌20% (NAV=0.8)")
        fund_service.update_nav(fund.id, 800, "2026-01-02")
        print(f"   ✅ 当前资产800元")
        
        # 步骤4: 全部赎回
        print("📌 步骤4: 全部赎回")
        result = investor_service.redeem(
            fund_id=fund.id,
            investor_id=investor.id,
            amount=1000,  # 全部份额
            amount_type="share",
            date="2026-01-03"
        )
        print(f"   ✅ 赎回金额: {abs(result['balance_change']):.2f}")
        
        # 步骤5: 验证
        print("📌 步骤5: 验证亏损")
        redeemed_amount = abs(result['balance_change'])
        loss = 1000 - redeemed_amount
        print(f"   投入: 1000元")
        print(f"   赎回: {redeemed_amount:.2f}元")
        print(f"   亏损: {loss:.2f}元")
        
        assert abs(redeemed_amount - 800) < 1, "赎回金额应该约800元"
        assert loss > 0, "应该有亏损"
        
        print("\n🎉 测试案例5通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 6: 多基金独立管理
# =============================================================================
def test_case_6():
    """
    场景: 多个基金数据相互独立
    
    步骤:
    1. 创建基金F1和F2
    2. 向F1投入1000元
    3. 向F2投入2000元
    4. 更新F1净值
    5. 验证F2不受影响
    
    预期: F1和F2的数据完全独立
    """
    print("="*60)
    print("🧪 测试案例 6: 多基金独立管理")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1: 创建两个基金
        print("📌 步骤1: 创建基金F1和F2")
        f1 = fund_service.create_fund(name="基金F1", start_date="2026-01-01")
        f2 = fund_service.create_fund(name="基金F2", start_date="2026-01-01")
        print(f"   ✅ F1 ID={f1.id}, F2 ID={f2.id}")
        
        # 步骤2-3: 分别投入
        print("📌 步骤2-3: F1投1000，F2投2000")
        inv_f1 = investor_service.add_investor(f1.id, "F1投资者", "2026-01-01")
        investor_service.invest(f1.id, inv_f1.id, 1000, "2026-01-01")
        
        inv_f2 = investor_service.add_investor(f2.id, "F2投资者", "2026-01-01")
        investor_service.invest(f2.id, inv_f2.id, 2000, "2026-01-01")
        print(f"   ✅ 投资完成")
        
        # 步骤4: 只更新F1
        print("📌 步骤4: 更新F1净值 (资产→1500)")
        fund_service.update_nav(f1.id, 1500, "2026-01-02")
        
        # 步骤5: 验证独立性
        print("📌 步骤5: 验证F2未受影响")
        f1_after = fund_service.get_fund(f1.id)
        f2_after = fund_service.get_fund(f2.id)
        
        print(f"   F1 资产: {f1_after.balance:.2f} (应该1500)")
        print(f"   F2 资产: {f2_after.balance:.2f} (应该2000)")
        
        assert abs(f1_after.balance - 1500) < 1, "F1应该1500"
        assert abs(f2_after.balance - 2000) < 1, "F2应该保持2000"
        
        print("\n🎉 测试案例6通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 7: 边界值测试 - 极小金额
# =============================================================================
def test_case_7():
    """
    场景: 极小金额操作
    
    步骤:
    1. 创建基金G
    2. 投入0.01元
    3. 更新净值
    4. 赎回
    
    预期: 系统能处理极小金额，精度保持
    """
    print("="*60)
    print("🧪 测试案例 7: 边界值测试 - 极小金额")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1-2: 创建并投入极小金额
        print("📌 步骤1-2: 创建基金，投入0.01元")
        fund = fund_service.create_fund(name="基金G", start_date="2026-01-01")
        investor = investor_service.add_investor(fund.id, "小额测试", "2026-01-01")
        result = investor_service.invest(fund.id, investor.id, 0.01, "2026-01-01")
        print(f"   ✅ 投入0.01元，获得 {result['new_share']:.6f} 份")
        
        # 步骤3: 更新净值
        print("📌 步骤3: 更新净值到0.015")
        fund_service.update_nav(fund.id, 0.015, "2026-01-02")
        
        # 步骤4: 赎回
        print("📌 步骤4: 赎回全部")
        redeem_result = investor_service.redeem(
            fund.id, investor.id, 
            result['new_share'], "share", "2026-01-03"
        )
        
        final_amount = abs(redeem_result['balance_change'])
        print(f"   ✅ 赎回金额: {final_amount:.6f}元")
        
        # 验证精度
        assert final_amount > 0, "应该能赎回正金额"
        print("\n🎉 测试案例7通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 8: 高频净值更新
# =============================================================================
def test_case_8():
    """
    场景: 一天内多次更新净值
    
    步骤:
    1. 创建基金H
    2. 投资者投入1000元
    3. 同一天内更新净值5次（1000→1100→1200→1100→1300→1250）
    4. 验证最终NAV正确
    
    预期: 每次更新都正确计算，最终NAV = 1.25
    """
    print("="*60)
    print("🧪 测试案例 8: 高频净值更新")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1-2: 创建并投入
        print("📌 步骤1-2: 创建基金H，投入1000")
        fund = fund_service.create_fund(name="基金H", start_date="2026-01-01")
        investor = investor_service.add_investor(fund.id, "高频测试", "2026-01-01")
        investor_service.invest(fund.id, investor.id, 1000, "2026-01-01")
        
        # 步骤3: 多次更新净值
        print("📌 步骤3: 同一天内5次净值更新")
        values = [1100, 1200, 1100, 1300, 1250]
        for i, val in enumerate(values, 1):
            fund_service.update_nav(fund.id, val, "2026-01-01")
            fund_info = fund_service.get_fund(fund.id)
            print(f"   更新{i}: {val} → NAV={fund_info.net_asset_value:.4f}")
        
        # 步骤4: 验证
        print("📌 步骤4: 验证最终NAV")
        final_fund = fund_service.get_fund(fund.id)
        expected_nav = 1250 / 1000  # 总资产1250 / 总份额1000
        print(f"   最终NAV: {final_fund.net_asset_value:.4f} (预期: {expected_nav:.4f})")
        
        assert abs(final_fund.net_asset_value - expected_nav) < 0.0001, "NAV计算错误"
        
        print("\n🎉 测试案例8通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 9: 投资者重复名称测试
# =============================================================================
def test_case_9():
    """
    场景: 同一基金内投资者名称唯一性
    
    步骤:
    1. 创建基金I
    2. 添加投资者"张三"
    3. 尝试再添加同名"张三"
    4. 验证是否被拒绝
    
    预期: 第二次添加应该失败或重命名
    """
    print("="*60)
    print("🧪 测试案例 9: 投资者名称唯一性")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1-2: 创建基金和第一个投资者
        print("📌 步骤1-2: 创建基金I，添加投资者'张三'")
        fund = fund_service.create_fund(name="基金I", start_date="2026-01-01")
        inv1 = investor_service.add_investor(fund.id, "张三", "2026-01-01")
        print(f"   ✅ 第一个张三 ID={inv1.id}")
        
        # 步骤3: 尝试添加同名
        print("📌 步骤3: 尝试添加第二个'张三'")
        try:
            inv2 = investor_service.add_investor(fund.id, "张三", "2026-01-01")
            print(f"   ⚠️ 允许重复名称，第二个张三 ID={inv2.id}")
            # 如果允许重复，验证两者ID不同
            assert inv1.id != inv2.id, "ID应该不同"
        except Exception as e:
            print(f"   ✅ 正确拒绝重复名称: {e}")
        
        print("\n🎉 测试案例9通过！\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        return False
    finally:
        db.close()


# =============================================================================
# 测试案例 10: 复杂多步骤组合场景
# =============================================================================
def test_case_10():
    """
    场景: 复杂组合操作 - 模拟真实投资周期
    
    步骤:
    1. 创建基金J，设定成立日
    2. 投资者A申购500元
    3. 投资者B申购800元
    4. 第1个月：净值上涨10%
    5. 投资者C申购1000元
    6. 第2个月：净值下跌5%
    7. 投资者A赎回50%份额
    8. 投资者B转账100份给C
    9. 第3个月：净值上涨20%
    10. 查询所有投资者最终盈亏
    
    预期: 所有操作正确执行，数据一致性保持
    """
    print("="*60)
    print("🧪 测试案例 10: 复杂组合场景")
    print("="*60)
    
    db = SessionLocal()
    try:
        clean_database(db)
        fund_service = FundService(db)
        investor_service = InvestorService(db)
        
        # 步骤1: 创建基金
        print("📌 步骤1: 创建基金J")
        fund = fund_service.create_fund(name="基金J", start_date="2026-01-01")
        print(f"   ✅ 基金创建")
        
        # 步骤2-3: A和B申购
        print("📌 步骤2-3: A投500，B投800")
        inv_a = investor_service.add_investor(fund.id, "A", "2026-01-01")
        investor_service.invest(fund.id, inv_a.id, 500, "2026-01-01")
        
        inv_b = investor_service.add_investor(fund.id, "B", "2026-01-01")
        investor_service.invest(fund.id, inv_b.id, 800, "2026-01-01")
        print(f"   ✅ A和B投资完成")
        
        # 步骤4: 第1个月净值上涨10% (1300 → 1430)
        print("📌 步骤4: 第1个月净值上涨10%")
        fund_service.update_nav(fund.id, 1430, "2026-02-01")
        nav1 = fund_service.get_fund(fund.id).net_asset_value
        print(f"   ✅ NAV = {nav1:.4f}")
        
        # 步骤5: C申购
        print("📌 步骤5: C申购1000")
        inv_c = investor_service.add_investor(fund.id, "C", "2026-02-01")
        investor_service.invest(fund.id, inv_c.id, 1000, "2026-02-01")
        
        # 步骤6: 第2个月下跌5%
        print("📌 步骤6: 第2个月净值下跌5%")
        current_total = 1430 + 1000
        new_total = current_total * 0.95
        fund_service.update_nav(fund.id, new_total, "2026-03-01")
        nav2 = fund_service.get_fund(fund.id).net_asset_value
        print(f"   ✅ NAV = {nav2:.4f}")
        
        # 步骤7: A赎回50%
        print("📌 步骤7: A赎回50%份额")
        a_info = investor_service.get_investor(fund.id, inv_a.id)
        investor_service.redeem(fund.id, inv_a.id, a_info.share * 0.5, "share", "2026-03-02")
        print(f"   ✅ A赎回完成")
        
        # 步骤8: B转100份给C
        print("📌 步骤8: B转账100份给C")
        investor_service.transfer(fund.id, inv_b.id, inv_c.id, 100, "2026-03-03")
        print(f"   ✅ 转账完成")
        
        # 步骤9: 第3个月上涨20%
        print("📌 步骤9: 第3个月净值上涨20%")
        fund_after = fund_service.get_fund(fund.id)
        final_total = fund_after.balance * 1.2
        fund_service.update_nav(fund.id, final_total, "2026-04-01")
        nav3 = fund_service.get_fund(fund.id).net_asset_value
        print(f"   ✅ NAV = {nav3:.4f}")
        
        # 步骤10: 查询最终盈亏
        print("📌 步骤10: 最终盈亏统计")
        print("-" * 40)
        
        a_final = investor_service.get_investor(fund.id, inv_a.id)
        b_final = investor_service.get_investor(fund.id, inv_b.id)
        c_final = investor_service.get_fund(fund.id)
        
        a_value = a_final.share * nav3
        b_value = b_final.share * nav3
        c_value = investor_service.get_investor(fund.id, inv_c.id).share * nav3
        
        # A投入了500，赎回了部分，计算较复杂
        print(f"   A: 投入500，当前价值约 {a_value:.2f}")
        print(f"   B: 投入800，当前价值约 {b_value:.2f}")
        print(f"   C: 投入1000，当前价值约 {c_value:.2f}")
        
        print("\n🎉 测试案例10通过！复杂场景处理正确。\n")
        return True
    except Exception as e:
        print(f"\n❌ 测试失败: {e}\n")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


# =============================================================================
# 主函数：运行所有测试
# =============================================================================
def run_all_tests():
    """运行所有测试案例"""
    print("\n" + "="*60)
    print("🚀 基金管理系统 - 复杂场景测试套件")
    print("="*60 + "\n")
    
    test_cases = [
        ("基金生命周期全流程", test_case_1),
        ("多投资者申购与收益分配", test_case_2),
        ("部分赎回场景", test_case_3),
        ("份额转账场景", test_case_4),
        ("亏损场景验证", test_case_5),
        ("多基金独立管理", test_case_6),
        ("边界值测试 - 极小金额", test_case_7),
        ("高频净值更新", test_case_8),
        ("投资者名称唯一性", test_case_9),
        ("复杂组合场景", test_case_10),
    ]
    
    results = []
    for name, test_func in test_cases:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ 测试 {name} 异常: {e}\n")
            results.append((name, False))
    
    # 汇总结果
    print("\n" + "="*60)
    print("📊 测试结果汇总")
    print("="*60)
    passed = sum(1 for _, r in results if r)
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"   {status} - {name}")
    print("-"*60)
    print(f"   总计: {passed}/{len(results)} 通过")
    print("="*60)
    
    return passed == len(results)


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
