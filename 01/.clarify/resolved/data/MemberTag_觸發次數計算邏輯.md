# 釐清問題

MemberTag.trigger_count 欄位的計算邏輯為何？是否每次標籤觸發都累加，還是僅特定情境累加？

# 定位

ERM：spec/erm.dbml MemberTag 表格 trigger_count 欄位（約第35行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 每次標籤觸發（無論是否重複）都累加，記錄總觸發次數 |
| B | 僅首次觸發時設為 1，後續重複觸發不累加（去重記錄） |
| C | 依標籤來源不同而有不同邏輯（CRM/PMS 標籤累加，互動標籤去重） |
| Short | 其他邏輯（<=5字）|

# 影響範圍

影響標籤統計資料準確性、去重邏輯實作、標籤管理頁面顯示，以及會員行為分析報表。

# 優先級

High

---
# 解決記錄

- **回答**：A（理解1️⃣）- 每次標籤觸發都累加，trigger_count 記錄該組合 (member_id, tag_id, message_id) 被觸發的原始累計次數
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：
  1. 更新 MemberTag.trigger_count 欄位 note，明確說明累加邏輯：
     - 同一組合重複觸發時，執行 UPDATE trigger_count = trigger_count + 1
     - 前端顯示會員標籤時，按 (member_id, tag_id) 分組並加總 trigger_count
  2. 更新 unique_member_tag_trigger index note，說明 unique index 用於確保組合唯一性並防止重複插入
- **補充說明**：
  - **去重目的**：前端顯示時，同一個會員的同一個標籤只顯示一次（例如「雙十優惠」標籤不會重複顯示）
  - **trigger_count 目的**：累計該標籤被觸發的原始次數，不管是同一訊息還是不同訊息
  - **資料庫層級**：unique index 確保 (member_id, tag_id, message_id) 組合唯一，重複觸發時更新 trigger_count
  - **前端顯示層級**：查詢時用 GROUP BY (member_id, tag_id) 並 SUM(trigger_count)，同一標籤只顯示一次但可以看到總觸發次數
