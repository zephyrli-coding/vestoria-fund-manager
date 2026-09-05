# Fund safety and UX iterations

Status: implemented locally, NOT yet verified or deployed.
Scope: vestoria-fund-manager only. No database migration or production data changes.

## Round 1: accounting safety and reliable requests

- Business operations commit fund, investor, history and operation changes together.
- JSONL imports are atomic per file, including creation of the fund itself.
- ZIP imports retain per-file results: a failed file does not undo other successful files.
- Existing create/append import modes and JSONL fields remain supported.
- Append imports reject currency mismatches and warn about different fund names.
- Self-transfers, non-finite/non-positive inputs, invalid dates and zero-share operations are rejected.
- Investment/redemption history captures balances and total shares before mutation.
- Imported trade NAV determines transaction amounts; remaining balances use the current fund NAV.
- Repeated NAV updates on the same date replace that date's investor snapshots.
- Fund start-date edits are persisted.
- List totals respect tag/date filters, and recipient transfers appear in investor history.
- Existing collection screens load all pages instead of silently truncating at 20/50 records.
- Fund/investor list enrichment uses grouped queries rather than one query per item.
- Aggregate charts retain opening balances from snapshots preceding the requested range.
- JSON, validation, permission, network and non-JSON server errors share one request handler.
- Failed writes propagate to forms instead of allowing false-success navigation or dismissal.
- The dedicated import page uses the existing BFF/CSRF request path.

## Round 2: focused UX improvements

- Viewer mode is visible; write buttons and create/edit routes respect existing permissions.
- Existing permission policy is unchanged, including editor-only batch export via POST.
- Single-fund GET exports remain available to viewers.
- Trade/NAV forms show estimates before submission.
- Existing automatic capping at available shares/balance is retained and explicitly explained.
- Failed trade submissions keep form inputs and show the request error.
- Main monetary summaries retain two decimal places; trade quantities keep six-decimal precision.
- Trade form default dates use the browser's local calendar date.
- Cross-currency totals explicitly state the existing fixed USD/CNY 6.9 estimate.
- Investor profit displays and chart tooltips use the fund currency.
- Negative-only return charts receive correct axis padding.

## Compatibility boundaries

- Existing pages, routes, accounting formulas and file formats are not replaced.
- Storage remains SQLite/Float with six-decimal calculations; no Decimal migration.
- Existing historical accounting errors are not backfilled automatically.
- Appending the same import twice is still not idempotent; the UI warns before appending.
- No live exchange-rate feed, new role model or cross-platform authentication changes.
- Loading every page is the compatibility-first fix for the current small data set,
  not a substitute for a future independent summary API and paginated UI.
- Atomic writes prevent partial commits, but do not yet add optimistic concurrency
  control for simultaneous writers.

## Required local validation before any deployment

Not run in this iteration. Obtain approval to run local tests/Docker regression.

- Existing backend/frontend checks and local Docker build/start.
- Investment, redemption, transfer and NAV success cases; full redemption and amount capping.
- Self-transfer, invalid date/number and sub-precision amount rejection.
- Inject a failure after an intermediate write and confirm complete rollback.
- Metadata-only JSONL, create/append imports, failed-line rollback and mixed-result ZIP.
- Multiple NAV updates and new investors added between updates in the same import.
- More than 20 funds/investors and 50 operations, including transfer recipients.
- Tag/date-filtered totals and chart opening balances.
- Viewer/editor flows, deep links, import CSRF and failed/non-JSON responses.
- Mobile forms, negative returns, USD/CNY labels and local calendar dates.

## Later iterations

- Import preflight/dry-run, duplicate detection and idempotency keys.
- Actor-level audit records, reconciliation and concurrency conflict protection.
- Dedicated summary endpoint, visible history pagination and request-specific loading states.
- Explicit performance-metric definitions, followed by TWR/XIRR where appropriate.
- Precision/migration strategy, configurable FX sources and historical currency policy.
- Gradual extraction of large detail-page components after behavior is covered by regression checks.

Release sequence remains: local development -> local Docker regression -> review/merge ->
explicit deployment approval -> SG01 deployment -> production verification.

## 后续本地验收补充

前序安全修复已纳入统一 UI 实施并保留。本地隔离 Docker 的 BFF、迁移及账务安全套件共 19 项通过，真实浏览器共 25 组场景通过，包含原子导入、历史净值回放、105 名投资者跨页、交易预览、只读权限及子路径登录。实际套件、截图与未覆盖边界见 [统一 UI 与验收记录](2026-09-06-unified-ui.md)。本轮未推送或部署生产。
