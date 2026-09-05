# Fund 统一 UI 与本地验收

状态：已实现并完成本地验收。本轮未提交、推送、创建 PR 或部署生产。

工作分支：`feat/fund-unified-ui`。本记录覆盖统一 UI 实施，并延续 [前序安全与体验迭代](2026-09-05-fund-safety-ux.md)。

## 范围与边界

- 只修改 Fund 仓库；共享 Auth、其他业务仓库、基础设施配置与设计参考没有改动。
- 参考 `compound-infra/design/unified-ui-v1/` 的统一视觉规范，落地到真实 React 应用，而不是替换为静态原型。
- 保留真实 API、BFF 会话、角色授权、账务算法及 JSONL/ZIP 格式；不添加模拟行情、模拟收益或角色切换开关。
- 保留前序事务原子性、输入校验、分页完整性、历史筛选和错误传播修复。
- 使用独立 Docker 数据与 Redis 卷；不挂载原有业务 `data/`，不连接 sg01 或生产数据库。

## 已完成

| 模块 | 实际变更 | 保留的能力 |
|---|---|---|
| 工作区 | 统一侧栏、顶栏、产品入口、账号入口、手机导航 | 真实用户、退出统一账号、已有路由及子路径 |
| 基金总览 | 原币种资产卡片、真实曲线、资产分布、最近操作 | 标签筛选、CNY/USD 视图、原有跨币种估算 |
| 基金列表 | 搜索、币种/标签筛选、排序、分页、清晰操作入口 | 创建、编辑、详情、导入与批量导出 |
| 基金详情 | 概览/投资者/历史视图、统一指标与图表、复制数值 | 净值/资产/份额曲线、日期筛选、完整记录导出 |
| 投资者 | 搜索、分页、直接详情、现金流与收益口径说明 | 添加、申购、赎回、转让、收益快照、转入/转出历史 |
| 交易表单 | 共用真实表单、提交锁、预览、明确错误、失败保留输入 | 原操作日期、六位份额精度、原有超额处理规则 |
| 数据管理 | 全局与基金内入口、确认页、逐文件结果 | JSONL 新建/追加、ZIP 导入、单基金与批量导出 |
| 权限与登录 | 只读按钮、编辑路由保护、明确邮箱/授权提示 | 后端授权约束、HttpOnly 会话、全局退出 |

## 计算与数据口径未变

- CNY、USD 资产分别展示；原固定汇率 `1 USD = 6.9 CNY` 只用于已有跨币种估算，并明确标注非实时汇率。
- 累计收益仍为“当前份额 × 当前净值 + 累计赎回 - 累计投入”；收益率不是年化、TWR 或 XIRR。
- 更新净值仍以基金总资产与总份额计算；同日重复更新仍替换当天快照，并保留操作历史。
- 回放导入继续遵循记录中的 `nav_at_op`，不会擅自改成当前净值。追加历史申购对当前估值的影响，可能不同于历史现金金额。
- JSONL 按文件原子提交；ZIP 按每个 JSONL 分别提交或回滚，不把整个压缩包误报成全部成功。
- 单基金 JSONL 导出仍允许 Viewer；现有批量 ZIP POST 仍要求 Editor，不在 UI 迭代中擅自扩大权限。
- 本轮 UI 没有增加数据库 schema migration，也没有替换业务记账算法。

## 本地环境

| 用途 | 地址 / 配置 |
|---|---|
| Fund 根路径 | [http://localhost:20260](http://localhost:20260) |
| Fund 子路径验收 | [http://localhost:21260/fund/](http://localhost:21260/fund/) |
| 共享本地 Auth | [http://localhost:20263](http://localhost:20263) |
| 独立 Compose | `compose.ui-local.yml`，项目名 `fund-ui-local` |
| 独立数据 | Compose 内 `fund-ui-data`、`fund-ui-sessions` 卷 |
| 浏览器 | 现有独立 Chrome CDP `127.0.0.1:9223`，仅使用本任务隔离上下文 |

两个 Fund 前端及对应后端保持运行，页面中的演示记录都是本轮创建的隔离测试数据。原有 Fund 容器和原数据目录未重建或改写。

Auth 本地客户端需要包含以下精确回调：

- `http://localhost:20260/auth/callback`
- `http://localhost:21260/fund/auth/callback`

Auth 的现有启动 seed 可能覆盖临时回调。若重建共享 Auth，应先协调其维护任务恢复测试回调，不修改生产回调或降低验证规则。

## 验收结果

### 构建与后端

- 根路径与 `/fund/` 前端的 Docker TypeScript/Vite 构建通过。
- 后端隔离测试：**19 passed**，覆盖 BFF、既有迁移及本轮账务安全回归。
- 测试使用临时 SQLite、只读代码挂载和 `--network none`，不访问真实邮件服务。
- 仍有 9 条既有 Pydantic/SQLAlchemy 弃用警告；未借 UI 迭代升级依赖。

运行的测试文件：

- `tests/test_bff_auth.py`
- `tests/test_admin_password_nullable_migration.py`
- `tests/test_fund_safety.py`

### 浏览器

**25 组场景通过**，均使用真实本地 API 和隔离账号，不伪造成功响应。

| 脚本 | 通过组数 | 覆盖 |
|---|---:|---|
| `tests/ui/core.mjs` | 6 | 创建与日期、两名投资者申购、净值、转让、金额赎回、转入历史、详情快照、总览 |
| `tests/ui/access.mjs` | 6 | Viewer 只读/API 403/导出、编辑深链拦截、全局退出、Admin、邮箱未验证、无授权、子路径 OAuth 与深链 |
| `tests/ui/data.mjs` | 8 | 真实 JSONL 下载和回放、追加历史净值、失败不落半份数据、真实 ZIP 上传/下载、逐文件结果、编辑、键入名称删除 |
| `tests/ui/resilience.mjs` | 5 | 非 JSON 500、输入保留与提交锁、105 名投资者、历史分页/筛选、七页响应式布局、手机导航/弹窗 |

浏览器核心交易断言：申购、转让、赎回及净值更新完成后，测试基金总资产 `18,850`、总份额 `14,500`、净值 `1.3`。后续导入测试追加的是独立测试操作，不将演示库最终余额误当成此阶段断言。

布局覆盖七个实际页面的 `1440 / 390 / 320 px` 视口，没有页面级横向溢出；宽表格在容器内部滚动。手机抽屉 Escape 关闭后恢复焦点；交易弹窗可见、可取消。核心与韧性回归没有捕获到页面运行时异常。

500 用例仅在自己的测试标签页拦截一次请求，返回 `Internal Server Error`；确认页面展示可读错误、保留输入、不误报成功和不写入数据，随后解除拦截。

### 回归中修复的问题

1. 修复前序页面字符串替换造成的 TSX 结构破损，保留已有安全改动。
2. 修复注销竞态：清空业务登录状态后，登录页自动 OAuth 曾抢先覆盖全局退出跳转。新增 `isLoggingOut` 过渡状态阻止自动登录，真实注销复测通过。
3. 统一回调错误解析：邮箱未验证和无授权均提供真实错误及账号中心入口，不再只显示“登录失败”。
4. 测试驱动补充可点击性检查、动画稳定等待及自己标签页的激活，避免后台 Chrome 导致假失败和截取响应式过渡帧。

## 复跑

仅在这套专用本地测试库运行。脚本会创建、修改和删除带 UI 回归标识的测试记录；不要改地址后对生产执行。

准备条件：共享本地 Auth 已启动、上述回调已注册、独立 CDP Chrome 已启用、Node 22+ 可用。浏览器 fixture 凭据位于仓库外 `/private/tmp/fund-ui-credentials.json`，权限为 `0600`，由本地 Auth 测试准备，不写入 Git。

`users` 数组顺序为：已验证 Editor、已验证 Viewer、未验证 Editor、全局 Admin、已验证但无 Fund 授权账号。

```sh
docker compose -f compose.ui-local.yml --profile prefix build
docker compose -f compose.ui-local.yml --profile prefix up -d

docker build -f tests/Dockerfile.ui -t fund-ui-local:tests .
docker run --rm --network none \
  -e DATABASE_URL=sqlite:////tmp/fund-ui-tests.db \
  -v "$PWD/backend:/workspace/backend:ro" \
  -v "$PWD/tests:/workspace/tests:ro" \
  fund-ui-local:tests

NO_PROXY=localhost,127.0.0.1 node tests/ui/core.mjs
NO_PROXY=localhost,127.0.0.1 node tests/ui/access.mjs
NO_PROXY=localhost,127.0.0.1 node tests/ui/data.mjs
NO_PROXY=localhost,127.0.0.1 node tests/ui/resilience.mjs
```

依次运行浏览器脚本：核心脚本建立测试基金状态，后续脚本复用该状态。下载与运行状态保存在 `/private/tmp/fund-ui-*`，每次导出使用独立下载目录。截图写入本仓库的 `docs/iterations/screenshots/unified-ui/`。

## 截图

- [桌面总览](screenshots/unified-ui/overview-desktop.png)
- [桌面基金详情](screenshots/unified-ui/fund-detail-desktop.png)
- [手机总览](screenshots/unified-ui/overview-mobile.png)
- [手机基金详情](screenshots/unified-ui/fund-detail-mobile.png)
- [手机交易预览](screenshots/unified-ui/trade-preview-mobile.png)
- [可读错误与输入保留](screenshots/unified-ui/operation-error-desktop.png)
- [邮箱未验证提示](screenshots/unified-ui/unverified-access.png)
- [无授权提示](screenshots/unified-ui/ungranted-access.png)

## 未覆盖与后续边界

- 未部署 sg01，未验证生产 HTTPS、真实生产反向代理或生产数据。
- 移动端为 Chrome 设备/视口模拟，未做 iOS Safari、Android 真机或其他浏览器验收。
- 未调用真实邮件发送、未做长期会话耐久、高并发或超大导入压测。
- 没有声称执行仓库所有历史测试脚本；实际套件与命令以上述清单为准。
- 后续如要上线，应另行安排生产备份、部署、生产账号及路径冒烟，不把本地验收等同于生产已上线。
