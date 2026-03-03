# 服务器环境配置和启动指南

## 🚀 在服务器上启动前端开发

### 前提条件

✅ 服务器已安装：Node.js 22.22.0, npm 10.9.4
✅ 后端服务运行：uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
✅ 前端代码已推送：GitHub frontend 分支

---

## 📋 步骤 1：进入前端目录

```bash
cd projects/fund-manager/frontend
```

---

## 📋 步骤 2：安装依赖

```bash
# 清理旧依赖
rm -rf node_modules package-lock.json

# 安装依赖
npm install
```

**预计时间**：2-5 分钟（取决于网络速度）

---

## 📋 步骤 3：启动开发服务器

```bash
# 启动 Vite 开发服务器
npm run dev
```

---

## 📋 步骤 4：访问应用

启动成功后，通过以下方式访问：

### 主访问地址
```
http://your-server-ip:5173
```

### 替代方案（如果 5173 端口被占用）
```
http://your-server-ip:5174
```

---

## 🔧 Vite 配置说明

当前 `vite.config.ts` 已配置：
- 开发服务器端口：5173
- API 代理：`/api` → `http://localhost:8000/api`

---

## 🛠️ 可能遇到的问题和解决方案

### 问题 1：端口 5173 被占用
```bash
# 查找占用进程
lsof -i :5173

# 杀死进程
kill -9 <PID>
```

### 问题 2：npm install 失败
```bash
# 清理缓存重试
npm cache clean --force
npm install

# 或使用淘宝镜像
npm install --registry=https://registry.npmmirror.com
```

### 问题 3：API 连接失败
- 确保 uvicorn 后端服务正在 8000 端口运行
- 检查 Vite 代理配置

---

## 📊 开发服务器信息

启动成功后，终端会显示：

```
  VITE v7.3.8  ready in 1234 ms

  ➜  Local:   http://0.0.0.0:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

看到 `ready` 就说明启动成功了！

---

## 🎨 前端功能（当前进度）

### ✅ 已完成的页面
- 登录页
- 仪表盘（统计卡片、快捷操作、最近记录）
- 基金列表
- 基金详情
- 投资者管理
- 主布局（侧边栏、Header）

### 🔄 待开发的功能
- 申购/赎回/转账弹窗
- 图表组件（NAV 走势、资产变化）
- 历史记录页
- 操作详情页

---

## 🚀 快速命令总结

```bash
# 完整流程（一键安装并启动）
cd projects/fund-manager/frontend && rm -rf node_modules && npm install && npm run dev

# 仅启动（如果已安装）
cd projects/fund-manager/frontend && npm run dev

# 查看日志
npm run dev
```

---

## 💡 开发提示

1. **热更新**：修改文件后，Vite 会自动刷新浏览器
2. **代理配置**：已配置 `/api` → `http://localhost:8000/api`
3. **调试工具**：在浏览器中使用 React DevTools
4. **API 文档**：后端 API 文档在 `http://localhost:8000/docs`

---

## 🎯 当前状态

- ✅ 服务器环境就绪（Node.js + npm）
- ✅ 前端代码已拉取到最新
- 🔄 正在安装依赖...
- ⏳ 等待启动开发服务器

---

安装依赖完成后，告诉我，我会确认启动状态！
