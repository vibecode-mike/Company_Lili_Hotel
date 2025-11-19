# 釐清問題

Message.available_quota 與 estimated_send_count 比較邏輯不完整：available_quota 來源為何？（LINE API 查詢？本地計算？）estimated_send_count 計算時機為何？（儲存草稿時？發送前？即時計算？）配額消耗後如何更新 available_quota？

# 定位

ERM：Message 表中 available_quota, estimated_send_count 欄位計算邏輯
Feature：create_broadcast.feature 中配額檢查規則

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | available_quota 即時從 LINE API 查詢；estimated_send_count 發送前計算；發送後立即查詢 API 更新配額 |
| B | available_quota 本地維護（發送時遞減）；estimated_send_count 即時計算（篩選條件變更時重算） |
| C | available_quota 定時從 LINE API 同步（每 5 分鐘）；estimated_send_count 儲存草稿時計算並儲存 |
| D | available_quota 發送前查詢 LINE API；estimated_send_count 即時計算（不儲存）；發送成功後本地遞減配額 |

# 影響範圍

- Message 表 available_quota, estimated_send_count 欄位設計
- 群發訊息發送前檢查邏輯
- LINE API 配額查詢頻率與效能
- 配額不足時的錯誤處理流程
- 配額消耗追蹤與告警機制

# 優先級

High
- 阻礙群發訊息核心功能實作
- 影響 LINE API 整合設計
- 影響錯誤處理邏輯

---
# 解決記錄

- **回答**：A - available_quota 即時從 LINE API 查詢；estimated_send_count 發送前計算；發送後立即查詢 API 更新配額
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 Message 表的 estimated_send_count 和 available_quota 欄位定義（第 336-337 行）。estimated_send_count：發送前根據篩選條件即時計算符合條件的 LineFriend 數量，不儲存。available_quota：發送前/後即時從 LINE Messaging API 查詢取得，不進行本地維護，確保與 LINE API 完全同步
