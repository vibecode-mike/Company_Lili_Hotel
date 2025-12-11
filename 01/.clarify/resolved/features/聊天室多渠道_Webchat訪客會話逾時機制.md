# 釐清問題

Webchat 訪客會話多久未互動後視為「已結束」（is_following = false）？

# 定位

- ERM：WebchatFriend.is_following、WebchatFriend.unfollowed_at
- Feature：聊天室多渠道 - Webchat 訪客狀態管理

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 30 分鐘無互動自動結束會話 |
| B | 24 小時無互動自動結束會話 |
| C | 瀏覽器關閉時結束會話（需 WebSocket 偵測） |
| D | 永不自動結束，僅手動結束 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- WebchatFriend 狀態管理邏輯
- 客服聊天室「在線」狀態顯示
- Webchat 訪客活躍度統計
- WebSocket 連線管理

# 優先級

Medium - 影響 Webchat 訪客狀態準確性和客服操作體驗

---

# 解決記錄

**解決日期**: 2025-12-11
**選擇答案**: C - 瀏覽器關閉時結束會話（需 WebSocket 偵測）
**決策原因**:
- 即時性最佳：WebSocket 斷線可在數秒內偵測，相較時間逾時方案更即時準確
- 符合 Webchat 即時對話情境：Webchat 本質為即時對話，用戶離開即應視為會話結束
- 與已定義規格一致：第 2 題已定義「Webchat 用戶已離線」的錯誤處理，此機制作為偵測基礎
- 自動釋放資源：不需定時掃描資料庫，降低系統負載

**補充規格**:
- 心跳機制：每 30 秒 ping/pong 確認連線狀態
- 重連寬限期：60 秒內重新連線視為同一會話，不更新狀態
- 重新訪問：用戶重新訪問時自動恢復 is_following = true

**規格更新位置**:
- ERM: WebchatFriend.is_following 欄位 note 更新
- ERM: WebchatFriend Note 區段新增「會話結束（WebSocket 斷線偵測）」規則
- Feature: 聊天室多渠道.feature 新增「Webchat 訪客會話狀態管理」區段 (line 229-256)
