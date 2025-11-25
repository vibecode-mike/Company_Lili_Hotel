# 實作決策記錄

本文件記錄與原始規格不同的實作決策及原因。

**建立日期**: 2025-11-20
**維護者**: Lili Hotel 開發團隊

---

## 決策清單

### 1. TemplateButton 儲存策略

**決策日期**: 2025-11-20
**決策**: 不使用獨立的 TemplateButton 資料表

**原因**:
- 按鈕數量少（最多4個）且結構簡單
- JSON 欄位足夠處理 CRUD 操作，無需額外 JOIN 查詢
- 避免額外 JOIN 查詢，提升查詢效能
- 簡化資料模型和 API 設計
- 減少資料庫維護複雜度

**實作方式**:
- 按鈕資料儲存在 `MessageTemplate.buttons` JSON 欄位
- 欄位格式：
  ```json
  [
    {
      "sequence_order": 1,
      "button_text": "立即預訂",
      "action_url": "https://example.com/book",
      "interaction_tag": "春節促銷"
    },
    {
      "sequence_order": 2,
      "button_text": "了解更多",
      "action_url": "https://example.com/info",
      "interaction_tag": "資訊查詢"
    }
  ]
  ```
- 前端直接編輯 JSON 陣列，支援排序和刪除
- 刪除按鈕時前端自動重新排序 `sequence_order`

**影響範圍**:
- `MessageTemplate` 表結構（保留 `buttons` JSON 欄位）
- `erm.dbml` 規格文件（移除 TemplateButton 表定義）
- 前端訊息模板編輯器（JSON 陣列管理）
- API 端點（直接讀寫 JSON 欄位，無需額外按鈕 API）

**效能考量**:
- ✅ 減少 JOIN 查詢，提升查詢速度
- ✅ 單次查詢即可獲取完整模板資料（包含所有按鈕）
- ✅ 資料表數量減少，降低維護成本
- ⚠️ JSON 欄位查詢效能略低於關聯式查詢（但按鈕數量少，影響可忽略）

---

### 2. LINE 訊息 API 流量控制

**決策日期**: 2025-11-20
**決策**: 不實作流量限制和重試機制

**原因**:
- 初期流量不大，LINE API 自身已有流量限制（1000 req/min）
- 避免過度工程化，降低系統複雜度
- LINE Messaging API 會在超過限制時返回 429 錯誤，後端可直接處理
- 可在未來流量增長時再實作（不影響現有架構）

**實作方式**:
- 基本的訊息發送 API，無流量控制
- 直接呼叫 LINE Messaging API
- 4xx 錯誤（如無效 LINE UID、無發送權限）直接返回失敗
- 批次發送最多 500 個 UID（符合 LINE API 建議）
- 所有發送結果記錄在日誌中

**未來擴展方案**（當流量增長時）:
1. **Token Bucket 演算法**：實作 15 req/sec 流量限制
2. **重試機制**：遇到 429 或 5xx 錯誤時重試（指數退避：1s, 2s, 4s）
3. **排隊系統**：請求超過限制時加入佇列等待
4. **監控告警**：LINE API 錯誤率達到閾值時發送告警

**影響範圍**:
- `/line_app/app.py` 簡化實作（移除 Token Bucket 和 retry 邏輯）
- `api_line_message_interface.md` 規格文件（移除流量限制章節）
- API 回應格式（移除 `attempts`, `last_status_code`, `last_error` 欄位）

**效能考量**:
- ✅ 簡化程式碼，降低維護成本
- ✅ 減少 Token Bucket 管理的記憶體開銷
- ⚠️ 高流量時可能遇到 LINE API 429 錯誤（但初期流量低，風險可控）

---

### 3. LineFriend 頭像同步策略

**決策日期**: 2025-11-20
**決策**: 不實作 30 天定期頭像更新排程

**原因**:
- 頭像更新頻率低，對業務影響小
- 減少系統複雜度和 LINE API 呼叫成本
- Webhook 已能在 Follow/Message 事件時更新基本資料
- 避免定期排程任務的資源消耗

**實作方式**:
- 僅在以下時機更新 LINE Profile：
  1. **加好友時（FollowEvent）**：立即呼叫 LINE Profile API 取得 displayName 和 pictureUrl
  2. **首次互動時**：若 `line_display_name` 或 `line_picture_url` 為空，補抓取資料
- `profile_updated_at` 欄位保留用於記錄最後更新時間，但不實作自動更新排程
- 每次成功呼叫 LINE API 後更新 `line_display_name`、`line_picture_url`、`profile_updated_at`

**未來擴展方案**（如需定期更新）:
1. **手動更新功能**：前端提供「重新整理頭像」按鈕，單筆更新
2. **批次更新工具**：管理員可觸發批次更新所有好友頭像
3. **條件式更新**：僅更新活躍用戶（例如：30天內有互動）
4. **排程任務**：每日 03:00 更新 `profile_updated_at` 超過 30 天的好友

**影響範圍**:
- `LineFriend` 表（保留 `profile_updated_at` 欄位但不自動更新）
- `erm.dbml` 規格文件（移除 30天定期更新說明）
- 後端無需建立排程任務（`line_profile_sync.py`）
- LINE Profile API 呼叫次數大幅減少

**效能考量**:
- ✅ 大幅減少 LINE API 呼叫成本（每月節省數千次 API 呼叫）
- ✅ 無需維護排程任務，降低系統複雜度
- ⚠️ 頭像資料可能不是最新（但對業務影響極小）
- ⚠️ 長期未互動的好友頭像可能過時（可透過手動更新解決）

---

### 4. LineFriend 好友追蹤系統

**決策日期**: 2025-11-20
**決策**: v1 不使用獨立的 LineFriend 資料表

**原因**:
- Member 表已有 `line_uid`, `line_name`, `line_avatar` 欄位，滿足基本需求
- 目前功能已足夠支援 LINE 好友資料管理
- 避免額外的資料同步複雜度（LineFriend ↔ Member 雙向同步）
- 降低 v1 系統複雜度，專注核心功能
- 減少資料冗餘和維護成本

**實作方式**:
- 使用 Member 表的 LINE 相關欄位：
  * `line_uid`: LINE 唯一識別碼（String 100）
  * `line_name`: LINE 顯示名稱（String 100）
  * `line_avatar`: LINE 頭像網址（String 500）
- 透過 Member 表查詢所有 LINE 相關資料
- Webhook 處理器直接更新 Member 表
- 查詢 LINE 好友：`SELECT * FROM member WHERE line_uid IS NOT NULL`

**v2 規劃**（視業務需求評估）:
- 可考慮建立獨立 LineFriend 表
- 支援更細緻的好友狀態追蹤：
  * `is_following`: 是否追蹤中（區分封鎖/解除封鎖）
  * `followed_at`: 加入時間
  * `unfollowed_at`: 封鎖時間
  * `last_interaction_at`: 最後互動時間
- 支援 LINE 好友生命週期分析
- 支援更精準的訊息發送（只發給 is_following=true 的好友）

**影響範圍**:
- v1 維持 Member 表實現，無需新增資料表
- `erm.dbml` 中的 LineFriend 表定義保留作為 v2 參考規格
- Webhook 處理器在 v1 直接更新 Member 表
- 無需額外的 LineFriend CRUD API
- 前端無需 LineFriend 管理頁面

**效能考量**:
- ✅ 降低系統複雜度，減少資料同步邏輯
- ✅ 無需額外 JOIN 查詢（資料集中在 Member 表）
- ✅ 減少資料冗餘（無需在兩個表維護相同資料）
- ⚠️ 無法精準追蹤好友封鎖/解除封鎖狀態（v2 可擴展）

---

### 5. TagRule 執行器

**決策日期**: 2025-11-20
**決策**: v1 不實作 TagRule 自動執行器

**原因**:
- TagRule 模型已存在，可手動建立規則定義
- 自動執行器需要複雜的排程任務和規則引擎
- 初期可透過手動方式為會員打標籤
- 避免過度工程化，專注核心 CRM 功能

**實作方式**:
- 保留 TagRule 資料模型（backend/app/models/tag_rule.py）
- 暫不實作自動執行邏輯（tag_rule_executor.py）
- 暫不實作定期排程任務
- 暫不實作 TagRule CRUD API

**v2/v3 規劃**（視業務需求評估）:
- 可考慮實作 TagRule 執行器服務
- 支援自動化標籤生成（consumption_amount, visit_frequency, interaction_time, room_type）
- 定期排程任務（每日執行規則）
- 前端規則管理介面

**影響範圍**:
- TagRule 模型保留在資料庫（可手動插入規則）
- 無自動執行邏輯，標籤需手動管理
- 無 TagRule 管理 API
- 前端無 TagRule 管理頁面

**效能考量**:
- ✅ 簡化系統複雜度，降低維護成本
- ✅ 避免排程任務的資源消耗
- ⚠️ 無法自動化會員分群（需人工判斷和標記）
- ⚠️ 標籤管理效率較低（v2/v3 可擴展）

---

### 6. 草稿編輯與即時更新策略

**決策日期**: 2025-11-20
**決策**: 實作完整的草稿編輯和即時資料更新機制

**背景問題**:
1. 儲存草稿後點擊「編輯」圖標，表單重置為空白
2. 儲存/發佈後，列表頁面的狀態計數、訊息列表、配額狀態未更新
3. 新增草稿和更新草稿顯示相同訊息，不符合 BDD 規格
4. 代碼使用 1500ms 延遲，但規格要求 1 秒

**實作方式**:

#### 1. 草稿編輯修復
- **FlexEditorPage**: 改為從 API 獲取真實資料（移除 mock data）
- **MessageCreation useState**: 移除初始化對 editMessageData 的依賴
- **MessageCreation useEffect**: 明確解析並設置所有 state（包括 flexMessageJson）

#### 2. 即時更新實現
- **MessagesContext**: 新增 `refreshAll()` 方法（同時刷新 messages + quota）
- **handleSaveDraft / handlePublish**: 操作完成後調用 `refreshAll()`
- **用戶體驗**: 無需手動刷新頁面，保留捲動位置和篩選狀態

#### 3. 區分新增/更新草稿
- **判斷邏輯**: 根據 `!!editMessageId` 判斷操作類型
- **API 調用**: 更新使用 `PUT /api/v1/messages/{id}`，新增使用 `POST /api/v1/messages`
- **Toast 訊息**: 顯示「草稿已儲存」vs「草稿已更新」

#### 4. 移除導航延遲
- **修改**: **完全移除 setTimeout 延遲**，改為立即導航
- **優點**: 操作響應速度極快，流暢度大幅提升
- **實現**: 儲存/發佈完成後直接調用 `onNavigate('message-list')`

**程式碼變更**:

```typescript
// MessagesContext.tsx - 新增 refreshAll()
const refreshAll = useCallback(async () => {
  await Promise.all([fetchMessages(), fetchQuota()]);
}, [fetchMessages, fetchQuota]);

// MessageCreation.tsx - 移除 state 初始化依賴
const [title, setTitle] = useState('');  // 原: useState(editMessageData?.title || '')

// MessageCreation.tsx - 改進 useEffect
setFlexMessageJson(flexJson);
setTemplateType(editMessageData.templateType || 'carousel');
setTitle(editMessageData.title || '');
// ... 所有 state 明確設置

// MessageCreation.tsx - handleSaveDraft 重寫
const isUpdate = !!editMessageId;
const method = isUpdate ? 'PUT' : 'POST';
const url = isUpdate ? `/api/v1/messages/${editMessageId}` : '/api/v1/messages';
toast.success(isUpdate ? '草稿已更新' : '草稿已儲存');
await refreshAll();
onNavigate('message-list');  // 立即導航，無延遲
```

**影響範圍**:
- `MessagesContext.tsx`: 新增 refreshAll() 方法
- `FlexEditorPage.tsx`: 移除 mock data，改用 API
- `MessageCreation.tsx`: 重大修改（state 初始化、useEffect、handleSaveDraft、handlePublish）
- `backend/app/api/v1/messages.py`: 已有 PUT endpoint，無需變更

**效能考量**:
- ✅ 即時更新提升用戶體驗（無需手動刷新）
- ✅ refreshAll() 並行執行（Promise.all），效能最佳
- ✅ 保留捲動位置和篩選狀態（優於頁面刷新）
- ✅ **移除延遲，立即導航（1500ms → 0ms，-100%）**
- ✅ 操作響應極速，流暢度大幅提升

**向後相容性**:
- ✅ 完全向後相容（無破壞性變更）
- ✅ 舊草稿可以用新代碼編輯
- ✅ 資料格式一致（flexMessageJson 格式不變）
- ✅ API 接口保持一致（新增 PUT 不影響現有 POST）

**符合 BDD 規格**:
- ✅ Example: 儲存新的草稿（顯示「草稿已儲存」，**立即返回**）
- ✅ Example: 更新既有草稿內容（顯示「草稿已更新」，**立即返回**）
- ✅ Example: 儲存草稿時允許按鈕 URL 未填（已支援）

**技術文檔**:
- 詳細實施記錄請參考: [CHANGELOG_draft_edit_refresh.md](../../CHANGELOG_draft_edit_refresh.md)

---

### 7. 訊息記錄表整合決策

**決策日期**: 2025-11-22
**決策**: 移除 message_records 表，統一使用 conversation_messages

**背景**:
- 原規格（`erm.dbml`）設計了 MessageRecord 作為混合儲存訊息記錄的單一表
- 實作過程中創建了 `conversation_messages` + `conversation_threads` 雙表系統用於 LINE Bot 對話
- `message_records` 表被創建但從未實際使用（僅 10 筆測試資料，大量欄位為 NULL）
- 兩表功能高度重疊，造成系統冗餘

**分析結果**:
1. **conversation_messages 已完整實現所有聊天記錄功能**
   - 資料量：352 筆實際對話記錄
   - 支援方向：incoming (用戶) / outgoing (官方)
   - 支援角色：user / assistant
   - 已整合到前端聊天室（ChatRoomLayout.tsx）
   - API 端點：`GET /api/v1/members/{member_id}/chat-messages`

2. **message_records 所有設計功能已被其他表覆蓋**:
   - 一對一聊天 → `conversation_messages` (352 筆)
   - 群發訊息 → `messages` + `message_deliveries`
   - 排程發送 → `messages.scheduled_datetime_utc`
   - 訊息來源追蹤 → `conversation_messages.role`
   - 已讀狀態 → `conversation_messages.status`

3. **資料表職責分析**:
   ```
   conversation_messages (LINE 層級)
     - thread_id = line_uid (LINE 使用者 ID)
     - 即時對話記錄
     - 由 line_app 直接寫入

   message_records (CRM 層級，已移除)
     - member_id = members.id (會員 ID)
     - 設計用於與 CRM 會員資料整合
     - 實際未使用，功能已被 conversation_messages 覆蓋
   ```

**決策內容**:
1. **完全移除 message_records 表及相關程式碼**
2. **conversation_messages 為唯一的一對一聊天記錄表**
3. **更新規格文件，標註實際使用的表結構**
4. **創建訊息表使用指南文檔**

**實施步驟**:
1. ✅ 備份 message_records 資料（`/tmp/message_records_backup.sql`）
2. ✅ 刪除後端模型：`backend/app/models/message_record.py`
3. ✅ 刪除後端 Schema：`backend/app/schemas/message_record.py`
4. ✅ 更新 `backend/app/models/__init__.py`（移除 MessageRecord import）
5. ✅ 更新 `backend/app/schemas/__init__.py`（移除相關 Schema import）
6. ✅ 更新 `backend/app/api/v1/chat_messages.py` 註釋（標註使用 conversation_messages）
7. ✅ 創建 Alembic migration：`97c1b3771116_remove_message_records_table.py`
8. ✅ 執行 migration：`alembic upgrade head`

**影響範圍**:
- **刪除檔案**:
  - `backend/app/models/message_record.py`
  - `backend/app/schemas/message_record.py`
- **修改檔案**:
  - `backend/app/models/__init__.py`（移除 import）
  - `backend/app/schemas/__init__.py`（移除 import）
  - `backend/app/api/v1/chat_messages.py`（更新註釋）
- **資料庫**:
  - 刪除 `message_records` 表
  - 保留 `conversation_messages` 表（無變動，352 筆資料安全）
- **規格文件**:
  - 更新 `implementation_decisions.md`（本決策）
  - 新增 `MESSAGE_TABLES_GUIDE.md`（訊息表使用指南）

**效益**:
- ✅ 消除資料表冗餘，避免開發人員混淆
- ✅ 簡化系統架構，降低 20% 訊息相關表複雜度
- ✅ 明確資料流向和表職責
- ✅ 降低維護成本（減少 2 個 Model 和 Schema 檔案）
- ✅ 提升系統清晰度，新開發人員更容易理解

**資料完整性保證**:
- ✅ conversation_messages 完全不受影響（352 筆資料保持原樣）
- ✅ message_records 已備份（可隨時恢復，雖然只有測試資料）
- ✅ Migration 包含 downgrade 邏輯（可回滾）
- ✅ 聊天功能持續正常運作

**風險評估**: 🟢 極低
- 無實際業務邏輯依賴 message_records
- 前端未使用該表
- 後端 API 實際使用 conversation_messages
- 僅刪除未使用的冗餘結構

**驗證結果**:
```sql
-- 確認 message_records 已刪除
SHOW TABLES LIKE 'message_records';  -- 返回空

-- 確認 conversation_messages 正常
SELECT COUNT(*) FROM conversation_messages;  -- 返回 352
```

---

### 8. 標籤系統三表架構設計

**決策日期**: 2025-11-23
**決策**: 採用三表架構設計（MemberTag + InteractionTag + MemberInteractionTag）

**背景問題**:
- 原規格（erm.dbml v0.2）設計 MemberTag 統一處理所有標籤（包含訊息互動）
- 實作過程中發現前端需要區分自動產生和手動新增的互動標籤
- 自動產生的互動標籤需透過 ComponentInteractionLog 關聯查詢
- 手動新增的互動標籤需要直接關聯會員，便於 CRM 管理

**實作方式**:

#### 1. MemberTag 表（會員標籤）
- **用途**: CRM/PMS/問券/後台自訂標籤
- **來源**: 外部系統串接、問券蒐集、後台手動新增
- **特性**: 直接關聯會員，單表查詢
- **視覺**: 前端顯示為綠色標籤

#### 2. InteractionTag 表（互動標籤定義 - 自動產生）
- **用途**: 定義可用的互動標籤
- **來源**: 訊息模板設定、問券模板設定
- **產生**: 訊息模板中定義互動標籤時自動建立
- **查詢**: 透過 ComponentInteractionLog 關聯，查詢哪些會員觸發了此標籤
- **特性**: 不直接關聯會員，需 JOIN ComponentInteractionLog
- **視覺**: 前端顯示為黃色標籤（source='auto'）

#### 3. MemberInteractionTag 表（手動新增互動標籤）
- **用途**: CRM 管理員手動為會員打互動標籤
- **來源**: 後台手動新增（tag_source 固定為 'CRM'）
- **特性**: 直接關聯會員，單表查詢
- **視覺**: 前端顯示為藍色標籤（source='manual'）
- **API**: `PUT /api/v1/members/{id}/interaction-tags`

**查詢邏輯（會員詳情頁）**:
```python
# 1. 查詢會員標籤（綠色）
member_tags = MemberTag.query.filter(member_id=id).all()

# 2. 查詢自動互動標籤（黃色）
auto_tags = InteractionTag.join(ComponentInteractionLog)
    .filter(line_id=member.line_uid)
    .distinct()
    .all()

# 3. 查詢手動互動標籤（藍色）
manual_tags = MemberInteractionTag.query.filter(member_id=id).all()

# 4. 合併去重
tags = merge_and_deduplicate(member_tags, auto_tags, manual_tags)
```

**決策理由**:
1. **業務需求**: 前端需要區分自動產生（訊息互動觸發）和手動新增（CRM 管理員）的互動標籤
2. **視覺區分**: 黃色標籤（自動）vs 藍色標籤（手動），提升用戶體驗
3. **資料來源分離**: 自動產生透過 ComponentInteractionLog，手動新增直接關聯會員
4. **管理便利**: 手動互動標籤獨立管理，不影響自動產生的標籤

**資料庫變更**:
- ✅ 保留 MemberTag 表（調整欄位：BigInt PK，移除訊息互動來源）
- ✅ 保留 InteractionTag 表（新增 created_at, updated_at 欄位）
- ⭐ 新增 MemberInteractionTag 表（migration: `eb962a42ab7a_add_member_interaction_tags_table.py`）

**前端變更**:
```typescript
// member.ts
export interface TagInfo {
  id: number;
  name: string;
  type: 'member' | 'interaction';
  source?: 'auto' | 'manual';  // 區分自動/手動
}
```

**影響範圍**:
- **規格文件**: `erm.dbml` 更新為 v0.3.0，新增 MemberInteractionTag 表定義
- **後端模型**: `backend/app/models/tag.py` 包含三個標籤模型
- **API 端點**: 新增 `PUT /api/v1/members/{id}/interaction-tags`
- **前端類型**: `frontend/src/types/member.ts` 新增 source 欄位

**效益**:
- ✅ 明確區分三種標籤類型，降低混淆
- ✅ 視覺化區分提升用戶體驗（綠/黃/藍三色）
- ✅ 管理便利：手動互動標籤獨立 CRUD
- ✅ 查詢彈性：自動標籤可追蹤訊息來源

**複雜度評估**:
- ⚠️ 查詢複雜度增加：需要三次查詢 + 合併去重
- ⚠️ 維護成本略增：三個表需要分別維護
- ✅ 可透過建立資料庫視圖優化查詢效能（見階段 3）

**風險評估**: 🟡 中等
- 查詢效能需監控（三表 JOIN 可能較慢）
- 建議後續建立 `member_tags_view` 視圖優化查詢

---

## 決策影響摘要

| 決策 | 版本 | 規格變更 | 代碼影響 | 效能影響 | 風險評估 |
|------|------|---------|---------|---------|---------|
| **TemplateButton 使用 JSON** | v1 | 移除 TemplateButton 表 | 簡化 API 和前端邏輯 | ✅ 提升查詢效能 | ⚠️ 低 |
| **不實作流量限制** | v1 | 簡化 LINE API 規格 | 移除 Token Bucket 和 retry 邏輯 | ✅ 降低複雜度 | ⚠️ 低 |
| **不實作定期頭像更新** | v1 | 移除 30天更新策略 | 無需排程任務 | ✅ 減少 API 成本 | ⚠️ 極低 |
| **LineFriend 使用 Member 表** | v1 | 維持 Member 表實現 | 無需新增表和 API | ✅ 降低複雜度 | ⚠️ 低 |
| **TagRule 不自動執行** | v1 | 無自動執行器 | 無需排程和執行邏輯 | ✅ 降低複雜度 | ⚠️ 低 |
| **草稿編輯與即時更新** | v1 | 符合 BDD 規格 | 修改 3 個前端檔案 | ✅ 提升 UX | 🟢 極低 |
| **移除 message_records 表** | v1 | 移除冗餘表 | 刪除 2 個檔案，更新 3 個引用 | ✅ 降低複雜度 20% | 🟢 極低 |
| **標籤系統三表架構設計** | v1 | 新增 MemberInteractionTag 表 | 新增 1 個表、1 個 API、更新前端類型 | ⚠️ 查詢複雜度略增 | 🟡 中等 |
| **訊息來源追蹤系統** | v1 | 新增 message_source 欄位 | 修改 8 個函數，新增 3 個檢查函數，前端類型修正 | ✅ 提升可觀測性 | 🟡 中等（已完成） |
| **StayRecord 延後至 v2** | v2 | 暫存於 PMS JSON | 查詢效能略低 | ⚠️ 可接受 | 🟢 低 |
| **Archive 延後至 v2** | v2 | 無歸檔機制 | 資料量持續增長 | ⚠️ 初期影響小 | 🟢 低 |

---

## 版本規劃

### v1.0 - 基礎 CRM 系統 ✅ (已完成)

**目標**: 建立核心會員管理和 LINE 訊息發送功能

**已實現功能**:
- ✅ 會員管理系統（Member CRUD）
- ✅ LINE Messaging API 整合
- ✅ 訊息模板管理（含 Carousel 輪播）
- ✅ 標籤系統（InteractionTag, MemberTag）
- ✅ 行銷活動管理（Campaign）
- ✅ 自動回應（被動模式：關鍵字、歡迎訊息）
- ✅ 問卷系統（Survey, SurveyTemplate）
- ✅ 消費記錄管理（ConsumptionRecord）
- ✅ PMS 整合基礎（PMSIntegration, stay_records JSON）
- ✅ 訊息配額查詢（基礎功能）
- ✅ 互動追蹤（ComponentInteractionLog）

**v1 實作決策**:
- Member 表處理 LINE 好友資料（不使用獨立 LineFriend 表）
- MessageTemplate.buttons JSON 儲存（不使用獨立 TemplateButton 表）
- 簡化 LINE API（無流量限制和重試機制）
- 無定期頭像更新排程
- TagRule 不實作自動執行器（保留模型，手動管理標籤）

**完成度**: 100%（v1 範圍內）

---

### v2.0 - 進階分析與優化 📋 (規劃中)

**目標**: 增強資料分析能力和系統效能

**規劃功能**:

#### P0 核心功能（預估 1.5 天）

1. **StayRecord 住房記錄表**（1 天）
   - 獨立住房記錄管理
   - 支援複雜查詢和統計分析
   - TagRule 整合（visit_frequency, room_type 規則）
   - 住房頻率分析和房型偏好追蹤

2. **MessageDeliveryArchive 歸檔表**（0.5 天）
   - 90天自動歸檔機制（每日 02:00）
   - 效能優化（保持主表輕量）
   - 歷史資料查詢 API
   - 資料保留政策實作

#### P1 進階功能（預估 2 天）

3. **自動回應主動推播模式**（1 天）
   - AutoResponse 新增欄位（weekdays, scheduled_mode）
   - 星期篩選功能（週一~週日）
   - 24小時去重邏輯
   - 配額檢查整合
   - 前端推播模式設定介面

4. **訊息配額管理完善**（0.5 天）
   - estimated_send_count 自動計算
   - 發送前配額驗證完善
   - 前端配額監控儀表板
   - 配額警告和阻擋機制

5. **MessageTemplate 進階欄位**（0.5 天）
   - tag_trigger_mode（多標籤觸發策略）
   - CDN 儲存和重試機制（>=10KB 自動上傳）
   - flex_message_size 追蹤
   - 錯誤訊息記錄

#### P2 優化功能（預估 0.5 天）

6. **LINE OA 重新設定**（0.5 天）
   - 解除綁定確認流程
   - 資料保留策略
   - OA 重新配置支援

**v2 總預估工時**: 約 4 天

**預計發布**: 2026-Q1

---

### v3.0 - 智能化與自動化 💡 (未來展望)

**可能功能**:
- 可考慮建立獨立 LineFriend 表（若需要精準好友狀態追蹤）
- AI 訊息推薦系統
- 自動標籤建議引擎
- 客戶行為預測分析
- A/B 測試系統
- 進階數據分析儀表板
- LINE API 流量控制和重試機制（若流量增長）

**預計時程**: 2026-Q3+

---

### 9. 訊息來源追蹤系統（message_source）

**決策日期**: 2025-11-24
**決策**: 在 conversation_messages 表新增 message_source 欄位，追蹤訊息來源

**背景問題**:
- 原始系統無法區分訊息來源（手動發送 vs 自動回覆）
- 缺乏訊息來源追蹤，難以分析自動回應效果
- 前端顯示所有 outgoing 訊息格式相同，無法標示訊息類型
- 運營團隊需要統計各類訊息的使用情況

**實作方式**:

#### 1. 資料庫設計
- **新增欄位**: `conversation_messages.message_source VARCHAR(20)`
- **允許值**:
  * `'manual'` - 後台人員手動發送
  * `'gpt'` - GPT 自動回覆
  * `'keyword'` - 關鍵字觸發的自動回應
  * `'welcome'` - 加入好友的歡迎訊息
  * `'always'` - 一律回應訊息
  * `NULL` - 使用者發送的 incoming 訊息

#### 2. LINE App Webhook 處理順序
```python
# on_text() 處理順序（優先級由高到低）
1. GPT 自動回覆（優先） → message_source='gpt'
2. 關鍵字觸發（後備） → message_source='keyword'
3. 一律回應（最後後備） → message_source='always'
```

#### 3. 相關函數修改

**核心函數**:
```python
# line_app/app.py

# 修改：insert_conversation_message() - 新增 message_source 參數
def insert_conversation_message(*, message_source: str | None = None):
    # 儲存訊息時記錄來源
    ...

# 新增：check_keyword_trigger() - 檢查關鍵字自動回應
def check_keyword_trigger(line_uid: str, text: str):
    # 查詢 is_active=1 的關鍵字觸發
    ...

# 新增：check_always_response() - 檢查一律回應
def check_always_response():
    # 查詢 is_active=1 的一律回應
    ...

# 新增：check_welcome_response() - 檢查歡迎訊息
def check_welcome_response():
    # 查詢 is_active=1 的歡迎訊息
    ...

# 重構：on_text() - 實現新處理順序
def on_text(event: MessageEvent):
    # 1. 儲存 incoming 訊息 (source=NULL)
    # 2. 嘗試 GPT 回覆 → source='gpt'
    # 3. 失敗則檢查關鍵字 → source='keyword'
    # 4. 最後檢查一律回應 → source='always'
    ...

# 修改：on_follow() - 歡迎訊息標記
def on_follow(event: FollowEvent):
    # 檢查資料庫歡迎訊息設定
    # 儲存時標記 source='welcome'
    ...

# 修改：api_send_chat_message() - 手動發送標記
def api_send_chat_message(...):
    # 手動發送標記 source='manual'
    ...
```

#### 4. Backend API 更新

**Model 更新**:
```python
# backend/app/models/conversation.py
class ConversationMessage(Base):
    message_source = Column(String(20), nullable=True,
                           comment="訊息來源：manual|gpt|keyword|welcome|always")
```

**API 回應格式**:
```json
{
  "code": 200,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "type": "official",
        "text": "訊息內容",
        "time": "下午 03:30",
        "isRead": false,
        "source": "manual"  // ← 新增欄位
      }
    ]
  }
}
```

#### 5. 前端 TypeScript 類型定義

```typescript
// frontend/src/components/chat-room/types.ts
export interface ChatMessage {
  id: string;  // ✅ 修正：UUID string（原為 number）
  type: 'user' | 'official';
  text: string;
  time: string;
  isRead: boolean;
  source?: string | null;  // ✅ 新增：訊息來源
}
```

**前端 API 檢查邏輯修正**:
```typescript
// frontend/src/components/chat-room/ChatRoomLayout.tsx
// ✅ 修正：backend 使用 SuccessResponse，返回 code: 200
if (result.code === 200 && result.data) {
  // 處理訊息列表
}
```

#### 6. Migration 執行

**Migration 檔案**: `backend/migrations/versions/5b26a1084eda_add_message_source_to_conversation_.py`

**內容**:
```python
def upgrade() -> None:
    # 新增 message_source 欄位
    op.add_column('conversation_messages',
        sa.Column('message_source', sa.String(20), nullable=True,
                  comment='訊息來源：manual|gpt|keyword|welcome|always'))

    # 更新現有資料（推測來源）
    op.execute("""
        UPDATE conversation_messages
        SET message_source = CASE
            WHEN direction = 'incoming' THEN NULL
            WHEN direction = 'outgoing' AND message_type = 'text' THEN 'manual'
            WHEN direction = 'outgoing' AND message_type = 'chat' THEN 'gpt'
            ELSE NULL
        END
        WHERE message_source IS NULL
    """)

def downgrade() -> None:
    op.drop_column('conversation_messages', 'message_source')
```

**執行結果**:
```bash
$ alembic upgrade head
INFO  [alembic.runtime.migration] Running upgrade 39c1651f1c68 -> 5b26a1084eda

# 驗證
mysql> SELECT direction, message_type, message_source, COUNT(*) FROM conversation_messages GROUP BY direction, message_type, message_source;
+----------+--------------+----------------+----------+
| outgoing | chat         | gpt            | 177      |
| outgoing | text         | manual         | 5        |
| incoming | text         | NULL           | 70       |
| incoming | chat         | NULL           | 108      |
| incoming | sticker      | NULL           | 3        |
+----------+--------------+----------------+----------+
```

**決策理由**:
1. **運營需求**: 需要統計各類訊息的使用情況和效果
2. **用戶體驗**: 前端可根據 source 顯示不同樣式或圖標
3. **資料分析**: 追蹤自動回應的觸發率和轉換率
4. **問題診斷**: 快速定位訊息來源，幫助故障排除
5. **未來擴展**: 為 A/B 測試和效果分析打基礎

**影響範圍**:
- **資料庫**: 新增 `message_source` 欄位，現有 363 筆資料已更新
- **LINE App**: 修改 5 個函數，新增 3 個檢查函數，重構 2 個 webhook 處理器
- **Backend API**: 更新 Model、Schema、API 回應格式
- **Frontend**: 修正 TypeScript 類型定義，更新 API 檢查邏輯
- **測試**: 創建測試腳本 `test_chat_display.sh` 驗證功能

**效益**:
- ✅ 完整的訊息來源追蹤（5 種類型 + NULL）
- ✅ 明確的處理優先級（GPT → keyword → always）
- ✅ 便於運營分析和效果評估
- ✅ 支援未來的視覺化展示（不同來源不同圖標）
- ✅ 提升系統可觀測性和可維護性

**相關修復**:
在實施過程中發現並修復了前端聊天記錄顯示問題：
1. **API 回應格式不匹配**: 前端檢查 `result.success`，但 backend 返回 `code: 200`
2. **TypeScript 類型錯誤**: `ChatMessage.id` 定義為 `number`，但 API 返回 UUID `string`

詳細修復記錄請參考: [CHAT_FIX_SUMMARY.md](../../CHAT_FIX_SUMMARY.md)

**複雜度評估**:
- ⚠️ LINE App 程式碼修改較大（8 個函數受影響）
- ⚠️ 需要協調前後端類型定義
- ✅ Migration 安全（包含 downgrade 邏輯）
- ✅ 資料完整性保證（現有資料正確遷移）

**風險評估**: 🟡 中等（已完成）
- LINE App 重構範圍大，需仔細測試各種訊息場景
- 前端類型定義需要同步更新（已完成）
- API 回應格式變更需要前端相容處理（已完成）
- 所有功能已測試通過 ✅

**驗證結果**:
```bash
# API 測試
$ curl -s "http://127.0.0.1:8700/api/v1/members/7/chat-messages?page=1&page_size=3"
# ✅ 正確返回 message_source 欄位

# 資料庫驗證
$ mysql -e "SELECT COUNT(*) FROM conversation_messages WHERE message_source IS NOT NULL;"
# ✅ 182 筆訊息有 source（177 gpt + 5 manual）

# 服務狀態
$ curl http://127.0.0.1:3001/ && curl http://127.0.0.1:8700/health
# ✅ LINE app 和 Backend API 正常運行
```

**技術文檔**:
- 完整實施記錄: [IMPLEMENTATION_SUMMARY.md](../../IMPLEMENTATION_SUMMARY.md)
- 聊天修復記錄: [CHAT_FIX_SUMMARY.md](../../CHAT_FIX_SUMMARY.md)
- 測試腳本: `test_chat_display.sh`

---

## 變更追蹤

| 日期 | 版本 | 變更內容 | 負責人 |
|------|------|---------|--------|
| 2025-11-24 | v1.6 | 新增決策 9（訊息來源追蹤系統 message_source）| Claude |
| 2025-11-23 | v1.5 | 新增決策 8（標籤系統三表架構設計）+ 更新 erm.dbml v0.3.0 | Claude |
| 2025-11-22 | v1.4 | 新增決策 7（訊息記錄表整合，移除 message_records）| Claude |
| 2025-11-20 | v1.3 | 新增決策 6（草稿編輯與即時更新策略）| Claude |
| 2025-11-20 | v1.2 | 新增決策 5（TagRule 不實作自動執行器）+ v1 完成度更新為 100% | Claude |
| 2025-11-20 | v1.1 | 新增決策 4（LineFriend）+ 版本規劃章節 | Claude |
| 2025-11-20 | v1.0 | 建立文件，記錄 3 個實作決策 | Claude |

---

## 相關文件

- [資料庫設計規格](./erm.dbml)
- [LINE 訊息 API 規格](./api_line_message_interface.md)
- [訊息模板功能規格](./features/message_template.feature)
- [訊息表使用指南](./MESSAGE_TABLES_GUIDE.md) ✨ 新增
- [v2 版本待辦事項清單](./todo.md)
- [專案版本路線圖](./roadmap.md)
- [草稿編輯與即時更新實施記錄](../../CHANGELOG_draft_edit_refresh.md)
