# 釐清問題

系統預設權限（Permission）的完整清單為何？何時初始化？

# 定位

ERM：Permission 實體的初始化與預設資料定義

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 透過資料庫 migration 腳本初始化（部署時自動建立） |
| B | 透過應用程式啟動時的初始化腳本建立 |
| C | 透過管理後台手動建立（提供匯入功能） |
| D | 混合模式（核心權限透過 migration，自訂權限透過後台） |
| Short | 提供其他簡短答案（<=5 字） |

註：需釐清完整的預設權限清單（如 member.view, member.create, message.send, tag.manage 等）

# 影響範圍

影響權限系統的初始化策略、資料庫 migration 腳本內容、應用程式啟動流程、以及 RBAC 系統的完整性

# 優先級

High - 阻礙權限系統的實作規格定義

---

# 解決記錄

- **回答**：D - 混合模式（核心權限透過 migration，自訂權限透過後台）
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 Permission 實體的 Note 說明，新增「權限初始化策略：混合模式」，明確定義 39 個核心權限清單（member.*, tag.*, message.*, autoresponse.*, campaign.*, pms.*, admin.*, system.*）以及擴展權限策略（meta.*, whatsapp.*, automation.*, event.* 等透過後台動態新增）
- **解決時間**：2025-11-14
