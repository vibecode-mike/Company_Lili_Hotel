# 釐清問題

MessageTemplate.flex_message_json 欄位是否需要結構驗證？是否限制 JSON 深度、大小或必要欄位？

# 定位

ERM：spec/erm.dbml MessageTemplate 表格 flex_message_json 欄位（約第91行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 完全信任前端產生的 JSON，不進行後端驗證 |
| B | 驗證 JSON 格式正確性與基本結構，確保可解析 |
| C | 嚴格驗證符合 LINE Flex Message 規範（含欄位、型別、層級限制） |
| D | 驗證 JSON 大小上限（如 50KB），避免過大訊息 |
| Short | 其他規則（<=5字）|

# 影響範圍

影響訊息模板儲存邏輯、資料完整性、LINE API 呼叫成功率、錯誤處理機制，以及系統穩定性。

# 優先級

High

---
# 解決記錄

- **回答**：B - 驗證 JSON 格式正確性與基本結構，確保可解析
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：
  1. 在 Message 表格新增 flex_message_json 欄位定義（注意：實際欄位在 Message 表格而非 MessageTemplate）
  2. 欄位 note 說明：
     - 選填欄位，由前端 Flex Message Simulator 產生
     - 後端驗證項目：(1) JSON 格式正確性（可解析）、(2) 基本結構完整性
     - 前端使用 LINE 官方 Simulator 確保符合 LINE Flex Message 規範
- **驗證策略**：
  - **後端責任**：基本防護（格式驗證、可解析性檢查）
  - **前端責任**：使用 LINE 官方 Flex Message Simulator，確保產生的 JSON 符合 LINE API 規範
  - **成本考量**：不需實作完整的 LINE Flex Message 規範驗證器，降低開發與維護成本
