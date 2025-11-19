# 釐清問題
資料模型中所有 string 型別欄位的長度上限應該如何定義？

# 定位
ERM：大部分 string 欄位缺少長度約束定義

`erm.dbml` 中大量使用 `string` 型別，但僅少數欄位明確定義長度上限（如 Member.line_name 限制 100 字元），大多數欄位缺少明確的長度限制。

典型案例：
- Member.email, Member.name, Member.phone - 未定義長度上限
- MessageTemplate.title, MessageTemplate.description - 未定義長度上限
- Campaign.name - 未定義長度上限
- Admin.username, Admin.email - 未定義長度上限

相關 Feature：
- `member_tag_integration.feature:157-163` - 單筆會員標籤不得超過 20 個字（已明確定義）

# 多選題
| 選項 | 描述 |
|--------|-------------|
| A | 為每個 string 欄位根據業務需求逐一定義長度上限（如 email: 255, name: 100, phone: 20） |
| B | 採用通用長度標準：短文字 100、中文字 255、長文字 500、超長文字 1000 |
| C | 僅為關鍵欄位定義長度上限，其他欄位使用資料庫預設值 TEXT |
| D | 參考 LINE API 限制定義相關欄位長度（如 LINE 名稱限制 100 字元） |
| E | 其他方案（請說明） |

# 影響範圍
- **實體影響**：所有包含 string 欄位的實體（Member, MessageTemplate, Campaign, Admin, Tag 等）
- **功能影響**：
  - 所有表單輸入驗證
  - 前端 UI 輸入框字數限制提示
  - 資料匯入功能的長度驗證
- **資料庫影響**：
  - 需調整資料庫欄位型別定義（VARCHAR(n) vs TEXT）
  - 可能影響索引效能（VARCHAR 長度影響索引大小）
- **API 影響**：所有 POST/PATCH 端點需新增長度驗證
- **測試影響**：需新增所有 string 欄位的長度邊界測試

# 優先級
Low

# 理由
雖然影響範圍廣泛，但此問題為資料完整性與驗證邏輯的優化項目，不影響核心功能開發。可在實作過程中逐步補充，但建議在資料庫 schema 定義階段明確規範。
