# 測試觸發圖片功能

## 測試目標
驗證群發訊息的按鈕觸發圖片功能是否正常運作

## 修改內容總結

### 1. 擴展卡片狀態 (MessageCreation.tsx:184, 191, 198, 205)
- ✅ 新增 `button1TriggerImageUrl` 欄位
- ✅ 新增 `button2TriggerImageUrl` 欄位
- ✅ 新增 `button3TriggerImageUrl` 欄位
- ✅ 新增 `button4TriggerImageUrl` 欄位

### 2. 修改 handlePublish 函數 (MessageCreation.tsx:707-757)
- ✅ 在生成 FlexMessage 前上傳所有觸發圖片
- ✅ 使用 `Promise.all` 並行上傳,提升效率
- ✅ 檢查每個按鈕是否有觸發圖片 (File 物件) 且尚未上傳
- ✅ 呼叫 `handleImageUpload` 上傳圖片
- ✅ 將上傳後的 URL 儲存到 `cardsWithUploadedImages`
- ✅ 將包含 URL 的卡片傳遞給 `generateFlexMessage`

### 3. 修改 generateFlexMessage 函數 (MessageCreation.tsx:543, 623, 657-673)
- ✅ 接受 `cardsToUse` 參數 (預設為當前 cards state)
- ✅ 在 `addButton` 函數中新增 `triggerImageUrlKey`
- ✅ 新增 `action === 'image'` 的處理邏輯
- ✅ 使用圖片 URL 作為按鈕 action 的 uri
- ✅ 如果圖片 URL 不存在,使用 fallback (message action)

## 測試步驟

### 前置條件
1. 後端服務正在運行 (http://127.0.0.1:8700)
2. 前端服務正在運行 (http://localhost:5173)
3. 已登入系統並有權限訪問群發訊息功能

### 測試案例 1: 主圖片上傳 (應該維持正常)
1. 進入「建立群發訊息」頁面
2. 上傳卡片主圖片
3. 填寫必填欄位 (標題、內容等)
4. 點擊「發布」
5. **預期結果**:
   - 圖片成功上傳
   - FlexMessage JSON 中 `hero.url` 包含正確的圖片 URL
   - 訊息發送成功

### 測試案例 2: 按鈕 URL 動作 (應該維持正常)
1. 進入「建立群發訊息」頁面
2. 啟用按鈕 1
3. 選擇「連結」作為按鈕動作
4. 輸入 URL (例如: https://example.com)
5. 點擊「發布」
6. **預期結果**:
   - FlexMessage JSON 中按鈕的 `action.type` 為 "uri"
   - `action.uri` 為輸入的 URL
   - 訊息發送成功

### 測試案例 3: 按鈕觸發圖片 (新功能 - 重點測試)
1. 進入「建立群發訊息」頁面
2. 填寫卡片基本資訊
3. 啟用按鈕 1
4. 選擇「觸發圖片」作為按鈕動作
5. 上傳觸發圖片 (選擇一張測試圖片)
6. **觀察**: 確認圖片預覽顯示正確
7. 點擊「發布」
8. **預期結果**:
   - 觸發圖片成功上傳到後端
   - 控制台顯示上傳成功的 URL
   - FlexMessage JSON 中按鈕的 `action.type` 為 "uri"
   - `action.uri` 為上傳後的圖片 URL (格式: https://linebot.star-bit.io/uploads/...)
   - 訊息發送成功
   - 在 LINE 中點擊按鈕會開啟圖片

### 測試案例 4: 多個按鈕混合動作
1. 進入「建立群發訊息」頁面
2. 啟用按鈕 1: 選擇「連結」,輸入 URL
3. 啟用按鈕 2: 選擇「觸發圖片」,上傳圖片
4. 啟用按鈕 3: 選擇「文字」,輸入回傳文字
5. 點擊「發布」
6. **預期結果**:
   - 所有按鈕的動作正確設定
   - FlexMessage JSON 包含三個按鈕,每個動作類型正確
   - 訊息發送成功

### 測試案例 5: 多卡片輪播 + 觸發圖片
1. 進入「建立群發訊息」頁面
2. 新增第二張卡片
3. 卡片 1: 啟用按鈕 1 (觸發圖片),上傳圖片 A
4. 卡片 2: 啟用按鈕 1 (觸發圖片),上傳圖片 B
5. 點擊「發布」
6. **預期結果**:
   - 兩張圖片都成功上傳
   - FlexMessage JSON 的 carousel 包含兩個 bubble
   - 每個 bubble 的按鈕都有正確的圖片 URL
   - 訊息發送成功

### 測試案例 6: 重複上傳防護
1. 進入「建立群發訊息」頁面
2. 啟用按鈕 1,選擇「觸發圖片」,上傳圖片
3. 點擊「預覽」(如果有此功能)
4. 再次點擊「發布」
5. **預期結果**:
   - 圖片不會重複上傳 (因為有 `!card.button1TriggerImageUrl` 檢查)
   - 使用已上傳的 URL
   - 效能良好

## 驗證方法

### 方法 1: 瀏覽器開發者工具
1. 打開 Chrome DevTools (F12)
2. 切換到 Network 標籤
3. 執行測試案例
4. 檢查:
   - `/api/v1/upload` 請求 (圖片上傳)
   - `/api/v1/messages` 請求 (建立訊息)
   - `/api/v1/messages/{id}/send` 請求 (發送訊息)
5. 查看 Request Payload 中的 `flex_message_json`

### 方法 2: 後端日誌
```bash
# 查看後端日誌
tail -f /data2/lili_hotel/backend/app.log

# 或使用 journalctl (如果使用 systemd)
sudo journalctl -u lili-hotel-backend -f
```

### 方法 3: 資料庫查詢
```sql
-- 查詢最新的訊息記錄
SELECT id, flex_message_json, created_at
FROM messages
ORDER BY created_at DESC
LIMIT 1;

-- 查看 FlexMessage JSON 內容
SELECT
  id,
  JSON_PRETTY(flex_message_json) as flex_message
FROM messages
WHERE id = [最新訊息 ID];
```

### 方法 4: LINE 實際測試
1. 確保已將測試帳號加入 LINE 好友
2. 發送測試訊息
3. 在 LINE 中驗證:
   - 訊息正確顯示
   - 點擊按鈕後的行為正確
   - 觸發圖片按鈕會開啟圖片

## 預期的 FlexMessage JSON 結構

### 按鈕觸發圖片的 JSON 範例
```json
{
  "type": "bubble",
  "size": "mega",
  "hero": {
    "type": "image",
    "url": "https://linebot.star-bit.io/uploads/20250128_main.jpg",
    "size": "full",
    "aspectRatio": "1.92:1",
    "aspectMode": "cover"
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "測試標題",
        "weight": "bold",
        "size": "xl",
        "wrap": true
      }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "spacing": "sm",
    "contents": [
      {
        "type": "button",
        "action": {
          "type": "uri",
          "label": "查看圖片",
          "uri": "https://linebot.star-bit.io/uploads/20250128_trigger.jpg"
        },
        "style": "primary",
        "height": "sm"
      }
    ],
    "flex": 0
  }
}
```

## 已知限制與注意事項

1. **圖片格式限制**: 僅支援 jpg, jpeg, png, gif
2. **圖片大小限制**: 最大 5MB
3. **LINE 圖片限制**: LINE 對圖片 URL 有要求 (必須為 HTTPS)
4. **並行上傳**: 使用 `Promise.all` 可能在大量卡片時造成壓力
5. **錯誤處理**: 如果上傳失敗,該按鈕會使用 fallback (message action)

## 錯誤排查

### 問題 1: 圖片上傳失敗
- **檢查**: 後端 `/api/v1/upload` 是否正常運作
- **檢查**: 檔案權限 (`/data2/lili_hotel/backend/public/uploads/`)
- **檢查**: 網絡連接
- **檢查**: 檔案大小和格式

### 問題 2: FlexMessage JSON 不包含圖片 URL
- **檢查**: `cardsWithUploadedImages` 是否包含 URL
- **檢查**: `generateFlexMessage` 是否接收到正確的參數
- **檢查**: 控制台錯誤訊息

### 問題 3: LINE 訊息發送失敗
- **檢查**: 後端 LINE API 設定
- **檢查**: 圖片 URL 是否可訪問 (HTTPS)
- **檢查**: FlexMessage JSON 格式是否符合 LINE 規範

## 成功標準

✅ 所有 6 個測試案例通過
✅ 無控制台錯誤
✅ FlexMessage JSON 格式正確
✅ 圖片成功上傳並可訪問
✅ LINE 訊息正確顯示和互動
✅ 效能良好 (上傳時間 < 5 秒)
