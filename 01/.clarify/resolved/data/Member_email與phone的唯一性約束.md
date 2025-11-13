# 釐清問題

Member 表的 email 與 phone 欄位是否需要唯一性約束？若需要，如何處理未填寫的情況（NULL 值）？

# 定位

ERM：spec/erm.dbml Member 表格 email 與 phone 欄位（約第10-11行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | email 與 phone 都需要唯一性約束，NULL 值不受約束 |
| B | email 需要唯一，phone 可重複（考慮家庭共用號碼） |
| C | 都不需要唯一性約束，允許同一 email/phone 對應多個會員 |
| D | 需要複合唯一約束 (email + phone) 組合 |
| Short | 其他規則（<=5字）|

# 影響範圍

影響會員註冊流程、資料驗證規則、索引設計、會員搜尋功能，以及外部系統（CRM/PMS）資料串接時的比對邏輯。

# 優先級

High

---
# 解決記錄

- **回答**：B - email 需要唯一，phone 可重複（考慮家庭共用號碼）
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 Member 實體的 email 欄位新增 unique 約束並說明 NULL 值處理，phone 欄位明確說明允許重複以支援家庭成員共用號碼情境
