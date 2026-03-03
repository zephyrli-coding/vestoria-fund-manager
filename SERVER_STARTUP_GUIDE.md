# 服务器前端启动指南

## 🚀 在服务器上启动前端

### 前提条件

✅ 后端服务运行：uvicorn app.main:app --host 0.0.0.0 --port 8000
✅ 前端代码已拉取：GitHub frontend 分支
✅ Node.js 已安装：v22.22.0
✅ npm 已安装：10.9.4

---

## 📋 启动步骤

### 步骤 1：全局安装 Vite
```bash
npm install -g vite
```

### 步骤 2：进入前端目录
```bash
cd projects/fund-manager/frontend
```

### 步骤 3：启动开发服务器
```bash
npm run dev
```

---

## 🔍 启动验证

启动后，检查以下内容：

### 1. 检查服务器地址
```bash
# 如果是本地开发
curl http://localhost:5173/health

# 如果是服务器，使用实际 IP
curl http://your-server-ip:5173/health
```

### 2. 查看 Vite 输出
终端应该显示：
```
  VITE v7.3.x  ready in xxxx ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. 测试前端访问
```
http://localhost:5173/login
http://localhost:5173/dashboard
```

---

## 🛠️ 常见问题

### 问题 1：vite 命令未找到
```bash
# 解决方案：全局安装 vite
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

### 问题 3：依赖安装失败
```bash
# 清理并重试
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 📊 端口说明

### 开发服务器端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Vite | 5173 | 开发服务器（HMR）|
| 后端 FastAPI | 8000 | API 服务器 |

### 代理配置

前端通过 Vite 代理访问后端 API：

```
http://localhost:5173/api → http://localhost:8000/api
```

配置位置：`vite.config.ts`

---

## 🎯 成功标志

启动成功后，你会看到：

### Vite 输出
```
  VITE v7.3.x  ready in xxxx ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 浏览器访问
```
✅ 登录页面正常加载
✅ 仪表盘数据显示
✅ 导航栏正常切换
✅ API 请求正常
```

---

## 🚀 快速重启

```bash
# 停止开发服务器（Ctrl+C）
# 重新启动
npm run dev
```

---

## 💡 开发提示

1. **热模块替换 (HMR)**：保存文件后，浏览器会自动刷新
2. **API 调试**：浏览器开发者工具查看网络请求
3. **错误日志**：终端会显示编译错误
4. **状态检查**：使用 Zustand DevTools 扩展查看状态变化

---

**启动命令**：
```bash
cd projects/fund-manager/frontend
npm run dev
```

**访问地址**：
```
http://your-server-ip:5173/login
```

启动成功后告诉我，我会确认服务状态！
