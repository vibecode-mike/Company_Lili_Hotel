# 釐清問題
MessageTemplate 實體的 button_count 欄位的數值上限是多少？

# 定位
ERM：MessageTemplate.button_count 欄位缺少數值範圍約束定義

依據 `message_template.feature:126-151` 規則，訊息配置支援輪播圖卡功能，數量限制為 2-9 張。但 `erm.dbml` 的 MessageTemplate 實體中 button_count 欄位僅定義為 `int`，未明確說明上限值。

相關 Feature：
- `message_template.feature:76-84` - 支援新增按鈕
- `message_template.feature:126-151` - 支援輪播圖卡（2-9 張）

# 多選題
| 選項 | 描述 |
|--------|-------------|
| A | button_count 上限為 3，符合 LINE Flex Message 單一訊息按鈕數量限制 |
| B | button_count 上限為 9，與輪播圖卡數量上限保持一致 |
| C | button_count 沒有上限，由前端根據 LINE API 限制動態控制 |
| D | button_count 上限為 4，LINE Messaging API 的實際限制 |
| E | 其他方案（請說明） |

# 影響範圍
- **實體影響**：MessageTemplate.button_count 欄位需新增 CHECK 約束或註解說明上限
- **功能影響**：
  - 訊息模板配置（message_template.feature）
  - 前端按鈕新增 UI 的驗證邏輯
- **API 影響**：
  - POST /message-templates 需驗證 button_count 範圍
  - PATCH /message-templates/:id 需驗證按鈕數量修改的合法性
- **測試影響**：需新增按鈕數量邊界測試案例

# 優先級
Medium

# 理由
此問題影響訊息模板的資料驗證規則及前端 UI 限制，應在實作前明確定義以確保符合 LINE API 規範。

---
# 解決記錄

- **回答**：D - button_count 上限為 4，符合 LINE Messaging API 的實際限制
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 MessageTemplate.button_count 欄位說明：
  - 範圍：0-4（LINE Messaging API 限制單一訊息最多 4 個按鈕）
  - 驗證層級：前端 UI 層限制 + 後端 API 驗證
  - 資料庫層建議使用 CHECK 約束：CHECK (button_count >= 0 AND button_count <= 4)
- **實作影響**：
  - 資料庫遷移時需新增 CHECK 約束確保資料完整性
  - 前端 UI 需限制按鈕新增功能最多 4 個
  - 後端 API（POST/PATCH /message-templates）需驗證 button_count 範圍
  - 測試需涵蓋邊界情況（0, 1, 4, 5 等）
