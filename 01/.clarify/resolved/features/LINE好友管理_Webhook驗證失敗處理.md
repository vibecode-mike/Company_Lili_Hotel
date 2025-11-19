# 釐清問題

line_friends_management.feature 提到 Webhook 驗證，但未定義驗證失敗時如何回應 LINE。回傳 HTTP 400？403？是否記錄可疑請求？是否需要告警機制？

# 定位

Feature：line_friends_management.feature 中 Webhook 接收規則
已解決項目：`.clarify/resolved/features/設定_Messaging_API_webhook驗證方式.md`

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | Webhook 驗證失敗回傳 HTTP 403 Forbidden，記錄可疑請求（IP、timestamp），超過 10 次/小時發送告警 |
| B | Webhook 驗證失敗回傳 HTTP 401 Unauthorized，僅記錄 log，不發送告警（避免誤報） |
| C | Webhook 驗證失敗回傳 HTTP 200（靜默失敗），記錄可疑請求，每日彙總報告發送給管理員 |
| D | Webhook 驗證失敗回傳 HTTP 400 Bad Request，記錄 log 並立即發送告警郵件給管理員 |

# 影響範圍

- Webhook 接收 API 錯誤處理邏輯
- LINE Webhook 驗證機制實作（X-Line-Signature 驗證）
- 可疑請求記錄表設計（需要嗎？）
- 告警通知機制（郵件、系統通知）
- 監控儀表板設計（Webhook 失敗率）
- 測試案例（驗證失敗情境）

# 優先級

High
- 阻礙 LINE Webhook 安全性設計
- 影響系統安全性
- 影響告警機制設計

---

# 解決記錄

**解決日期**：2025-11-19
**選擇方案**：A（HTTP 403 Forbidden + 記錄可疑請求 + 10 次/小時告警閾值）
**解決理由**：
- HTTP 403 語義最準確：簽名驗證失敗是「禁止訪問」，不是「未授權」（401）或「請求格式錯誤」（400）
- 平衡的告警策略：10 次/小時閾值可過濾偶發錯誤（配置問題、開發測試），但能及時捕捉真實攻擊
- 完整的安全記錄：記錄 IP、timestamp、signature、request_body 有助於事後分析和追蹤攻擊來源
- 行業最佳實踐：GitHub、Stripe、Slack 等主流 Webhook 服務都使用 403 處理簽名驗證失敗
- 優點：
  • 語義準確（403 Forbidden）
  • 避免告警疲勞（閾值機制）
  • 安全可追溯（完整日誌）
  • 可建立黑名單或 IP 封鎖規則

**規格更新**：
- 更新 `01/spec/features/line_friends_management.feature`（lines 370-438）：
  - 新增 Rule「Webhook 簽名驗證失敗處理機制（方案 A：HTTP 403 + 記錄 + 閾值告警）」
  - 6 個 Example 場景：
    1. Webhook 簽名驗證失敗 - 回傳 403 Forbidden
    2. 記錄可疑請求詳情 - IP、timestamp、signature、request_body
    3. 超過告警閾值 - 發送告警郵件給管理員（10 次/小時）
    4. 未達閾值 - 僅記錄不告警（避免誤報）
    5. 正常 Webhook 請求處理 - 回傳 200 OK
    6. 缺少簽名 Header - 視為驗證失敗（回傳 403）

**安全驗證邏輯**：
```
Webhook 請求接收
  → 檢查 X-Line-Signature header 是否存在
  → 使用 Channel Secret 計算 HMAC-SHA256 簽名
  → 比對計算結果與 X-Line-Signature

驗證成功：
  → 回傳 HTTP 200 OK
  → 正常處理請求（建立或更新 line_friends）

驗證失敗：
  → 回傳 HTTP 403 Forbidden
  → 記錄可疑請求（IP、timestamp、signature、body 前 200 字元）
  → 日誌等級：WARNING
  → 檢查失敗次數：過去 1 小時內 >= 11 次 → 發送告警郵件
```

**告警機制**：
```
告警條件：
  - 相同 IP 在過去 1 小時內簽名驗證失敗 >= 11 次

告警內容：
  - 郵件標題：「⚠️ LINE Webhook 可疑請求告警」
  - 來源 IP、失敗次數、首次/最近失敗時間
  - 建議動作：檢查 Channel Secret 設定，或考慮封鎖該 IP

日誌記錄欄位：
  - timestamp (UTC)
  - ip_address
  - signature (驗證失敗的簽名值)
  - request_body (前 200 字元)
  - error_type (signature_verification_failed / missing_signature)
```
