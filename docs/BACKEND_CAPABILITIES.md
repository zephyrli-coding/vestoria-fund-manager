# 基金管理系统 - 后端能力清单

## 📊 数据模型 (SQL Tables)

### 1. funds (基金表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键，自增 |
| name | String(100) | 基金名称，唯一 |
| start_date | String(10) | 成立日期 (YYYY-MM-DD) |
| total_share | Float | 总份额 |
| net_asset_value | Float | 单位净值 (NAV) |
| balance | Float | 总资产 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### 2. investors (投资者表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| fund_id | Integer | 所属基金ID (外键) |
| name | String(100) | 投资者姓名 |
| share | Float | 持有份额 |
| balance | Float | 资产价值 |
| created_at | DateTime | 创建时间 |

**约束**: 同一基金内投资者名称唯一 (fund_id + name)

### 3. operations (操作记录表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| fund_id | Integer | 基金ID |
| investor_id | Integer | 投资者ID (可为空) |
| operation_type | String(20) | 操作类型 |
| operation_date | String(10) | 操作日期 |
| amount | Float | 金额 |
| amount_type | String(10) | 金额类型 (share/balance) |
| share | Float | 份额变动 |
| nav_before | Float | 操作前NAV |
| nav_after | Float | 操作后NAV |
| total_share_before | Float | 操作前总份额 |
| total_share_after | Float | 操作后总份额 |
| balance_before | Float | 操作前总资产 |
| balance_after | Float | 操作后总资产 |
| transfer_from_id | Integer | 转账来源投资者 |
| transfer_to_id | Integer | 转账目标投资者 |
| created_at | DateTime | 记录时间 |

**操作类型**: invest(申购), redeem(赎回), transfer(转账), update_nav(更新净值), add_investor(添加投资者)

### 4. fund_history (基金历史表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| fund_id | Integer | 基金ID |
| history_date | String(10) | 历史日期 |
| total_share | Float | 当日总份额 |
| net_asset_value | Float | 当日NAV |
| balance | Float | 当日总资产 |

**约束**: 同一基金同一日期唯一记录

### 5. admins (管理员表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| username | String(50) | 用户名，唯一 |
| password_hash | String(255) | 密码哈希 |
| created_at | DateTime | 创建时间 |

---

## 🔐 认证模块 (Auth)

### API端点
| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| POST | /api/v1/auth/login | 管理员登录 | 否 |
| GET | /api/v1/auth/me | 获取当前管理员信息 | 是 |

### 功能
- ✅ JWT Token认证
- ✅ Token有效期7天
- ✅ Bearer Token方式
- ✅ Swagger UI支持

---

## 📈 基金管理模块 (Funds)

### API端点
| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| GET | /api/v1/funds | 获取基金列表（分页） | 否 |
| POST | /api/v1/funds | 创建基金 | 是 |
| GET | /api/v1/funds/{id} | 获取基金详情 | 否 |
| PUT | /api/v1/funds/{id} | 更新基金名称 | 是 |
| DELETE | /api/v1/funds/{id} | 删除基金 | 是 |
| POST | /api/v1/funds/{id}/update-nav | 更新基金净值 | 是 |
| GET | /api/v1/funds/{id}/history | 获取基金历史 | 否 |
| GET | /api/v1/funds/{id}/chart | 获取图表数据 | 否 |

### 业务功能
- ✅ 基金CRUD（创建、读取、更新、删除）
- ✅ 基金名称唯一性校验
- ✅ 净值更新（自动计算新NAV）
- ✅ 历史记录（自动记录每次净值变更）
- ✅ 图表数据（NAV、总资产、份额走势）
- ✅ 级联删除（删除基金时删除关联的投资者、操作记录、历史）

---

## 👥 投资者管理模块 (Investors)

### API端点
| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| GET | /api/v1/funds/{id}/investors | 获取投资者列表 | 否 |
| POST | /api/v1/funds/{id}/investors | 添加投资者 | 是 |
| GET | /api/v1/funds/{id}/investors/{id} | 获取投资者详情 | 否 |
| PUT | /api/v1/funds/{id}/investors/{id} | 更新投资者名称 | 是 |
| POST | /api/v1/funds/{id}/investors/{id}/invest | 投资者申购 | 是 |
| POST | /api/v1/funds/{id}/investors/{id}/redeem | 投资者赎回 | 是 |
| POST | /api/v1/funds/{id}/investors/transfer | 份额转账 | 是 |
| GET | /api/v1/funds/{id}/investors/operations | 获取基金操作记录 | 否 |
| GET | /api/v1/funds/{id}/investors/{id}/operations | 获取投资者操作记录 | 否 |

### 业务功能

#### 1. 添加投资者
- ✅ 校验基金是否存在
- ✅ 同一基金内投资者名称唯一
- ✅ 自动记录操作日志

#### 2. 申购 (Invest)
- ✅ 按当前NAV计算获得份额
- ✅ 更新投资者份额和资产
- ✅ 更新基金总份额和总资产
- ✅ 自动记录操作日志

#### 3. 赎回 (Redeem)
- ✅ 支持按份额赎回
- ✅ 支持按金额赎回
- ✅ 自动计算赎回金额/份额
- ✅ 更新投资者和基金数据
- ✅ 自动记录操作日志
- ✅ 校验是否有足够份额

#### 4. 转账 (Transfer)
- ✅ 投资者之间份额转账
- ✅ 支持按份额转账
- ✅ 支持按金额转账
- ✅ 基金总份额不变
- ✅ 自动记录操作日志
- ✅ 校验转出方是否有足够份额

#### 5. 操作记录查询
- ✅ 按操作类型筛选
- ✅ 按投资者筛选
- ✅ 按日期范围筛选
- ✅ 分页支持

---

## 🧮 核心计算逻辑

### 1. NAV计算
```
NAV = 总资产 / 总份额
```
- 初始NAV = 1.0
- 每次净值更新时重新计算

### 2. 申购计算
```
获得份额 = 申购金额 / 当前NAV
```

### 3. 赎回计算
- 按份额赎回: `赎回金额 = 赎回份额 × NAV`
- 按金额赎回: `赎回份额 = 赎回金额 / NAV`

### 4. 转账计算
- 按份额转账: 直接转指定份额
- 按金额转账: `转账份额 = 转账金额 / NAV`

### 5. 投资者资产价值
```
资产价值 = 持有份额 × NAV
```

---

## 📋 约束与验证

### 基金层面
- ❌ 不能更新无投资者的基金NAV
- ❌ 不能更新总份额为0的基金NAV
- ❌ NAV更新时资本必须 > 0

### 投资者层面
- ❌ 同一基金内投资者名称不能重复
- ❌ 赎回时不能超出持有份额
- ❌ 转账时不能超出持有份额

---

## 🎯 总结

后端具备完整的功能：
1. **基金全生命周期管理** - 创建、编辑、删除、净值更新
2. **投资者管理** - 添加、编辑、持仓查看
3. **份额操作** - 申购、赎回、转账
4. **审计追踪** - 完整的操作历史记录
5. **数据可视化** - 图表数据支持
6. **安全认证** - JWT Token认证

**前端需要对接的API已全部实现！**
