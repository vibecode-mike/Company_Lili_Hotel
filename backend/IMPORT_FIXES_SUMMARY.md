# API 端點調整 - 導入錯誤修復報告

## ✅ 已完成修復（P0 阻塞性問題）

### 1. Campaign 模型向後兼容性修復

**問題**：多個服務層文件（linebot_service.py, campaign_service.py, scheduler.py）無法導入 `Campaign` 和 `CampaignStatus`

**修復內容**：`/data2/lili_hotel/backend/app/models/campaign.py`

1. **添加 CampaignStatus 枚舉**
   ```python
   class CampaignStatus(str, Enum):
       DRAFT = "草稿"
       SCHEDULED = "排程發送"
       SENT = "已發送"
       FAILED = "發送失敗"
   ```

2. **創建 Campaign 別名**
   ```python
   Campaign = Message
   CampaignRecipient = MessageRecipient
   ```

3. **添加向後兼容屬性到 Message 類別**
   - `title` → `message_content`
   - `status` → `send_status` (with enum conversion)
   - `sent_at` → `send_time`
   - `sent_count` → `send_count`
   - `target_audience` → `target_type` + `target_filter` (complex mapping)
   - `scheduled_at` → `scheduled_date` + `scheduled_time` (datetime combination)

**結果**：✅ linebot_service.py, campaign_service.py, scheduler.py 可成功導入

---

### 2. usage_monitor 導入路徑修復

**問題**：linebot_service.py 動態導入 line_app/app.py 時，app.py 無法找到同目錄的 usage_monitor 模組

**修復內容**：`/data2/lili_hotel/backend/app/services/linebot_service.py`

```python
# 將 line_app 目錄添加到 sys.path
line_app_str = str(line_app_path)
if line_app_str not in sys.path:
    sys.path.insert(0, line_app_str)
```

**結果**：✅ LINE Bot service 成功初始化

---

### 3. Tag 模型向後兼容性修復

**問題**：tags.py 無法導入 `TagType`、`TagSource`，且引用已移除的 `MemberTagRelation`

**修復內容**：`/data2/lili_hotel/backend/app/models/tag.py`

1. **添加枚舉定義**
   ```python
   class TagType(str, Enum):
       MEMBER = "member"
       INTERACTION = "interaction"

   class TagSource(str, Enum):
       CRM = "CRM"
       PMS = "PMS"
       SURVEY = "問券"
       MANUAL = "後台自訂"
       MESSAGE = "訊息模板"
   ```

2. **添加向後兼容屬性到 MemberTag 和 InteractionTag**
   - `name` → `tag_name`
   - `source` → `tag_source`
   - `type` → 返回對應的 TagType 枚舉值
   - `description` → 返回空字串（新設計中不存在）
   - `member_count` → `trigger_member_count`
   - `campaign_id` → 返回 None（InteractionTag 中不存在）

3. **更新 tags.py 中的查詢邏輯**
   - 移除 `MemberTagRelation` 引用
   - 直接查詢 `MemberTag` 表，使用 `tag_name` 而非 `tag_id`

**修復位置**：`/data2/lili_hotel/backend/app/api/v1/tags.py:464-481`

```python
# OLD: 查詢 MemberTagRelation
from app.models.tag import MemberTagRelation
member_count_result = await db.execute(
    select(func.count())
    .select_from(MemberTagRelation)
    .where(and_(
        MemberTagRelation.tag_id == tag['id'],
        MemberTagRelation.tag_type == TagType.MEMBER,
        MemberTagRelation.tagged_at >= date_start,
        MemberTagRelation.tagged_at <= date_end
    ))
)

# NEW: 直接查詢 MemberTag
member_count_result = await db.execute(
    select(func.count())
    .select_from(MemberTag)
    .where(and_(
        MemberTag.tag_name == tag['name'],
        MemberTag.tagged_at >= date_start,
        MemberTag.tagged_at <= date_end
    ))
)
```

**結果**：✅ tags.py 可成功導入

---

### 4. members.py 的 MemberTagRelation 引用修復

**問題**：已在前一階段完成（見 members.py.backup）

**修復內容**：`/data2/lili_hotel/backend/app/api/v1/members.py`

- 移除 `MemberTagRelation` 和 `TagType` 導入
- 添加 `MemberInteractionRecord` 導入
- 更新所有標籤查詢邏輯使用新的單表設計
- 標籤篩選改用 `tag_name` 而非 `tag_id`

**結果**：✅ members.py 可成功導入

---

## 📊 測試結果

### 模型層測試

```bash
✅ Successfully imported Campaign, CampaignStatus, CampaignRecipient
✅ Campaign is Message: Message
✅ CampaignStatus values: ['草稿', '排程發送', '已發送', '發送失敗']
✅ CampaignRecipient is MessageRecipient: MessageRecipient

✅ Successfully imported TagType and TagSource
✅ TagType values: ['member', 'interaction']
✅ TagSource values: ['CRM', 'PMS', '問券', '後台自訂', '訊息模板']
```

### 服務層測試

```bash
✅ linebot_service.py imported successfully
✅ campaign_service.py imported successfully
✅ scheduler.py imported successfully
```

### API 層測試

```bash
INFO:app.services.linebot_service:✅ LINE Bot service initialized successfully
✅ members.py and campaigns.py imported successfully
✅ tags.py imported successfully
✅ All API modules imported successfully
```

---

## 🎯 向後兼容策略總結

### 設計原則

1. **別名模式**：`Campaign = Message`, `CampaignRecipient = MessageRecipient`
2. **屬性映射**：使用 `@property` 和 `@setter` 映射舊欄位名稱到新欄位
3. **枚舉保留**：保留 `CampaignStatus`, `TagType`, `TagSource` 枚舉用於 API 兼容
4. **智能轉換**：自動在枚舉值和資料庫字串值之間轉換

### 欄位映射表

#### Campaign/Message 欄位映射

| 舊欄位名 | 新欄位名 | 轉換邏輯 |
|---------|---------|---------|
| `title` | `message_content` | 直接映射 |
| `status` | `send_status` | 枚舉 ↔ 字串轉換 |
| `sent_at` | `send_time` | 直接映射 |
| `sent_count` | `send_count` | 直接映射 |
| `target_audience` | `target_type` + `target_filter` | 結構化 JSON 組合 |
| `scheduled_at` | `scheduled_date` + `scheduled_time` | datetime 拆分/組合 |

#### Tag 欄位映射

| 舊欄位名 | 新欄位名 | 轉換邏輯 |
|---------|---------|---------|
| `name` | `tag_name` | 直接映射 |
| `source` | `tag_source` | 枚舉 ↔ 字串轉換 |
| `type` | (固定值) | MemberTag → MEMBER, InteractionTag → INTERACTION |
| `description` | (不存在) | 返回空字串 |
| `member_count` | `trigger_member_count` | 直接映射 |
| `campaign_id` | (不存在) | 返回 None |

---

## ⏳ 待處理事項（P1-P2）

### P1: line_app/app.py SQL 查詢調整

**狀態**：待處理

**說明**：line_app/app.py 中可能存在直接的 SQL 查詢引用 `campaigns` 表，需要更新為 `messages` 表

**影響**：不影響 API 啟動，但可能影響 LINE Bot 功能

---

### P2: 完整測試

**狀態**：待處理

**測試項目**：
- [ ] API 端點實際運行測試
- [ ] 群發訊息功能測試
- [ ] 標籤管理功能測試
- [ ] 會員管理功能測試
- [ ] LINE Bot 推播測試

---

## 📝 技術文檔參考

- 資料庫重構規格：`/data2/lili_hotel/backend/DATABASE_REDESIGN_SPEC.md`
- API 遷移狀態：`/data2/lili_hotel/backend/API_MIGRATION_STATUS.md`
- 模型定義：
  - `/data2/lili_hotel/backend/app/models/campaign.py`
  - `/data2/lili_hotel/backend/app/models/tag.py`

---

## 🎉 結論

所有 P0 阻塞性導入錯誤已成功修復，API 服務可以正常啟動。向後兼容層設計完善，允許現有 API 代碼在不修改的情況下繼續工作。下一步可以進行實際功能測試和優化。
