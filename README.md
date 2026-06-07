# Fund Manager - 基金管理系统

一个现代化的基金管理系统，支持 CLI 和 Web UI 两种操作方式。

---

## 🚀 快速启动

### 方式一：Docker Compose 部署（推荐用于生产/演示）

**环境要求：**
- Docker
- Docker Compose

**部署步骤：**

```bash
# 1. 克隆代码
git clone https://github.com/Zaaachary/fund_manager.git
cd fund_manager

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 SECRET_KEY（重要！）
# 生成密钥: openssl rand -hex 32

# 3. 启动服务
docker compose up -d --build

# 4. 访问系统
# 前端: http://localhost:20260
# API 文档: http://localhost:20260/docs
# 默认账号: admin / admin123
```

**常用命令：**
```bash
# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 更新部署（拉取新代码后）
docker compose up -d --build
```

**数据持久化：**
- 数据库文件保存在 `./data/fund_manager.db`
- 通过 Docker volume 挂载，容器重启数据不丢失

---

### 方式二：本地开发环境

**环境要求：**
- **Python**: 3.12+
- **Node.js**: 18+
- **uv**: Python 包管理器（必须）

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
```

#### 1. 启动后端

```bash
cd backend

# 创建虚拟环境
uv venv

# 激活虚拟环境
source .venv/bin/activate

# 安装依赖
uv pip install -r requirements.txt

# 初始化数据库（首次）
python init_db.py

# 启动后端服务
./start.sh
# 或手动: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**后端服务：**
- API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 默认账号: `admin` / `admin123`

#### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**前端服务：**
- http://localhost:5173
- 开发模式下支持热重载

#### 3. 访问系统

```bash
# 本地访问
http://localhost:5173

# SSH 隧道穿透（远程服务器开发）
ssh -L 5173:localhost:5173 -L 8000:localhost:8000 user@server
```

---

## 📦 技术栈

### 后端
| 技术 | 版本 | 说明 |
|------|------|------|
| FastAPI | ^0.115.0 | Web 框架 |
| SQLAlchemy | ^2.0.35 | ORM |
| SQLite | - | 数据库 |
| Pydantic | ^2.9.2 | 数据验证 |
| JWT | - | 认证 |
| Typer | - | CLI 框架 |

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| React | ^19.2.0 | UI 框架 |
| Vite | ^6.0.0 | 构建工具 |
| TypeScript | - | 类型系统 |
| Zustand | ^5.0.2 | 状态管理 |
| Lucide React | ^0.460.0 | 图标库 |

### 部署
| 技术 | 说明 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 多服务编排 |
| Nginx | 反向代理、静态文件服务 |

---

## 🗺️ 前端页面 URL

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录页 | 管理员登录 |
| `/` | 仪表盘 | 资产概览、基金列表 |
| `/funds` | 基金列表 | 所有基金、搜索、筛选 |
| `/funds/create` | 创建基金 | 新建基金表单 |
| `/funds/:id` | 基金详情 | 概览、投资者、操作历史 |
| `/funds/:id/edit` | 编辑基金 | 修改名称、删除 |

**页面结构说明：**
- 所有页面需要登录（除 `/login`）
- 侧边栏导航：仪表盘、基金管理
- 投资者功能通过基金详情页访问（`/funds/:id` → 投资者标签）

---

## 🔌 后端 API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 登录获取 Token |
| GET | `/api/v1/auth/me` | 获取当前用户信息 |

### 基金
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/funds` | 获取基金列表 |
| POST | `/api/v1/funds` | 创建基金 |
| GET | `/api/v1/funds/{id}` | 获取基金详情 |
| PUT | `/api/v1/funds/{id}` | 更新基金名称 |
| DELETE | `/api/v1/funds/{id}` | 删除基金 |
| POST | `/api/v1/funds/{id}/update-nav` | 更新净值 |
| GET | `/api/v1/funds/{id}/history` | 获取历史记录 |
| GET | `/api/v1/funds/{id}/chart` | 获取图表数据 |

### 投资者
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/funds/{id}/investors` | 获取投资者列表 |
| POST | `/api/v1/funds/{id}/investors` | 添加投资者 |
| GET | `/api/v1/funds/{id}/investors/{id}` | 投资者详情 |
| PUT | `/api/v1/funds/{id}/investors/{id}` | 更新投资者 |

### 份额操作
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/funds/{id}/investors/{id}/invest` | 申购 |
| POST | `/api/v1/funds/{id}/investors/{id}/redeem` | 赎回 |
| POST | `/api/v1/funds/{id}/investors/transfer` | 转账 |

**响应格式：**
```json
{
  "code": 0,        // 0 = 成功, 非0 = 错误
  "message": "success",
  "data": { ... }
}
```

---

## 📋 功能清单

### ✅ 已实现
- [x] 基金 CRUD（创建、查询、更新、删除）
- [x] 投资者管理（添加、搜索、列表）
- [x] 申购/赎回/转账（完整操作流）
- [x] 净值更新（自动计算 NAV，支持自定义日期）
- [x] 操作历史（审计追踪）
- [x] 数据图表（净值走势、资产变化）
- [x] JWT 认证
- [x] 响应式 UI（支持宽屏）
- [x] 操作日期选择（申购/赎回/转账/更新净值）
- [x] Docker Compose 一键部署

### ⏳ 待实现（后续迭代）
- [ ] 数据导出（CSV/Excel）
- [ ] 多管理员权限管理
- [ ] 移动端适配优化
- [ ] 实时通知（WebSocket）
- [ ] 数据备份/恢复

---

## 🗂️ 项目结构

```
projects/fund-manager/
├── backend/              # 后端
│   ├── app/
│   │   ├── api/          # API 路由
│   │   ├── models/       # 数据库模型
│   │   ├── services/     # 业务逻辑
│   │   └── cli/          # CLI 工具
│   ├── data/             # SQLite 数据库（开发）
│   ├── Dockerfile        # 后端镜像构建
│   └── requirements.txt
├── frontend/             # 前端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── stores/       # Zustand 状态
│   │   └── api/          # API 封装
│   ├── Dockerfile        # 前端镜像构建
│   └── package.json
├── data/                 # 生产数据目录（Docker 挂载）
├── docs/                 # 文档
│   ├── API-DESIGN.md     # API 详细设计
│   └── BACKEND_CAPABILITIES.md  # 后端能力清单
├── docker-compose.yml    # Docker Compose 配置
├── nginx.conf            # Nginx 配置
├── .env.example          # 环境变量模板
└── README.md             # 本文件
```

---

## 🔧 常用命令

### Docker 部署
```bash
docker compose up -d --build     # 构建并启动
docker compose logs -f backend   # 查看后端日志
docker compose logs -f frontend  # 查看前端日志
docker compose down              # 停止并移除容器
docker compose restart           # 重启服务
```

### 后端开发
```bash
cd backend
source .venv/bin/activate
./start.sh                              # 启动后端
python init_db.py                       # 初始化数据库（开发）
python -m app.cli --help                # CLI 帮助
rm -rf data/ && python init_db.py       # 重置数据库
```

### 前端开发
```bash
cd frontend
npm install                             # 安装依赖
npm run dev                             # 开发模式
npm run build                           # 生产构建
npm run preview                         # 预览生产构建
```

---

## 📝 核心概念

### 基金 → 投资者 → 操作
- **投资者属于基金**：必须先创建基金，再添加投资者
- **操作在基金内进行**：申购、赎回、转账都在基金上下文
- **净值驱动一切**：NAV = 总资产 / 总份额

### 计算逻辑
```
申购: 份额 = 金额 / NAV
赎回: 金额 = 份额 × NAV
转账: 份额不变，基金总份额不变
```

---

## 📄 其他文档

- [API 详细设计](./docs/API-DESIGN.md) - 完整的 API 规范
- [后端能力清单](./docs/BACKEND_CAPABILITIES.md) - 后端功能说明
- [测试用例](./test_samples/) - 复杂场景测试

---

## 🔐 安全提示

1. **生产环境务必修改默认密码**
2. **修改 SECRET_KEY**（使用 `openssl rand -hex 32` 生成）
3. **定期备份** `./data/` 目录下的数据库文件
4. **不要**将 `.env` 文件提交到 Git

---

**Made with 💰 by Vestoria**
