# 釐清問題

LoginConfig 與 LoginSession 的關係與用途為何？LoginConfig 是否儲存 LINE Login Channel 設定，LoginSession 是否記錄登入會話？

# 定位

ERM：spec/erm.dbml LoginConfig 表格（約第38-45行）與 LoginSession 表格（約第47-54行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | LoginConfig 儲存 LINE Login Channel 設定；LoginSession 記錄管理員登入會話（24小時有效） |
| B | LoginConfig 儲存 LINE Login 設定；LoginSession 記錄會員 LINE Login 授權資訊 |
| C | 兩者都與管理員登入相關，LoginConfig 是設定表，LoginSession 是會話表 |
| Short | 其他關係（<=5字）|

# 影響範圍

影響 LINE Login 整合流程、會員資料蒐集邏輯、管理員登入會話管理、資料表關聯設計。

# 優先級

High

---
# 解決記錄

- **回答**：A - LoginConfig 儲存 LINE Login Channel 設定；LoginSession 記錄管理員登入會話（24 小時有效）
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：
  1. 更新 LoginConfig 實體 Note，明確說明：
     - 這是管理員設定的 LINE Login Channel，供會員使用
     - 會員透過此 Channel 授權登入，系統藉此整併會員資料
  2. 更新 LoginSession 實體 Note，明確說明：
     - 這是記錄管理員登入狀態的會話表
     - 支援多裝置同時登入，各自維護獨立會話
     - 24 小時有效期，於當日零時自動登出
- **關係釐清**：
  - **LoginConfig**：管理員設定 → 會員使用（會員透過 LINE Login 授權）
  - **LoginSession**：管理員使用 → 記錄管理員登入會話（email_password / google / line 三種方式）
