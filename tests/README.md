# Fund 测试说明

## 当前账号与迁移回归

在隔离的本地 Docker 测试容器中，将仓库根目录作为工作目录，设置 `PYTHONPATH=backend`，使用临时数据库与会话替身：

```bash
python -m pytest tests/test_bff_auth.py tests/test_admin_password_nullable_migration.py
```

`test_bff_auth.py` 覆盖 callback 不暴露 token、邮箱/角色门禁、viewer 只读与 editor 的 CSRF 校验。`test_admin_password_nullable_migration.py` 覆盖旧 admins 表数据保留及 SSO 用户空密码插入。

这组测试不等于所有业务测试或真实 OAuth 浏览器验收。Fund 生产镜像仅复制 backend，根 tests 需要在测试容器单独提供。

## 历史脚本

`test_api.py`、`test_case_1.py`、`test_cases_comprehensive.py` 及其他独立脚本包含旧接口/登录假设。运行前先适配 BFF、核对服务地址及清理逻辑，只能使用可丢弃测试数据，不得连接生产或日常个人数据库。

## 业务场景样本

- [生命周期与收益分配](cases/01_fund_lifecycle_profit_distribution.md)
- [复杂转让](cases/02_complex_transfer_scenarios.md)
- [亏损与回本](cases/03_loss_recovery_analysis.md)
- [高频一致性](cases/04_high_frequency_consistency.md)
- [分红与拆分模拟](cases/05_dividend_split_simulation.md)

这些是测试设计，不是已通过证明，也不代表所有模拟场景都有独立产品功能。涉及写操作需 editor 或全局管理员，且邮箱已验证。

## 发布验收

前端构建、实际登录/退出、深层路由、新用户首次映射、角色撤销和业务冒烟遵循 [infra 开发流程](https://github.com/zephyrli-coding/compound-infra/blob/main/docs/development/README.md)。历史报告保留在 docs/dev_logs，不改写为当前测试结果。
