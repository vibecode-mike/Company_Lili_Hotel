# 釐清問題

ConversationMessage.role 欄位的值域為何？

# 定位

ERM：ConversationMessage 實體的 role 欄位（string(20)）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 簡單二分：`user` / `assistant` |
| B | 三方角色：`member` / `staff` / `system` |
| C | 詳細角色：`member` / `manual` / `gpt` / `keyword` / `welcome` |
| D | 使用 direction + message_source 組合取代 role |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- ConversationMessage 資料結構
- 聊天室訊息顯示邏輯
- 訊息來源追蹤與統計

# 優先級

Medium
- Medium：影響對話串資料結構清晰度

---
# 解決記錄

- **回答**：B - 三方角色：member / staff / system（system 包含 GPT/keyword/welcome/always 自動回應）
- **更新的規格檔**：01/spec/erm.dbml
- **變更內容**：設定 ConversationMessage.role 值域為 member / staff / system；自動回應類型繼續由 message_source 區分
