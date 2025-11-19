# 釐清問題
MemberTag 以 `(member_id, tag_id, message_id)` 去重，但手動新增標籤或外部（CRM/PMS/問券）匯入時並沒有對應的訊息 ID。這些情境下 `message_id` 應該如何填值以維持唯一性與累計邏輯？

# 定位
ERM：spec/erm.dbml:29-52（MemberTag.message_id 與 unique_member_tag_trigger 索引）

# 多選題
| 選項 | 描述 |
|--------|-------------|
| A | 為非訊息來源產生人工識別（如 `manual-{uuid}`、`crm-{batch_id}`），`message_id` 永不為 NULL 以維持索引去重。 |
| B | 允許 `message_id = NULL`，去重邏輯改為 (member_id, tag_name, tag_source) 於應用層處理。 |
| C | 新增 `source_reference_id` 欄位儲存外部批次 ID，`message_id` 僅限訊息觸發使用，unique 索引需調整。 |
| Short | 其他作法（<=5字） |

# 影響範圍
- **資料一致性**：若 `message_id` 允許空值或重複，可能造成標籤重複貼附或統計錯誤。
- **同步流程**：涉及 CRM/PMS/問券匯入批次寫入策略與追蹤能力。
- **索引設計**：決定是否需調整 unique 索引與欄位設計，影響資料庫層邏輯。

# 優先級
High — 直接影響標籤去重、統計準確性與異來源同步流程，若未釐清會阻礙實作。

---
# 解決記錄

- **回答**：A - 為非訊息來源使用固定標識（manual、crm-sync、pms-sync、survey-{survey_id}）
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：
  1. 更新 MemberTag.message_id 欄位定義，說明不同來源的填值策略：
     - 後台手動：message_id = 'manual'
     - CRM 同步：message_id = 'crm-sync'
     - PMS 同步：message_id = 'pms-sync'
     - 問券蒐集：message_id = 'survey-{survey_id}'
     - 訊息互動：message_id = 實際訊息 ID
  2. 更新 MemberTag.Note，補充完整的來源分類與 message_id 填值策略
  3. 確保 message_id 永不為 NULL，維持 unique 索引 (member_id, tag_id, message_id) 有效性
  4. 實現資料庫層去重，無需應用層額外邏輯
  5. 支援業務語義：系統標籤（CRM/PMS/後台）不重複，訊息標籤可累計
