# 数据库迁移脚本

此目录包含数据库迁移脚本，按创建时间编号执行。

## 文件列表

| 编号 | 文件名 | 描述 | 创建时间 |
|------|--------|------|----------|
| 001 | migrate_data.py | 从 pickle 迁移数据到 SQLite | 2024-03-03 |
| 002 | migrate_currency.py | 添加基金币种支持 (CNY/USD) | 2024-03-14 |
| 003 | migrate_investor_cumulative.py | 初始化投资者累计投入/赎回字段 | 2024-03-14 |
| 004 | migrate_investor_snapshots.py | 生成投资者历史收益快照 | 2024-03-14 |

## 使用方法

```bash
# 进入后端目录
cd backend

# 激活虚拟环境
source .venv/bin/activate

# 运行特定迁移脚本
python migrations/003_migrate_investor_cumulative.py

# 或在 backend 目录下直接运行
python -m migrations.003_migrate_investor_cumulative
```

## 注意事项

1. 迁移脚本按编号顺序执行
2. 执行前请备份数据库
3. 每个脚本支持幂等执行（可重复运行）
