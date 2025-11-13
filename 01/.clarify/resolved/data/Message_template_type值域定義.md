# 釐清問題

Message.template_type 欄位的可接受值為何？是否對應 Template01-04 或其他命名規範？

# 定位

ERM：spec/erm.dbml Message 表格 template_type 欄位（約第85行）
Feature：spec/features/message_template.feature 四種模板類型（約第6、20、41、62行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 使用「Template01」「Template02」「Template03」「Template04」四個值 |
| B | 使用語意化名稱「純文字」「文字按鈕確認型」「圖片點擊型」「圖卡按鈕型」 |
| C | 使用英文代碼「text」「text_button」「image_click」「card_button」 |
| D | 使用 LINE Flex Message 官方類型名稱（請註明） |
| Short | 其他命名（<=5字）|

# 影響範圍

影響訊息模板建立流程、模板類型識別、前端元件選擇、資料驗證規則，以及 LINE Flex Message JSON 生成邏輯。

# 優先級

Medium

---
# 解決記錄

- **回答**：移除模板分類概念（LINE 官方沒有模板類型，改為配置欄位自動生成 JSON）
- **更新的規格檔**：spec/erm.dbml, spec/features/message_template.feature
- **變更內容**：
  - erm.dbml：
    - 移除 template_type 欄位（LINE 官方沒有模板類型概念）
    - 保留所有配置欄位（text_content, image_url, title, description, amount, button_text 等），所有欄位改為選填
    - 新增 flex_message_json 欄位（後端根據填寫的欄位自動生成 LINE Flex Message JSON，用於實際發送）
    - 更新 Note：不區分固定模板類型，由填寫的欄位組合決定最終的 Flex Message 結構，後端負責 JSON 生成
  - message_template.feature：完全重寫，移除 Template01-04 分類概念，改為以下流程：
    - (1) 配置區填寫欄位 → 系統自動生成 LINE Flex Message JSON
    - (2) 支援即時預覽功能
    - (3) 支援編輯各類欄位：文字內容、圖片、標題、內文、金額、按鈕、互動標籤、通知訊息、訊息預覽
    - (4) 支援輪播圖卡（2-9 張）
    - (5) 後端自動生成 JSON（前端不需處理 JSON 編輯）
    - (6) 儲存訊息模板
- **設計理念**：LINE Flex Message 採用 JSON 自由組合元件（bubble, carousel, box, button, image, text 等），沒有官方預設的模板類型分類。系統提供視覺化配置區讓用戶填寫簡化欄位，後端自動轉換為 LINE Flex Message JSON，前端僅負責欄位輸入與即時預覽。
