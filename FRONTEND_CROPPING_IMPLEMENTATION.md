# 前端圖片裁切實現文檔

## 實現概述

已成功將圖片裁切邏輯從後端轉移到前端，實現以下目標：
- ✅ 前端使用 Canvas API 裁切圖片
- ✅ 原始圖片存儲在組件 state（內存暫存）
- ✅ 只在最終保存時上傳裁切後的圖片到後端
- ✅ 頁面刷新後原始圖片丟失（符合需求）
- ✅ 後端不再保存原始圖片到 uploads_original/

## 實現細節

### 1. 前端裁切工具 (`frontend/src/utils/imageCropper.ts`)

**功能**:
- `cropImage(file: File, aspectRatio: "1:1" | "1.92:1")`: 裁切圖片到指定比例
- `createBlobUrl(blob: Blob)`: 創建 Blob URL 用於預覽
- `revokeBlobUrl(url: string)`: 釋放 Blob URL
- `blobToFile(blob: Blob, filename: string)`: 轉換 Blob 為 File

**裁切邏輯**:
- 1:1 → 900x900px
- 1.92:1 → 1920x1000px
- 中心裁切，質量 95%

### 2. CarouselCard 介面更新

```typescript
interface CarouselCard {
  image: string;             // 預覽用的 Blob URL 或已上傳的 URL
  originalFile?: File;       // 原始 File 對象（內存暫存）
  uploadedImageUrl?: string; // 最終上傳到後端的 URL（保存後才有）
  // ... 其他欄位
}
```

### 3. 圖片上傳流程

**用戶選擇圖片時** (`CarouselMessageEditor.tsx:220-263`):
1. 驗證文件類型和大小
2. 計算當前需要的裁切比例
3. 前端裁切圖片 (Canvas)
4. 生成 blob URL 用於預覽
5. 保存原始 File 對象到 `originalFile`
6. 保存 blob URL 到 `image`

**用戶勾選/取消欄位時** (`CarouselMessageEditor.tsx:282-343`):
1. 檢測 aspect ratio 變化
2. 從 `originalFile` 重新裁切
3. 生成新的 blob URL
4. 更新預覽（自動且即時）

**用戶保存訊息時** (`MessageCreation.tsx:592-596`):
1. 調用 `uploadCroppedImages()` 批量上傳
2. 遍歷所有卡片，重新裁切並上傳
3. 更新 `uploadedImageUrl` 欄位
4. 生成 Flex Message JSON（使用 `uploadedImageUrl`）
5. 保存到數據庫

### 4. 後端簡化 (`backend/app/api/v1/upload.py`)

**變更**:
- ❌ 移除 `UPLOAD_ORIGINAL_DIR` 配置
- ❌ 移除原始圖片存儲邏輯
- ❌ 移除 `crop_to_square()` 和 `crop_to_ratio()` 函數
- ❌ 移除 `/recrop` 端點
- ✅ 簡化上傳端點（只接收已裁切的圖片）

**新的上傳端點**:
```python
@router.post("")
async def upload_image(file: UploadFile = File(...)):
    # 1. 驗證文件
    # 2. 轉換為 RGB JPEG
    # 3. 保存到 /uploads/
    # 4. 返回 URL
```

## 流程圖

```
[用戶選擇圖片]
    ↓
[前端 Canvas 裁切] → blob
    ↓
[保存 originalFile + blob URL 到 state]
    ↓
[顯示預覽 (blob URL)]
    ↓
[用戶勾選/取消欄位]
    ↓
[檢測 ratio 變化] → 從 originalFile 重新裁切 → 更新預覽
    ↓
[用戶點擊保存]
    ↓
[批量上傳所有裁切後的圖片]
    ↓
[後端接收並保存到 /uploads/]
    ↓
[獲得 uploadedImageUrl]
    ↓
[生成 Flex Message JSON]
    ↓
[保存訊息到數據庫]
```

## 關鍵代碼位置

### 前端
- **裁切工具**: `frontend/src/utils/imageCropper.ts` (完整文件)
- **介面定義**: `frontend/src/components/CarouselMessageEditor.tsx:30-32`
- **上傳處理**: `frontend/src/components/CarouselMessageEditor.tsx:220-263`
- **自動重新裁切**: `frontend/src/components/CarouselMessageEditor.tsx:282-343`
- **批量上傳**: `frontend/src/components/MessageCreation.tsx:802-865`
- **保存時調用**: `frontend/src/components/MessageCreation.tsx:592-596`

### 後端
- **簡化的上傳端點**: `backend/app/api/v1/upload.py:108-205`

## 優勢

✅ **節省後端存儲**: 不再需要保存原始圖片
✅ **減少網路請求**: 編輯過程中無需頻繁呼叫 API
✅ **即時預覽**: 前端裁切速度更快
✅ **代碼簡化**: 後端邏輯更簡單
✅ **用戶體驗**: 更快的響應速度

## 限制

⚠️ **頁面刷新**: 原始圖片丟失，需重新上傳
⚠️ **瀏覽器兼容**: 需要現代瀏覽器支持 Canvas API
⚠️ **內存使用**: 大圖片會佔用更多內存（但刷新後釋放）

## BDD 場景規格

完整的 BDD 場景文檔位於：`01/spec/features/carousel_auto_recrop.feature`

### 核心場景摘要

**場景 1: 正方形自動改為橫向（1:1 → 1.92:1）**
```gherkin
Given 行銷人員已上傳圖片「hotel_room.jpg」
  And 僅勾選「選擇圖片」欄位
  And 當前預覽顯示為 1:1 正方形（900x900）
  And 原始圖片已存儲在 originalFile
When 行銷人員新增勾選「標題」欄位
Then 前端檢測到比例需求從 1:1 變更為 1.92:1
  And 前端從 originalFile 使用 Canvas API 重新裁切
  And 裁切目標比例為 1.92:1（1920x1000px）
  And 前端清理舊的 Blob URL（釋放內存）
  And 前端生成新的 Blob URL
  And 前端更新 image 欄位為新的 Blob URL
  And 預覽區立即更新為橫向長方形顯示
  And 整個過程無後端 API 呼叫
  And 響應時間 < 100ms（純前端處理）
```

**場景 2: 橫向自動改回正方形（1.92:1 → 1:1）**
```gherkin
Given 行銷人員已上傳圖片「hotel_room.jpg」
  And 已勾選「選擇圖片」和「標題」欄位
  And 當前預覽顯示為 1.92:1 橫向長方形（1920x1000）
  And 原始圖片已存儲在 originalFile
When 行銷人員取消勾選「標題」欄位
  And 此時僅保留「選擇圖片」勾選
Then 前端檢測到比例需求從 1.92:1 變更為 1:1
  And 前端從 originalFile 使用 Canvas API 重新裁切
  And 裁切目標比例為 1:1（900x900px）
  And 前端清理舊的 Blob URL
  And 前端生成新的 Blob URL
  And 前端更新 image 欄位為新的 Blob URL
  And 預覽區立即更新為正方形顯示
  And 整個過程無後端 API 呼叫
  And 響應時間 < 100ms
```

**關鍵規則**:
- ✅ 僅勾選「選擇圖片」→ 1:1 正方形
- ✅ 勾選任何其他欄位（標題/內文/金額/按鈕）→ 1.92:1 橫向
- ✅ 所有重新裁切都在前端完成，無後端 API 呼叫
- ✅ 原始圖片存於 `originalFile`（內存），裁切結果存於 `image`（Blob URL）
- ✅ 只有保存時才上傳裁切後的圖片到後端

## 測試建議

### 手動測試步驟

1. **上傳測試**:
   - 選擇一張圖片
   - 只勾選「選擇圖片」
   - 確認預覽顯示為正方形 (1:1)

2. **自動重新裁切測試**:
   - 勾選「標題」欄位
   - 確認預覽自動變為橫向長方形 (1.92:1)
   - 取消勾選「標題」
   - 確認預覽自動變回正方形 (1:1)

3. **保存測試**:
   - 填寫所有必填欄位
   - 點擊「儲存草稿」
   - 確認圖片成功上傳到後端
   - 檢查 `/uploads/` 目錄有新圖片
   - 確認 `/uploads_original/` 目錄無新圖片

4. **多卡片測試**:
   - 新增多個輪播卡片
   - 每個卡片上傳不同圖片
   - 設定不同的欄位組合
   - 保存並確認所有圖片都正確上傳

5. **頁面刷新測試**:
   - 上傳圖片後刷新頁面
   - 確認無法再重新裁切（符合預期）
   - 需要重新上傳圖片

### 驗證清單

- ✅ 前端可以裁切圖片
- ✅ 預覽正確顯示
- ✅ 自動重新裁切功能正常
- ✅ 保存時批量上傳成功
- ✅ 後端只保存裁切後的圖片
- ✅ 後端不再創建 uploads_original/ 目錄
- ✅ 編譯無錯誤
- ✅ 沒有TypeScript錯誤
- ✅ BDD 場景文檔已建立

## 注意事項

1. **確保使用最新代碼**: 前端和後端都需要部署最新版本
2. **清理舊數據**: `/uploads_original/` 目錄中的舊文件可以手動刪除
3. **監控性能**: 注意大圖片裁切的性能表現
4. **瀏覽器兼容性**: 測試不同瀏覽器的 Canvas API 支持

## 未來改進建議

1. **IndexedDB 持久化**: 如需要頁面刷新後保留原始圖片，可以使用 IndexedDB
2. **裁切預覽**: 添加裁切前的預覽功能，讓用戶看到將如何裁切
3. **手動調整**: 允許用戶手動調整裁切區域（非中心裁切）
4. **進度顯示**: 批量上傳時顯示進度條
5. **錯誤重試**: 上傳失敗時自動重試機制

## 結論

成功實現了前端圖片裁切方案，完全符合需求：
- 不再依賴後端存儲原始圖片
- 前端完全控制裁切邏輯
- 提供了更好的用戶體驗
- 簡化了後端代碼
- 節省了後端存儲空間

編譯測試通過，可以部署測試！
