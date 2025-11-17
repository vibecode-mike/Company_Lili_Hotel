# 釐清問題

Member.last_interaction_at 欄位的更新觸發條件為何？僅會員主動發送訊息觸發，還是包含點擊按鈕、接收推播等被動互動？

# 定位

ERM：spec/erm.dbml Member 表格 last_interaction_at 欄位（約第17行）
Feature：spec/features/member_tag_management.feature Rule 關於沉睡會員判定（約第71-85行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 僅會員主動發送文字/圖片訊息時更新 |
| B | 包含會員主動發送訊息 + 點擊按鈕互動 |
| C | 包含所有會員互動行為（發送訊息、點擊按鈕、開啟訊息） |
| D | 分為兩個欄位：last_active_at（主動）與 last_interaction_at（所有互動） |
| Short | 其他定義（<=5字）|

# 影響範圍

影響沉睡會員標籤判定邏輯、會員活躍度統計、需回覆會員篩選功能，以及排序規則的準確性。

# 優先級

High

---
# 解決記錄

- **回答**：A - 僅會員主動發送文字/圖片訊息時更新
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 Member 實體的 last_interaction_at 欄位 note，明確定義更新觸發條件為「僅當會員主動發送文字或圖片訊息時更新」，並明確列出不更新的情境（被動接收推播訊息、點擊按鈕互動、開啟訊息等）
