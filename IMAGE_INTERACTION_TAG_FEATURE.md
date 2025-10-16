# 圖片模板互動標籤功能實現文檔

## 功能概述

此功能確保在建立群發訊息時，圖片類型模板（圖片點擊型和圖卡按鈕型）**無論是否有動作按鈕，都會顯示「互動標籤」欄位**。

## 修改內容

### 1. 前端修改 (frontend/src/features/campaigns/pages/CampaignCreatePage.tsx)

#### 變更前行為：
- 互動標籤欄位只在動作按鈕啟用時顯示
- 所有模板類型使用相同的邏輯

#### 變更後行為：
- **圖片類型模板（image 和 image_text）**：互動標籤始終顯示，獨立於動作按鈕狀態
- **文字類型模板（text）**：互動標籤僅在動作按鈕啟用時顯示（保持原有邏輯）

#### 具體修改：

**1. UI 層面的變更（行 430-475）：**
```tsx
{/* 互動標籤 - 圖片類型始終顯示 */}
{(templateType === 'image' || templateType === 'image_text') && (
  <div className="form-group-inline">
    <label className="form-label-inline">
      互動標籤
      <InfoCircleOutlined className="info-icon" style={{ marginLeft: 8 }} />
    </label>
    <Input
      className="form-input"
      placeholder="輸入互動標籤"
      value={currentItem.actionButtonTag}
      onChange={(e) => {
        const updatedItems = [...carouselItems];
        updatedItems[currentCarouselIndex] = {
          ...updatedItems[currentCarouselIndex],
          actionButtonTag: e.target.value,
        };
        setCarouselItems(updatedItems);
      }}
    />
  </div>
)}

{/* 文字型的互動標籤（只在動作按鈕啟用時顯示） */}
{templateType === 'text' && actionButton1Enabled && (
  <div className="form-group-inline">
    <label className="form-label-inline">
      互動標籤
      <InfoCircleOutlined className="info-icon" style={{ marginLeft: 8 }} />
    </label>
    <Input
      className="form-input"
      placeholder="可依據會員互動結果自動貼上標籤"
      value={actionButton1Tag}
      onChange={(e) => setActionButton1Tag(e.target.value)}
    />
  </div>
)}
```

**2. 資料提交邏輯更新（行 151-157）：**
```tsx
// 獲取互動標籤（圖片類型從 currentItem，其他類型從 formData）
let interactionTag: string | undefined;
if (templateType === 'image' || templateType === 'image_text') {
  interactionTag = carouselItems[0]?.actionButtonTag || undefined;
} else {
  interactionTag = formData.interaction_tag || actionButton1Tag || undefined;
}
```

### 2. 資料庫架構

資料庫已經支持互動標籤功能，無需修改：

- **campaigns 表**：已有 `interaction_tag` 欄位（varchar(50)）
- **message_templates 表**：已有 `interaction_tag_id` 欄位
- **interaction_tags 表**：專門用於管理互動標籤

### 3. 後端 API

後端 API 已經完整支持，無需修改：

- `POST /api/v1/campaigns`：接受 `interaction_tag` 參數
- Schema 定義（`app/schemas/campaign.py`）：`CampaignCreate` 已包含 `interaction_tag` 欄位
- 資料處理（`app/api/v1/campaigns.py:83`）：正確處理並存儲 `interaction_tag`

## 使用場景

### 場景 1：圖片點擊型（無動作按鈕）
1. 選擇模板類型：「圖片點擊型」
2. 上傳圖片
3. **不勾選**「動作按鈕」
4. 填寫「互動標籤」：例如 "viewed_promotion"
5. 填寫其他必填欄位
6. 發送訊息

**結果**：會員點擊圖片時，系統會自動給該會員貼上 "viewed_promotion" 標籤

### 場景 2：圖片點擊型（有動作按鈕）
1. 選擇模板類型：「圖片點擊型」
2. 上傳圖片
3. **勾選**「動作按鈕」，輸入按鈕文字
4. 選擇互動類型：例如「觸發新訊息」
5. 填寫「互動標籤」：例如 "clicked_button"
6. 填寫其他必填欄位
7. 發送訊息

**結果**：會員點擊動作按鈕時，除了觸發相應的互動行為，還會自動貼上 "clicked_button" 標籤

### 場景 3：圖卡按鈕型（輪播）
1. 選擇模板類型：「圖卡按鈕型」
2. 上傳第一張圖片
3. 填寫訊息文字
4. 填寫「互動標籤」：例如 "carousel_item_1"
5. 點擊「新增輪播」添加更多圖片
6. 為每個輪播項目設定不同的互動標籤
7. 發送訊息

**結果**：每個輪播項目都可以有獨立的互動標籤，便於追蹤會員對不同內容的興趣

## 技術優勢

1. **更精確的用戶行為追蹤**：即使沒有動作按鈕，也能透過互動標籤追蹤用戶查看圖片的行為
2. **靈活的標籤策略**：不同的輪播項目可以設定不同的標籤
3. **向下相容**：文字型模板保持原有邏輯，不影響現有功能
4. **統一的資料結構**：所有模板類型都使用相同的 `interaction_tag` 欄位

## 測試建議

### 單元測試
1. 測試圖片模板在無動作按鈕時，互動標籤欄位是否顯示
2. 測試圖片模板在有動作按鈕時，互動標籤欄位是否顯示
3. 測試文字模板在無動作按鈕時，互動標籤欄位是否隱藏
4. 測試提交資料時，互動標籤是否正確傳遞到後端

### 整合測試
1. 建立圖片點擊型活動（無動作按鈕），填寫互動標籤，發送
2. 檢查資料庫 campaigns 表，確認 interaction_tag 欄位已正確存儲
3. 建立輪播型活動，為每個項目設定不同標籤
4. 模擬用戶互動，確認標籤正確貼到會員資料

## 資料流程

```
前端輸入（互動標籤）
    ↓
carouselItems[n].actionButtonTag（圖片型）
或 actionButton1Tag（文字型）
    ↓
handleSubmit() → interactionTag
    ↓
CampaignCreate.interaction_tag
    ↓
POST /api/v1/campaigns
    ↓
Campaign.interaction_tag（資料庫）
```

## 未來擴展

1. **標籤預設值**：可以為常用標籤建立預設選項
2. **標籤管理界面**：統一管理和查看所有互動標籤
3. **標籤分析報告**：分析哪些標籤最有效，會員的標籤分布
4. **自動標籤建議**：根據活動類型和內容，AI 建議合適的標籤名稱
