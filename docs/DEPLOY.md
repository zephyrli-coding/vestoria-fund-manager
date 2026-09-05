# Fund 部署指南

当前部署采用统一 Auth、Redis BFF 和 Vestoria `/fund/` 子路径。不使用旧独立 JWT 登录、默认管理员密码或单站点根路径 Nginx 模板。

## 本地先行

按[项目 README](../README.md)启动 Auth 和 Fund。本地 Docker 入口为 `http://localhost:20260`。在隔离测试容器完成[认证与迁移回归](../tests/README.md)，再进行实际登录、viewer/editor、CSRF、页面刷新和业务冒烟。

涉及现有 SQLite 的修改，必须在脱敏生产备份副本上测试“新用户第一次登录”，已有用户成功不能排除旧列约束问题。

## SG01 参数

| 配置 | 生产值 |
|---|---|
| 浏览器入口 / `FRONTEND_URL` | `https://vestoria.mr-strawberry.com/fund` |
| `VITE_BASE_PATH` | `/fund/` |
| `VITE_API_URL` | `/fund/api/v1` |
| `AUTH_SERVICE_PUBLIC_URL`、issuer | `https://auth.mr-strawberry.com` |
| 后端 Auth / JWKS | `http://auth-nginx`、`http://auth-nginx/.well-known/jwks.json` |
| client / callback | `vestoria` / `https://vestoria.mr-strawberry.com/fund/auth/callback` |
| session cookie | Secure、HttpOnly，path `/fund/` |

保持现有生产配置的 URL 规范，尤其不要因末尾斜杠生成双斜杠 callback。OAuth client 的 redirect URI 必须精确匹配。前端参数在构建时注入，改值后需重建。

## 发布顺序

1. 对应仓库 PR 合并 main，记录部署 SHA 和回滚 SHA。
2. 通过 `sg01-daily` 进入已登记工作区，按 infra 清单核对目标，不覆盖私有 `.env`。
3. 一致性备份 SQLite、记录实际挂载和 schema；有 migration 时先在副本演练。
4. 按需执行[迁移](../backend/migrations/README.md)，再重建受影响服务；不盲目执行全部历史迁移。
5. 验收 HTTPS、深层路由和静态资源；未登录为 401，无角色/邮箱未验证为 403。
6. 验证新用户首次登录、viewer 读取与写入拒绝、editor 写入、全局管理员和 CSRF。
7. 核对业务数据与日志；记录时间、SHA、执行结果和未覆盖范围。

完整流程以 [infra 部署检查清单](https://github.com/zephyrli-coding/compound-infra/blob/main/docs/operations/deployment-checklist.md)为准。

## 数据与排障

SQLite 默认宿主机 `./data/fund_manager.db` → 容器 `/app/data/fund_manager.db`，可由 `DATA_PATH` 改变宿主机位置。Redis 会话使用独立 volume。重建容器不应删除挂载数据。

- 404：区分页面 base path、API 前缀与反向代理，不能把所有请求兜底为 HTML。
- 401：检查当前 BFF cookie、过期/撤销和 Auth 可用性。
- 403：检查邮箱、对应应用角色与 CSRF，而不是自动提权为管理员。
- `Unexpected token ... Internal Server Error`：先查状态码、Content-Type、后端和代理日志；新用户登录失败尤其检查旧 `admins.password_hash NOT NULL` 与 007 迁移。
- schema 回滚与代码回滚不同，恢复前先保护上线后的新增数据。

禁止将删除 `data/`、默认密码重建账号或 `docker compose down -v` 写入常规修复步骤。
