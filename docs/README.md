# Fund 文档索引

## 当前维护指南

| 文档 | 用途 |
|---|---|
| [项目 README](../README.md) | 产品、权限、启动与生产入口 |
| [API-DESIGN](API-DESIGN.md) | 业务 API 参考；认证段按 M6 更新，字段以目标版本 OpenAPI 为准 |
| [后端能力](BACKEND_CAPABILITIES.md) | 领域数据和计算能力 |
| [部署](DEPLOY.md) | 本地测试、SG01、数据保护 |
| [后端开发](../backend/README.md) | 后端入口和配置 |
| [前端开发](../frontend/README.md) | 构建、路径和会话边界 |
| [迁移](../backend/migrations/README.md) | 旧库兼容，特别是 006/007 |
| [测试](../tests/README.md) | 当前认证回归和旧脚本使用限制 |

## 设计与阶段记录

- [导入导出设计](DATA_IMPORT_EXPORT_DESIGN.md)：需求/设计，不代表所有格式已经支持。
- [前端设计稿](FRONTEND_DESIGN.md)：旧设计参考；旧登录表单、token store、分支不再适用。
- [导入导出任务记录](IMPORT_EXPORT_TODO.md)、[投资者快照任务记录](TODO_LIST.md)、[早期前端进度](../frontend/PROGRESS.md)：保留原阶段，不作为当前分支或发布状态。
- [测试报告 0](dev_logs/TEST_REPORT_0.md)、[问题记录 0](dev_logs/BUG_FIXES_0.md)、[修复记录 1](dev_logs/BUG_FIXES_1.md)：历史证据，不表示本次测试结果。
- [业务场景样本](../tests/README.md#业务场景样本)：用例设计不等于已通过报告。

跨服务账号计划和上线记录只维护在 [compound-infra](https://github.com/zephyrli-coding/compound-infra/blob/main/docs/README.md)，避免在本仓库复制另一份状态表。
