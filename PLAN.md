# 基金管理系统技术方案

## 需求拆解

### 核心需求
1. **双界面支持**：CLI + WebUI，共享后端逻辑
2. **单一管理员**：网站只有一个管理员账户
3. **功能对齐**：实现现有的全部基金管理功能
4. **数据迁移**：从 pickle 迁移到 SQLite

---

## 架构设计

```
┌─────────────────────────────────────────────────────┐
│                     Presentation Layer              │
│  ┌──────────────┐              ┌──────────────────┐ │
│  │     CLI      │              │     WebUI        │ │
│  │  (typer)     │              │  (HTML/JS/React) │ │
│  └──────┬───────┘              └────────┬─────────┘ │
│         │                                │           │
│         └────────────────────────────────┘           │
│                            │                          │
│                    ┌───────▼────────┐                 │
│                    │     API        │                 │
│                    │   (FastAPI)    │                 │
│                    └───────┬────────┘                 │
└────────────────────────────────────│─────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────┐
│                    Business Layer                    │
│  ┌────────────────────────────────────────────────┐  │
│  │  Fund Core Services                            │  │
│  │  - FundManager: 基金管理                       │  │
│  │  - InvestorManager: 投资者管理                 │  │
│  │  - PortfolioManager: 组合管理                  │  │
│  │  - Analytics: 统计分析                         │  │
│  └────────────────────────────────────────────────┘  │
└────────────────────────────────────┬─────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────┐
│                     Data Layer                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  SQLite Database                               │  │
│  │  - funds, investors, operations, history       │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 技术栈选择

| 层级 | 技术 | 理由 |
|------|------|------|
| **后端 API** | FastAPI | 性能好，自动文档，类型安全 |
| **CLI** | Typer | 现代化的 CLI 框架，基于 argparse |
| **数据库** | SQLite | 轻量，无服务部署，Python 原生支持 |
| **ORM** | SQLAlchemy | 成熟，类型提示好 |
| **数据迁移** | Alembic | 数据库版本管理 |
| **Web 前端** | Jinja2 + HTMX | 后端渲染简单，HTMX 无需复杂 JS |
| **身份认证** | JWT tokens | 无状态，易于集成 |
| **数据验证** | Pydantic | 与 FastAPI 天然集成 |

---

## 项目结构

```
fund-manager/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # 配置文件
│   ├── models/                 # 数据模型（SQLAlchemy）
│   │   ├── __init__.py
│   │   ├── fund.py
│   │   ├── investor.py
│   │   └── operation.py
│   ├── schemas/                # Pydantic 模型（API 请求/响应）
│   │   ├── __init__.py
│   │   ├── fund.py
│   │   ├── investor.py
│   │   └── operation.py
│   ├── services/                # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── fund_service.py
│   │   ├── investor_service.py
│   │   └── auth_service.py
│   ├── repositories/            # 数据访问层
│   │   ├── __init__.py
│   │   ├── fund_repo.py
│   │   └── investor_repo.py
│   ├── api/                    # API 路由
│   │   ├── __init__.py
│   │   ├── funds.py
│   │   ├── investors.py
│   │   └── auth.py
│   ├── cli/                    # CLI 命令
│   │   ├── __init__.py
│   │   └── main.py
│   ├── web/                    # Web UI
│   │   ├── templates/
│   │   │   ├── base.html
│   │   │   ├── funds.html
│   │   │   └── investors.html
│   │   └── static/
│   │       ├── css/
│   │       └── js/
│   └── db.py                   # 数据库连接
├── alembic/                    # 数据库迁移
├── tests/
│   ├── __init__.py
│   ├── test_services/
│   └── test_api/
├── utils/                      # 现有代码（保留兼容）
│   ├── manage.py
│   └── test_manage.py
├── requirements.txt
├── pyproject.toml              # uv 项目配置
└── README.md
```

---

## 数据库设计

### 核心表结构

```sql
-- 基金表
CREATE TABLE funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    start_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投资者表
CREATE TABLE investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fund_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fund_id) REFERENCES funds(id),
    UNIQUE(fund_id, name)
);

-- 操作记录表
CREATE TABLE operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fund_id INTEGER NOT NULL,
    investor_id INTEGER,
    operation_type VARCHAR(20) NOT NULL,  -- invest, redeem, transfer, update_nav
    operation_date DATE NOT NULL,
    amount DECIMAL(15, 6),
    amount_type VARCHAR(10),             -- share, balance
    share DECIMAL(15, 6),
    nav_before DECIMAL(15, 6),
    nav_after DECIMAL(15, 6),
    total_share_before DECIMAL(15, 6),
    total_share_after DECIMAL(15, 6),
    balance_before DECIMAL(15, 6),
    balance_after DECIMAL(15, 6),
    transfer_from_id INTEGER,
    transfer_to_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fund_id) REFERENCES funds(id),
    FOREIGN KEY (investor_id) REFERENCES investors(id),
    FOREIGN KEY (transfer_from_id) REFERENCES investors(id),
    FOREIGN KEY (transfer_to_id) REFERENCES investors(id)
);

-- 基金历史表（用于查询历史快照）
CREATE TABLE fund_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fund_id INTEGER NOT NULL,
    history_date DATE NOT NULL,
    total_share DECIMAL(15, 6),
    net_asset_value DECIMAL(15, 6),
    balance DECIMAL(15, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fund_id) REFERENCES funds(id),
    UNIQUE(fund_id, history_date)
);

-- 管理员表
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API 设计

### RESTful 端点

```
# 认证
POST   /api/auth/login                    # 管理员登录
POST   /api/auth/logout                   # 登出
GET    /api/auth/me                       # 获取当前用户信息

# 基金管理
GET    /api/funds                         # 获取所有基金
POST   /api/funds                         # 创建基金
GET    /api/funds/{fund_id}               # 获取基金详情
PUT    /api/funds/{fund_id}               # 更新基金
DELETE /api/funds/{fund_id}               # 删除基金
GET    /api/funds/{fund_id}/history       # 获取基金历史
POST   /api/funds/{fund_id}/update-nav    # 更新净值
GET    /api/funds/{fund_id}/chart         # 获取图表数据

# 投资者管理
GET    /api/funds/{fund_id}/investors     # 获取基金的所有投资者
POST   /api/funds/{fund_id}/investors     # 添加投资者
GET    /api/funds/{fund_id}/investors/{investor_id}  # 获取投资者详情
PUT    /api/funds/{fund_id}/investors/{investor_id}  # 更新投资者

# 份额操作
POST   /api/funds/{fund_id}/investors/{investor_id}/invest   # 申购
POST   /api/funds/{fund_id}/investors/{investor_id}/redeem   # 赎回
POST   /api/funds/{fund_id}/transfer                     # 份额转账
```

---

## CLI 设计示例

```bash
# 基金管理
fund-cli fund list                          # 列出所有基金
fund-cli fund create "My Fund"               # 创建基金
fund-cli fund info MM                        # 查看基金详情
fund-cli fund update-nav MM 10000.50          # 更新净值
fund-cli fund history MM                     # 查看历史

# 投资者管理
fund-cli investor list MM                    # 列出投资者
fund-cli investor add MM "Alice"             # 添加投资者
fund-cli investor info MM "Alice"           # 查看投资者详情

# 份额操作
fund-cli invest MM "Alice" 1000              # 申购
fund-cli redeem MM "Alice" 500 --type share  # 赎回（按份额）
fund-cli transfer MM "Alice" "Bob" 100      # 转账

# 数据导出
fund-cli export MM --format csv              # 导出数据
```

---

## Web UI 页面

### 页面结构

1. **登录页面** (`/login`)
   - 用户名/密码表单

2. **首页** (`/`)
   - 基金概览卡片（总资产、总份额、NAV）
   - 基金列表表格
   - 快捷操作按钮

3. **基金详情页** (`/funds/{fund_id}`)
   - 基本信息
   - 投资者列表
   - 历史记录
   - 操作按钮（申购、赎回、转账、更新净值）
   - 图表展示（NAV/Balance/Share 曲线）

4. **投资者详情页** (`/funds/{fund_id}/investors/{investor_id}`)
   - 投资者信息
   - 持仓明细
   - 历史操作

---

## 实施计划

### Phase 1: 基础设施（1-2天）
- [ ] 项目结构搭建
- [ ] 数据库模型定义（SQLAlchemy）
- [ ] Alembic 迁移配置
- [ ] 数据库初始化

### Phase 2: 核心业务层（2-3天）
- [ ] Services 层实现（基于现有 manage.py 逻辑）
- [ ] Repositories 层实现
- [ ] 现有数据迁移工具（pickle → SQLite）

### Phase 3: API 开发（2-3天）
- [ ] FastAPI 基础框架
- [ ] 认证模块（JWT）
- [ ] 基金 CRUD 接口
- [ ] 投资者管理接口
- [ ] 操作接口（申购、赎回、转账）
- [ ] 历史查询接口

### Phase 4: CLI 开发（1-2天）
- [ ] Typer 框架搭建
- [ ] 命令实现（调用 API）

### Phase 5: Web UI（3-4天）
- [ ] Jinja2 模板
- [ ] 静态资源（CSS/JS）
- [ ] 页面开发
- [ ] HTMX 交互

### Phase 6: 测试与优化（1-2天）
- [ ] 单元测试
- [ ] API 测试
- [ ] 部署文档

---

## 潜在问题和注意事项

1. **并发控制**：多个操作同时执行时的数据一致性
2. **精度问题**：金额计算使用 `decimal.Decimal` 避免浮点误差
3. **权限隔离**：多基金场景下需要确保数据隔离
4. **历史记录**：`history_operation` 的数据量会增长，需要考虑归档策略
5. **备份机制**：SQLite 需要定期备份

---

## 我的建议

**MVP（最小可行产品）优先**：
1. 先实现核心功能：基金创建、投资者管理、申购/赎回、净值更新
2. CLI 和 WebUI 共享同一套 API，减少重复代码
3. 使用 HTMX 实现 WebUI，避免复杂的前端框架
4. 现有代码作为参考，逐步迁移到新架构

**后续扩展**：
- 多管理员支持（角色权限）
- 数据可视化优化
- 导出功能（Excel/CSV）
- 移动端适配
- 实时通知（净值更新提醒）
