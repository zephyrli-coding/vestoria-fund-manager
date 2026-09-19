# Fund USD/CNY 估值修正

范围：本地开发与测试。分支 `fix/data-terminal-fx-valuation`；本轮未部署生产。原有未提交的 `2026-09-17-currency-unit-diagnosis.md` 保持原样。

## 配置与接口

在 Fund 根目录私有 `.env` 配置：

```dotenv
DATA_TERMINAL_API_URL=http://data-terminal-backend:8000/api/v1
DATA_TERMINAL_API_KEY=<具有 read scope 的 Data Terminal API key>
DATA_TERMINAL_TIMEOUT_SECONDS=8
FX_CACHE_TTL_SECONDS=300
```

公网 API base 示例为 `https://vestoria.mr-strawberry.com/data/api/v1`。密钥只注入 Fund 后端，通过 `X-API-Key` 调用 `/exchange-rates/latest?base=USD&quote=CNY` 和 `/exchange-rates?base=USD&quote=CNY&limit=10000`，不传给浏览器、不放进 VITE 变量、不记录日志、不跟随重定向。此实现使用个人 API key，不是 Data 的 X-Service-Token 内部接口。更改 `.env` 后需重建配置对应的 backend 容器，单纯 restart 不会更新容器环境。

后端成功结果缓存 300 秒；失败退避 60 秒，避免每个页面请求反复调用上游。最近完整成功快照原子写入 `/app/data/fx-rates-cache.json`，容器重建后保留；此文件不进入 Git。接口失效、超时或数据无效时使用缓存并显式警告；没有缓存时返回缺失值，不使用 6.9 或零值代替。超过 4 个自然日的参考汇率也标记陈旧。历史接口返回达到 10,000 条上限时视为可能截断，拒绝覆盖完整缓存，后续扩展应实现分段读取。

Fund 新增受现有 BFF 权限保护的 `GET /api/v1/funds/valuation/current?tag=...`。返回每只基金的 CNY/USD 展示金额、对应汇总、原币小计，以及来源、日期、缓存与错误状态。聚合历史接口继续提供 `balance`（CNY）及 `balance_usd`，新增汇率状态、逐快照采用的汇率日期和缺失日期；缺失换算值为 null。

## 金额口径

- 总览 CNY/USD 开关表示全部筛选基金的展示币种，统一作用于当前总额、分布和基金估值；不再过滤掉另一币种。
- 当前估值：USD→CNY 乘汇率，CNY→USD 除汇率。Decimal 计算，每只基金按半入保留 2 位小数再合计，使总额与明细一致。原币账本和份额不变。
- 历史曲线保留快照日期与前值填充余额；每个日期取当日或此前最近汇率，不用未来汇率回填。没有早期汇率时显示缺口；曲线不增加未发生的账务快照。当前总额与历史终点可因净值/汇率日期不同而不同，页面说明此区别。
- 基金列表跨币种按统一 CNY 估值排序，单币种按原币金额排序；缺少汇率时跨币种排序禁用，已选该排序时退回成立日期顺序。
- 基金详情、投资者、申赎和流水继续显示原币；录入单位标为元/美元。已有账务记录的基金禁止通过元数据修改币种；导入原有的币种一致性检查保留。
- 图表标记币种与“万”的单位，日期轴保留年份；非负曲线不再生成负轴下限。长金额/六位份额保持单行，按容器宽度调整字号；接近零的金额不显示 `-0.00`。

## 本地验证

- 后端 42 项通过：FX 真实 HTTP 契约替身、乘除方向、历史周末前值/禁止未来回填、缺失/无效汇率、超时、401/403/429/503/重定向、持久缓存、总额明细一致、币种修改保护，以及既有账务/BFF/旧库回归。测试使用一次性容器和隔离数据库。
- 前端 `tsc -b && vite build` 及前后端 Docker 构建通过。镜像只替换本地 Fund backend/frontend。
- 本地 Data 数据库原来没有 FX 历史。经现有 ECB 获取器和本地代理导入 2024-01-02 至 2026-09-18 的 694 条真实 CNY 记录。最初 2000 年至今的请求超时；缩小为覆盖全部本地基金历史的范围后成功。
- 通过已登录的本地 Data 账号创建只读联调 key，并直接写入 Fund 私有 `.env`；有效期 365 天，可在本地 Data「API 接入」撤销或轮换。明文不写入文档/报告。
- 本地数据库备份：infra 的 gitignored `backups/fund-fx-local-20260919/`。基金、历史、投资者、操作、收益快照 5 张业务表与备份逐行哈希一致。
- 桌面/手机浏览器结果与截图：工作区 `human-docs/research-report/fund-fx-local-2026-09-19/`。具体断言以该目录 `acceptance.json` 为准，截图包含私人业务信息，不提交到源码仓库。

此轮不修改 Data 源码、不变更账本 schema、不修改或部署生产。生产接入仍需单独配置合适的密钥、URL、备份和部署验收。
