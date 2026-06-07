# 数据导入导出功能设计

## 需求分析

### 导出场景
1. **备份** - 完整导出所有数据
2. **分享** - 导出特定基金数据给他人
3. **分析** - 导出为 Excel 进行数据分析
4. **迁移** - 导出后导入到其他系统

### 导入场景
1. **恢复** - 从备份文件恢复数据
2. **迁移** - 从其他系统导入
3. **批量录入** - 通过 Excel 批量录入历史数据

## 数据模型

### 核心实体
1. **Fund** - 基金（基本信息、币种、净值等）
2. **Investor** - 投资者（份额、累计投入/赎回）
3. **Operation** - 操作记录（申购、赎回、转账、NAV更新）
4. **FundHistory** - 基金历史净值记录
5. **InvestorReturnSnapshot** - 投资者收益快照（可选导出）

## 功能设计

### 导出功能

#### 1. 导出格式
- **JSON** - 完整数据，保留所有字段和关系
- **CSV** - 表格形式，适合 Excel 编辑
- **Excel (.xlsx)** - 多 sheet，每个实体一个 sheet

#### 2. 导出范围
- **全部数据** - 所有基金、投资者、操作记录
- **单个基金** - 指定基金及其关联数据
- **时间范围** - 指定日期范围内的操作记录

#### 3. 导出选项
- 是否包含收益快照（占用空间较大）
- 是否包含基金历史净值
- 日期格式（ISO 8601 或本地化）

### 导入功能

#### 1. 导入模式
- **创建新模式** - 导入为新基金（基金名不能重复）
- **追加模式** - 向现有基金追加操作记录
- **覆盖模式** - 删除现有数据后导入（危险操作）

#### 2. 数据验证
- 基金名称唯一性
- 投资者名称唯一性（同一基金内）
- 日期格式验证
- 数值范围验证（份额、金额不能为负）
- 关联关系验证（操作记录中的投资者必须存在）

#### 3. 冲突处理
- **跳过** - 冲突数据跳过，继续导入其他
- **报错** - 遇到冲突立即停止
- **合并** - 智能合并（如投资者已存在则复用）

## API 设计

### 导出 API

```
POST /api/v1/export
```

请求体：
```json
{
  "format": "json" | "csv" | "excel",
  "scope": "all" | "fund",
  "fund_id": 1,  // scope=fund 时必填
  "options": {
    "include_snapshots": false,
    "include_history": true,
    "date_format": "iso"
  }
}
```

响应：文件下载

### 导入 API

```
POST /api/v1/import
Content-Type: multipart/form-data
```

请求参数：
- `file`: 上传的文件
- `format`: json | csv | excel
- `mode`: create | append | overwrite
- `conflict_resolution`: skip | error | merge

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "funds_imported": 1,
    "investors_imported": 3,
    "operations_imported": 10,
    "warnings": [],
    "errors": []
  }
}
```

## 数据库变更

不需要变更数据库 schema，复用现有模型。

## 实现步骤

1. **创建导出服务** (`app/services/export_service.py`)
   - 支持 JSON/CSV/Excel 导出
   - 按范围筛选数据

2. **创建导入服务** (`app/services/import_service.py`)
   - 解析不同格式
   - 数据验证
   - 冲突处理

3. **创建 API 路由** (`app/api/import_export.py`)
   - 导出接口
   - 导入接口

4. **前端页面**
   - 导出页面（选择格式、范围、选项）
   - 导入页面（上传文件、配置选项）

## 技术选型

- **Excel 处理**: `openpyxl` 或 `pandas`
- **CSV 处理**: Python 标准库 `csv`
- **JSON 处理**: Python 标准库 `json`
- **文件上传**: FastAPI `UploadFile`

## 安全考虑

1. 文件大小限制（最大 10MB）
2. 文件类型验证
3. 导入操作需要管理员权限
4. 敏感数据（如投资者姓名）在导出时可选脱敏
