# 釐清問題

Member.id_number（身分證/護照號碼）是否強制唯一？如何處理隱私保護（加密儲存或遮罩顯示）？

# 定位

ERM：spec/erm.dbml Member 表格 id_number 欄位（約第12行）
Feature：spec/features/member_management.feature Rule 關於身分證顯示（約第109-114行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 強制唯一，加密儲存，前端顯示遮罩（如 A12****789） |
| B | 強制唯一，明文儲存，完整顯示（需符合隱私法規確認） |
| C | 允許重複（考慮家庭成員或資料不完整情況），加密儲存 |
| D | 允許 NULL 但不允許重複，明文儲存 |
| Short | 其他規則（<=5字）|

# 影響範圍

影響資料庫 schema、資料安全合規性、PMS/CRM 串接比對邏輯、會員管理 UI 顯示，以及備份還原策略。

# 優先級

High

---
# 解決記錄

- **回答**：A（修改版）- 強制唯一，明文儲存於資料庫，前端預設顯示遮罩（如 A12****789），可手動解除查看完整號碼
- **更新的規格檔**：spec/erm.dbml、spec/features/member_management.feature
- **變更內容**：
  1. 更新 Member 實體的 id_number 欄位 note，明確說明明文儲存、前端預設遮罩顯示、可手動解除
  2. 更新 member_management.feature 中身分證號碼顯示規則：
     - 新增預設顯示遮罩格式的 Rule 與 Example（A12****789）
     - 新增手動解除遮罩的 Rule 與 Example（點擊「顯示完整號碼」按鈕後顯示 A123456789）
