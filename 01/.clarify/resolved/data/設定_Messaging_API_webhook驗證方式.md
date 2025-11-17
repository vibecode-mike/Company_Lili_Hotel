# 釐清項目：設定_Messaging_API_webhook驗證方式

## 基本資訊
- **優先級**：Medium
- **類別**：功能模型
- **相關檔案**：
  - `spec/erm.dbml` (LineOAConfig 表)
  - `spec/features/設定_Messaging_API.feature`

## 問題描述

現有規格定義了 LINE Messaging API 設定流程：
- 管理員輸入 **Channel ID、Channel Secret、Channel Access Token**
- 系統**向 LINE 驗證憑證**
- 確認 **webhook 已開啟**
- 驗證成功後儲存設定

但規格中未明確定義：

1. **憑證格式驗證**（#TODO）：
   - Channel ID 的格式規則（長度、字元類型）
   - Channel Secret 的格式規則
   - Channel Access Token 的格式規則

2. **憑證有效性驗證**：
   - 如何驗證憑證是否有效？調用 LINE 的哪個 API？
   - 驗證失敗時的錯誤訊息？

3. **Webhook 簽章驗證**（接收 webhook 事件時）：
   - LINE 發送 webhook 事件時會包含 `X-Line-Signature` header
   - 如何使用 channel_secret 驗證簽章？
   - 簽章驗證失敗時如何處理？

4. **Webhook URL 設定**：
   - 系統的 webhook URL 是什麼？（如：`https://yourdomain.com/api/v1/line/webhook`）
   - 需要在 LINE Developer Console 手動設定嗎？

5. **Webhook 開啟檢查**（#TODO）：
   - 系統如何確認 LINE 原生後台的 webhook 已開啟？
   - 是檢查使用者勾選「我已完成」嗎？還是透過 API 檢查？

## 影響範圍

- **系統安全性**：Webhook 簽章驗證確保接收到的事件來自 LINE
- **使用者體驗**：明確的錯誤訊息幫助使用者快速定位問題
- **系統穩定性**：正確的驗證邏輯確保系統不會接收到偽造的 webhook 事件
- **開發實作**：前後端需明確知道驗證流程與錯誤處理

## 選項分析

### 選項 A：前端格式驗證 + 後端 LINE API 驗證 + Webhook 簽章驗證（推薦）

**憑證格式驗證**（前端 + 後端）：
- **Channel ID**：
  - 格式：數字，10 位數
  - 範例：`1234567890`
  - 驗證：前端檢查長度與數字，後端最終驗證
- **Channel Secret**：
  - 格式：英數字混合，32 字元
  - 範例：`abcdef1234567890abcdef1234567890`
  - 驗證：前端檢查長度與字元類型，後端最終驗證
- **Channel Access Token**：
  - 格式：英數字混合，包含斜線，長度約 100-200 字元
  - 範例：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - 驗證：前端檢查最小長度，後端最終驗證

**憑證有效性驗證**（後端）：
- **驗證方式**：調用 LINE Messaging API 的 **Get Bot Info** API
  - API：`GET https://api.line.me/v2/bot/info`
  - Header：`Authorization: Bearer {channel_access_token}`
- **驗證成功**：
  - 返回 200 OK，包含 Bot 資訊（userId, displayName, pictureUrl）
  - 系統儲存 line_account_id（如 `@262qaash`）
  - 系統記錄 is_verified = true
- **驗證失敗**：
  - 返回 401 Unauthorized → 顯示「Channel Access Token 無效」
  - 返回 403 Forbidden → 顯示「權限不足，請檢查 Channel 設定」
  - 返回 其他錯誤 → 顯示「驗證失敗，請檢查憑證是否正確」

**Webhook 簽章驗證**（後端接收 webhook 事件時）：
- **驗證流程**：
  1. 接收 webhook 請求，讀取 `X-Line-Signature` header
  2. 使用 channel_secret 計算 HMAC-SHA256 簽章
  3. 比對計算的簽章與 X-Line-Signature 是否一致
  4. 一致 → 接受事件，進行處理
  5. 不一致 → 拒絕事件，記錄日誌，返回 403 Forbidden

**簽章計算演算法**（HMAC-SHA256）：
```python
import hmac
import hashlib
import base64

def validate_signature(channel_secret: str, body: str, signature: str) -> bool:
    """驗證 LINE webhook 簽章"""
    # 使用 channel_secret 和 request body 計算 HMAC-SHA256
    hash_obj = hmac.new(
        channel_secret.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    )

    # Base64 編碼
    calculated_signature = base64.b64encode(hash_obj.digest()).decode('utf-8')

    # 比對簽章
    return calculated_signature == signature
```

**Webhook URL 設定**：
- **系統 Webhook URL**：`https://yourdomain.com/api/v1/line/webhook`
- **設定方式**：管理員需在 LINE Developer Console 手動設定 Webhook URL
- **文件提示**：前端顯示 Webhook URL 並提示管理員複製到 LINE Developer Console

**Webhook 開啟檢查**：
- **方式 1（推薦）**：依賴使用者勾選「我已完成」確認
  - 優點：簡單，不需額外 API 調用
  - 缺點：依賴使用者誠實性
- **方式 2**：發送測試 webhook 事件檢查
  - 調用 LINE Messaging API 的 **Test Webhook** API
  - API：`POST https://api.line.me/v2/bot/channel/webhook/test`
  - 優點：確保 webhook 確實開啟
  - 缺點：需額外 API 調用，可能失敗

**優點**：
- ✅ 完整的驗證流程（格式 → 有效性 → 簽章）
- ✅ 前後端雙重驗證，安全性高
- ✅ 明確的錯誤訊息，使用者體驗佳
- ✅ Webhook 簽章驗證確保事件真實性
- ✅ 符合 LINE 官方建議的最佳實踐

**缺點**：
- ❌ 實作複雜度稍高（需實作多個驗證邏輯）
- ❌ 依賴 LINE API 可用性

**適用情境**：
- **一般情況**（推薦）
- 追求安全性與可靠性

---

### 選項 B：後端統一驗證 + 基礎 Webhook 簽章驗證

**憑證格式驗證**（僅後端）：
- **前端不驗證格式**：僅檢查欄位非空
- **後端統一驗證**：格式檢查 + 有效性驗證一起進行

**憑證有效性驗證**（後端）：
- 同選項 A

**Webhook 簽章驗證**（後端）：
- 同選項 A，但錯誤處理更簡單
- 簽章驗證失敗 → 記錄日誌 → 返回 400 Bad Request（不區分錯誤類型）

**Webhook 開啟檢查**：
- 僅依賴使用者勾選「我已完成」

**優點**：
- ✅ 前端邏輯簡單（僅檢查非空）
- ✅ 後端統一把關
- ✅ 實作難度較低

**缺點**：
- ❌ 使用者體驗稍差（需等待後端返回錯誤）
- ❌ 前端無法即時提示格式錯誤

**適用情境**：
- 前端開發能力有限
- 追求簡單實作

---

### 選項 C：最小驗證 - 僅檢查非空 + LINE API 驗證

**憑證格式驗證**：
- **前端**：僅檢查欄位非空
- **後端**：不額外檢查格式，直接調用 LINE API

**憑證有效性驗證**（後端）：
- 同選項 A，調用 Get Bot Info API

**Webhook 簽章驗證**：
- **不實作簽章驗證**（不推薦）
- 直接接受所有 webhook 事件

**Webhook 開啟檢查**：
- 僅依賴使用者勾選「我已完成」

**優點**：
- ✅ 實作最簡單
- ✅ 前後端邏輯最少

**缺點**：
- ❌ **安全性極低**（不驗證 webhook 簽章，可能接收偽造事件）
- ❌ 使用者體驗差（格式錯誤需等待 LINE API 返回錯誤）
- ❌ **不推薦使用**（安全風險過高）

**適用情境**：
- **不推薦使用**

---

### 選項 D：前端格式驗證 + 測試 Webhook 驗證

**憑證格式驗證**：
- 同選項 A

**憑證有效性驗證**：
- 同選項 A

**Webhook 簽章驗證**：
- 同選項 A

**Webhook 開啟檢查**（主動測試）：
- **方式**：調用 LINE Messaging API 的 **Test Webhook** API
  - API：`POST https://api.line.me/v2/bot/channel/webhook/test`
  - Header：`Authorization: Bearer {channel_access_token}`
  - Body：
    ```json
    {
      "endpoint": "https://yourdomain.com/api/v1/line/webhook"
    }
    ```
- **成功**：返回 200 OK → webhook 已開啟並可接收事件
- **失敗**：返回錯誤 → 顯示「Webhook 未開啟或設定錯誤」

**優點**：
- ✅ 主動檢查 webhook 是否開啟（不依賴使用者勾選）
- ✅ 確保 webhook 確實可接收事件
- ✅ 完整的驗證流程

**缺點**：
- ❌ 需額外 API 調用（可能增加延遲）
- ❌ Test Webhook API 可能失敗（網路問題、LINE API 問題）
- ❌ 實作複雜度最高

**適用情境**：
- 追求最高可靠性
- 不信任使用者手動勾選

---

## 推薦方案

**推薦選項 A：前端格式驗證 + 後端 LINE API 驗證 + Webhook 簽章驗證**

**推薦理由**：

1. **完整的驗證流程**：從格式到有效性到簽章，全面保障系統安全
2. **前端即時回饋**：格式驗證在前端即時顯示，使用者體驗佳
3. **後端統一把關**：後端最終驗證確保安全性
4. **Webhook 簽章驗證**：符合 LINE 官方建議，確保接收到的事件真實性
5. **實作難度適中**：相比選項 D 更簡單，相比選項 B 更安全
6. **依賴使用者勾選**：依賴使用者確認 webhook 已開啟（平衡實作複雜度與可靠性）

**次要推薦選項 D**（若追求最高可靠性）：
- 主動測試 webhook 是否開啟
- 適合追求極高可靠性的場景

**不推薦選項 C**：
- 不驗證 webhook 簽章，安全性過低

---

## 設計細節（基於推薦選項 A）

### 憑證格式驗證實作

**前端驗證（TypeScript）**：

```typescript
interface CredentialsValidation {
  isValid: boolean;
  errors: {
    channelId?: string;
    channelSecret?: string;
    channelAccessToken?: string;
  };
}

function validateCredentials(
  channelId: string,
  channelSecret: string,
  channelAccessToken: string
): CredentialsValidation {
  const errors: any = {};

  // Channel ID 驗證：10 位數字
  if (!/^\d{10}$/.test(channelId)) {
    errors.channelId = 'Channel ID 須為 10 位數字';
  }

  // Channel Secret 驗證：32 字元英數字
  if (!/^[a-zA-Z0-9]{32}$/.test(channelSecret)) {
    errors.channelSecret = 'Channel Secret 須為 32 字元英數字';
  }

  // Channel Access Token 驗證：最少 50 字元
  if (channelAccessToken.length < 50) {
    errors.channelAccessToken = 'Channel Access Token 格式錯誤';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

**後端驗證（Python FastAPI）**：

```python
import re
import httpx
from fastapi import HTTPException

LINE_API_BASE_URL = "https://api.line.me/v2"

def validate_credentials_format(
    channel_id: str,
    channel_secret: str,
    channel_access_token: str
) -> tuple[bool, dict]:
    """驗證憑證格式"""
    errors = {}

    # Channel ID 驗證
    if not re.match(r'^\d{10}$', channel_id):
        errors['channel_id'] = 'Channel ID 須為 10 位數字'

    # Channel Secret 驗證
    if not re.match(r'^[a-zA-Z0-9]{32}$', channel_secret):
        errors['channel_secret'] = 'Channel Secret 須為 32 字元英數字'

    # Channel Access Token 驗證
    if len(channel_access_token) < 50:
        errors['channel_access_token'] = 'Channel Access Token 格式錯誤'

    return len(errors) == 0, errors

async def verify_credentials_with_line_api(
    channel_access_token: str
) -> tuple[bool, str, dict]:
    """向 LINE API 驗證憑證有效性"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{LINE_API_BASE_URL}/bot/info",
                headers={
                    "Authorization": f"Bearer {channel_access_token}"
                },
                timeout=10.0
            )

            if response.status_code == 200:
                bot_info = response.json()
                # 返回成功、LINE Account ID、Bot 資訊
                return True, bot_info.get('userId', ''), bot_info

            elif response.status_code == 401:
                raise HTTPException(
                    status_code=400,
                    detail="Channel Access Token 無效"
                )

            elif response.status_code == 403:
                raise HTTPException(
                    status_code=400,
                    detail="權限不足，請檢查 Channel 設定"
                )

            else:
                raise HTTPException(
                    status_code=400,
                    detail="驗證失敗，請檢查憑證是否正確"
                )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=408,
            detail="LINE API 請求超時，請稍後再試"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"無法連線至 LINE API: {str(e)}"
        )
```

### Webhook 簽章驗證實作

**後端實作（Python FastAPI）**：

```python
import hmac
import hashlib
import base64
from fastapi import Request, HTTPException

async def validate_line_signature(
    request: Request,
    channel_secret: str
) -> bool:
    """驗證 LINE webhook 簽章"""
    # 讀取 X-Line-Signature header
    signature = request.headers.get('X-Line-Signature')
    if not signature:
        raise HTTPException(
            status_code=403,
            detail="Missing X-Line-Signature header"
        )

    # 讀取 request body
    body = await request.body()
    body_str = body.decode('utf-8')

    # 計算 HMAC-SHA256 簽章
    hash_obj = hmac.new(
        channel_secret.encode('utf-8'),
        body_str.encode('utf-8'),
        hashlib.sha256
    )
    calculated_signature = base64.b64encode(hash_obj.digest()).decode('utf-8')

    # 比對簽章
    if calculated_signature != signature:
        raise HTTPException(
            status_code=403,
            detail="Invalid signature"
        )

    return True

@app.post("/api/v1/line/webhook")
async def handle_line_webhook(request: Request):
    """接收並處理 LINE webhook 事件"""
    # 從資料庫取得 channel_secret
    config = get_line_oa_config()  # 假設函數

    # 驗證簽章
    await validate_line_signature(request, config.channel_secret)

    # 解析 webhook 事件
    events = await request.json()

    # 處理事件...
    for event in events.get('events', []):
        # 處理不同類型的事件
        pass

    return {"status": "ok"}
```

### 功能規則新增

**設定_Messaging_API.feature 更新**：

```gherkin
Rule: 三項憑證欄位須符合格式要求

  Example: Channel ID 格式錯誤（非 10 位數字）
    Given 管理員進入 Messaging API 設定頁面
    When 管理員輸入 Channel ID「12345」（少於 10 位）
    Then 前端即時顯示錯誤訊息「Channel ID 須為 10 位數字」

  Example: Channel Secret 格式錯誤（非 32 字元）
    Given 管理員進入 Messaging API 設定頁面
    When 管理員輸入 Channel Secret「short_secret」（少於 32 字元）
    Then 前端即時顯示錯誤訊息「Channel Secret 須為 32 字元英數字」

  Example: Channel Access Token 格式錯誤（少於 50 字元）
    Given 管理員進入 Messaging API 設定頁面
    When 管理員輸入 Channel Access Token「short_token」
    Then 前端即時顯示錯誤訊息「Channel Access Token 格式錯誤」

  Example: 所有憑證格式正確
    Given 管理員進入 Messaging API 設定頁面
    When 管理員輸入 Channel ID「1234567890」（10 位數字）
    And 管理員輸入 Channel Secret「abcdef1234567890abcdef1234567890」（32 字元）
    And 管理員輸入 Channel Access Token（有效格式，50+ 字元）
    Then 前端允許提交表單

Rule: 系統調用 LINE API 驗證憑證有效性

  Example: Channel Access Token 無效
    Given 管理員輸入所有格式正確的憑證
    And 管理員勾選「我已完成」
    When 管理員點擊「建立攔截」
    And 系統調用 LINE Get Bot Info API
    And LINE API 返回 401 Unauthorized
    Then 操作失敗
    And 系統顯示錯誤訊息「Channel Access Token 無效」

  Example: 權限不足
    Given 管理員輸入所有格式正確的憑證
    And 管理員勾選「我已完成」
    When 管理員點擊「建立攔截」
    And 系統調用 LINE Get Bot Info API
    And LINE API 返回 403 Forbidden
    Then 操作失敗
    And 系統顯示錯誤訊息「權限不足，請檢查 Channel 設定」

  Example: 驗證成功並取得 Bot 資訊
    Given 管理員輸入所有正確的憑證
    And 管理員勾選「我已完成」
    When 管理員點擊「建立攔截」
    And 系統調用 LINE Get Bot Info API
    And LINE API 返回 200 OK
    And 返回 Bot 資訊（userId: @262qaash, displayName: 飯店官方帳號）
    Then 系統儲存 line_account_id 為「@262qaash」
    And 系統記錄 is_verified 為 true
    And 系統顯示文字提示「連結成功」

Rule: 須勾選「我已完成」確認完成 LINE 原生後台設定

  Example: 未勾選「我已完成」時阻擋提交
    Given 管理員輸入所有正確的憑證
    But 管理員未勾選「我已完成」
    When 管理員點擊「建立攔截」
    Then 操作失敗
    And 系統顯示錯誤訊息「請確認已完成 LINE 原生後台設定」

  Example: 勾選「我已完成」後允許提交
    Given 管理員輸入所有正確的憑證
    And 管理員勾選「我已完成」
    When 管理員點擊「建立攔截」
    Then 系統允許提交
    And 系統進行憑證驗證

Rule: 前端顯示 Webhook URL 供管理員複製設定

  Example: 顯示系統的 Webhook URL
    Given 管理員進入 Messaging API 設定頁面
    When 管理員查看 Webhook 設定說明
    Then 系統顯示 Webhook URL「https://yourdomain.com/api/v1/line/webhook」
    And 系統顯示提示文字「請將此 URL 複製到 LINE Developer Console 的 Webhook URL 設定」
    And 系統提供「複製」按鈕

Rule: 後端驗證 Webhook 簽章確保事件真實性

  Example: Webhook 簽章驗證成功
    Given 系統已完成 Messaging API 設定
    And channel_secret 為「abcdef1234567890abcdef1234567890」
    When LINE 發送 webhook 事件到「/api/v1/line/webhook」
    And 請求包含 X-Line-Signature header
    And 簽章驗證成功（HMAC-SHA256 一致）
    Then 系統接受事件
    And 系統處理 webhook 事件

  Example: Webhook 簽章驗證失敗
    Given 系統已完成 Messaging API 設定
    When LINE 發送 webhook 事件到「/api/v1/line/webhook」
    And 請求包含 X-Line-Signature header
    But 簽章驗證失敗（HMAC-SHA256 不一致）
    Then 系統拒絕事件
    And 系統記錄日誌「Invalid webhook signature」
    And 系統返回 403 Forbidden

  Example: Webhook 請求缺少簽章 header
    Given 系統已完成 Messaging API 設定
    When 收到 webhook 請求但缺少 X-Line-Signature header
    Then 系統拒絕事件
    And 系統記錄日誌「Missing X-Line-Signature header」
    And 系統返回 403 Forbidden
```

---

## 後續影響

### 需同步更新的規格檔案
1. **spec/erm.dbml**：LineOAConfig 欄位說明更新（明確憑證格式要求）
2. **spec/features/設定_Messaging_API.feature**：更新 #TODO 規則，新增格式驗證、API 驗證、Webhook 簽章驗證範例

### 需考慮的技術實作
1. **前端憑證格式驗證函數**：即時驗證 Channel ID、Channel Secret、Channel Access Token 格式
2. **後端 LINE API 調用**：Get Bot Info API 驗證憑證有效性
3. **Webhook 簽章驗證**：HMAC-SHA256 簽章計算與比對
4. **錯誤處理與日誌記錄**：詳細的錯誤訊息與日誌記錄
5. **Webhook URL 顯示**：前端顯示系統 Webhook URL 供管理員複製

### 相關釐清項目
- **設定_Login_API_憑證格式驗證規則**（Low 優先級）- LINE Login API 憑證格式驗證（可採用相同邏輯）

---

## 決策記錄
- **決策日期**：2025-01-13
- **決策者**：專案團隊
- **選擇方案**：選項 A - 前端格式驗證 + 後端 LINE API 驗證 + Webhook 簽章驗證
- **決策理由**：
  1. 完整的驗證流程：從格式到有效性到簽章，全面保障系統安全
  2. 前端即時回饋：格式驗證在前端即時顯示，使用者體驗佳
  3. 後端統一把關：後端最終驗證確保安全性
  4. Webhook 簽章驗證：符合 LINE 官方建議，確保接收到的事件真實性
  5. 實作難度適中：相比選項 D 更簡單，相比選項 B 更安全
  6. 依賴使用者勾選：依賴使用者確認 webhook 已開啟（平衡實作複雜度與可靠性）

## 實作內容
- **已更新 spec/erm.dbml**：LineOAConfig 欄位說明更新，明確憑證格式要求（Channel ID: 10位數字、Channel Secret: 32字元英數字、Channel Access Token: 最少50字元）、驗證方式（前端格式驗證、後端 LINE Get Bot Info API 驗證）、Webhook 簽章計算（HMAC-SHA256）
- **已更新 spec/features/設定_Messaging_API.feature**：替換 2 個 #TODO，新增 5 個 Rule with 13 個 Examples 涵蓋憑證格式驗證、勾選確認邏輯、LINE API 驗證、Webhook URL 顯示、Webhook 簽章驗證
