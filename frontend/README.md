# 基金管理系统 - 前端本地开发指南

**版本**: v1.0.0
**最后更新**: 2026-03-03

---

## 🚀 快速开始

### 第一步：拉取最新代码
```bash
cd fund-manager
git pull origin frontend
```

### 第二步：进入前端目录
```bash
cd fund-manager/frontend
```

### 第三步：安装依赖并启动
```bash
# 一键清理并安装
chmod +x install.sh && ./install.sh

# 或者手动安装
npm install
npm run dev
```

---

## 📋 开发环境

### 必需工具
- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0

### 推荐使用 Homebrew 安装 Node.js
```bash
# 安装 Node.js 20.x LTS
brew install node@20

# 验证版本
node --version
```

---

## 🛠️ 常见问题解决

### 问题 1：端口 5173 被占用
```bash
# 查找占用端口的进程
lsof -i :5173

# 杀死进程
kill -9 <PID>

# 或者修改 Vite 配置中的端口
# 编辑 vite.config.ts，将 port: 5173 改为其他端口
```

### 问题 2：依赖安装失败
```bash
# 使用一键清理脚本
chmod +x install.sh && ./install.sh

# 或者使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### 问题 3：API 连接失败
```bash
# 检查后端是否运行
curl http://localhost:8000/health

# 启动后端（如果需要）
cd ../backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

### 问题 4：npm install 卡住
```bash
# 清除 npm 缓存
npm cache clean --force

# 使用 -S 详细输出
npm install -S

# 或切换到淘宝镜像
echo "registry=https://registry.npmmirror.com" > .npmrc
npm install
```

---

## 📁 项目结构

```
fund-manager/frontend/
├── src/
│   ├── api/           # API 请求封装（待创建）
│   ├── components/
│   │   ├── common/      # 通用组件
│   │   │   ├── Button.tsx  ✅
│   │   ├── Modal.tsx   # （待创建）
│   │   └── Table.tsx     # （待创建）
│   ├── fund/          # 基金相关组件
│   │   ├── FundCard.tsx     # （待创建）
│   │   └── FundChart.tsx    # （待创建）
│   ├── investor/       # 投资者相关组件
│   │   ├── InvestorTable.tsx  # （待创建）
│   │   └── OperationDialog.tsx # （待创建）
│   ├── hooks/            # 自定义 hooks（待创建）
│   ├── layouts/
│   │   └── MainLayout.tsx  ✅
│   ├── pages/
│   │   ├── Login.tsx        ✅
│   │   ├── Dashboard.tsx    ✅
│   │   ├── Funds.tsx         ✅
│   │   ├── FundDetail.tsx   ✅
│   │   ├── Investors.tsx   ✅
│   │   ├── History.tsx      # （待创建）
│   │   └── NavUpdate.tsx    # （待创建）
│   ├── stores/           # Zustand 状态
│   │   ├── auth.ts          ✅
│   │   ├── ui.ts           ✅
│   │   └── fund.ts         ✅
│   ├── types/
│   │   └── api.ts          ✅
│   ├── App.tsx           ✅
│   └── main.tsx          # （待创建）
├── package.json           ✅
├── vite.config.ts          ✅
├── tsconfig.json          ✅
├── .eslintrc.cjs          ✅
├── .prettierrc           ✅
├── .env.development       ✅
└── install.sh              ✅
```

---

## 🎨 样式开发

### 主题色配置

```css
/* 主色 */
--primary: #1890ff;
--primary-hover: #40a9ff;

/* 功能色 */
--success: #52c41a;
--warning: #faad14;
--danger: #ff4d4f;

/* 文字色 */
--text-primary: #262626;
--text-secondary: #595959;
--text-tertiary: #8c8c8c;

/* 背景 */
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
```

### 自定义 CSS 写法

在 Vite 项目中，推荐使用 CSS Modules 或 Tailwind CSS：

```tsx
import styles from './Login.module.css';

function Login() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>登录</h1>
    </div>
  );
}

// styles.module.css
.container {
  padding: 40px;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #262626);
}
```

---

## 📊 API 集成示例

```typescript
// src/api/funds.ts（待创建）
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

export const fundsApi = {
  list: () => api.get('/v1/funds'),
  create: (data: FundCreate) => api.post('/v1/funds', data),
  update: (id: number, data: FundUpdate) => api.put(`/v1/funds/${id}`, data),
  delete: (id: number) => api.delete(`/v1/funds/${id}`),
  updateNav: (id: number, data: { capital: number, date: string }) =>
    api.post(`/v1/funds/${id}/update-nav`, data),
};
```

---

## 🚀 开发命令

### 依赖管理
```bash
# 安装新依赖
npm install <package-name>

# 卸载依赖
npm uninstall <package-name>

# 更新依赖
npm update <package-name>
```

### 代码质量
```bash
# 运行 ESLint
npm run lint

# 自动修复
npm run lint -- --fix

# 格式化代码
npm run format
```

---

## 📝 工作流程

1. **拉取最新代码**
   ```bash
   git pull origin frontend
   ```

2. **开发新功能**
   - 创建/修改组件
   - 实现页面逻辑
   - 添加状态管理

3. **测试**
   ```bash
   npm run dev
   ```
   在浏览器中访问 http://localhost:5173

4. **提交代码**
   ```bash
   git add .
   git commit -m "描述"
   git push
   ```

---

## 💡 提示

1. **热更新**：Vite 支持热更新，保存文件后会自动刷新浏览器
2. **类型安全**：充分利用 TypeScript 的类型检查，避免运行时错误
3. **组件复用**：在 `components/common` 中创建可复用的组件
4. **状态管理**：复杂状态用 Zustand，简单状态用 React.useState
5. **API 错误处理**：所有 API 调用都应该添加 try-catch，显示友好的错误提示

---

## 🐛 调试技巧

### 查看日志
```bash
# 在终端查看 Vite 日志
npm run dev

# 使用 Chrome DevTools
# 安装 React Developer Tools 扩展
```

### 常见开发工具

- **React DevTools** - 调试 React 组件和状态
- **Redux DevTools** - 如果使用 Redux
- **Network 标签** - 查看网络请求
- **Console 标签** - 查看日志和错误

---

## 📚 学习资源

- [React 官方文档](https://react.dev/)
- [Ant Design 组件库](https://ant.design/components/overview-cn/)
- [Vite 文档](https://vitejs.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Zustand 文档](https://zustand.docs.pm/introduction)

---

## 🎯 目标

打造一个**专业、美观、易用**的基金管理系统前端！

**当前进度**: 基础设施完成 30%

**下一步**：
1. 添加投资者详情页
2. 实现份额操作弹窗
3. 完善图表组件
4. 添加历史记录页

---

需要我帮助解决任何问题吗？
