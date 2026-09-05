# Fund 前端开发

React、TypeScript、Vite、Ant Design 和 Zustand。当前以仓库 main 为基线，不再维护独立的 `frontend` 发布分支。

## 开发命令

在本目录执行：

```bash
npm ci
npm run dev
```

发布构建：

```bash
npm run build
```

单独 Vite 开发需对齐后端代理、`FRONTEND_URL`、Auth client callback 和 CORS；默认 Docker 地址是 20260，不是 Vite 开发端口。完整账号验收优先走本地 Docker。

## 路由和会话

| 环境 | base path | API base |
|---|---|---|
| 本地 Docker | `/` | `/api/v1` |
| SG01 | `/fund/` | `/fund/api/v1` |

`VITE_BASE_PATH`、`VITE_API_URL`、Auth 公开 URL 在构建时注入。内部导航使用 Router，不使用绕过 basename 的根路径链接。深层刷新、callback 和静态资源均需覆盖。

认证状态通过本应用 BFF 获取；Zustand 保存展示状态，不保存 access/refresh token。写请求带 cookie 与 CSRF。不要复制历史设计稿中的 Bearer 拦截器或账号密码登录表单。

viewer 隐藏/禁用写操作只是体验优化，最终由后端拒绝；普通登录成功不意味着 editor 权限。

## 维护入口

- [根 README](../README.md)
- [API](../docs/API-DESIGN.md)、[部署](../docs/DEPLOY.md)、[测试](../tests/README.md)
- [早期设计稿](../docs/FRONTEND_DESIGN.md)、[早期进度](PROGRESS.md)仅保留设计历史，不作为当前功能完成度。
