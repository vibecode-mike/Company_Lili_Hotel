# 釐清問題

ChatLog.content 欄位儲存非文字訊息時的 JSON Schema 為何？

# 定位

ERM：ChatLog 實體的 content 欄位（text, JSON 格式）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 按訊息類型區分：image 為 `{"url": "..."}`, sticker 為 `{"package_id": "...", "sticker_id": "..."}` |
| B | 統一格式：`{"type": "...", "data": {...}}` |
| C | 直接儲存 LINE/FB 原始 Webhook JSON |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- ChatLog 資料儲存格式
- 跨渠道訊息解析邏輯
- 前端聊天室訊息顯示

# 優先級

Medium
- Medium：影響多渠道訊息整合的資料一致性

---
# 解決記錄

- **回答**：B - 統一格式：{"type":"...","data":{...}}
- **更新的規格檔**：01/spec/erm.dbml
- **變更內容**：ChatLog.content note 與格式對照表，定義 type/data 統一格式，列出 image/sticker/flex/video/audio/location/file/text 等欄位
