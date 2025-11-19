# 釐清問題

AutoResponseMessage 表的 sequence_order 欄位僅定義「>= 1」，未明確上限與最大訊息數量限制

# 定位

ERM: AutoResponseMessage 表 → sequence_order int [note: 'UI 顯示順序與發送順序，>= 1。發送時依照此順序由小到大依序發送']

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | sequence_order 上限為 5（對應自動回應最多 5 筆訊息的限制） |
| B | sequence_order 上限為 10（保留擴充彈性） |
| C | sequence_order 上限為 20（與關鍵字數量上限一致） |
| D | sequence_order 不設上限，由前端 UI 與業務規則限制訊息數量 |
| Short | 提供其他簡短答案(<=5 字) |

# 影響範圍

影響範圍：
1. AutoResponseMessage 表的欄位定義與驗證規則
2. 自動回應建立 API 的訊息數量驗證
3. 前端 UI 的訊息數量限制提示
4. 自動回應發送邏輯的訊息遍歷

# 優先級

Medium

理由：
- UI 一致性：需與「訊息數量 1-5 筆」的 UI 設計保持一致
- 資料驗證：未定義上限可能導致無效資料寫入
- 業務邏輯：需明確訊息數量限制以避免使用者困惑

---

# 解決記錄

- **回答**：選項 A。sequence_order 限制為 1-5，與自動回應最多 5 筆訊息的規則一致。
- **更新的規格檔**：`spec/erm.dbml`
- **變更內容**：
  1. 將 AutoResponseMessage.sequence_order note 改為「範圍 1-5」，並建議資料庫使用 CHECK 約束。
- **業務影響**：
  - 前後端都以 5 筆訊息為上限，避免超出範圍的資料寫入。
  - 保障自動回應發送邏輯與 UI 限制一致，減少錯誤。
