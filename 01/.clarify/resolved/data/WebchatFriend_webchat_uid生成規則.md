# 釐清問題

Webchat 訪客的 webchat_uid 應如何生成？格式和唯一性保證機制為何？

# 定位

- ERM：WebchatFriend.webchat_uid（string(100) [unique, not null]）
- Note：「系統自動生成或 OAuth 關聯」

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | UUID v4 格式（如 W-550e8400-e29b-41d4-a716-446655440000）|
| B | 時間戳 + 隨機數（如 W1702300800123456）|
| C | 瀏覽器指紋 Hash（可跨 session 識別同一訪客）|
| D | Session ID（每次新會話生成新 ID，不跨 session 追蹤）|
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- WebchatFriend 表唯一性約束
- 訪客身份追蹤（是否能跨 session 識別同一訪客）
- 客服聊天室訪客識別
- 與 OAuth 登入後的會員關聯邏輯

# 優先級

Medium - 影響訪客追蹤和識別機制

---

# 解決記錄

**解決日期**: 2025-12-11
**選擇答案**: A - UUID v4 格式
**決策原因**:
- 全域唯一性保證：UUID v4 碰撞機率極低（2^122 可能值），無需額外檢查
- 標準格式：廣泛支援，便於日誌追蹤和除錯
- 隱私友善：不包含用戶裝置資訊，符合 GDPR 等隱私法規
- 簡單實作：所有語言都有現成 UUID 庫

**補充規格**:
- 生成時機：訪客首次建立 WebSocket 連線時由後端生成
- 跨 session 識別：前端將 webchat_uid 儲存於 localStorage，重新訪問時優先讀取既有 ID
- localStorage 清除處理：視為新訪客，生成新 UUID

**規格更新位置**:
- ERM: WebchatFriend.webchat_uid 欄位 note 更新格式說明
- ERM: WebchatFriend Note 區段新增「webchat_uid 生成規則」
- Feature: 聊天室多渠道.feature 新增「webchat_uid 生成與識別」區段 (line 258-283)
