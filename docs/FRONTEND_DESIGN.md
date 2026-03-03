# 基金管理系统前端开发文档

**版本**: v1.0.0
**日期**: 2026-03-03
**前端框架**: React + Vite + Ant Design

---

## 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [功能模块](#功能模块)
- [页面设计](#页面设计)
- [组件设计](#组件设计)
- [状态管理](#状态管理)
- [路由设计](#路由设计)
- [开发计划](#开发计划)

---

## 技术栈

### 核心框架
- **React 18** - UI 框架
- **Vite** - 构建工具（快速）
- **TypeScript** - 类型安全
- **Ant Design 5.x** - UI 组件库

### 状态管理
- **Zustand** - 轻量级状态管理
- **React Query** 或 **SWR** - 数据获取和缓存

### 路由
- **React Router v6** - 客户端路由

### 表单处理
- **React Hook Form** - 表单验证
- **Zod** - Schema 验证

### 图表
- **Recharts** - 数据可视化
- **ECharts** - 备选方案

### HTTP 客户端
- **Axios** - HTTP 请求
- **React Query** - 服务端状态管理

### 工具库
- **Day.js** - 日期处理
- **Numeral.js** - 数字格式化
- **React Hot Toast** - 消息提示
- **React Icons** - 图标库

---

## 项目结构

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/               # API 客户端封装
│   │   ├── index.ts      # API 实例
│   │   ├── auth.ts      # 认证相关
│   │   ├── funds.ts     # 基金相关
│   │   └── investors.ts # 投资者相关
│   ├── components/        # 公共组件
│   │   ├── common/     # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   ├── fund/       # 基金组件
│   │   │   ├── FundCard.tsx
│   │   │   ├── FundForm.tsx
│   │   │   └── FundChart.tsx
│   │   └── investor/  # 投资者组件
│   │       ├── InvestorTable.tsx
│   │       ├── InvestorForm.tsx
│   │       └── OperationDialog.tsx
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useFunds.ts
│   │   └── useToast.ts
│   ├── layouts/          # 布局组件
│   │   ├── MainLayout.tsx
│   │   └── LoginLayout.tsx
│   ├── pages/            # 页面组件
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Funds.tsx
│   │   ├── FundDetail.tsx
│   │   └── Investors.tsx
│   ├── stores/           # Zustand 状态管理
│   │   ├── auth.ts
│   │   ├── fund.ts
│   │   └── ui.ts
│   ├── types/            # TypeScript 类型定义
│   │   ├── api.ts
│   │   └── fund.ts
│   ├── utils/            # 工具函数
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── App.tsx          # 根组件
│   ├── main.tsx          # 入口文件
│   └── vite-env.d.ts     # 环境变量
├── .env.development      # 开发环境变量
├── .env.production       # 生产环境变量
├── .eslintrc.cjs       # ESLint 配置
├── .prettierrc        # Prettier 配置
├── index.html           # HTML 模板
├── package.json         # 依赖配置
├── tsconfig.json        # TypeScript 配置
├── tsconfig.node.json   # Node TypeScript 配置
└── vite.config.ts       # Vite 配置
```

---

## 功能模块

### 1. 认证模块
- 登录页面
- Token 存储（localStorage）
- Token 自动刷新
- 路由守卫（未登录重定向）

### 2. 基金管理模块
- 基金列表展示
- 创建基金
- 编辑基金名称
- 删除基金
- 基金详情页
- NAV 更新
- 历史记录查看
- 图表展示

### 3. 投资者管理模块
- 投资者列表
- 添加投资者
- 编辑投资者信息
- 投资者详情
- 持仓统计

### 4. 份额操作模块
- 申购操作
- 赎回操作（按份额/按余额）
- 转账操作
- 操作历史记录
- 操作详情查看

### 5. 仪表盘模块
- 概览卡片
  - 总资产
  - 总份额
  - 总投资者数
  - 今日收益
- 快捷操作入口
- 最近操作记录
- 基金净值走势图

---

## 页面设计

### 1. 登录页 (`/login`)
**布局**:
- 居中的登录表单
- Logo 和标题

**表单字段**:
- 用户名（文本输入）
- 密码（密码输入）
- 记住我（复选框）

**交互**:
- 表单验证
- 错误提示
- 加载状态
- 成功后跳转到仪表盘

---

### 2. 仪表盘 (`/`)
**布局**:
- 顶部导航栏
- 左侧菜单
- 主内容区

**内容区块**:
1. **统计卡片**（4个）
   - 总资产（带图标和趋势）
   - 总份额
   - 总投资者数
   - 今日收益

2. **快捷操作**
   - 创建基金
   - 添加投资者
   - 申购/赎回

3. **基金列表**（表格）
   - 基金名称
   - 当前净值
   - 总资产
   - 创建日期
   - 操作按钮

4. **最近操作**（时间线）
   - 最近的 10 条操作记录

---

### 3. 基金列表页 (`/funds`)
**布局**:
- 面包屑导航
- 工具栏（搜索、筛选、新建）
- 表格区
- 分页器

**表格列**:
- 基金名称（可点击）
- 成立时间
- 总份额
- 单位净值
- 总资产
- 操作（查看、编辑、删除）

**交互**:
- 排序
- 搜索
- 分页
- 快速操作（菜单）

---

### 4. 基金详情页 (`/funds/:id`)
**布局**:
- 面包屑导航（返回基金列表）
- 基本信息卡片
- 图表区（NAV/Balance/Share 走势）
- 投资者列表
- 操作记录

**图表**:
- NAV 走势图（折线图）
- 资产变化图（面积图）
- 份额变化图（折线图）
- 时间范围选择器（1周/1月/3月/全部）

**操作按钮**:
- 更新 NAV
- 添加投资者
- 赎回/转账（批量操作）

---

### 5. 投资者管理页 (`/funds/:id/investors`)
**布局**:
- 基金信息头
- 工具栏（搜索、添加、批量操作）
- 投资者表格
- 分页器

**表格列**:
- 投资者姓名
- 持有份额
- 持有市值
- 占比（进度条）
- 加入日期
- 操作（申购、赎回、转账）

**批量操作**:
- 批量赎回
- 批量转账

---

## 组件设计

### 公共组件 (`components/common/`)

#### 1. Button
**变体**:
- Primary（主按钮）
- Secondary（次按钮）
- Danger（危险按钮）
- Ghost（幽灵按钮）

**属性**:
- `loading` - 加载状态
- `disabled` - 禁用状态
- `icon` - 图标

---

#### 2. Modal
**功能**:
- 标题和内容
- 确认和取消按钮
- 关闭按钮（X）
- 点击遮罩关闭

**变体**:
- Info 信息弹窗
- Warning 警告弹窗
- Success 成功弹窗
- Danger 危险弹窗

---

#### 3. Table
**功能**:
- 排序
- 筛选
- 分页
- 列配置
- 行选择
- 加载状态

---

### 基金组件 (`components/fund/`)

#### 1. FundCard
**展示**:
- 基金名称
- 当前净值（带涨跌颜色）
- 总资产
- 收益率
- 操作按钮

**交互**:
- 点击跳转详情
- 悬停显示快捷操作

---

#### 2. FundForm
**表单字段**:
- 基金名称（必填）
- 成立时间（日期选择器）

**验证**:
- 名称唯一性检查
- 名称长度限制
- 日期格式验证

---

#### 3. FundChart
**图表类型**:
- Line Chart（NAV 走势）
- Area Chart（资产变化）
- Bar Chart（份额分布）

**交互**:
- 时间范围切换
- 数据点提示
- 图例显示/隐藏
- 下载图表

---

### 投资者组件 (`components/investor/`)

#### 1. InvestorTable
**功能**:
- 投资者列表展示
- 持仓排序
- 操作菜单

**列**:
- 投资者姓名
- 持仓份额
- 持仓市值
- 占比（可视化）
- 加入日期

---

#### 2. OperationDialog
**用途**:
- 申购弹窗
- 赎回弹窗
- 转账弹窗

**表单字段**:
- 投资者选择（转账时）
- 金额输入
- 金额类型选择（份额/市值）
- 日期选择
- 备注

---

## 状态管理

### Zustand Store 设计

#### 1. Auth Store (`stores/auth.ts`)

```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}
```

#### 2. Fund Store (`stores/fund.ts`)

```typescript
interface FundState {
  funds: Fund[];
  currentFund: Fund | null;
  loading: boolean;
  error: string | null;
  fetchFunds: () => Promise<void>;
  createFund: (data: FundCreate) => Promise<void>;
  updateFund: (id: number, data: FundUpdate) => Promise<void>;
  deleteFund: (id: number) => Promise<void>;
  updateNav: (id: number, capital: number) => Promise<void>;
}
```

#### 3. UI Store (`stores/ui.ts`)

```typescript
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}
```

---

## 路由设计

### 路由结构

```typescript
const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'funds',
        element: <Funds />,
      },
      {
        path: 'funds/:id',
        element: <FundDetail />,
        children: [
          {
            path: 'investors',
            element: <Investors />,
          },
          {
            path: 'history',
            element: <History />,
          },
        ],
      },
    ],
  },
];
```

### 路由守卫

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

---

## 开发计划

### Phase 1: 项目初始化（1天）
- [ ] Vite + React + TypeScript 项目搭建
- [ ] Ant Design 配置
- [ ] 路由配置
- [ ] ESLint + Prettier 配置
- [ ] 环境变量配置

### Phase 2: 基础设施（2天）
- [ ] API 客户端封装
- [ ] Zustand 状态管理
- [ ] 路由守卫
- [ ] 公共组件
  - [ ] Button
  - [ ] Modal
  - [ ] Table

### Phase 3: 认证模块（1天）
- [ ] 登录页面
- [ ] Token 存储
- [ ] 认证逻辑
- [ ] 登出功能

### Phase 4: 基金管理（3天）
- [ ] 仪表盘页面
- [ ] 基金列表页
- [ ] 基金详情页
- [ ] 创建基金表单
- [ ] 基金图表组件
- [ ] NAV 更新功能

### Phase 5: 投资者管理（2天）
- [ ] 投资者列表页
- [ ] 添加投资者
- [ ] 编辑投资者
- [ ] 投资者表格
- [ ] 持仓统计

### Phase 6: 份额操作（2天）
- [ ] 申购弹窗
- [ ] 赎回弹窗
- [ ] 转账弹窗
- [ ] 操作记录列表
- [ ] 批量操作

### Phase 7: 优化和测试（2天）
- [ ] 响应式设计
- [ ] 错误处理
- [ ] 加载状态优化
- [ ] 单元测试
- [ ] 集成测试

### Phase 8: 部署（1天）
- [ ] 生产构建
- [ ] 环境变量配置
- [ ] Nginx 配置（如需要）
- [ ] 域名部署

---

## API 集成

### 基础配置

```typescript
// src/api/index.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，跳转登录
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API 模块

```typescript
// src/api/auth.ts
import api from './index';

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/v1/auth/login', { username, password }),

  me: () =>
    api.get('/v1/auth/me'),
};

// src/api/funds.ts
export const fundsApi = {
  list: (params?: FundListParams) =>
    api.get('/v1/funds', { params }),

  create: (data: FundCreate) =>
    api.post('/v1/funds', data),

  update: (id: number, data: FundUpdate) =>
    api.put(`/v1/funds/${id}`, data),

  delete: (id: number) =>
    api.delete(`/v1/funds/${id}`),

  updateNav: (id: number, data: UpdateNavRequest) =>
    api.post(`/v1/funds/${id}/update-nav`, data),

  history: (id: number, params?: HistoryParams) =>
    api.get(`/v1/funds/${id}/history`, { params }),

  chart: (id: number, params?: ChartParams) =>
    api.get(`/v1/funds/${id}/chart`, { params }),
};
```

---

## 样式规范

### CSS-in-JS
使用 Tailwind CSS 或 CSS Modules，保持样式隔离。

### 主题色

```css
/* 主色 */
--primary-color: #1890ff;
--primary-hover: #40a9ff;

/* 成功 */
--success-color: #52c41a;
--warning-color: #faad14;
--danger-color: #ff4d4f;

/* 文字 */
--text-primary: #262626;
--text-secondary: #595959;
--text-tertiary: #8c8c8c;

/* 背景 */
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
--bg-tertiary: #fafafa;

/* 边框 */
--border-color: #d9d9d9;
```

---

## 性能优化

### 代码分割
```typescript
// 路由级别代码分割
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Funds = lazy(() => import('@/pages/Funds'));

// 配合 Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### 数据缓存
使用 React Query 缓存策略：
```typescript
const { data } = useQuery(
  ['funds'],
  fetchFunds,
  {
    staleTime: 5 * 60 * 1000,  // 5 分钟
    cacheTime: 10 * 60 * 1000, // 10 分钟
  }
);
```

---

## 测试策略

### 单元测试
- 组件测试
- Hooks 测试
- 工具函数测试
- Store 测试

### 集成测试
- API 模块测试
- 路由测试
- 认证流程测试

### E2E 测试
- 关键业务流程
- 用户操作路径
- 错误场景处理

---

## 部署配置

### 开发环境

```bash
npm run dev
# 访问 http://localhost:5173
```

### 生产构建

```bash
npm run build
# 输出到 dist/
```

### 环境变量

```env
# .env.production
VITE_API_URL=https://api.example.com/api
VITE_APP_TITLE=基金管理系统
```

---

## 参考资源

- [React 官方文档](https://react.dev/)
- [Ant Design 文档](https://ant.design/components/overview-cn/)
- [Zustand 文档](https://zustand.docs.pm/introduction)
- [React Router 文档](https://reactrouter.com/)
- [Vite 文档](https://vitejs.dev/)
- [Recharts 文档](https://recharts.org/)
