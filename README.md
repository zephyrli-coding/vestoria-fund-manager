# Fund Manager - 基金管理系统

一个现代化的基金管理系统，支持 CLI 和 Web UI 两种操作方式。

## 技术栈

### 后端
- **框架**: FastAPI
- **数据库**: SQLite
- **ORM**: SQLAlchemy
- **CLI**: Typer
- **认证**: JWT

### 前端
- **框架**: React + Vite
- **UI 库**: Ant Design
- **路由**: React Router
- **状态管理**: Zustand
- **图表**: Recharts

## 项目结构

```
fund-manager/
├── backend/              # 后端项目
│   ├── app/              # 应用代码
│   ├── data/             # SQLite 数据库
│   ├── requirements.txt  # Python 依赖
│   ├── init_db.py        # 数据库初始化
│   └── start.sh          # 启动脚本
├── frontend/             # 前端项目
│   ├── src/
│   └── package.json
├── docs/                 # 文档
│   └── API-DESIGN.md     # API 设计文档
└── README.md             # 本文件
```

## 核心功能

- ✅ 基金管理（创建、查询、更新、删除）
- ✅ 投资者管理（添加、查询、更新）
- ✅ 份额操作（申购、赎回、转账）
- ✅ 净值更新
- ✅ 历史记录查询
- ✅ 数据可视化
- ✅ CLI 命令行工具
- ✅ Web 管理界面

## 环境要求

- **Python**: 3.12+ (推荐 3.12.x)
- **Node.js**: 18+
- **uv**: Python 包管理器（必须）

## 环境安装

### 1. 安装 uv（如果未安装）

```bash
# Linux/Mac
curl -LsSf https://astral.sh/uv/install.sh | sh

# 添加到 PATH
export PATH="$HOME/.local/bin:$PATH"

# 验证安装
uv --version
```

> ⚠️ **重要**: 必须使用 `uv` 而不是 `pip`，项目依赖 `pyproject.toml` 配置。

### 2. 克隆项目

```bash
git clone git@github.com:<your-username>/fund-manager.git
cd fund-manager
```

### 3. 后端初始化

```bash
cd backend

# 创建虚拟环境
uv venv

# 激活虚拟环境
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate    # Windows

# 安装依赖
uv pip install -r requirements.txt

# 初始化数据库（创建 admin 账号）
python init_db.py
```

数据库文件将创建在 `backend/data/fund_manager.db`

**默认账号:**
- 用户名: `admin`
- 密码: `[REDACTED_TEST_PASSWORD]`

### 4. 前端初始化

```bash
cd frontend

# 安装依赖
npm install

# 或如果使用 pnpm
pnpm install
```

## 运行

### 启动后端

```bash
cd backend

# 方式1: 使用启动脚本
./start.sh

# 方式2: 手动启动
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问:
- API 地址: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 认证: POST `/auth/login` (username=admin, password=[REDACTED_TEST_PASSWORD])

### 启动前端

```bash
cd frontend
npm run dev
```

访问: http://localhost:3000

## 配置说明

### 后端配置 (backend/app/config.py)

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `sqlite:///./data/fund_manager.db` |
| `SECRET_KEY` | JWT 密钥 | 自动生成 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间 | 30 分钟 |

**自定义配置:**

创建 `.env` 文件在 `backend/` 目录:

```bash
# backend/.env
DATABASE_URL=sqlite:///./data/fund_manager.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 前端配置 (frontend/.env)

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

## 测试验证

### API 测试

```bash
# 1. 登录获取 token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=[REDACTED_TEST_PASSWORD]"

# 2. 创建基金
curl -X POST http://localhost:8000/funds/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试基金","start_date":"2024-01-01"}'

# 3. 查看基金列表
curl http://localhost:8000/funds/ \
  -H "Authorization: Bearer <token>"
```

### 完整测试用例

项目包含测试脚本，验证核心业务流程:

```bash
cd backend
source .venv/bin/activate
python test_case_1.py
```

测试场景:
1. 创建基金 A
2. 投资者 aa 投入 100
3. 更新净值（资金→150）
4. 投资者 bb 投入 100
5. 更新净值（资金→200）
6. 验证: aa 赚钱，bb 亏钱

## CLI 工具

```bash
cd backend
source .venv/bin/activate

# 查看帮助
python -m app.cli --help

# 创建基金
python -m app.cli fund create "基金A" 2024-01-01

# 添加投资者
python -m app.cli investor add 1 "投资者甲" 2024-01-01

# 申购
python -m app.cli investor invest 1 1 100 2024-01-01
```

## 文档

- [API 设计文档](./docs/API-DESIGN.md) - 完整的 API 接口定义
- [项目初始化指南](./README-SETUP.md) - 详细的环境搭建步骤
- [技术方案](./PLAN.md) - 架构设计和技术选型

## 开发路线

### Phase 1: 后端核心功能 ✅
- [x] API 设计文档
- [x] 数据库模型定义
- [x] 业务逻辑实现
- [x] API 接口实现
- [x] CLI 工具实现

### Phase 2: 前端开发 ⏳
- [ ] 前端框架搭建
- [ ] 认证页面
- [ ] 基金管理页面
- [ ] 投资者管理页面
- [ ] 数据可视化

### Phase 3: 测试与优化（待开始）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 部署文档

## 常见问题

### Q: `uv` 命令找不到
```bash
# 检查安装位置
~/.local/bin/uv --version

# 添加到 PATH
export PATH="$HOME/.local/bin:$PATH"
```

### Q: Python 3.13 兼容性问题
项目已在 Python 3.12 测试通过。如果使用 Python 3.13，可能会遇到 pydantic-core 构建问题，建议降级到 3.12:
```bash
uv venv --python 3.12
```

### Q: 数据库已存在/报错
```bash
# 删除数据库重新初始化
rm -rf backend/data/
cd backend && python init_db.py
```

---

**Made with 💰 by Vestoria**
