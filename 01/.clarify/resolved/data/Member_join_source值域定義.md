# 釐清問題

Member.join_source 欄位的可接受值為何？是否需要擴充支援其他來源？

# 定位

ERM：spec/erm.dbml Member 表格 join_source 欄位（約第16行）
Feature：spec/features/member_search_filter.feature Rule 關於建立來源篩選（約第86-124行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 僅支援「LINE」「CRM」「後台系統」三個固定值 |
| B | 支援「LINE」「CRM」「PMS」「後台系統」「問券」五個值 |
| C | 使用可擴充的枚舉或設定檔，未來可動態新增來源 |
| Short | 其他設計（<=5字）|

# 影響範圍

影響會員註冊流程、資料匯入邏輯、篩選功能選項、來源統計報表，以及未來系統整合擴充性。

# 優先級

Medium

---
# 解決記錄

- **回答**：D - 使用可擴充設計，未來可透過設定檔動態新增來源（無硬編碼限制）
- **更新的規格檔**：spec/erm.dbml, spec/features/member_search_filter.feature
- **變更內容**：
  - erm.dbml：明確 join_source 欄位採用可擴充設計，初始值域包含 LINE、CRM、PMS、ERP、系統，支援透過設定檔動態管理來源清單，必填欄位
  - member_search_filter.feature：新增「加入來源支援動態擴充」規則，包含 3 個 Example：(1) 初始加入來源清單（含完整描述）、(2) 動態新增加入來源（無需修改程式碼）、(3) 篩選動態新增的來源
