# 基金管理系统 - 服务器环境配置

## 🚀 在服务器上启动前端

### 前提条件
- ✅ 后端服务运行（http://localhost:8000）
- ✅ 前端代码已拉取（GitHub frontend 分支）
- ✅ Vite 已全局安装（最新版）

---

## 📋 启动步骤

### 1. 进入前端目录
```bash
cd projects/fund-manager/frontend
```

### 2. 清理并安装依赖
```bash
# 清理旧依赖
rm -rf node_modules package-lock.json

# 安装依赖
npm install
```

**预计时间**：3-5 分钟

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 访问应用
```
http://your-server-ip:5173
```

---

## 🔍 启动成功标志

终端会显示：
```
VITE v7.3.x  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

看到 `ready` 就说明启动成功了！

---

## 🌐 网络访问

### 如果是本地开发
- 访问：`http://localhost:5173`
- 代理：自动转发 `/api` → `http://localhost:8000/api`

### 如果是服务器部署
- 确保端口 5173 已开放
- 防火墙允许 HTTP 流量
- 配置反向代理（如需要）

---

## 🐛 常见问题

### 问题 1：Vite 命令未找到
```bash
# 全局安装 vite
npm install -g vite

# 或使用 npx
npx vite
```

### 问题 2：端口 5173 被占用
```bash
# 查找占用进程
lsof -i :5173

# 杀死进程
kill -9 <PID>
```

### 问题 3：npm install 失败
```bash
# 清理缓存
npm cache clean --force

# 使用淘宝镜像
npm install --registry=https://registry.npmmirror.com
```

### 问题 4：连接后端失败
```bash
# 检查后端是否运行
curl http://localhost:8000/health

# 如果后端需要启动
cd projects/fund-manager/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0
```

---

## 📊 端口汇总

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Vite | 5173 | 开发服务器（HMR）|
| 后端 FastAPI | 8000 | API 服务器 |
| 后端 API 文档 | 8000/docs | Swagger UI |

---

## 🎯 完整启动流程

```bash
# 1. 进入目录
cd projects/fund-manager/frontend

# 2. 清理并安装
rm -rf node_modules
npm install

# 3. 启动开发服务器
npm run dev

# 4. 验证（新开终端）
# 访问 http://your-server-ip:5173
# 测试登录：admin / [REDACTED_TEST_PASSWORD]
```

---

## 🚀 启动命令

```bash
cd projects/fund-manager/frontend && npm run dev
```

---

**准备就绪！** 现在可以启动前端开发服务器了！
