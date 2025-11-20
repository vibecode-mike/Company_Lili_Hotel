# 修復群發訊息按鈕觸發圖片功能

## 修復日期
2025-11-20

## 問題描述

群發訊息(Broadcast Message)的按鈕支援「觸發圖片」(Trigger Image)選項,但該功能未完整實作:

1. **觸發圖片未上傳**: 用戶選擇的圖片檔案從未上傳到後端
2. **FlexMessage 不包含圖片**: 生成的 LINE Flex Message JSON 不包含圖片 URL
3. **狀態管理不完整**: 卡片狀態缺少儲存上傳後 URL 的欄位

## 修復內容

### 1. 擴展卡片狀態 (MessageCreation.tsx)

**檔案**: `frontend/src/components/MessageCreation.tsx`
**行號**: 184, 191, 198, 205

新增 4 個欄位儲存上傳後的圖片 URL:

```typescript
button1TriggerImageUrl: '',
button2TriggerImageUrl: '',
button3TriggerImageUrl: '',
button4TriggerImageUrl: '',
```

**原因**: 原本只有 `button*TriggerImage` (File 物件),沒有欄位儲存上傳後的 URL

---

### 2. 修改 handlePublish 函數 (MessageCreation.tsx)

**檔案**: `frontend/src/components/MessageCreation.tsx`
**行號**: 724-757

**主要變更**:
- 在生成 FlexMessage 前,先上傳所有觸發圖片
- 使用 `Promise.all` 並行上傳,提升效率
- 檢查條件: `button*Action === 'image'` AND `button*TriggerImage` 存在 AND `button*TriggerImageUrl` 為空
- 呼叫 `handleImageUpload` 上傳圖片到後端
- 將上傳後的 URL 儲存到 `cardsWithUploadedImages`
- 將包含 URL 的卡片陣列傳遞給 `generateFlexMessage`

**代碼片段**:
```typescript
// Upload trigger images first
const cardsWithUploadedImages = await Promise.all(cards.map(async (card) => {
  const updates: any = {};

  // Upload button1 trigger image
  if (card.button1Action === 'image' && card.button1TriggerImage && !card.button1TriggerImageUrl) {
    const url = await handleImageUpload(card.button1TriggerImage);
    if (url) updates.button1TriggerImageUrl = url;
  }

  // ... 同樣處理 button2, button3, button4

  return { ...card, ...updates };
}));

// Generate flex message JSON using cards with uploaded image URLs
const flexMessage = generateFlexMessage(cardsWithUploadedImages);
```

**優點**:
- 並行上傳提升效能
- 防止重複上傳 (檢查 `!card.button*TriggerImageUrl`)
- 不修改全域 state,避免 React 渲染問題

---

### 3. 修改 generateFlexMessage 函數 (MessageCreation.tsx)

**檔案**: `frontend/src/components/MessageCreation.tsx`
**行號**: 543, 623, 657-673

#### 3.1 接受卡片參數 (行 543)

```typescript
// 修改前
const generateFlexMessage = () => {
  const bubbles = cards.map(card => {

// 修改後
const generateFlexMessage = (cardsToUse = cards) => {
  const bubbles = cardsToUse.map(card => {
```

**原因**: 允許傳入包含上傳 URL 的卡片陣列,而不依賴全域 state

#### 3.2 新增圖片動作處理 (行 623, 657-673)

**在 addButton 函數中**:

```typescript
// 新增取得觸發圖片 URL 的 key
const triggerImageUrlKey = `button${buttonNum}TriggerImageUrl` as keyof typeof card;

// 新增處理 action === 'image' 的邏輯
} else if (action === 'image') {
  // Handle trigger image action
  const imageUrl = card[triggerImageUrlKey] as string;
  if (imageUrl) {
    button.action = {
      type: "uri",
      label: buttonText,
      uri: imageUrl
    };
  } else {
    // Fallback if image URL is not available
    button.action = {
      type: "message",
      label: buttonText,
      text: buttonText
    };
  }
}
```

**原因**:
- 原本只處理 `url` 和 `text` 動作,缺少 `image` 動作
- 使用 LINE 的 `uri` action 類型,點擊按鈕會開啟圖片 URL
- 提供 fallback 機制,如果圖片未上傳則使用預設動作

---

## 技術細節

### FlexMessage JSON 結構

修復後,按鈕觸發圖片會生成以下 JSON:

```json
{
  "type": "button",
  "action": {
    "type": "uri",
    "label": "查看圖片",
    "uri": "https://linebot.star-bit.io/uploads/20250128_abc123.jpg"
  },
  "style": "primary",
  "height": "sm"
}
```

### 圖片上傳流程

```
用戶選擇圖片 (File 物件)
    ↓
儲存到 card.button*TriggerImage
    ↓
點擊「發布」
    ↓
handlePublish: 檢測 action === 'image' && TriggerImage 存在
    ↓
呼叫 handleImageUpload(File) → POST /api/v1/upload
    ↓
後端返回 URL: https://linebot.star-bit.io/uploads/...
    ↓
儲存到 cardsWithUploadedImages[*].button*TriggerImageUrl
    ↓
generateFlexMessage(cardsWithUploadedImages)
    ↓
addButton: action === 'image' → 使用 TriggerImageUrl 作為 uri
    ↓
生成 FlexMessage JSON
    ↓
POST /api/v1/messages → 創建訊息
    ↓
POST /api/v1/messages/{id}/send → 發送到 LINE
```

### 效能優化

1. **並行上傳**: 使用 `Promise.all` 同時上傳多個圖片
2. **避免重複上傳**: 檢查 `!card.button*TriggerImageUrl`
3. **非阻塞**: 不修改全域 state,避免不必要的重新渲染

---

## 相容性

### 向後相容
✅ 不影響現有功能:
- 主圖片上傳 ✅
- 按鈕 URL 動作 ✅
- 按鈕文字動作 ✅

### 前端相容
✅ TypeScript 編譯通過
✅ Vite HMR 正常運作
✅ 沒有 ESLint 錯誤

### 後端相容
✅ 使用現有的 `/api/v1/upload` API
✅ FlexMessage JSON 符合 LINE Messaging API 規範

---

## 測試建議

請參考 `test_trigger_image.md` 文檔進行完整測試:

1. **測試案例 1**: 主圖片上傳 (驗證不受影響)
2. **測試案例 2**: 按鈕 URL 動作 (驗證不受影響)
3. **測試案例 3**: 按鈕觸發圖片 (新功能 - 重點測試)
4. **測試案例 4**: 多個按鈕混合動作
5. **測試案例 5**: 多卡片輪播 + 觸發圖片
6. **測試案例 6**: 重複上傳防護

---

## 已知限制

1. **圖片格式**: 僅支援 jpg, jpeg, png, gif
2. **圖片大小**: 最大 5MB (後端限制)
3. **HTTPS 要求**: LINE 要求圖片 URL 必須為 HTTPS
4. **並行上傳數量**: 大量卡片可能對伺服器造成壓力

---

## 相關檔案

| 檔案 | 修改類型 | 影響範圍 |
|-----|---------|---------|
| `frontend/src/components/MessageCreation.tsx` | 修改 | 新增狀態欄位、修改上傳邏輯、修改 JSON 生成 |
| `backend/app/api/v1/upload.py` | 無修改 | 現有 API 繼續使用 |
| `backend/app/api/v1/messages.py` | 無修改 | 現有 API 繼續使用 |

---

## 驗證方法

### 方法 1: 瀏覽器 DevTools
```
Chrome DevTools → Network 標籤
檢查:
- /api/v1/upload (圖片上傳)
- /api/v1/messages (創建訊息)
- Request Payload 中的 flex_message_json
```

### 方法 2: 後端日誌
```bash
tail -f /data2/lili_hotel/backend/app.log
```

### 方法 3: 資料庫查詢
```sql
SELECT id, JSON_PRETTY(flex_message_json) as flex_message
FROM messages
ORDER BY created_at DESC
LIMIT 1;
```

### 方法 4: LINE 實際測試
1. 發送測試訊息
2. 點擊按鈕
3. 驗證圖片是否正確開啟

---

## 修復狀態

✅ **已完成**

- [x] 擴展卡片狀態
- [x] 修改 handlePublish 函數
- [x] 修改 generateFlexMessage 函數
- [x] TypeScript 編譯通過
- [x] 前端建構成功
- [x] 創建測試文檔

---

## 後續工作建議

1. **錯誤處理增強**:
   - 上傳失敗時顯示明確錯誤訊息
   - 提供重試機制

2. **使用者體驗改善**:
   - 顯示上傳進度條
   - 支援拖放上傳
   - 圖片壓縮優化

3. **效能優化**:
   - 實作圖片快取
   - 限制並行上傳數量
   - 支援 WebP 格式

4. **測試完善**:
   - 新增單元測試
   - E2E 測試覆蓋
   - 效能測試

---

## 聯絡資訊

如有問題或建議,請聯繫開發團隊。
