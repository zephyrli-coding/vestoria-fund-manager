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
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   └── ...
├── frontend/             # 前端项目
│   ├── src/
│   └── ...
├── docs/                # 文档
│   └── API-DESIGN.md   # API 设计文档
└── utils/               # 现有代码（参考）
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

## 快速开始

### 前置要求

- Python 3.9+
- Node.js 18+
- uv (Python 包管理器）

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd fund-manager

# 后端初始化
cd backend
uv init
uv pip install -r requirements.txt

# 前端初始化
cd ../frontend
npm install
```

### 运行

```bash
# 启动后端
cd backend
uv run uvicorn app.main:app --reload

# 启动前端（新终端）
cd frontend
npm run dev
```

访问：
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 前端界面: http://localhost:3000

## 文档

- [API 设计文档](./docs/API-DESIGN.md) - 完整的 API 接口定义
- [项目初始化指南](./README-SETUP.md) - 详细的环境搭建步骤
- [技术方案](./PLAN.md) - 架构设计和技术选型

## 开发路线

### Phase 1: 后端核心功能（进行中）
- [x] API 设计文档
- [x] 项目初始化指南
- [ ] 数据库模型定义
- [ ] 业务逻辑实现
- [ ] API 接口实现
- [ ] CLI 工具实现

### Phase 2: 前端开发（待开始）
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

## 当前状态

- ✅ 需求分析完成
- ✅ 技术方案确定
- ✅ API 设计文档完成
- ✅ 项目结构规划完成
- ⏳ 等待开始后端开发

## 下一步

1. 按照项目初始化指南搭建开发环境
2. 开始后端开发，从数据库模型定义开始
3. API 稳定后，开始前端开发

---

**开发中...** 💰
