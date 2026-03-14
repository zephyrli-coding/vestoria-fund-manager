# Investor 优化 TODO 清单

## 方案：空间换时间（Investor 收益快照表）

---

## 任务列表

### 1. 数据库模型 ✅
- [x] **修改 `backend/app/models/investor.py`**
  - 新增字段 `total_invested` (累计投入，默认 0)
  - 新增字段 `total_redeemed` (累计赎回，默认 0)

- [x] **新建 `backend/app/models/investor_return_snapshot.py`**
  - `id`, `investor_id`, `fund_id`, `date`
  - `nav`, `share`, `total_invested`, `total_redeemed`, `total_return`
  - `created_at`

- [x] **修改 `backend/app/models/__init__.py`**
  - 导入新模型

### 2. Schema ✅
- [x] **修改 `backend/app/schemas/investor.py`**
  - `InvestorResponse` 增加 `total_invested`, `total_redeemed`
  - 新增 `InvestorReturnSnapshot` schema

### 3. API 路由 ✅
- [x] **修改 `backend/app/services/investor_service.py`**
  - 申购 → 增加 `total_invested`
  - 赎回 → 增加 `total_redeemed`
  - 转账 → 转出方 `total_redeemed++`，转入方 `total_invested++`

- [x] **修改 `backend/app/services/fund_service.py`**
  - NAV 更新后 → 遍历该基金所有 investor，生成快照记录

- [x] **新增 API 端点 `backend/app/api/investors.py`**
  - GET `/{investor_id}/return-history` - 获取收益历史

### 4. 数据迁移（⚠️ 先备份数据库）✅
- [x] **迁移脚本 1：初始化 investor 累计字段**
  - 为 investor 表增加字段
  - 基于 operation 计算并填充现有数据

- [x] **迁移脚本 2：生成历史快照**
  - 基于历史 operation 和 NAV 历史
  - 生成所有 investor 的历史收益快照

### 5. 前端 ✅
- [x] **修改 `frontend/src/types/api.ts`**
  - Investor 类型增加 `total_invested`, `total_redeemed`

- [x] **修改 `frontend/src/pages/Investors.tsx`**
  - 列表增加"累计收益"列（绿色/红色根据正负显示）
  - 下方小字显示"投入: xxx / 赎回: xxx"

---

## 累计收益计算公式

```
累计收益 = (当前份额 × 当前净值) + 累计赎回 - 累计投入
```

---

## 注意事项

- ⚠️ **数据库操作前务必备份**
- 修改模型后需要更新 `__init__.py` 导入
- 迁移脚本要支持幂等执行（可重复运行）
