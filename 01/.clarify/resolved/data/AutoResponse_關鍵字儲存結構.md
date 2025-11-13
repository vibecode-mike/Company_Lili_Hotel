# 釐清問題

AutoResponse.keywords 欄位如何儲存多組關鍵字（最多 20 組）？使用 JSON 陣列、逗號分隔字串，還是關聯表？

# 定位

ERM：spec/erm.dbml AutoResponse 表格 keywords 欄位（約第65行）
Feature：spec/features/auto_response.feature Rule 關於多組關鍵字（約第27-32行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 使用 JSON 陣列儲存（如 ["訂房","預約","價格"]），支援結構化查詢 |
| B | 使用逗號或分號分隔字串（如 "訂房,預約,價格"），簡單易讀 |
| C | 新增 AutoResponseKeyword 關聯表，支援進階查詢與統計 |
| Short | 其他設計（<=5字）|

# 影響範圍

影響關鍵字比對邏輯、查詢效能、關鍵字觸發統計、資料驗證規則，以及未來支援正則表達式或模糊比對的擴充性。

# 優先級

Medium

---
# 解決記錄

- **回答**：C - 新增 AutoResponseKeyword 關聯表，支援進階查詢與統計
- **更新的規格檔**：spec/erm.dbml, spec/features/auto_response.feature
- **變更內容**：
  - erm.dbml：
    - 移除 AutoResponse.keywords 欄位（改由關聯表管理）
    - 更新 AutoResponse 表 Note，新增關鍵字管理說明與 AutoResponseKeyword 關係
    - 新增 AutoResponseKeyword 表（關鍵字關聯實體），一對多關係，包含欄位：keyword_text（關鍵字文字，長度上限 50 字元）、match_type（比對類型：包含匹配/完全匹配/正則表達式）、is_enabled（是否啟用，預設 true）、trigger_count（觸發次數統計）、last_triggered_at（最近觸發時間）
    - 新增唯一性約束：(response_id, keyword_text) 組合唯一，同一自動回應不可有重複關鍵字
    - 數量限制：每個自動回應最多 20 組關鍵字（應用層驗證）
  - auto_response.feature：新增 3 個 Rule 與 11 個 Example：
    - (1) 關鍵字透過關聯表管理：新增/刪除關鍵字建立/移除關聯記錄、數量上限驗證（20 組）、同一自動回應不可重複關鍵字
    - (2) 關鍵字觸發時更新統計資訊：累加 trigger_count、更新 last_triggered_at、僅更新實際觸發的關鍵字、查看關鍵字觸發統計
    - (3) 支援個別關鍵字的啟用/停用：停用關鍵字不參與比對、停用不刪除記錄、重新啟用恢復比對
