# 釐清問題

User 表與 Admin 表的關係與使用場景區分為何？

# 定位

ERM：User 實體與 Admin 實體
- User：簡化版使用者管理（角色：ADMIN/MARKETING/CUSTOMER_SERVICE）
- Admin：完整 RBAC 權限管理（透過 AdminRole, RolePermission）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 替代關係 - User 為 Admin 的簡化版，未來將統一使用 User |
| B | 並存關係 - User 用於問卷創建者等輕量操作，Admin 用於系統管理 |
| C | 遷移過渡 - User 為新表，將逐步替代 Admin（包含資料遷移） |
| D | 功能分離 - User 管理前台操作人員，Admin 管理後台系統管理員 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- 權限管理系統架構
- 登入驗證流程
- Survey.created_by 的參照對象

# 優先級

High
- High：影響系統權限架構的整體設計方向

---
# 解決記錄

- **回答**：C - User 為新表，逐步替代 Admin（包含資料與權限遷移）
- **更新的規格檔**：01/spec/erm.dbml
- **變更內容**：標記 Admin 為過渡狀態、User 為最終單一帳號表；規範過渡期 Admin/RBAC 為權限來源且需與 User 1:1 同步，新功能外鍵（含 Survey.created_by）一律參照 User，後續淘汰 Admin
