# 釐清問題

Member.gpt_enabled 欄位的切換邏輯與影響範圍為何？

# 定位

ERM：Member 實體的 gpt_enabled 欄位（bool, default: true）
Feature：聊天室多渠道 - GPT 自動回應

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 全域控制 - gpt_enabled=false 時，該會員所有訊息都不觸發 GPT |
| B | 渠道控制 - 需結合渠道設定，LINE/FB 可分別開關 |
| C | 時段控制 - gpt_enabled 為基礎，但可設定啟用時段 |
| D | 類型控制 - 僅關閉 GPT，但其他自動回應（keyword/welcome）仍觸發 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- GPT 自動回應觸發邏輯
- 客服操作流程
- 會員體驗（是否收到 GPT 回應）

# 優先級

Medium
- Medium：影響 GPT 功能的細節控制

---
# 解決記錄

- **回答**：A + D 組合 - gpt_enabled 為會員級開關，關閉時僅停 GPT，自動回應 (keyword/welcome/time) 仍可觸發
- **更新的規格檔**：01/spec/features/auto_response.feature
- **變更內容**：新增 GPT 自動回應開關規則與示例：gpt_enabled=false 時跳過 GPT 呼叫，不影響其他自動回應；gpt_enabled=true 時正常觸發 GPT
