# 釐清問題

Member.line_uid 欄位的格式與長度限制為何？

# 定位

ERM：spec/erm.dbml Member 表格 line_uid 欄位（約第8-9行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 使用 varchar(50)，LINE UID 格式為 U 開頭加32位英數字 |
| B | 使用 varchar(100)，預留未來 LINE 格式變更空間 |
| C | 使用 varchar(255)，最大彈性儲存 |
| Short | 其他長度限制（<=5字）|

# 影響範圍

影響資料庫 schema 定義、索引效能、欄位驗證規則，以及會員資料匯入時的格式檢查邏輯。

# 優先級

High

---
# 解決記錄

- **回答**：B - 使用 varchar(100)，預留未來 LINE 格式變更空間
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 Member 實體的 line_uid 欄位 note，明確定義長度上限為 100 字元，並說明當前格式與預留空間考量
