# 釐清問題

MemberTag.unique_member_tag_trigger 索引（member_id, tag_id, message_id）要求永不為 NULL 以確保 UNIQUE 索引有效，但 PostgreSQL/MySQL 對 NULL 值的 UNIQUE 處理不同。使用何種資料庫？message_id 填值策略能否保證永不為 NULL？後台手動操作時 message_id 是否可能為空？

# 定位

ERM：MemberTag 表中 unique_member_tag_trigger 索引定義與 message_id 欄位約束

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 使用 PostgreSQL，允許 message_id 為 NULL（多個 NULL 視為不同值），但需調整索引為 partial index |
| B | 使用 MySQL 8.0+，message_id NOT NULL 約束，後台手動操作使用固定值 'manual'（如 DBML 註解） |
| C | 使用 PostgreSQL，message_id NOT NULL 約束，強制所有來源填值（manual, crm-sync, pms-sync 等） |
| D | 移除 message_id 作為 UNIQUE 索引組成部分，改用 (member_id, tag_id) 唯一性約束 |

# 影響範圍

- 資料庫選型與版本要求
- MemberTag 表 message_id 欄位約束定義
- unique_member_tag_trigger 索引設計
- 標籤觸發去重邏輯
- 後台手動新增/移除標籤流程
- 資料庫遷移腳本

# 優先級

High
- 阻礙資料庫設計與遷移
- 影響標籤去重邏輯正確性
- 影響後台標籤管理功能

---
# 解決記錄

- **回答**：B - 使用 MySQL 8.0+，message_id NOT NULL 約束，後台手動操作使用固定值 'manual'（如 DBML 註解）
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 MemberTag 表定義（第 162、175-178 行）。message_id 欄位加入 `[not null]` 約束，確保 MySQL UNIQUE 索引 (member_id, tag_id, message_id) 有效運作。在 Note 中新增「資料庫選型與約束設計」段落，明確說明使用 MySQL 8.0+ 的原因及 NOT NULL 約束的必要性

---

## 補充釐清（2025-11-19）

**補充問題**：標籤點擊次數是否需要去重？

**使用者回饋**：「上一題的標籤點擊次數不去重」

**選擇方案**：B - 同一組合累加計數器（部分去重）
- 保留 UNIQUE 索引 `(member_id, tag_id, message_id)`
- 新增 `click_count INT NOT NULL DEFAULT 1` 欄位
- 重複點擊執行 `UPDATE click_count = click_count + 1`

**新增規格更新**（2025-11-19）：
- **新增欄位**（erm.dbml:163）：
  ```dbml
  click_count int [not null, default: 1, note: '點擊次數，>= 1。預設值：1（首次點擊）。重複點擊同一組合時執行 UPDATE click_count = click_count + 1，累計點擊次數不去重。僅適用於訊息互動來源（Interaction），其他來源（CRM/PMS/後台自訂）此欄位固定為 1']
  ```

- **更新 UNIQUE 索引說明**（erm.dbml:166）：
  ```dbml
  unique_member_tag_trigger [unique, note: '確保 (member_id, tag_id, message_id) 組合唯一性，防止重複插入。同一組合重複觸發時執行 UPDATE click_count = click_count + 1，累加點擊次數（標籤點擊次數不去重）']
  ```

- **更新 Note 段落**（erm.dbml:181-187）：
  新增「點擊計數與去重規則（方案 B：同一組合累加計數器）」段落，說明：
  - UNIQUE 索引確保同一組合只有一筆記錄
  - 重複點擊處理邏輯：UPDATE click_count = click_count + 1
  - 訊息互動來源：click_count 累加計數
  - 其他來源：click_count 固定為 1

**業務邏輯**：
- 首次點擊：INSERT 新記錄，click_count = 1
- 重複點擊：UPDATE 現有記錄，click_count += 1
- 優點：資料量小、查詢快速、保留累計點擊次數
- 缺點：無法追蹤點擊時間序列（僅保留最後一次觸發時間 last_triggered_at）
