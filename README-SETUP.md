# 基金管理系统 - 项目初始化指南

## 项目概览

- **项目名称**: fund-manager
- **架构**: 前后端分离
- **后端**: FastAPI + SQLite + SQLAlchemy
- **前端**: React + Ant Design + Vite
- **CLI**: Typer
- **文档**: 已完成 API 设计

---

## 第一步：后端项目初始化

### 1.1 创建后端目录结构

```bash
cd ~/workspace-vestoria/projects/fund-manager

# 创建后端目录
mkdir -p backend/{app/{models,schemas,services,repositories,api,cli},alembic,tests}
cd backend

# 创建 __init__.py 文件
find app -type d -exec touch {}/__init__.py \;

# 初始化 uv
uv init
```

### 1.2 安装依赖

创建 `backend/requirements.txt`:

```txt
# Web API
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.23
alembic==1.12.1

# Auth
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# CLI
typer==0.9.0
rich==13.7.0

# Data Processing
pandas==2.1.3
numpy==1.26.2
python-dateutil==2.8.2

# Utilities
httpx==0.25.2
```

安装依赖：
```bash
cd backend
uv pip install -r requirements.txt
```

### 1.3 配置 Alembic

```bash
cd backend
uv run alembic init alembic
```

编辑 `backend/alembic.ini`:
```ini
# 修改 sqlalchemy.url
sqlalchemy.url = sqlite:///./fund_manager.db

# 修改 script_location
script_location = alembic
```

---

## 第二步：前端项目初始化

### 2.1 创建前端项目

```bash
cd ~/workspace-vestoria/projects/fund-manager

# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest frontend -- --template react-ts

cd frontend

# 安装依赖
npm install

# 安装 Ant Design
npm install antd @ant-design/icons

# 安装 React Router
npm install react-router-dom

# 安装 Axios
npm install axios

# 安装 Zustand（状态管理）
npm install zustand

# 安装 Recharts（图表）
npm install recharts

# 安装 Day.js（日期处理）
npm install dayjs
```

### 2.2 配置 Vite

编辑 `frontend/vite.config.ts`，添加代理配置：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 第三步：开发环境配置

### 3.1 后端配置文件

创建 `backend/app/config.py`:

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """应用配置"""
    
    # 应用名称
    app_name: str = "Fund Manager API"
    app_version: str = "1.0.0"
    
    # 数据库
    database_url: str = "sqlite:///./fund_manager.db"
    
    # JWT 配置
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    
    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

### 3.2 环境变量

创建 `backend/.env`:

```env
# 应用配置
APP_NAME=Fund Manager API
APP_VERSION=1.0.0

# 数据库
DATABASE_URL=sqlite:///./fund_manager.db

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## 第四步：验证环境

### 4.1 启动后端

```bash
cd backend

# 运行 FastAPI 应用
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000/docs 查看自动生成的 API 文档。

### 4.2 启动前端

```bash
cd frontend

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看前端页面。

---

## 第五步：开始开发

### 5.1 后端开发顺序

按照以下顺序实现后端功能：

1. **Day 1-2: 数据层**
   - SQLAlchemy 模型定义
   - Alembic 迁移脚本
   - 数据库初始化

2. **Day 3: 业务层**
   - Services 实现
   - Repositories 实现

3. **Day 4: API 层**
   - FastAPI 路由
   - 请求/响应模型
   - 认证中间件

4. **Day 5: CLI**
   - Typer 命令实现

### 5.2 前端开发顺序

后端 API 稳定后开始前端开发：

1. **Day 1: 基础框架**
   - React Router 配置
   - Axios 封装
   - 状态管理

2. **Day 2: 认证页面**
   - 登录页面
   - 路由保护

3. **Day 3-4: 核心页面**
   - 基金列表
   - 基金详情
   - 投资者管理

4. **Day 5: 完善功能**
   - 数据可视化
   - 导出功能

---

## 常用命令

### 后端

```bash
# 运行开发服务器
cd backend && uv run uvicorn app.main:app --reload

# 运行测试
cd backend && uv run pytest

# 数据库迁移
cd backend && uv run alembic revision --autogenerate -m "message"
cd backend && uv run alembic upgrade head

# 运行 CLI
cd backend && uv run python -m app.cli.main --help
```

### 前端

```bash
# 运行开发服务器
cd frontend && npm run dev

# 构建生产版本
cd frontend && npm run build

# 预览生产版本
cd frontend && npm run preview

# 代码格式化
cd frontend && npm run format
```

---

## 下一步

1. **开始后端开发**: 从 SQLAlchemy 模型定义开始
2. **参考 API 文档**: `docs/API-DESIGN.md`
3. **保持沟通**: 遇到问题随时反馈

---

**准备开始了吗？告诉我你想先做哪一步！** 💰
