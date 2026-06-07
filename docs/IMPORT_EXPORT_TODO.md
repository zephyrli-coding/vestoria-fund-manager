# 数据导入导出功能 - TODO

## 当前分支
`feature/operation-import-export`

## 方案设计
JSONL 格式，第一行放基金元数据，后续行放操作记录：

```json
{"_type": "fund_meta", "name": "日富一日", "start_date": "2026-03-12", "currency": "USD"}
{"_type": "operation", "operation_type": "add_investor", "operation_date": "2026-03-12", "investor_name": "wff"}
{"_type": "operation", "operation_type": "invest", ...}
```

## 后端任务

### 1. 修改导出服务
- [x] 更新 `export_to_jsonl()` 方法
  - 第一行输出基金元数据（_type: fund_meta）
  - 后续行输出操作记录（_type: operation）
  - 包含字段：name, start_date, currency

### 2. 修改导入服务
- [x] 更新 `import_from_jsonl()` 方法
  - 解析第一行的基金元数据
  - 支持两种模式：
    - 有 target_fund_id：追加到现有基金
    - 无 target_fund_id：自动创建新基金

### 3. 修改 API 路由
- [x] 导出接口：`GET /funds/{id}/operations/export`
- [x] 追加导入：`POST /funds/{id}/operations/import`
- [x] 新建导入：`POST /funds/import`

## 前端任务（当前进行）

### 1. 基金列表页 (`/funds`)
- [ ] 添加「导入基金」按钮
- [ ] 点击后弹出文件选择框
- [ ] 上传 JSONL 文件
- [ ] 后端自动创建新基金
- [ ] 显示导入结果（成功/失败）

### 2. 基金详情页 (`/funds/{id}`)
- [ ] 添加「导出操作记录」按钮
- [ ] 点击后下载 JSONL 文件
- [ ] 可选：添加「导入追加」按钮（追加操作到当前基金）

## 文件位置

**后端：**
- `backend/app/services/operation_history_service.py`
- `backend/app/api/operation_history.py`

**前端：**
- `frontend/src/pages/Funds.tsx`（基金列表页）
- `frontend/src/pages/FundDetail.tsx`（基金详情页）

## 注意事项

1. 基金名称唯一性检查
2. 导入时币种默认值处理
3. 错误处理和用户提示
4. 大文件处理（如果操作记录很多）
