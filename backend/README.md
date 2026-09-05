# Fund Backend

FastAPI + SQLAlchemy，入口为 `app/main.py`，主要分层为 API、service、repository、model。业务 SQLite 与 Redis BFF 会话分离。

## 本地开发

优先使用仓库根目录 Docker Compose，完整准备步骤见[根 README](../README.md)。需要单独热更新时，在本目录安装 `requirements.txt` 的依赖，并显式配置测试数据库、Redis、Auth 内部 URL、issuer、client secret 和前端地址后启动：

```bash
uvicorn app.main:app --reload --port 8000
```

此时后端自身的 Swagger 为 `http://localhost:8000/docs`。这个地址不等于生产公开 API，也不保证通过前端 Nginx 开放。

不要把 `init_db.py`、历史数据导入脚本或 `start.sh` 当作无副作用的生产启动/升级步骤；既有库迁移见[migrations](migrations/README.md)。

## 当前认证

- 浏览器页面跳转 Auth，回调后由 `POST /api/v1/auth/callback?code=...` 建立 BFF 会话。
- `GET /api/v1/auth/me` 返回当前业务用户；`POST /api/v1/auth/logout` 清除本应用会话。
- 浏览器不获得 access/refresh token，不提供旧的 `/auth/login` 密码登录。
- Fund client 是 `vestoria`；viewer 读取，editor 读写，全局 `auth-service:admin` 具备完整权限。所有角色均需要邮箱已验证。
- 写请求校验 `X-CSRF-Token`，认证状态从 Auth userinfo 获取。
- `admins` 表是本地投影，`password_hash` 对 SSO 用户可空。

API 常用前缀为 `/api/v1/funds` 及其 investors、操作历史等子资源。生产经 edge 加上 `/fund`。业务字段参见 [API 文档](../docs/API-DESIGN.md)，以实际路由/OpenAPI 为准。

## 测试与数据

[测试说明](../tests/README.md)列出当前 BFF 与 007 migration 回归，须在隔离本地 Docker 环境执行。

Compose 数据库为 `sqlite:////app/data/fund_manager.db`。源码目录的 `backend/data` 不是宿主机 Compose 默认 `data/`；迁移前必须明确目标，不要运行脚本后误以为已经修改了实际业务库。
