# 群發訊息「儲存草稿」功能實作

## 實作日期
2025-11-20

## 功能描述

根據規格文件 `01/spec/features/message_template.feature` (Rule 261-268) 實作「儲存草稿」功能，允許用戶在尚未完成所有欄位時先儲存草稿。

## 規格要求

### Rule: 儲存草稿時允許按鈕 URL 未填（草稿容錯）

```gherkin
Example: 儲存草稿時有按鈕但 URL 未填
  Given 內容管理者已加入按鈕「立即預訂」
  And 尚未輸入 URL 網址
  When 內容管理者點擊「儲存為草稿」
  Then 系統允許儲存草稿
  And 系統記錄 action_url 為 NULL
```

### Rule: 發送訊息前嚴格驗證按鈕 URL

```gherkin
Example: 發送訊息時有按鈕但 URL 未填
  Given 內容管理者已加入按鈕「立即預訂」
  And action_url 為 NULL
  When 內容管理者點擊「發送訊息」
  Then 系統阻擋發送
  And 系統顯示錯誤訊息「按鈕 URL 網址未填寫」
```

## 實作內容

### 1. 前端 - MessageCreation.tsx

**檔案**: `frontend/src/components/MessageCreation.tsx`

#### 修改內容

**修改前** (lines 436-439):
```typescript
const handleSaveDraft = () => {
  setIsDirty(false); // 儲存後清除未儲存標記
  toast.success('草稿已儲存');
};
```

**修改後** (lines 436-546):
```typescript
const handleSaveDraft = async () => {
  // 草稿驗證 - 僅檢查基本必填欄位
  const errors: string[] = [];

  // Check basic required fields only for draft
  if (!title || title.trim() === '') {
    errors.push('訊息標題');
  }
  if (!notificationMsg || notificationMsg.trim() === '') {
    errors.push('通知訊息');
  }
  if (!previewMsg || previewMsg.trim() === '') {
    errors.push('訊息預覽');
  }

  if (errors.length > 0) {
    setValidationErrors(errors);
    setValidationDialogOpen(true);
    return;
  }

  try {
    // Upload trigger images first (same as publish)
    const cardsWithUploadedImages = await Promise.all(cards.map(async (card) => {
      const updates: any = {};

      // Upload button1-4 trigger images if present
      if (card.button1Action === 'image' && card.button1TriggerImage && !card.button1TriggerImageUrl) {
        const url = await handleImageUpload(card.button1TriggerImage);
        if (url) updates.button1TriggerImageUrl = url;
      }
      // ... similar for button2-4 ...

      return { ...card, ...updates };
    }));

    // Generate flex message JSON using cards with uploaded image URLs
    const flexMessage = generateFlexMessage(cardsWithUploadedImages);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('請先登入');
      return;
    }

    // Prepare request body for draft
    const requestBody: any = {
      flex_message_json: JSON.stringify(flexMessage),
      target_type: targetType === 'all' ? 'all_friends' : 'filtered',
      schedule_type: 'draft',  // 固定為 draft
      notification_message: notificationMsg,
      preview_message: previewMsg || notificationMsg,
      message_content: title || notificationMsg || '未命名訊息',
      thumbnail: cards[0]?.image || null
    };

    // Add target filter for filtered audience
    if (targetType === 'filtered' && selectedFilterTags.length > 0) {
      requestBody.target_filter = {
        [filterCondition]: selectedFilterTags.map(t => t.name)
      };
    }

    // Create draft message
    const createResponse = await fetch('/api/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({ detail: '儲存草稿失敗' }));
      toast.error(errorData.detail || '儲存草稿失敗');
      return;
    }

    toast.success('草稿已儲存');
    setIsDirty(false); // 儲存後清除未儲存標記

    // Navigate back to message list after 1.5 seconds
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('message-list');
      }
    }, 1500);

  } catch (error) {
    console.error('儲存草稿錯誤:', error);
    toast.error('儲存草稿失敗，請檢查網絡連接');
  }
};
```

#### 實作特點

1. **簡化驗證**: 草稿只驗證 3 個基本欄位
   - ✅ 訊息標題 (title)
   - ✅ 通知訊息 (notification_message)
   - ✅ 訊息預覽 (preview_message)

2. **容錯設計**: 不驗證以下欄位（允許為空）
   - ❌ 按鈕 URL (button*Url) - 符合規格 Rule 261-268
   - ❌ 輪播卡片內容 (cardTitle, content, price)
   - ❌ 圖片上傳 (image)

3. **完整功能保留**:
   - ✅ 圖片上傳 - 觸發圖片如果已選擇則上傳
   - ✅ FlexMessage 生成 - 完整生成 JSON
   - ✅ 對象篩選 - 支援標籤篩選
   - ✅ 導航返回 - 儲存後 1.5 秒返回列表

### 2. 後端支援 (無需修改)

後端已完整支援草稿功能，無需額外修改：

#### Message 模型 (backend/app/models/message.py)

```python
class Message(Base):
    # ...
    send_status = Column(
        String(20),
        nullable=False,
        default="草稿",  # 預設為草稿
        comment="發送狀態：已排程/已發送/草稿/發送失敗",
        index=True,
    )
    # ...
```

#### MessageService (backend/app/services/message_service.py)

```python
async def create_message(
    self,
    db: AsyncSession,
    flex_message_json: str,
    target_type: str,
    schedule_type: str,  # "immediate" | "scheduled" | "draft"
    # ...
) -> Message:
    # 根據 schedule_type 設定 send_status
    if schedule_type == "draft":
        send_status = "草稿"
    elif schedule_type == "scheduled":
        send_status = "已排程"
    else:
        send_status = "待發送"

    # 儲存訊息
    message = Message(
        # ...
        send_status=send_status,
        # ...
    )
```

#### Messages API (backend/app/api/v1/messages.py)

```python
@router.post("", response_model=MessageDetail)
async def create_message(
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    创建群发消息

    Request Body:
        - schedule_type: "immediate" | "scheduled" | "draft"
    """
    message = await message_service.create_message(
        db=db,
        flex_message_json=data.flex_message_json,
        target_type=data.target_type,
        schedule_type=data.schedule_type,  # 支援 draft
        # ...
    )
    return message
```

## 驗證邏輯對比

### 「儲存草稿」驗證 (handleSaveDraft)

| 欄位類型 | 驗證規則 | 原因 |
|---------|---------|------|
| **基本資訊** | 必填 | 識別訊息基本資訊 |
| - 訊息標題 | ✅ 必填 | 用於列表顯示 |
| - 通知訊息 | ✅ 必填 | LINE API 要求 |
| - 訊息預覽 | ✅ 必填 | LINE API 要求 |
| **卡片內容** | 選填 | 草稿容錯 |
| - 卡片標題 | ❌ 選填 | 草稿可不完整 |
| - 卡片內容 | ❌ 選填 | 草稿可不完整 |
| - 卡片金額 | ❌ 選填 | 草稿可不完整 |
| - 卡片圖片 | ❌ 選填 | 草稿可不完整 |
| **按鈕設定** | 選填 | 符合規格 Rule 261-268 |
| - 按鈕文字 | ❌ 選填 | 草稿可無按鈕 |
| - 按鈕 URL | ❌ 選填 | **草稿允許 URL 為空** |

### 「發佈」驗證 (handlePublish -> validateForm)

| 欄位類型 | 驗證規則 | 原因 |
|---------|---------|------|
| **基本資訊** | 必填 | 同草稿 |
| - 訊息標題 | ✅ 必填 | - |
| - 通知訊息 | ✅ 必填 | - |
| - 訊息預覽 | ✅ 必填 | - |
| **卡片內容** | 必填（如啟用） | 發送嚴格驗證 |
| - 卡片標題 | ✅ 啟用時必填 | 確保內容完整 |
| - 卡片內容 | ✅ 啟用時必填 | 確保內容完整 |
| - 卡片金額 | ✅ 啟用時必填 | 確保內容完整 |
| - 卡片圖片 | ✅ 啟用時必填 | 確保內容完整 |
| **按鈕設定** | 必填 | 符合規格 Rule 270-278 |
| - 按鈕文字 | ✅ 啟用時必填 | 避免空按鈕 |
| - 按鈕 URL | ✅ 啟用時必填 | **發送必須有 URL** |

## 資料流程

### 儲存草稿流程

```
用戶填寫表單（部分欄位）
    ↓
點擊「儲存草稿」按鈕
    ↓
handleSaveDraft() 觸發
    ↓
驗證基本欄位（title, notification_message, preview_message）
    ↓ 驗證通過
上傳已選擇的觸發圖片
    ↓
生成 FlexMessage JSON
    ↓
POST /api/v1/messages
{
  "schedule_type": "draft",
  "flex_message_json": "...",
  "target_type": "all_friends",
  "notification_message": "...",
  "preview_message": "...",
  "message_content": "...",
  "thumbnail": "..."
}
    ↓
後端創建 Message
- send_status = "草稿"
- 儲存完整 FlexMessage JSON
- button URL 可為 NULL
    ↓
返回訊息 ID
    ↓
顯示「草稿已儲存」toast
    ↓
1.5 秒後返回訊息列表頁
```

### 發佈流程

```
用戶完成表單填寫
    ↓
點擊「發佈」按鈕
    ↓
handlePublish() 觸發
    ↓
validateForm() 完整驗證
- 基本欄位
- 啟用的卡片欄位
- 啟用的按鈕 + URL (嚴格驗證)
    ↓ 驗證通過
上傳已選擇的觸發圖片
    ↓
生成 FlexMessage JSON
    ↓
POST /api/v1/messages
{
  "schedule_type": "immediate" | "scheduled",
  // ... 所有欄位必須完整
}
    ↓
後端創建 Message
- send_status = "待發送" | "已排程"
    ↓
如果 schedule_type = "immediate":
  POST /api/v1/messages/{id}/send
  → line_app 發送到 LINE API
    ↓
顯示「發佈成功」toast
    ↓
1.5 秒後返回訊息列表頁
```

## 使用情境

### 情境 1: 儲存草稿後繼續編輯

```
1. 用戶填寫標題、通知訊息、預覽訊息
2. 點擊「儲存草稿」→ 成功儲存
3. 返回訊息列表
4. 點擊編輯草稿 (未來功能)
5. 繼續完成其他欄位
6. 點擊「發佈」→ 完整驗證 → 發送
```

### 情境 2: 草稿缺少欄位嘗試發佈

```
1. 用戶建立草稿，但按鈕 URL 未填
2. 點擊「發佈」
3. validateForm() 檢測到按鈕 URL 缺失
4. 顯示驗證錯誤對話框：「按鈕 1 URL」
5. 用戶返回填寫 URL
6. 再次點擊「發佈」→ 驗證通過 → 發送
```

### 情境 3: 只填基本資訊的草稿

```
1. 用戶只填寫：
   - 訊息標題: "春節優惠"
   - 通知訊息: "您有新的優惠訊息"
   - 訊息預覽: "春節特惠活動"
2. 未勾選卡片欄位（標題、內容、金額、圖片）
3. 未新增按鈕
4. 點擊「儲存草稿」→ 成功儲存
5. FlexMessage JSON 只包含基本結構
```

## 技術細節

### 草稿與發佈的差異

| 特性 | 儲存草稿 (handleSaveDraft) | 發佈 (handlePublish) |
|-----|---------------------------|---------------------|
| **驗證欄位** | 3 個基本欄位 | 所有啟用的欄位 |
| **按鈕 URL** | 可為空 | 必填（如按鈕啟用） |
| **schedule_type** | 固定 "draft" | "immediate" 或 "scheduled" |
| **send_status** | "草稿" | "待發送" 或 "已排程" |
| **發送操作** | 不發送 | immediate 時立即發送 |
| **導航返回** | 1.5 秒後返回列表 | 1.5 秒後返回列表 |

### 資料庫狀態

**草稿訊息**:
```sql
SELECT
  id,
  message_content,
  send_status,       -- "草稿"
  flex_message_json, -- 完整 JSON（按鈕 URL 可為空）
  created_at
FROM messages
WHERE send_status = '草稿';
```

**已發送訊息**:
```sql
SELECT
  id,
  message_content,
  send_status,       -- "已發送"
  send_time,         -- 實際發送時間
  send_count,        -- 發送人數
  flex_message_json  -- 完整 JSON（按鈕 URL 必須有值）
FROM messages
WHERE send_status = '已發送';
```

## 測試建議

### 測試案例 1: 儲存最小草稿

**步驟**:
1. 進入「建立群發訊息」頁面
2. 填寫:
   - 訊息標題: "測試草稿"
   - 通知訊息: "通知文字"
   - 訊息預覽: "預覽文字"
3. 不勾選任何卡片欄位
4. 不新增按鈕
5. 點擊「儲存草稿」

**預期結果**:
- ✅ 顯示「草稿已儲存」toast
- ✅ 1.5 秒後返回訊息列表
- ✅ 資料庫 send_status = "草稿"
- ✅ FlexMessage JSON 儲存成功

### 測試案例 2: 草稿缺少基本欄位

**步驟**:
1. 進入「建立群發訊息」頁面
2. 只填寫訊息標題
3. 通知訊息和預覽訊息留空
4. 點擊「儲存草稿」

**預期結果**:
- ❌ 顯示驗證錯誤對話框
- ❌ 錯誤訊息包含: "通知訊息", "訊息預覽"
- ❌ 不儲存草稿

### 測試案例 3: 草稿有按鈕但無 URL

**步驟**:
1. 填寫基本欄位（標題、通知、預覽）
2. 勾選按鈕 1
3. 填寫按鈕文字: "立即預訂"
4. 不填寫按鈕 URL
5. 點擊「儲存草稿」

**預期結果**:
- ✅ 儲存成功（符合規格 Rule 261-268）
- ✅ button1Url 為空字串或 undefined
- ✅ FlexMessage JSON 中按鈕 action.uri 為空或不存在

### 測試案例 4: 草稿發佈驗證

**步驟**:
1. 建立草稿（有按鈕但無 URL）
2. 儲存草稿成功
3. (未來) 重新編輯草稿
4. 不修改內容，直接點擊「發佈」

**預期結果**:
- ❌ 顯示驗證錯誤對話框
- ❌ 錯誤訊息包含: "按鈕 1 URL"
- ❌ 阻擋發送（符合規格 Rule 270-278）

### 測試案例 5: 完整草稿轉發佈

**步驟**:
1. 建立完整草稿（所有欄位都填寫）
2. 儲存草稿成功
3. (未來) 重新編輯草稿
4. 點擊「發佈」

**預期結果**:
- ✅ 驗證通過
- ✅ 發送成功
- ✅ send_status 從 "草稿" 變為 "已發送"

## 後續工作

### 1. 編輯草稿功能 (未實作)

**需求**: 用戶可從訊息列表點擊草稿進行編輯

**實作建議**:
```typescript
// MessageList.tsx
const handleEditDraft = (messageId: number) => {
  // 1. 讀取草稿資料
  fetch(`/api/v1/messages/${messageId}`)
    .then(res => res.json())
    .then(data => {
      // 2. 填充表單欄位
      // 3. 導航到 MessageCreation 組件
    });
};
```

### 2. 草稿列表篩選

**需求**: 訊息列表支援篩選草稿

**實作建議**:
```typescript
// MessageList.tsx
const [statusFilter, setStatusFilter] = useState<string>('all');

// API 呼叫
fetch(`/api/v1/messages?send_status=草稿`)
```

### 3. 草稿自動儲存

**需求**: 表單內容變更時自動儲存草稿

**實作建議**:
```typescript
// MessageCreation.tsx
useEffect(() => {
  if (isDirty && autoSaveEnabled) {
    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 30000); // 30 秒自動儲存

    return () => clearTimeout(timer);
  }
}, [isDirty, cards, title, notificationMsg, previewMsg]);
```

## 相關檔案

| 檔案 | 修改狀態 | 說明 |
|-----|---------|------|
| `frontend/src/components/MessageCreation.tsx` | ✅ 已修改 | 實作 handleSaveDraft 函數 |
| `backend/app/models/message.py` | ✅ 無需修改 | 已支援 send_status="草稿" |
| `backend/app/services/message_service.py` | ✅ 無需修改 | 已支援 schedule_type="draft" |
| `backend/app/api/v1/messages.py` | ✅ 無需修改 | 已支援創建草稿 |
| `01/spec/features/message_template.feature` | - | 規格文件 |

## 修復狀態

✅ **已完成並編譯成功**

- [x] 實作 handleSaveDraft 函數
- [x] 草稿簡化驗證邏輯
- [x] 支援按鈕 URL 為空
- [x] 整合圖片上傳流程
- [x] TypeScript 編譯通過
- [x] Vite HMR 成功 (4:44:40 PM)

## 聯絡資訊

如有問題或建議，請聯繫開發團隊。
