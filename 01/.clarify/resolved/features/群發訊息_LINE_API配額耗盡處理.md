# 釐清問題

create_broadcast.feature 只定義了本地配額檢查（available_quota >= estimated_send_count），未定義發送時 LINE API 回傳配額不足的處理。MessageDelivery 如何標記失敗原因？是否需要告警通知管理員？已發送部分是否可查詢？

# 定位

Feature：create_broadcast.feature 中配額檢查與發送規則
ERM：MessageDelivery.delivery_status, failure_reason 欄位

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | LINE API 回傳配額不足立即停止發送，Message.send_status 改為 failed，已發送的 MessageDelivery 標記 sent，未發送的標記 failed（failure_reason: 配額不足） |
| B | 配額不足時繼續嘗試發送（LINE API 可能有延遲更新），超過 3 次失敗後停止，發送郵件通知管理員 |
| C | 配額不足時暫停發送，記錄 Message.send_status = paused，等待配額恢復後自動續傳（每小時檢查一次） |
| D | 配額不足時標記 Message.send_status = partial_sent（部分發送），顯示已發送人數與失敗人數，允許手動補發 |

# 影響範圍

- LINE API 錯誤處理邏輯
- Message.send_status 狀態定義（是否需新增 paused, partial_sent 狀態）
- MessageDelivery.failure_reason 記錄格式
- 告警通知機制（郵件、簡訊、系統通知）
- 前端訊息列表顯示（部分發送的狀態呈現）
- 補發機制設計

# 優先級

High
- 阻礙群發訊息異常處理邏輯
- 影響使用者體驗（配額不足提示）
- 影響告警機制設計

---

# 解決記錄

**解決日期**：2025-11-19
**選擇方案**：A + 前端按鈕禁用機制
**解決理由**：
- 雙重防護機制：
  • 前端配額檢查：配額不足時禁用「發送」按鈕（disabled），避免無效操作
  • 後端配額驗證：防止繞過前端限制的請求
- LINE API 配額不足處理：立即停止發送，避免重複發送風險
- 狀態清晰：已發送的保持 delivered，未發送的標記 failed
- 不自動建立草稿：與系統崩潰情境區分（配額問題需手動處理）
- 優點：
  • 使用者體驗佳（前端即時反饋，按鈕禁用 + 提示訊息）
  • 避免無效 API 呼叫（前端預先阻擋）
  • 後端驗證確保安全性（防止繞過）
  • 錯誤訊息明確（配額不足原因 + 發送記錄）

**規格更新**：
- 更新 `01/spec/features/create_broadcast.feature`（lines 305-330）：
  - 強化 Rule「前端禁用發送按鈕並阻擋發送行為」
  - 3 個 Example 場景：
    1. 配額不足時前端禁用發送按鈕 - 顯示詳細提示
    2. 配額不足時後端阻擋發送 - 防止繞過前端限制
    3. 配額充足時發送按鈕正常啟用 - 正常流程

- 新增 `01/spec/features/create_broadcast.feature`（lines 548-591）：
  - 新增 Rule「LINE API 配額耗盡處理機制（方案 A：立即停止發送）」
  - 4 個 Example 場景：
    1. 發送時 LINE API 回傳配額不足 - 立即停止發送
    2. 檢視配額不足的失敗訊息 - 顯示詳細發送記錄
    3. 配額不足後需手動處理 - 不自動建立草稿
    4. LINE API 配額恢復後正常發送 - 驗證恢復流程

**前端實作要點**：
```
配額檢查邏輯：
  available_quota < estimated_send_count
  → 禁用「發送」按鈕（disabled = true）
  → 顯示提示「訊息配額不足（需要 X 則，可用 Y 則），無法發送」

配額充足：
  available_quota >= estimated_send_count
  → 啟用「發送」按鈕（disabled = false）
  → 允許正常發送
```

**後端處理邏輯**：
```
LINE API 配額不足錯誤：
  → 立即停止發送
  → Message.send_status = failed
  → Message.failure_reason = "LINE API 配額不足"
  → MessageDelivery（已發送）= delivered
  → MessageDelivery（未發送）= failed, failure_reason = "配額不足"
  → 不自動建立草稿（需手動處理）
```
