# 測試用例文檔

## 概述

本文檔列出 5 個即時阻塞功能的測試用例，包含單元測試與整合測試。

---

## 功能 1: 配額狀態查詢 API

### 單元測試 (Unit Tests)

#### `test_calculate_target_count_all_friends()`
**測試目標**: 計算所有好友數量
**測試數據**:
```python
target_type = "all_friends"
target_filter = None
```
**預期結果**: 返回資料庫中所有 Member 數量

#### `test_calculate_target_count_filtered_include()`
**測試目標**: 計算包含特定標籤的會員數
**測試數據**:
```python
target_type = "filtered"
target_filter = {"include": ["VIP", "常客"]}
```
**預期結果**: 返回同時擁有「VIP」和「常客」標籤的會員數

#### `test_calculate_target_count_filtered_exclude()`
**測試目標**: 計算排除特定標籤的會員數
**測試數據**:
```python
target_type = "filtered"
target_filter = {"exclude": ["黑名單"]}
```
**預期結果**: 返回不擁有「黑名單」標籤的會員數

#### `test_calculate_target_count_combined()`
**測試目標**: 計算包含與排除組合條件的會員數
**測試數據**:
```python
target_type = "filtered"
target_filter = {
    "include": ["VIP"],
    "exclude": ["已退訂"]
}
```
**預期結果**: 返回擁有「VIP」但不擁有「已退訂」標籤的會員數

### 整合測試 (Integration Tests)

#### `test_quota_status_api_success()`
**測試目標**: 配額查詢 API 成功回傳
**請求**:
```http
POST /api/v1/messages/quota
Content-Type: application/json

{
  "target_type": "all_friends",
  "target_filter": null
}
```
**預期響應** (200):
```json
{
  "estimated_send_count": 1000,
  "available_quota": 5000,
  "is_sufficient": true,
  "quota_type": "basic",
  "monthly_limit": 10000,
  "used": 5000,
  "quota_consumption": 1000
}
```

#### `test_quota_status_api_insufficient()`
**測試目標**: 配額不足時正確回傳
**模擬數據**: 預計發送 6000 人，可用配額 5000
**預期結果**: `is_sufficient = false`

#### `test_quota_status_api_line_api_failure()`
**測試目標**: LINE API 失敗時的降級處理
**模擬**: LineAppAdapter.get_quota() 拋出異常
**預期結果**: 回傳默認配額資訊（type="none", remaining=0）

---

## 功能 2: 訊息模板庫系統

### 單元測試 (Unit Tests)

#### `test_list_library_templates_sorted_by_usage()`
**測試目標**: 瀏覽模板庫並按使用次數排序
**測試數據**:
```python
# 創建 3 個模板: usage_count = 10, 5, 20
```
**預期結果**: 返回順序 [20, 10, 5]

#### `test_list_library_templates_sorted_by_created_at()`
**測試目標**: 瀏覽模板庫並按創建時間排序
**預期結果**: 最新的模板排在前面

#### `test_copy_template_success()`
**測試目標**: 成功複製模板
**測試步驟**:
1. 創建源模板（ID=1, usage_count=5）
2. 調用 `copy_template(template_id=1)`
3. 檢查新模板的 `source_template_id == 1`
4. 檢查源模板的 `usage_count == 6`

#### `test_copy_template_not_found()`
**測試目標**: 複製不存在的模板
**測試數據**: `template_id = 99999`
**預期結果**: 拋出 `ValueError("模板不存在: ID=99999")`

#### `test_add_to_library()`
**測試目標**: 加入模板庫
**測試步驟**:
1. 創建模板（is_in_library=False）
2. 調用 `add_to_library(template_id, add=True)`
3. 檢查 `is_in_library == True`

#### `test_remove_from_library()`
**測試目標**: 移除模板庫
**測試步驟**:
1. 創建模板（is_in_library=True）
2. 調用 `add_to_library(template_id, add=False)`
3. 檢查 `is_in_library == False`

### 整合測試 (Integration Tests)

#### `test_template_library_api_list()`
**測試目標**: 瀏覽模板庫 API
**請求**:
```http
GET /api/v1/templates/library?sort_by=usage_count
```
**預期響應** (200):
```json
[
  {
    "id": 1,
    "name": "歡迎訊息模板",
    "template_type": "FlexMessage",
    "is_in_library": true,
    "usage_count": 20,
    "storage_type": "database",
    "created_at": "2025-11-15T10:00:00Z"
  }
]
```

#### `test_template_library_api_copy()`
**測試目標**: 複製模板 API
**請求**:
```http
POST /api/v1/templates/1/copy
```
**預期響應** (200):
```json
{
  "id": 2,
  "name": "歡迎訊息模板 (副本)",
  "source_template_id": 1,
  "created_at": "2025-11-15T10:05:00Z"
}
```

#### `test_template_library_api_copy_not_found()`
**測試目標**: 複製不存在的模板
**請求**:
```http
POST /api/v1/templates/99999/copy
```
**預期響應** (404):
```json
{
  "detail": "模板不存在: ID=99999"
}
```

#### `test_template_library_api_toggle()`
**測試目標**: 切換模板庫狀態 API
**請求**:
```http
PUT /api/v1/templates/1/library
Content-Type: application/json

{
  "add_to_library": true
}
```
**預期響應** (200):
```json
{
  "id": 1,
  "is_in_library": true,
  ...
}
```

---

## 功能 3: Flex Message 處理邏輯

### 單元測試 (Unit Tests)

#### `test_create_message_with_flex_json()`
**測試目標**: 創建訊息時正確存儲 Flex JSON
**測試數據**:
```python
flex_message_json = '{"type": "bubble", "body": {...}}'
```
**預期結果**: `message.flex_message_json == flex_message_json`

#### `test_send_message_parse_flex_json()`
**測試目標**: 發送訊息時正確解析 Flex JSON
**測試步驟**:
1. 創建訊息（含 flex_message_json）
2. 調用 `send_message(message_id)`
3. 檢查解析後的 JSON 格式正確

#### `test_send_message_invalid_flex_json()`
**測試目標**: Flex JSON 格式錯誤時拋出異常
**測試數據**: `flex_message_json = 'invalid json'`
**預期結果**: 拋出 `ValueError("Flex Message JSON 格式錯誤")`

### 整合測試 (Integration Tests)

#### `test_create_message_api_with_flex_json()`
**測試目標**: 創建訊息 API 接收 Flex JSON
**請求**:
```http
POST /api/v1/messages
Content-Type: application/json

{
  "flex_message_json": "{\"type\": \"bubble\", ...}",
  "target_type": "all_friends",
  "schedule_type": "immediate",
  "notification_text": "新訊息通知"
}
```
**預期響應** (200): 訊息創建成功

#### `test_send_message_api_with_flex_json()`
**測試目標**: 發送訊息 API 正確轉發 Flex JSON
**測試步驟**:
1. 創建訊息（含 flex_message_json）
2. 調用發送 API
3. 驗證 LINE API 收到正確的 Flex Message

---

## 功能 4: 排程發送與時區轉換

### 單元測試 (Unit Tests)

#### `test_create_message_with_scheduled_at()`
**測試目標**: 創建排程訊息
**測試數據**:
```python
schedule_type = "scheduled"
scheduled_at = datetime(2025, 2, 1, 2, 0, 0, tzinfo=timezone.utc)  # UTC
```
**預期結果**:
- `message.send_status == "排程發送"`
- `message.scheduled_datetime_utc == scheduled_at`

#### `test_schedule_campaign()`
**測試目標**: Scheduler 排程任務
**測試步驟**:
1. 調用 `scheduler.schedule_campaign(campaign_id=1, scheduled_at=...)`
2. 檢查任務已加入排程器
3. 檢查任務 ID 為 "campaign_1"

#### `test_cancel_campaign()`
**測試目標**: 取消排程任務
**測試步驟**:
1. 先排程任務
2. 調用 `scheduler.cancel_campaign(campaign_id=1)`
3. 檢查任務已移除

### 整合測試 (Integration Tests)

#### `test_create_scheduled_message_api()`
**測試目標**: 創建排程訊息 API
**請求**:
```http
POST /api/v1/messages
Content-Type: application/json

{
  "flex_message_json": "{...}",
  "target_type": "all_friends",
  "schedule_type": "scheduled",
  "scheduled_at": "2025-02-01T02:00:00Z"
}
```
**預期結果**: 訊息創建成功，狀態為「排程發送」

#### `test_scheduled_message_trigger()`
**測試目標**: 排程訊息正確觸發
**測試步驟**:
1. 創建排程訊息（scheduled_at = 1 秒後）
2. 等待 2 秒
3. 檢查訊息狀態更新為「已發送」

#### `test_scheduled_at_in_past()`
**測試目標**: 排程時間為過去時間的處理
**測試數據**: `scheduled_at = datetime(2020, 1, 1, 0, 0, 0)`
**預期結果**: 前端應驗證並拒絕（後端接受但不會觸發）

---

## 功能 5: 草稿管理機制

### 單元測試 (Unit Tests)

#### `test_create_draft_message()`
**測試目標**: 創建草稿訊息
**測試數據**:
```python
schedule_type = "draft"
```
**預期結果**: `message.send_status == "草稿"`

#### `test_update_draft_message()`
**測試目標**: 更新草稿訊息
**測試步驟**:
1. 創建草稿訊息
2. 調用 `update_message(message_id, flex_message_json="new json")`
3. 檢查 flex_message_json 已更新

#### `test_send_draft_message()`
**測試目標**: 發送草稿訊息
**測試步驟**:
1. 創建草稿訊息
2. 調用 `send_message(message_id)`
3. 檢查狀態更新為「已發送」

### 整合測試 (Integration Tests)

#### `test_draft_workflow_api()`
**測試目標**: 草稿完整流程 API
**測試步驟**:

1. **創建草稿**:
```http
POST /api/v1/messages
{
  "schedule_type": "draft",
  "flex_message_json": "{...}",
  "target_type": "all_friends"
}
```
預期: 返回草稿訊息（send_status="草稿"）

2. **編輯草稿**:
```http
PUT /api/v1/messages/1
{
  "flex_message_json": "{updated json}"
}
```
預期: 返回更新後的草稿

3. **發送草稿**:
```http
POST /api/v1/messages/1/send
```
預期: 返回發送成功（send_status="已發送"）

#### `test_draft_multiple_updates()`
**測試目標**: 草稿可重複編輯
**測試步驟**:
1. 創建草稿
2. 編輯草稿（第 1 次）
3. 編輯草稿（第 2 次）
4. 編輯草稿（第 3 次）
5. 發送草稿

**預期結果**: 所有操作成功，最終訊息內容為第 3 次編輯的內容

#### `test_draft_send_failure_handling()`
**測試目標**: 草稿發送失敗處理
**模擬**: LINE API 發送失敗
**預期結果**: 訊息狀態更新為「發送失敗」

---

## 測試環境設置

### 單元測試環境

```bash
# 安裝測試依賴
pip install pytest pytest-asyncio pytest-cov

# 執行單元測試
pytest tests/unit/ -v

# 生成測試覆蓋率報告
pytest tests/unit/ --cov=app --cov-report=html
```

### 整合測試環境

```bash
# 設置測試資料庫
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost/test_db"

# 執行整合測試
pytest tests/integration/ -v

# 執行所有測試
pytest tests/ -v
```

### 測試資料準備

#### Fixtures 建議

```python
# tests/conftest.py

@pytest.fixture
async def db_session():
    """測試資料庫 session"""
    # 創建測試資料庫連接
    # 返回 AsyncSession
    pass

@pytest.fixture
async def sample_member():
    """測試會員數據"""
    return Member(
        line_uid="U1234567890abcdef",
        name="測試會員",
        ...
    )

@pytest.fixture
async def sample_template():
    """測試模板數據"""
    return MessageTemplate(
        name="測試模板",
        template_type="FlexMessage",
        is_in_library=True,
        usage_count=10,
        ...
    )

@pytest.fixture
async def sample_flex_json():
    """測試 Flex Message JSON"""
    return json.dumps({
        "type": "bubble",
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [...]
        }
    })
```

---

## 測試覆蓋率目標

| 層級 | 目標覆蓋率 | 說明 |
|------|-----------|------|
| Service 層 | ≥ 90% | 核心業務邏輯 |
| API 層 | ≥ 80% | API 端點測試 |
| Model 層 | ≥ 70% | 資料模型驗證 |
| 整體 | ≥ 80% | 專案整體覆蓋率 |

---

## 測試執行計畫

### Phase 1: 單元測試 (1-2 天)
- [ ] 配額計算邏輯測試
- [ ] 模板庫服務測試
- [ ] 草稿管理邏輯測試
- [ ] 排程邏輯測試

### Phase 2: 整合測試 (1-2 天)
- [ ] API 端點測試
- [ ] 資料庫整合測試
- [ ] Scheduler 整合測試

### Phase 3: 端到端測試 (1 天)
- [ ] 完整使用流程測試
- [ ] 錯誤情境測試
- [ ] 性能測試

---

## 附錄: Mock 物件建議

### Mock LINE API

```python
@pytest.fixture
def mock_line_app_adapter(mocker):
    """Mock LINE API 調用"""
    mock = mocker.patch('app.adapters.line_app_adapter.LineAppAdapter')

    # Mock 配額查詢
    mock.get_quota.return_value = {
        "type": "basic",
        "monthly_limit": 10000,
        "used": 5000,
        "remaining": 5000
    }

    # Mock 預檢
    mock.preflight_check.return_value = {
        "ok": True,
        "remaining": 5000,
        "needed": 1000
    }

    # Mock 發送
    mock.send_campaign.return_value = {
        "ok": True,
        "sent": 1000,
        "failed": 0
    }

    return mock
```

### Mock Scheduler

```python
@pytest.fixture
def mock_scheduler(mocker):
    """Mock APScheduler"""
    mock = mocker.patch('app.services.scheduler.CampaignScheduler')
    mock.schedule_campaign.return_value = True
    mock.cancel_campaign.return_value = True
    return mock
```
