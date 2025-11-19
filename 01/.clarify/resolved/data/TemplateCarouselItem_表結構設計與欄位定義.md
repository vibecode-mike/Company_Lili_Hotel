# 釐清問題

TemplateCarouselItem 表結構設計：主鍵、外鍵、欄位清單、每張圖卡是否可設定獨立的 title, description, button_text, action_url, interaction_tag？

# 定位

ERM：MessageTemplate 實體提到輪播圖卡（carousel_count, carousel_item_id），但缺少 TemplateCarouselItem 表定義

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 建立獨立 TemplateCarouselItem 表，每張圖卡可設定獨立的 title, description, button_text, action_url, interaction_tag |
| B | 建立 TemplateCarouselItem 表，但僅儲存 image_url 和 sequence_order，其他欄位沿用 MessageTemplate |
| C | 不建立獨立表，輪播圖卡資訊儲存於 MessageTemplate.flex_message_json 中 |
| D | 建立 TemplateCarouselItem 表，支援每張圖卡獨立設定，並透過 template_id + sequence_order 關聯 |

# 影響範圍

- MessageTemplate 表結構設計
- 訊息模板編輯介面設計（輪播圖卡配置區）
- flex_message_json 生成邏輯
- 訊息預覽與發送流程
- ComponentInteractionLog.carousel_item_id 關聯

# 優先級

High
- 阻礙訊息模板核心功能定義
- 影響資料庫遷移腳本設計
- 影響前端輪播編輯器實作

---
# 解決記錄

- **回答**：D - 建立 TemplateCarouselItem 表，支援每張圖卡獨立設定，並透過 template_id + sequence_order 關聯
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：在 MessageTemplate 表之後新增 TemplateCarouselItem 表定義（第 483-524 行），包含獨立的 carousel_item_id 主鍵、template_id 外鍵、sequence_order 順序編號，以及每張圖卡獨立的 title、description、button_text、action_url、interaction_tag、image_url 等欄位。建立 (template_id, sequence_order) 唯一索引，支援刪除後序號自動遞補功能
