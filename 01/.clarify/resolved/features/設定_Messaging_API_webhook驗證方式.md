# 釐清問題

「系統向 LINE 驗證憑證」的驗證方式為何？是呼叫 LINE API 測試連線，還是透過 webhook 接收測試訊息驗證？

# 定位

Feature：spec/features/設定_Messaging_API.feature Rule 關於驗證（約第58-68行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 呼叫 LINE Get Profile API 測試 Access Token 有效性 |
| B | 設定 webhook URL 後，接收 LINE 發送的驗證請求並回應 |
| C | 兩階段驗證：先測試 Access Token，再驗證 webhook 連通性 |
| Short | 其他方式（<=5字）|

# 影響範圍

影響 Messaging API 設定流程、驗證邏輯實作、錯誤訊息明確性、設定成功率，以及使用者體驗。

# 優先級

Medium

---
# 解決記錄

- **回答**：C - 兩階段驗證：先測試 Access Token，再驗證 webhook 連通性
- **更新的規格檔**：spec/features/設定_Messaging_API.feature
- **變更內容**：更新驗證流程規則，新增兩階段驗證邏輯：第一階段調用 LINE Get Bot Info API 驗證 Access Token 有效性，第二階段驗證 webhook 連通性。新增 4 個 Example 涵蓋兩階段驗證的各種情境（第一階段失敗、第一階段成功進入第二階段、第二階段失敗、兩階段皆成功）
