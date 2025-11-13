# 釐清問題

Admin 表僅定義 email 與 hashed_password，缺少角色（role）與權限（permission）欄位；系統是否需要角色權限管理？

# 定位

ERM：spec/erm.dbml Admin 表格（約第20-26行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | v0.1 僅支援單一管理員角色，所有管理員權限相同，無需 role 欄位 |
| B | 需要 role 欄位（如 superadmin、admin、staff），權限由程式碼硬編碼 |
| C | 需要完整 RBAC 系統，新增 Role 與 Permission 表，支援動態權限配置 |
| D | 新增 role 欄位（enum），v0.1 先支援 2-3 種固定角色 |
| Short | 其他設計（<=5字）|

# 影響範圍

影響資料庫 schema、使用者登入授權邏輯、功能模組存取控制、操作日誌記錄，以及未來多租戶擴充能力。

# 優先級

Medium

---
# 解決記錄

- **回答**：C - 需要完整 RBAC 系統，新增 Role 與 Permission 表，支援動態權限配置
- **更新的規格檔**：spec/erm.dbml, spec/features/admin_permission_management.feature
- **變更內容**：
  - erm.dbml：
    - 更新 Admin 表 Note，新增 RBAC 權限管理說明與 AdminRole 關係
    - 新增 Role 表（角色實體），定義角色分類，包含系統預設角色（superadmin/admin/staff）與自訂角色，支援動態配置
    - 新增 Permission 表（權限實體），採用「資源.操作」命名規則（如 member.view, message.send），定義系統功能存取控制
    - 新增 AdminRole 表（管理員-角色關聯，多對多），管理員可擁有多個角色，權限計算為所有角色的權限聯集
    - 新增 RolePermission 表（角色-權限關聯，多對多），支援動態配置角色權限，即時生效
  - admin_permission_management.feature：新增完整 RBAC 功能規格，包含 10 個 Rule：
    - (1) 系統初始化時載入預設角色（superadmin/admin/staff）
    - (2) 系統初始化時載入預設權限（member/message/tag/admin/system 等資源權限）
    - (3) 超級管理員指派角色給管理員（支援多角色）
    - (4) 超級管理員配置角色權限（新增/移除權限）
    - (5) 管理員權限計算（多角色權限聯集）
    - (6) 功能存取控制（權限檢查與拒絕處理）
    - (7) 超級管理員管理自訂角色（新增/刪除，系統角色不可刪除）
    - (8) 僅擁有 admin.manage 權限的管理員可管理角色與權限
    - (9) 動態權限配置即時生效（無需重新登入）
    - (10) 權限驗證與錯誤處理
