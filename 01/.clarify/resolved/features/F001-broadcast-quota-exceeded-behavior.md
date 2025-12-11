# F001: 群發訊息配額超限行為

## 問題描述
create_broadcast.feature 提到 quota 驗證 (available_quota >= estimated_send_count)，但未說明配額不足時的處理邏輯。

## 相關規格
- Feature: create_broadcast.feature - Quota management
- ERM: `Message` 表 - `estimated_send_count` 欄位

## 影響範圍
- 群發功能使用體驗
- 行銷活動規劃
- 錯誤處理流程

## 選項
- [ ] A. 完全阻擋 - 配額不足時禁止建立群發任務
- [ ] B. 部分發送 - 允許建立，發送至配額耗盡為止
- [ ] C. 預警提示 - 顯示警告但允許繼續（可能扣費）
- [ ] D. 排程延後 - 自動延後至下個配額週期

## 優先級
**High** - 影響核心群發功能

---
# 解決記錄

- **回答**：A - 配額不足時禁止建立群發任務
- **更新的規格檔**：01/spec/features/create_broadcast.feature
- **變更內容**：新增配額不足時禁止建立訊息記錄的情境，要求後端回傳錯誤並不產生 Message 或排程工作，確保配額不足不會建立群發任務
