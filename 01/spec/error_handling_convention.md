# 錯誤訊息處理規範

## 錯誤訊息格式

**統一規範**：使用 i18n 多語言錯誤訊息鍵值

### 格式定義

- **錯誤訊息鍵值格式**：`error.{module}.{field}.{type}`
- **前端顯示**：透過 i18n 系統將鍵值轉換為對應語言的錯誤訊息
- **後端回應**：API 回應包含錯誤訊息鍵值與參數

### 範例

#### 鍵值命名範例
- `error.tag.name.required` - 標籤名稱為必填
- `error.tag.name.too_long` - 標籤名稱超過長度限制
- `error.member.email.invalid` - 電子信箱格式不正確
- `error.message.quota.insufficient` - 訊息配額不足

#### 後端 API 回應範例
```json
{
  "success": false,
  "error": {
    "code": "error.tag.name.too_long",
    "params": {
      "maxLength": 20,
      "currentLength": 25
    }
  }
}
```

#### 前端顯示範例（繁體中文）
```
標籤名稱不得超過 20 個字元（目前：25 個字元）
```

#### 前端顯示範例（英文）
```
Tag name must not exceed 20 characters (current: 25 characters)
```

## 優點

1. **多語言支援**：輕鬆擴展至其他語言（英文、日文等）
2. **訊息集中管理**：所有錯誤訊息在 i18n 檔案中統一維護
3. **參數化訊息**：支援動態參數，提供更精確的錯誤資訊
4. **一致性**：確保全系統錯誤訊息格式一致
5. **可測試性**：測試案例可以驗證錯誤訊息鍵值

## 影響範圍

- 前端錯誤訊息顯示元件需整合 i18n 系統
- 後端 API 錯誤回應需包含錯誤訊息鍵值與參數
- 測試案例中驗證錯誤訊息鍵值而非具體文案
- 需建立 i18n 錯誤訊息資源檔（繁體中文、英文等）
