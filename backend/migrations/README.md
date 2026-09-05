# Fund 数据库迁移

迁移按现有数据库版本按需选择，不是每次部署顺序执行所有脚本。新库建表与旧库 schema 升级是两件事。

| 编号 | 文件 | 用途 |
|---|---|---|
| 001 | `001_migrate_data.py` | 旧数据导入，历史操作 |
| 002 | `002_migrate_currency.py` | 币种 |
| 003 | `003_migrate_investor_cumulative.py` | 累计投入/赎回 |
| 004 | `004_migrate_investor_snapshots.py` | 收益快照 |
| 005 | `005_migrate_tags.py` | 标签 |
| 006 | `006_migrate_admin_auth_user_id.py` | Auth 用户映射、邮箱和 active 字段 |
| 007 | `007_make_admin_password_nullable.py` | 取消旧 admins.password_hash 的 NOT NULL，允许 SSO 新用户 |

不为早期脚本补猜测的创建日期，也不保证每个历史数据导入脚本都可安全重复运行。

## 006 与 007

006 不会修改既有密码列的 NOT NULL；脚本中的提示不代表约束已解除。只有 model 声明 nullable 或执行 create_all 同样无法修复旧表。M6 的新用户首次登录问题由 007 修复。

006/007 默认路径按脚本所在 backend 目录定位 `data/fund_manager.db`。本地宿主机直接执行会指向 `backend/data`，不是 Compose 默认的仓库根 `data/`。

对于使用标准 Dockerfile 的 Fund 容器，代码工作目录为 `/app`，迁移脚本位于 `/app/migrations`，业务库挂载为 `/app/data/fund_manager.db`。完成备份和目标路径确认后，可在仓库根执行相应单个迁移：

```bash
docker compose exec -T backend python /app/migrations/006_migrate_admin_auth_user_id.py
docker compose exec -T backend python /app/migrations/007_make_admin_password_nullable.py
```

上面是按需操作示例，不是每次部署必跑指令；停写窗口、旧版本是否包含脚本及升级顺序按部署计划确定。容器尚不可用时，在隔离迁移容器内执行同一版本脚本并挂载明确的目标库。

## 安全步骤

1. 一致性备份并记录路径、schema、关键表记录数和部署 SHA。
2. 在备份副本演练迁移，验证数据、索引和约束保留。
3. 明确 006/007 对实际挂载库生效，避免迁移了空库或另一份开发库。
4. 迁移后执行数据库完整性检查，并测试全新 SSO 用户首次登录和旧业务用户数据。
5. 回滚先保留迁移后的新增数据；代码回滚不会自动还原 schema。

自动化覆盖见 `tests/test_admin_password_nullable_migration.py`。[部署指南](../../docs/DEPLOY.md)与 [infra 数据保护](https://github.com/zephyrli-coding/compound-infra/blob/main/docs/operations/data-persistence-and-backup.md)提供发布上下文。
