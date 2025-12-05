# GPT 自動計時器功能測試指南

## 前置準備

### 1. 確認服務狀態
- ✅ 後端服務：http://127.0.0.1:8700
- ✅ 前端服務：http://localhost:5173

### 2. 登入系統
1. 打開瀏覽器訪問 http://localhost:5173
2. 使用管理員帳號登入
3. 進入會員管理頁面

---

## 測試場景 1：基本功能測試

### 步驟 1：點擊輸入框觸發計時器

**操作步驟：**
1. 進入任一會員的聊天室頁面
2. 點擊聊天輸入框（或使用 Tab 鍵聚焦）

**預期結果：**
- ✅ 聊天區域右上角出現橘色「手動模式」標籤
- ✅ 標籤包含警告圖示 + "手動模式" 文字
- ✅ 背景色：淺橘色半透明 (rgba(255,152,0,0.15))
- ✅ 邊框色：橘色 (#ff9800)
- ✅ 文字色：深橘色 (#e65100)

**驗證 API 呼叫：**
1. 打開瀏覽器開發者工具（F12）
2. 切換到 Network 面板
3. 過濾 XHR/Fetch 請求
4. 應該看到：
   ```
   Request: PUT /api/v1/members/{member_id}
   Payload: { "gpt_enabled": false }
   Status: 200 OK
   ```

### 步驟 2：發送訊息重置計時器

**操作步驟：**
1. 在輸入框中輸入測試訊息（例如："測試訊息"）
2. 點擊「傳送」按鈕（或按 Enter）

**預期結果：**
- ✅ 訊息成功發送
- ✅ 「手動模式」標籤仍然顯示（未消失）
- ✅ 計時器重新計時 10 分鐘

**驗證 API 呼叫：**
```
Request 1: POST /api/v1/members/{member_id}/chat/send
Payload: { "text": "測試訊息" }
Status: 200 OK

Request 2: PUT /api/v1/members/{member_id}
Payload: { "gpt_enabled": false }
Status: 200 OK
```

### 步驟 3：等待 10 分鐘自動恢復

**操作步驟：**
1. 不進行任何操作
2. 等待 10 分鐘（600 秒）

**預期結果：**
- ✅ 10 分鐘後「手動模式」標籤自動消失
- ✅ GPT 自動回應功能恢復

**驗證 API 呼叫：**
```
Request: PUT /api/v1/members/{member_id}
Payload: { "gpt_enabled": true }
Status: 200 OK
```

**快速測試方法（開發用）：**
如需快速測試，可暫時修改 `MANUAL_MODE_DURATION` 為 10 秒：
```typescript
// ChatRoomLayout.tsx 第 154 行
const MANUAL_MODE_DURATION = 10 * 1000; // 10 秒（測試用）
// const MANUAL_MODE_DURATION = 10 * 60 * 1000; // 10 分鐘（正式）
```

---

## 測試場景 2：多分頁同步測試

### 步驟 1：開啟兩個分頁

**操作步驟：**
1. 在瀏覽器開啟分頁 A：http://localhost:5173
2. 登入並進入會員 #123 的聊天室
3. 複製瀏覽器分頁（Ctrl+Shift+D 或右鍵 > 複製分頁）
4. 得到分頁 B，同樣顯示會員 #123 的聊天室

**確認狀態：**
- ✅ 分頁 A 和 B 都顯示相同會員的聊天室
- ✅ 兩個分頁都沒有「手動模式」標籤

### 步驟 2：在分頁 A 啟動計時器

**操作步驟：**
1. 在分頁 A 點擊聊天輸入框

**預期結果：**
- ✅ 分頁 A：立即顯示「手動模式」標籤
- ✅ 分頁 B：1-2 秒內同步顯示「手動模式」標籤

**驗證機制：**
1. 打開分頁 A 的開發者工具 > Console
2. 執行：
   ```javascript
   localStorage.getItem('gpt_timer_123')
   ```
3. 應該看到：
   ```json
   {"memberId":"123","isManualMode":true,"startTime":1701234567890}
   ```

### 步驟 3：在分頁 B 發送訊息

**操作步驟：**
1. 切換到分頁 B
2. 在輸入框輸入訊息並發送

**預期結果：**
- ✅ 分頁 B：訊息發送成功，標籤保持顯示
- ✅ 分頁 A：標籤保持顯示（計時器已重置）

### 步驟 4：在分頁 A 切換會員

**操作步驟：**
1. 在分頁 A 切換到其他會員（例如會員 #456）

**預期結果：**
- ✅ 分頁 A：會員 #456 聊天室無「手動模式」標籤
- ✅ 分頁 B：會員 #123 的「手動模式」標籤消失（因為分頁 A 離開時觸發恢復）

**驗證 localStorage 清理：**
```javascript
// 分頁 B Console
localStorage.getItem('gpt_timer_123')  // 應返回 null
```

---

## 測試場景 3：會員切換測試

### 步驟 1：在會員 A 啟動計時器

**操作步驟：**
1. 進入會員 A (ID: 123) 的聊天室
2. 點擊輸入框

**確認狀態：**
- ✅ 顯示「手動模式」標籤

### 步驟 2：切換到會員 B

**操作步驟：**
1. 點擊側邊欄的會員列表
2. 選擇會員 B (ID: 456)

**預期結果：**
- ✅ 會員 B 的聊天室載入完成
- ✅ 會員 B 沒有「手動模式」標籤

**驗證 API 呼叫（會員 A 的 GPT 恢復）：**
```
Request: PUT /api/v1/members/123
Payload: { "gpt_enabled": true }
Status: 200 OK
```

### 步驟 3：返回會員 A

**操作步驟：**
1. 再次點擊會員 A

**預期結果：**
- ✅ 會員 A 的聊天室載入
- ✅ 沒有「手動模式」標籤（已恢復）
- ✅ GPT 自動回應功能正常

**驗證資料庫狀態：**
```sql
SELECT id, name, gpt_enabled FROM members WHERE id IN (123, 456);
```
預期：
```
id  | name   | gpt_enabled
123 | 會員A  | true
456 | 會員B  | true
```

---

## 測試場景 4：API 驗證測試

### 使用瀏覽器開發者工具

#### 1. 打開 Network 面板
1. 按 F12 開啟開發者工具
2. 切換到 "Network" 標籤
3. 勾選 "Preserve log"（保留日誌）
4. 過濾器選擇 "Fetch/XHR"

#### 2. 監控 API 請求

**啟動計時器時：**
```
General:
  Request URL: http://localhost:5173/api/v1/members/123
  Request Method: PUT
  Status Code: 200 OK

Request Headers:
  Content-Type: application/json
  Authorization: Bearer <token>

Request Payload:
  {
    "gpt_enabled": false
  }

Response:
  {
    "success": true,
    "data": {
      "id": "123",
      "gpt_enabled": false,
      ...
    }
  }
```

**恢復 GPT 時：**
```
Request Payload:
  {
    "gpt_enabled": true
  }

Response:
  {
    "success": true,
    "data": {
      "id": "123",
      "gpt_enabled": true,
      ...
    }
  }
```

#### 3. 檢查 localStorage

在 Console 中執行：
```javascript
// 查看當前會員的計時器狀態
Object.keys(localStorage).filter(key => key.startsWith('gpt_timer_'))

// 查看特定會員的計時器資料
localStorage.getItem('gpt_timer_123')

// 清除所有計時器（測試用）
Object.keys(localStorage)
  .filter(key => key.startsWith('gpt_timer_'))
  .forEach(key => localStorage.removeItem(key))
```

---

## 常見問題排查

### 問題 1：點擊輸入框沒有顯示標籤

**可能原因：**
- API 呼叫失敗
- 狀態更新失敗

**檢查步驟：**
1. 打開 Console，查看是否有錯誤訊息
2. 檢查 Network 面板，確認 PUT 請求是否發送
3. 檢查 Response 是否為 200 OK

**解決方法：**
```javascript
// Console 中手動觸發
setIsGptManualMode(true)
```

### 問題 2：多分頁不同步

**可能原因：**
- storage 事件未觸發
- localStorage 寫入失敗

**檢查步驟：**
```javascript
// 分頁 A Console
localStorage.setItem('test_sync', Date.now())

// 分頁 B Console
window.addEventListener('storage', (e) => {
  console.log('Storage event:', e.key, e.newValue)
})
```

### 問題 3：切換會員後 GPT 未恢復

**可能原因：**
- useEffect cleanup 未執行
- API 呼叫失敗

**檢查步驟：**
1. 在 Console 查看是否有 "恢復 GPT 自動模式失敗" 錯誤
2. 檢查 Network 面板的 PUT 請求
3. 手動查詢資料庫確認 gpt_enabled 狀態

---

## 效能監控

### 監控 API 呼叫頻率

**預期頻率：**
- 點擊輸入框：1 次 PUT 請求
- 發送訊息：1 次 POST + 1 次 PUT 請求
- 切換會員：1 次 PUT 請求（恢復上一個會員）
- 10 分鐘後：1 次 PUT 請求（自動恢復）

**異常情況：**
- ⚠️ 短時間內多次 PUT 請求（可能需要 debounce）
- ⚠️ 404/500 錯誤（API 問題）
- ⚠️ 401 錯誤（Token 過期）

### 監控記憶體使用

```javascript
// Console 中執行
console.log('Active timers:', gptTimerRef.current !== null)
console.log('LocalStorage items:', Object.keys(localStorage).filter(k => k.startsWith('gpt_timer_')).length)
```

---

## 回歸測試檢查清單

- [ ] 基本功能：點擊輸入框 → 顯示標籤
- [ ] 基本功能：發送訊息 → 重置計時器
- [ ] 基本功能：等待 10 分鐘 → 自動恢復
- [ ] 多分頁：分頁 A 啟動 → 分頁 B 同步顯示
- [ ] 多分頁：分頁 B 發送訊息 → 分頁 A 同步重置
- [ ] 會員切換：離開會員 A → GPT 立即恢復
- [ ] 會員切換：返回會員 A → 無標籤顯示
- [ ] API 驗證：PUT 請求正確發送
- [ ] API 驗證：gpt_enabled 值正確變更
- [ ] 頁面重整：計時器重置
- [ ] 錯誤處理：API 失敗時顯示 Toast

---

## 自動化測試腳本（可選）

如需自動化測試，可使用 Playwright：

```bash
# 安裝 Playwright（如果尚未安裝）
npm install -D @playwright/test

# 創建測試檔案
cat > tests/gpt-timer.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('GPT Timer Feature', () => {
  test('should show manual mode label when clicking input', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // 登入邏輯...
    await page.click('textarea[placeholder="輸入訊息文字"]');
    await expect(page.locator('text=手動模式')).toBeVisible();
  });
});
EOF

# 執行測試
npx playwright test
```

---

## 測試報告範本

### 測試人員：_____________
### 測試日期：_____________
### 瀏覽器版本：_____________

| 測試場景 | 結果 | 備註 |
|---------|------|------|
| 基本功能 - 點擊輸入框 | ☐ Pass ☐ Fail | |
| 基本功能 - 發送訊息 | ☐ Pass ☐ Fail | |
| 基本功能 - 10分鐘恢復 | ☐ Pass ☐ Fail | |
| 多分頁同步 - 啟動同步 | ☐ Pass ☐ Fail | |
| 多分頁同步 - 發送同步 | ☐ Pass ☐ Fail | |
| 會員切換 - 離開恢復 | ☐ Pass ☐ Fail | |
| 會員切換 - 返回正常 | ☐ Pass ☐ Fail | |
| API 驗證 - 請求正確 | ☐ Pass ☐ Fail | |
| API 驗證 - 資料正確 | ☐ Pass ☐ Fail | |

### 發現的問題：
1.
2.
3.

### 建議改進：
1.
2.
3.
