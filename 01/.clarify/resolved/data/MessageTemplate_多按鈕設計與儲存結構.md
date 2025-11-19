# 釐清問題

MessageTemplate.button_count 儲存按鈕數量（0-4），但只有單一 button_text, action_url 欄位，無法支援多按鈕場景。是否需要獨立的 TemplateButton 關聯表？每個按鈕是否有獨立的 button_text, action_url, interaction_tag？

# 定位

ERM：MessageTemplate 表中 button_count, button_text, action_url 欄位設計

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 建立獨立 TemplateButton 表（1:N 關係），每個按鈕有獨立的 button_text, action_url, interaction_tag, sequence_order |
| B | 使用 JSON 欄位儲存多按鈕資訊（如 buttons_config TEXT），不建立獨立表 |
| C | button_count 固定為 1，不支援多按鈕場景（簡化設計） |
| D | 使用 flex_message_json 儲存按鈕配置，button_text/action_url 僅為快速配置欄位 |

# 影響範圍

- MessageTemplate 表結構設計
- 訊息模板編輯介面（按鈕配置區）
- flex_message_json 生成邏輯
- ComponentInteractionLog 按鈕點擊追蹤
- 互動標籤觸發邏輯

# 優先級

High
- 阻礙訊息模板核心功能定義
- 影響資料庫設計與遷移
- 影響前端按鈕編輯器實作

---
# 解決記錄

- **回答**：A - 建立獨立 TemplateButton 表（1:N 關係），每個按鈕有獨立的 button_text, action_url, interaction_tag, sequence_order
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：在 TemplateCarouselItem 表之後新增 TemplateButton 表定義（第 526-568 行），包含獨立的 button_id 主鍵、template_id 外鍵、sequence_order 順序編號（1-4），以及每個按鈕獨立的 button_text、action_url、interaction_tag 欄位。建立 (template_id, sequence_order) 唯一索引，支援 0-4 個按鈕的配置
