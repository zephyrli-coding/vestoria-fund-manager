# 基金管理系统 API 设计文档

**版本**: v1.0.0  
**日期**: 2026-02-28  
**后端框架**: FastAPI  
**认证方式**: JWT Bearer Token

---

## 目录

- [API 概览](#api-概览)
- [认证机制](#认证机制)
- [通用规范](#通用规范)
- [错误码规范](#错误码规范)
- [数据模型](#数据模型)
- [API 端点](#api-端点)
  - [认证相关](#1-认证相关)
  - [基金管理](#2-基金管理)
  - [投资者管理](#3-投资者管理)
  - [份额操作](#4-份额操作)
  - [数据查询](#5-数据查询)

---

## API 概览

### 基础信息

- **Base URL**: `http://localhost:8000/api`
- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`

### 版本说明

当前版本: `v1`

示例请求：
```
GET http://localhost:8000/api/v1/funds
Authorization: Bearer <token>
```

---

## 认证机制

### JWT Token 认证

所有需要认证的接口都需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取 Token

通过登录接口获取 Token（详见认证章节）。

### Token 有效期

- **访问令牌**: 7天
- **刷新令牌**: 30天（预留，暂不实现）

---

## 通用规范

### 请求格式

```json
{
  "field1": "value1",
  "field2": 123
}
```

### 响应格式

#### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 响应数据
  }
}
```

#### 错误响应

```json
{
  "code": 40001,
  "message": "Invalid parameter: name is required",
  "data": null
}
```

#### 分页响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### 时间格式

所有时间字段使用 ISO 8601 格式：
```
2026-01-01T00:00:00Z
```

### 金额精度

所有金额字段使用 `decimal`，精度为 6 位小数：
```json
{
  "amount": 1000.123456
}
```

---

## 错误码规范

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|--------------|
| 0 | 成功 | 200 |
| 40001 | 参数错误 | 400 |
| 40002 | 参数缺失 | 400 |
| 40101 | 未授权 | 401 |
| 40102 | Token 过期 | 401 |
| 40103 | Token 无效 | 401 |
| 40301 | 权限不足 | 403 |
| 40401 | 资源不存在 | 404 |
| 40901 | 资源冲突（如重复创建） | 409 |
| 50001 | 服务器内部错误 | 500 |

---

## 数据模型

### Fund（基金）

```typescript
interface Fund {
  id: number;                    // 基金 ID
  name: string;                  // 基金名称（唯一）
  start_date: string;            // 成立时间
  total_share: number;            // 总份额
  net_asset_value: number;       // 单位净值（NAV）
  balance: number;               // 总资产
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
}
```

### Investor（投资者）

```typescript
interface Investor {
  id: number;                    // 投资者 ID
  fund_id: number;               // 所属基金 ID
  name: string;                  // 投资者名称
  share: number;                 // 持有份额
  balance: number;               // 持有市值
  created_at: string;            // 加入时间
}
```

### Operation（操作记录）

```typescript
interface Operation {
  id: number;                    // 操作 ID
  fund_id: number;               // 基金 ID
  investor_id?: number;          // 投资者 ID（可为空，如 update_nav）
  operation_type: OperationType; // 操作类型
  operation_date: string;         // 操作日期
  amount?: number;               // 金额
  amount_type?: AmountType;      // 金额类型
  share?: number;                // 份额
  nav_before?: number;           // 操作前 NAV
  nav_after?: number;            // 操作后 NAV
  total_share_before?: number;   // 操作前总份额
  total_share_after?: number;    // 操作后总份额
  balance_before?: number;       // 操作前总资产
  balance_after?: number;        // 操作后总资产
  transfer_from_id?: number;     // 转出方 ID
  transfer_to_id?: number;       // 转入方 ID
  created_at: string;            // 记录创建时间
}

type OperationType = 'invest' | 'redeem' | 'transfer' | 'update_nav' | 'add_investor';
type AmountType = 'share' | 'balance';
```

### FundHistory（基金历史）

```typescript
interface FundHistory {
  id: number;
  fund_id: number;
  history_date: string;          // 历史日期
  total_share: number;           // 该日期的总份额
  net_asset_value: number;       // 该日期的 NAV
  balance: number;               // 该日期的总资产
  created_at: string;
}
```

### Admin（管理员）

```typescript
interface Admin {
  id: number;
  username: string;              // 用户名（唯一）
  created_at: string;
  created_at: string;
}
```

---

## API 端点

### 1. 认证相关

#### 1.1 管理员登录

**接口**: `POST /api/v1/auth/login`

**描述**: 管理员登录，返回 JWT Token

**请求体**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 604800
  }
}
```

**错误响应**:
- 401: 用户名或密码错误

---

#### 1.2 获取当前用户信息

**接口**: `GET /api/v1/auth/me`

**描述**: 获取当前登录的管理员信息

**请求头**:
```
Authorization: Bearer <token>
```

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### 2. 基金管理

#### 2.1 获取所有基金

**接口**: `GET /api/v1/funds`

**描述**: 获取当前管理员有权限的所有基金

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `page` (可选): 页码，默认 1
- `page_size` (可选): 每页数量，默认 20

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "MM",
        "start_date": "2026-01-01",
        "total_share": 16665.0,
        "net_asset_value": 0.771917,
        "balance": 12863.996805,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-02-28T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

---

#### 2.2 创建基金

**接口**: `POST /api/v1/funds`

**描述**: 创建新基金

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "name": "NewFund",
  "start_date": "2026-01-01"
}
```

**响应** (201):
```json
{
  "code": 0,
  "message": "Fund created successfully",
  "data": {
    "id": 2,
    "name": "NewFund",
    "start_date": "2026-01-01",
    "total_share": 0.0,
    "net_asset_value": 1.0,
    "balance": 0.0,
    "created_at": "2026-02-28T15:30:00Z",
    "updated_at": "2026-02-28T15:30:00Z"
  }
}
```

**错误响应**:
- 400: 参数错误
- 409: 基金名称已存在

---

#### 2.3 获取基金详情

**接口**: `GET /api/v1/funds/{fund_id}`

**描述**: 获取指定基金的详细信息

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "MM",
    "start_date": "2026-01-01",
    "total_share": 16665.0,
    "net_asset_value": 0.771917,
    "balance": 12863.996805,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-02-28T00:00:00Z"
  }
}
```

**错误响应**:
- 404: 基金不存在

---

#### 2.4 更新基金信息

**接口**: `PUT /api/v1/funds/{fund_id}`

**描述**: 更新基金基本信息（目前只允许更新名称）

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**请求体**:
```json
{
  "name": "UpdatedFundName"
}
```

**响应** (200):
```json
{
  "code": 0,
  "message": "Fund updated successfully",
  "data": {
    "id": 1,
    "name": "UpdatedFundName",
    "start_date": "2026-01-01",
    "total_share": 16665.0,
    "net_asset_value": 0.771917,
    "balance": 12863.996805,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-02-28T15:35:00Z"
  }
}
```

**错误响应**:
- 400: 参数错误
- 404: 基金不存在
- 409: 基金名称已存在

---

#### 2.5 删除基金

**接口**: `DELETE /api/v1/funds/{fund_id}`

**描述**: 删除指定基金及其所有关联数据

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**响应** (200):
```json
{
  "code": 0,
  "message": "Fund deleted successfully",
  "data": null
}
```

**错误响应**:
- 404: 基金不存在

---

#### 2.6 更新基金净值

**接口**: `POST /api/v1/funds/{fund_id}/update-nav`

**描述**: 更新基金净值，并记录操作历史

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**请求体**:
```json
{
  "capital": 12864.00,
  "date": "2026-02-28"
}
```

**响应** (200):
```json
{
  "code": 0,
  "message": "NAV updated successfully",
  "data": {
    "fund_id": 1,
    "old_nav": 0.829403,
    "new_nav": 0.771917,
    "old_balance": 13822.000995,
    "new_balance": 12863.996805,
    "total_share": 16665.0
  }
}
```

**错误响应**:
- 400: capital 必须大于 0
- 404: 基金不存在

---

#### 2.7 获取基金历史

**接口**: `GET /api/v1/funds/{fund_id}/history`

**描述**: 获取基金净值历史数据

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**查询参数**:
- `start_date` (可选): 开始日期
- `end_date` (可选): 结束日期
- `page` (可选): 页码，默认 1
- `page_size` (可选): 每页数量，默认 50

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "fund_id": 1,
        "history_date": "2026-02-28",
        "total_share": 16665.0,
        "net_asset_value": 0.771917,
        "balance": 12863.996805,
        "created_at": "2026-02-28T00:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "page_size": 50
  }
}
```

---

#### 2.8 获取基金图表数据

**接口**: `GET /api/v1/funds/{fund_id}/chart`

**描述**: 获取基金图表数据，用于前端绘图

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**查询参数**:
- `start_date` (可选): 开始日期
- `end_date` (可选): 结束日期
- `interval` (可选): 间隔（day/week/month），默认 day

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "nav": [
      {
        "date": "2026-02-01",
        "value": 1.003157
      },
      {
        "date": "2026-02-02",
        "value": 1.007042
      }
    ],
    "balance": [
      {
        "date": "2026-02-01",
        "value": 92569.010667
      },
      {
        "date": "2026-02-02",
        "value": 92927.509493
      }
    ],
    "share": [
      {
        "date": "2026-02-01",
        "value": 92277.69
      },
      {
        "date": "2026-02-02",
        "value": 92277.69
      }
    ]
  }
}
```

---

### 3. 投资者管理

#### 3.1 获取基金的所有投资者

**接口**: `GET /api/v1/funds/{fund_id}/investors`

**描述**: 获取指定基金的所有投资者列表

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**查询参数**:
- `page` (可选): 页码，默认 1
- `page_size` (可选): 每页数量，默认 20

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "fund_id": 1,
        "name": "Family",
        "share": 9515.0,
        "balance": 9660.59853,
        "created_at": "2026-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "fund_id": 1,
        "name": "huangying",
        "share": 7150.0,
        "balance": 7259.40930,
        "created_at": "2026-01-02T00:00:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "page_size": 20
  }
}
```

---

#### 3.2 添加投资者

**接口**: `POST /api/v1/funds/{fund_id}/investors`

**描述**: 为基金添加新投资者

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**请求体**:
```json
{
  "name": "Alice",
  "date": "2026-01-01"
}
```

**响应** (201):
```json
{
  "code": 0,
  "message": "Investor added successfully",
  "data": {
    "id": 3,
    "fund_id": 1,
    "name": "Alice",
    "share": 0.0,
    "balance": 0.0,
    "created_at": "2026-02-28T15:40:00Z"
  }
}
```

**错误响应**:
- 400: 参数错误
- 404: 基金不存在
- 409: 投资者名称已存在

---

#### 3.3 获取投资者详情

**接口**: `GET /api/v1/funds/{fund_id}/investors/{investor_id}`

**描述**: 获取指定投资者的详细信息

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID
- `investor_id`: 投资者 ID

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "fund_id": 1,
    "name": "Family",
    "share": 9515.0,
    "balance": 9660.59853,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

**错误响应**:
- 404: 投资者不存在

---

#### 3.4 更新投资者信息

**接口**: `PUT /api/v1/funds/{fund_id}/investors/{investor_id}`

**描述**: 更新投资者信息（目前只允许更新名称）

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID
- `investor_id`: 投资者 ID

**请求体**:
```json
{
  "name": "UpdatedName"
}
```

**响应** (200):
```json
{
  "code": 0,
  "message": "Investor updated successfully",
  "data": {
    "id": 1,
    "fund_id": 1,
    "name": "UpdatedName",
    "share": 9515.0,
    "balance": 9660.59853,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

**错误响应**:
- 400: 参数错误
- 404: 投资者不存在
- 409: 投资者名称已存在

---

### 4. 份额操作

#### 4.1 申购（投资）

**接口**: `POST /api/v1/funds/{fund_id}/investors/{investor_id}/invest`

**描述**: 投资者申购基金份额

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID
- `investor_id`: 投资者 ID

**请求体**:
```json
{
  "amount": 1000.00,
  "date": "2026-01-01"
}
```

**响应** (200):
```json
{
  "code": 0,
  "message": "Investment successful",
  "data": {
    "investor_id": 1,
    "fund_id": 1,
    "investor_name": "Family",
    "invested_amount": 1000.00,
    "new_share": 9515.0,
    "fund_total_share": 16665.0,
    "fund_nav": 0.771917
  }
}
```

**错误响应**:
- 400: amount 必须大于 0
- 404: 投资者或基金不存在

---

#### 4.2 赎回

**接口**: `POST /api/v1/funds/{fund_id}/investors/{investor_id}/redeem`

**描述**: 投资者赎回基金份额或金额

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID
- `investor_id`: 投资者 ID

**请求体**:
```json
{
  "amount": 500.00,
  "amount_type": "balance",
  "date": "2026-01-01"
}
```

**字段说明**:
- `amount`: 赎回数量
- `amount_type`: 类型，`share`（按份额）或 `balance`（按市值）
- `date`: 操作日期

**响应** (200):
```json
{
  "code": 0,
  "message": "Redemption successful",
  "data": {
    "investor_id": 1,
    "fund_id": 1,
    "investor_name": "Family",
    "redeemed_share": 647.768882,
    "redeemed_balance": 500.00,
    "new_share": 8867.231118,
    "fund_total_share": 16017.231118,
    "fund_nav": 0.771917
  }
}
```

**错误响应**:
- 400: amount 必须大于 0，或持有份额不足
- 404: 投资者或基金不存在

---

#### 4.3 份额转账

**接口**: `POST /api/v1/funds/{fund_id}/transfer`

**描述**: 基金内投资者之间份额转账

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**请求体**:
```json
{
  "from_investor_id": 1,
  "to_investor_id": 2,
  "amount": 100.00,
  "amount_type": "balance",
  "date": "2026-01-01"
}
```

**字段说明**:
- `from_investor_id`: 转出方 ID
- `to_investor_id`: 转入方 ID
- `amount`: 转账数量
- `amount_type`: 类型，`share`（按份额）或 `balance`（按市值）
- `date`: 操作日期

**响应** (200):
```json
{
  "code": 0,
  "message": "Transfer successful",
  "data": {
    "fund_id": 1,
    "from_investor_id": 1,
    "from_investor_name": "Family",
    "to_investor_id": 2,
    "to_investor_name": "huangying",
    "transferred_share": 129.553776,
    "transferred_balance": 100.00,
    "from_new_share": 9385.446224,
    "to_new_share": 7279.553776
  }
}
```

**错误响应**:
- 400: amount 必须大于 0，或转出方份额不足
- 404: 投资者或基金不存在

---

### 5. 数据查询

#### 5.1 获取操作记录

**接口**: `GET /api/v1/funds/{fund_id}/operations`

**描述**: 获取基金的操作记录

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**查询参数**:
- `operation_type` (可选): 操作类型（invest/redeem/transfer/update_nav/add_investor）
- `investor_id` (可选): 投资者 ID
- `start_date` (可选): 开始日期
- `end_date` (可选): 结束日期
- `page` (可选): 页码，默认 1
- `page_size` (可选): 每页数量，默认 50

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "fund_id": 1,
        "investor_id": 1,
        "operation_type": "invest",
        "operation_date": "2026-01-01",
        "amount": 1000.00,
        "amount_type": null,
        "share": 1000.0,
        "nav_before": 1.0,
        "nav_after": 1.0,
        "total_share_before": 92277.69,
        "total_share_after": 93277.69,
        "balance_before": 92277.69,
        "balance_after": 93277.69,
        "transfer_from_id": null,
        "transfer_to_id": null,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 50
  }
}
```

---

#### 5.2 获取投资者操作记录

**接口**: `GET /api/v1/funds/{fund_id}/investors/{investor_id}/operations`

**描述**: 获取指定投资者的操作记录

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID
- `investor_id`: 投资者 ID

**查询参数**:
- `operation_type` (可选): 操作类型
- `start_date` (可选): 开始日期
- `end_date` (可选): 结束日期
- `page` (可选): 页码，默认 1
- `page_size` (可选): 每页数量，默认 50

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "fund_id": 1,
        "investor_id": 1,
        "operation_type": "invest",
        "operation_date": "2026-01-01",
        "amount": 1000.00,
        "share": 1000.0,
        "nav_before": 1.0,
        "nav_after": 1.0,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 50
  }
}
```

---

#### 5.3 导出数据

**接口**: `GET /api/v1/funds/{fund_id}/export`

**描述**: 导出基金数据为 CSV

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `fund_id`: 基金 ID

**查询参数**:
- `type`: 导出类型（funds/investors/operations/history）

**响应** (200):
```
Content-Type: text/csv
Content-Disposition: attachment; filename="MM_funds_20260228.csv"

id,name,start_date,total_share,net_asset_value,balance,created_at
1,MM,2026-01-01,16665.0,0.771917,12863.996805,2026-01-01T00:00:00Z
```

---

## 附录

### A. TypeScript 类型定义

完整的 TypeScript 类型定义文件将在前端项目中提供：
```
frontend/src/types/api.ts
```

### B. Postman Collection

API 测试集合将在项目根目录提供：
```
docs/postman/Fund-Manager-API.postman_collection.json
```

### C. 数据库初始化

数据库迁移脚本将在 Alembic 目录中提供：
```
backend/alembic/versions/
```

### D. 测试数据

测试 SQL 脚本将提供：
```
backend/tests/data/test_data.sql
```

---

**文档版本**: v1.0.0  
**最后更新**: 2026-02-28
