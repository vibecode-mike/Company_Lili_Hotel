# 釐清問題

message_template.feature 明確說「使用者不可手動編輯 JSON」，但已解決項目中提到「Flex_Message_JSON手動編輯支援」。v0 版是否支援手動編輯 JSON？若支援，與「僅透過配置區欄位修改」的規則如何協調？手動編輯的驗證規則是什麼？

# 定位

Feature：message_template.feature 中訊息模板編輯規則
已解決項目：`.clarify/resolved/features/訊息模板_Flex_Message_JSON手動編輯支援.md`

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | v0 版不支援手動編輯 JSON，僅透過配置區欄位修改，後端自動生成 JSON |
| B | v0 版支援「進階模式」手動編輯 JSON，與配置區雙向同步，JSON 變更後更新配置區欄位 |
| C | v0 版支援手動編輯 JSON，但僅限「專家模式」（需特定權限），編輯後配置區失效 |
| D | v0 版支援匯入外部 Flex Message JSON（從 LINE Simulator 複製），但不支援線上編輯 |

# 影響範圍

- 訊息模板編輯介面設計（配置區 vs. JSON 編輯器）
- flex_message_json 生成與驗證邏輯
- 配置區欄位與 JSON 的同步機制
- 使用者權限設計（一般使用者 vs. 專家使用者）
- 錯誤處理（JSON 格式錯誤、LINE API 驗證失敗）

# 優先級

High
- 阻礙訊息模板核心功能定義
- 影響前端介面設計
- 影響使用者體驗策略

---

# 解決記錄

**解決日期**：2025-11-18
**選擇方案**：A（v0 版不支援手動編輯 JSON，僅透過配置區欄位修改）+ 前端生成 JSON
**解決理由**：
- v0 版採用純配置區模式，使用者透過圖形化介面（輸入標題、內文、按鈕等欄位）建立訊息
- 前端（而非後端）根據配置區欄位自動生成符合 LINE 規範的 Flex Message JSON
- 使用者完全不接觸 JSON 代碼，簡化操作並避免格式錯誤
- 優點：簡單易用，不需要 JSON 知識；缺點：彈性較低，僅能使用預設的樣板樣式

**規格更新**：
- 更新 `01/spec/features/message_template.feature`：
  - Line 6: 明確說明「前端自動生成 LINE Flex Message JSON（v0 版不支援手動編輯 JSON，僅透過配置區欄位修改）」
  - Line 14: 「前端自動生成對應的 LINE Flex Message JSON」
  - Line 205-224: 新增 Rule「前端自動生成 LINE Flex Message JSON（v0 版不支援手動編輯 JSON，僅透過配置區修改）」
  - Line 215: 「前端根據欄位資料自動生成 LINE Flex Message JSON」
  - Line 222-224: 「前端負責欄位輸入、即時預覽與 JSON 生成」、「後端負責 JSON 格式驗證與儲存」、「v0 版不提供 JSON 手動編輯功能」
  - Line 233: 「儲存前端生成的 flex_message_json」
