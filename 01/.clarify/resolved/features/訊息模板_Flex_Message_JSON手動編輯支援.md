# 釐清問題

MessageTemplate 是否支援使用者直接編輯 flex_message_json 欄位？或僅由後端根據欄位自動生成？

# 定位

Feature：建立訊息推播 - 訊息模板設計與 Flex Message 生成機制

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 僅由後端自動生成，使用者不可編輯 JSON（簡化操作） |
| B | 支援進階模式，使用者可手動編輯 JSON（專業使用者） |
| C | 使用 LINE Flex Message Simulator 產生，貼上後由後端驗證 |
| D | 混合模式（預設自動生成，提供「匯出/匯入 JSON」功能） |
| Short | 提供其他簡短答案（<=5 字） |

# 影響範圍

影響訊息模板編輯介面設計、Flex Message 生成策略、前端與後端職責劃分、以及使用者操作複雜度

# 優先級

Medium - 影響功能彈性與使用者體驗，但不阻礙基本功能

---

# 解決記錄

- **回答**：A - 僅由後端自動生成，使用者不可編輯 JSON（簡化操作）
- **更新的規格檔**：spec/features/message_template.feature
- **變更內容**：更新 Rule 標題說明「使用者不可手動編輯 JSON，簡化操作並避免格式錯誤」，並新增 Example「使用者無法直接編輯 flex_message_json」明確限制手動編輯
- **解決時間**：2025-11-14
