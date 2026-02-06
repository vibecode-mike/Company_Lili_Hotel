# 釐清問題

主動推播模式（scheduled_mode = 'active'）的去重機制需要記錄 `last_pushed_at` 欄位，但 ERM 中未定義此欄位應儲存於何處。

# 定位

ERM：AutoResponse 實體 或 LineFriend/FbFriend/WebchatFriend 實體
Feature：auto_response.feature Part 9（第九部分：主動推播模式）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 在 LineFriend/FbFriend/WebchatFriend 表新增 `last_pushed_at` 欄位，記錄該好友最後被推播的時間 |
| B | 新增 `AutoResponsePushLog` 關聯表，記錄 (response_id, friend_id, pushed_at)，支援多個自動回應的獨立追蹤 |
| C | 在 AutoResponse 表新增 `push_log` JSON 欄位，以 JSON 格式儲存推播記錄 |
| D | 使用 MessageDelivery 表記錄推播歷史，透過 source_type = 'auto_response_active' 區分 |
| Short | 提供其他簡短答案 |

# 影響範圍

- ERM 資料模型：需新增欄位或關聯表
- auto_response.feature：Part 9 主動推播模式的去重邏輯
- 後端實作：推播服務需讀寫此欄位進行 24 小時去重判斷
- 效能考量：高頻查詢（每次推播前需檢查）

# 優先級

Medium
- 不阻礙核心功能（被動回應模式），但影響主動推播功能的完整性
- 需在實作主動推播功能前確定資料模型

---
# 解決記錄

- **回答**：B - 新增獨立的「推播紀錄表」(`AutoResponsePushLog`)，記錄 (自動回應ID, 好友ID, 推播時間)，支援多個自動回應的獨立追蹤
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：
  - 新增 `AutoResponsePushLog` 表，包含 id, response_id, friend_id, friend_type, pushed_at, created_at 欄位
  - 新增複合索引 (response_id, friend_id, friend_type, pushed_at) 優化去重查詢
  - 更新 AutoResponse Note 新增 1:N AutoResponsePushLog 關係
  - 版本更新至 v0.4.4
