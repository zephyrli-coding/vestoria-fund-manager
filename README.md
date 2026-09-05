# Vestoria Fund Manager

基金、投资者份额、净值和操作历史管理。React/Vite 前端，FastAPI/SQLAlchemy 后端，SQLite 业务库，Redis BFF 会话。

- [生产入口](https://vestoria.mr-strawberry.com/fund/)
- [本地 Docker 入口](http://localhost:20260)，需先启动本地服务。
- [项目飞书](https://compound.feishu.cn/wiki/MfkHwOkeUijSRUkvnVtcnRErngg)
- [文档索引](docs/README.md)

## 账号与权限

统一登录由 auth-service 提供，client ID 为 `vestoria`。邮箱验证后，`vestoria:viewer` 可读，`vestoria:editor` 可读写；`auth-service:admin` 具有完整权限。角色由 Auth 管理员设置。

本地 `admins` 表只是历史命名的业务用户映射，不代表每条记录都是管理员。SSO 新用户不设置本地密码。没有业务默认管理员密码，也不再使用 `POST /api/v1/auth/login` 获取浏览器 token。

浏览器只持有会话 cookie；access/refresh token 存于 BFF Redis。写请求需满足 editor 权限及 `X-CSRF-Token` 校验。

## 核心功能

基金和投资者管理、申购/赎回/转让、净值与历史走势、投资收益快照、操作历史导入导出。业务规则见 [API 说明](docs/API-DESIGN.md)和[后端能力](docs/BACKEND_CAPABILITIES.md)；具体字段以目标版本代码/OpenAPI 为准。

## 本地启动

1. 准备私有 `.env`，不覆盖现有文件；配置与 Auth 匹配的 client secret。
2. 先启动 auth-service，共享网络中将 `AUTH_SERVICE_URL=http://auth-nginx`、JWKS 指向同一内部地址，issuer 保持浏览器可见的 Auth URL。
3. 构建 infra 提供的 `compound-python-backend:3.11`。
4. 在本仓库根目录执行：

```bash
docker compose up -d --build
```

本地 `FRONTEND_URL=http://localhost:20260`，callback 为 `http://localhost:20260/auth/callback`；默认 `VITE_BASE_PATH=/`、`VITE_API_URL=/api/v1`。

## 部署和数据

生产必须按 `/fund/` 构建，API 为 `/fund/api/v1`，callback 为 `https://vestoria.mr-strawberry.com/fund/auth/callback`。仅改运行环境变量不能替代前端重建。

SQLite 默认宿主机 `./data/fund_manager.db` 映射到 `/app/data/fund_manager.db`。会话 Redis 使用独立 volume。重建容器不能删除这些数据。

旧库迁移必须检查 `006` 和 `007`；`create_all` 不会取消旧密码列的 NOT NULL。具体操作见[迁移说明](backend/migrations/README.md)和[部署指南](docs/DEPLOY.md)。

## 开发与测试

- [后端开发](backend/README.md)、[前端开发](frontend/README.md)、[测试边界与入口](tests/README.md)。
- 先在独立本地 Docker 测试，确认新用户登录、viewer/editor、CSRF 和旧库迁移，再通过 PR/main 部署到 SG01。
- 2026-08-30 上线与 Fund 首次登录修复的证据由 [infra 上线记录](https://github.com/zephyrli-coding/compound-infra/blob/main/docs/operations/m6-production-rollout-2026-08-30.md)维护；本次文档整理未重跑测试。
