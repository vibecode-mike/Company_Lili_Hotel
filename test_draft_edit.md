# 編輯草稿與已排程訊息功能測試指南

## 📋 測試前準備

### 1. 重啟服務
```bash
# 重啟後端服務
cd /data2/lili_hotel/backend
pkill -f uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8700 --reload

# 重啟前端服務（如果需要）
cd /data2/lili_hotel/frontend
npm run dev
```

### 2. 準備測試資料庫查詢
```sql
-- 查看訊息完整資料
SELECT
  id,
  message_content AS '訊息標題',
  notification_message AS '通知推播',
  scheduled_datetime_utc AS '排程時間',
  send_status AS '發送狀態',
  target_type AS '目標類型',
  target_filter AS '篩選條件',
  LENGTH(flex_message_json) AS 'JSON大小',
  thumbnail AS '縮圖',
  created_at AS '建立時間',
  updated_at AS '更新時間'
FROM messages
WHERE id = {message_id};
```

---

## 🧪 測試場景

### 測試場景 1：草稿添加排程時間

**目的**：驗證草稿可以添加排程時間，並自動變為「已排程」狀態

**步驟**：
1. 創建一個草稿訊息
   - 訊息標題：「測試草稿轉排程」
   - 通知推播：「這是測試通知」
   - 選擇「草稿」模式
   - 點擊「儲存草稿」

2. 記錄訊息 ID：`_______`

3. 查詢資料庫，確認初始狀態：
```sql
SELECT id, send_status, scheduled_datetime_utc
FROM messages
WHERE id = {message_id};
```
   **預期結果**：
   - `send_status` = "草稿"
   - `scheduled_datetime_utc` = NULL

4. 編輯該草稿：
   - 從訊息列表點擊「編輯」按鈕
   - 驗證所有欄位正確還原
   - 修改為「自訂時間」
   - 設定未來時間（例如：明天 14:00）
   - 點擊「儲存草稿」

5. 查詢資料庫，確認更新後狀態：
```sql
SELECT id, send_status, scheduled_datetime_utc, updated_at
FROM messages
WHERE id = {message_id};
```
   **預期結果**：
   - ✅ `send_status` = "已排程"
   - ✅ `scheduled_datetime_utc` = 設定的時間
   - ✅ `updated_at` 已更新為當前時間

---

### 測試場景 2：已排程改回草稿

**目的**：驗證已排程訊息可以取消排程，變回「草稿」狀態

**步驟**：
1. 創建一個已排程訊息
   - 訊息標題：「測試排程轉草稿」
   - 通知推播：「已排程測試」
   - 選擇「自訂時間」
   - 設定未來時間
   - 點擊「發佈」

2. 記錄訊息 ID：`_______`

3. 查詢資料庫，確認初始狀態：
```sql
SELECT id, send_status, scheduled_datetime_utc
FROM messages
WHERE id = {message_id};
```
   **預期結果**：
   - `send_status` = "已排程"
   - `scheduled_datetime_utc` = 設定的時間

4. 編輯該已排程訊息：
   - 從訊息列表點擊「編輯」按鈕
   - 驗證所有欄位正確還原（包括排程時間）
   - 修改為「立即發送」
   - 點擊「儲存草稿」

5. 查詢資料庫，確認更新後狀態：
```sql
SELECT id, send_status, scheduled_datetime_utc, updated_at
FROM messages
WHERE id = {message_id};
```
   **預期結果**：
   - ✅ `send_status` = "草稿"
   - ✅ `scheduled_datetime_utc` = NULL
   - ✅ `updated_at` 已更新

---

### 測試場景 3：修改所有欄位

**目的**：驗證編輯時所有欄位都能正確保存

**步驟**：
1. 創建一個草稿訊息，包含：
   - 訊息標題：「完整測試草稿」
   - 通知推播：「原始通知」
   - 目標對象：「所有好友」
   - 添加 2 張輪播卡片
   - 每張卡片包含 2 個按鈕

2. 記錄訊息 ID：`_______`

3. 編輯該草稿，修改所有欄位：
   - 訊息標題：「修改後的標題」
   - 通知推播：「修改後的通知」
   - 目標對象：改為「篩選目標對象」
   - 選擇標籤：添加 2 個標籤
   - 修改第一張卡片的按鈕文字和 URL
   - 選擇「自訂時間」，設定排程時間
   - 點擊「儲存草稿」

4. 查詢資料庫，確認所有欄位：
```sql
SELECT
  id,
  message_content,
  notification_message,
  scheduled_datetime_utc,
  send_status,
  target_type,
  target_filter,
  updated_at
FROM messages
WHERE id = {message_id};
```
   **預期結果**：
   - ✅ `message_content` = "修改後的標題"
   - ✅ `notification_message` = "修改後的通知"
   - ✅ `scheduled_datetime_utc` = 設定的時間
   - ✅ `send_status` = "已排程"
   - ✅ `target_type` = "filtered"
   - ✅ `target_filter` 包含選擇的標籤
   - ✅ `updated_at` 已更新

5. 再次編輯該訊息：
   - 驗證所有欄位正確還原
   - 特別檢查：
     - ✅ 訊息標題
     - ✅ 通知推播
     - ✅ 排程時間（日期和時間都正確）
     - ✅ 篩選標籤（所有選中的標籤）
     - ✅ 按鈕文字和 URL

---

### 測試場景 4：按鈕欄位還原測試

**目的**：驗證編輯時按鈕欄位完整還原

**步驟**：
1. 創建一個草稿，包含 4 個按鈕：
   - 按鈕 1：標籤「立即預訂」，URL「https://example.com/book」，樣式「primary」
   - 按鈕 2：標籤「了解更多」，URL「https://example.com/info」，樣式「secondary」
   - 按鈕 3：標籤「聯絡我們」，URL「https://example.com/contact」，樣式「link」
   - 按鈕 4：標籤「查看菜單」，URL「https://example.com/menu」，樣式「secondary」

2. 儲存草稿

3. 記錄訊息 ID：`_______`

4. 編輯該草稿：
   - 驗證所有按鈕欄位正確還原：
     - ✅ 按鈕 1：標籤、URL、樣式都正確
     - ✅ 按鈕 2：標籤、URL、樣式都正確
     - ✅ 按鈕 3：標籤、URL、樣式都正確
     - ✅ 按鈕 4：標籤、URL、樣式都正確

5. 修改按鈕 1 的 URL 為「https://example.com/new」

6. 儲存後，再次編輯：
   - ✅ 驗證按鈕 1 的 URL 已更新為新 URL

---

### 測試場景 5：篩選條件還原測試

**目的**：驗證篩選條件正確還原

**步驟**：
1. 創建一個草稿：
   - 目標對象：「篩選目標對象」
   - 條件：「包含」
   - 標籤：選擇 3 個標籤（例如：VIP、新會員、活躍用戶）

2. 儲存草稿

3. 記錄訊息 ID：`_______`

4. 編輯該草稿：
   - ✅ 驗證目標對象為「篩選目標對象」
   - ✅ 驗證條件為「包含」
   - ✅ 驗證所有 3 個標籤都正確選中

5. 修改條件為「不包含」

6. 儲存後查詢資料庫：
```sql
SELECT target_type, target_filter
FROM messages
WHERE id = {message_id};
```
   **預期結果**：
   - `target_filter` = `{"exclude": ["VIP", "新會員", "活躍用戶"]}`

---

## ✅ 測試結果記錄

| 測試場景 | 狀態 | 備註 |
|---------|------|------|
| 1. 草稿添加排程時間 | ☐ 通過 ☐ 失敗 | |
| 2. 已排程改回草稿 | ☐ 通過 ☐ 失敗 | |
| 3. 修改所有欄位 | ☐ 通過 ☐ 失敗 | |
| 4. 按鈕欄位還原 | ☐ 通過 ☐ 失敗 | |
| 5. 篩選條件還原 | ☐ 通過 ☐ 失敗 | |

---

## 🐛 常見問題排查

### 問題 1：排程時間沒有保存
**檢查點**：
1. 前端是否有發送 `scheduled_at` 欄位？
   - 打開瀏覽器開發者工具 → Network → 查看 PUT 請求的 Payload
2. 後端 Schema 是否有定義 `scheduled_at`？
3. 資料庫的 `scheduled_datetime_utc` 欄位是否存在？

### 問題 2：狀態沒有更新
**檢查點**：
1. 後端 `message_service.py` 的 `update_message` 方法是否有狀態更新邏輯？
2. 查看後端日誌，是否有錯誤訊息？

### 問題 3：按鈕欄位沒有還原
**檢查點**：
1. 前端 `MessageCreation.tsx` Line 343-370 的按鈕解析邏輯是否正確？
2. 打開瀏覽器 Console，查看是否有 JavaScript 錯誤

### 問題 4：updated_at 沒有更新
**檢查點**：
1. 後端 `message_service.py` 是否有明確設置 `message.updated_at = datetime.now()`？
2. 資料庫的 `updated_at` 欄位定義是否有 `onupdate=func.now()`？

---

## 📊 驗證 SQL 查詢

### 查詢所有草稿
```sql
SELECT
  id,
  message_content AS '標題',
  notification_message AS '通知',
  send_status AS '狀態',
  created_at AS '建立',
  updated_at AS '更新'
FROM messages
WHERE send_status = '草稿'
ORDER BY updated_at DESC;
```

### 查詢所有已排程
```sql
SELECT
  id,
  message_content AS '標題',
  scheduled_datetime_utc AS '排程時間',
  send_status AS '狀態',
  created_at AS '建立',
  updated_at AS '更新'
FROM messages
WHERE send_status = '已排程'
ORDER BY scheduled_datetime_utc ASC;
```

### 查詢最近更新的訊息
```sql
SELECT
  id,
  message_content AS '標題',
  send_status AS '狀態',
  updated_at AS '更新時間'
FROM messages
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 🎉 測試完成後

如果所有測試場景都通過：
1. ✅ 標記所有測試為「通過」
2. ✅ 提交代碼變更
3. ✅ 更新相關文檔

如果有測試失敗：
1. ❌ 記錄失敗場景和錯誤訊息
2. ❌ 檢查常見問題排查
3. ❌ 提供錯誤日誌和資料庫查詢結果
