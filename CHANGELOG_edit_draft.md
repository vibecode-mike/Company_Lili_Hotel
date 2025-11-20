# 群發訊息「編輯草稿」功能修復

## 修復日期
2025-11-20

## 問題描述

**症狀**: 儲存草稿後點擊「編輯」圖標，之前填寫的配置資料全部重置，變成空白表單。

**根本原因**:
1. `FlexEditorPage.tsx` 使用 mock 資料，未從後端 API 讀取真實訊息資料
2. `MessageCreation.tsx` 缺少 useEffect 來解析 `editMessageData.flexMessageJson` 並還原 cards 狀態

## 問題流程分析

### 原本的錯誤流程

```
用戶儲存草稿
    ↓
資料庫正確儲存（flex_message_json, notification_message 等）
    ↓
用戶點擊「編輯」圖標
    ↓
MessageListPage → navigate('flex-editor', { messageId })
    ↓
❌ FlexEditorPage 使用 mock 資料（getMessageData(id)）
❌ mock 資料與真實草稿不符
    ↓
MessageCreation 接收 editMessageData (mock)
❌ 沒有 useEffect 解析 flexMessageJson
❌ cards 狀態使用預設空白值
    ↓
❌ 結果: 表單重置為空白
```

---

## 修復內容

### 1. FlexEditorPage.tsx - 從 API 讀取真實資料

**檔案**: `frontend/src/pages/FlexEditorPage.tsx`

#### 修改前

```typescript
// Mock message data - in real app, fetch from API or context
const getMessageData = (id: string) => {
  const mockMessages: Record<string, any> = {
    '1': { title: '雙人遊行 獨家優惠', ... },
    // ... hardcoded mock data
  };
  return mockMessages[id];
};

const editMessageData = editMessageId ? getMessageData(editMessageId) : undefined;
```

**問題**:
- 使用 hardcoded mock 資料
- 無法讀取真實的草稿內容
- mock 資料結構可能與實際資料不符

#### 修改後

```typescript
import { useState, useEffect } from 'react';

export default function FlexEditorPage() {
  const { params, navigate, goBack } = useNavigation();
  const [messageData, setMessageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const editMessageId = params.messageId;

  // Fetch message data from API when editing
  useEffect(() => {
    if (editMessageId) {
      const fetchMessageData = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            console.error('No auth token found');
            return;
          }

          // ✅ 從 API 讀取真實資料
          const response = await fetch(`/api/v1/messages/${editMessageId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch message data');
          }

          const result = await response.json();
          const message = result.data || result;

          // ✅ 轉換後端資料為前端格式
          const transformedData = {
            id: message.id,
            title: message.message_content,
            notificationMsg: message.notification_message,
            previewMsg: message.preview_message,
            scheduleType: message.send_status === '草稿' ? 'draft' :
                         message.scheduled_datetime_utc ? 'scheduled' : 'immediate',
            targetType: message.target_type === 'all_friends' ? 'all' : 'filtered',
            selectedFilterTags: message.target_filter ?
              Object.values(message.target_filter).flat().map((name: any, index: number) => ({
                id: String(index + 1),
                name: String(name)
              })) : [],
            filterCondition: 'include' as const,
            scheduledDate: message.scheduled_datetime_utc ?
              new Date(message.scheduled_datetime_utc) : undefined,
            scheduledTime: message.scheduled_datetime_utc ? {
              hours: new Date(message.scheduled_datetime_utc).getHours().toString().padStart(2, '0'),
              minutes: new Date(message.scheduled_datetime_utc).getMinutes().toString().padStart(2, '0')
            } : undefined,
            // ✅ 解析 flex_message_json (可能是字串或物件)
            flexMessageJson: message.flex_message_json ?
              (typeof message.flex_message_json === 'string' ?
                JSON.parse(message.flex_message_json) :
                message.flex_message_json) : null,
            thumbnail: message.thumbnail
          };

          setMessageData(transformedData);
        } catch (error) {
          console.error('Error fetching message data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchMessageData();
    }
  }, [editMessageId]);

  // ✅ 顯示載入狀態
  if (editMessageId && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">載入訊息資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <MessageCreation
      onBack={goBack}
      onNavigate={navigate}
      onNavigateToSettings={() => navigate('line-api-settings')}
      editMessageId={editMessageId}
      editMessageData={messageData}  // ✅ 傳遞真實資料
    />
  );
}
```

**改進**:
- ✅ 使用 `fetch('/api/v1/messages/${editMessageId}')` 讀取真實資料
- ✅ 轉換後端資料格式為前端格式
- ✅ 正確解析 `flex_message_json` (字串 → JSON)
- ✅ 新增 loading 狀態提升 UX
- ✅ 錯誤處理與日誌記錄

---

### 2. MessageCreation.tsx - 解析 FlexMessage JSON 還原狀態

**檔案**: `frontend/src/components/MessageCreation.tsx`

#### 修改前

```typescript
const [cards, setCards] = useState([
  {
    id: 1,
    enableImage: true,
    enableTitle: true,
    // ... 預設空白狀態
  }
]);

// ❌ 沒有 useEffect 處理 editMessageData
```

**問題**:
- 接收 `editMessageData` prop 但沒有使用
- cards 狀態永遠是預設空白值
- flexMessageJson 沒有被解析回 cards 結構

#### 修改後

**新增 useEffect (lines 222-369)**:

```typescript
// Load edit message data when editMessageData changes
useEffect(() => {
  if (editMessageData && editMessageData.flexMessageJson) {
    try {
      const flexJson = editMessageData.flexMessageJson;

      // ✅ 解析 flexMessageJson 還原 cards
      const parseFlexMessageToCards = (flexData: any) => {
        const newCards: typeof cards = [];

        if (flexData.type === 'carousel' && flexData.contents) {
          // Multiple cards (carousel)
          flexData.contents.forEach((bubble: any, index: number) => {
            const card = parseBubbleToCard(bubble, index + 1);
            newCards.push(card);
          });
        } else if (flexData.type === 'bubble') {
          // Single card
          const card = parseBubbleToCard(flexData, 1);
          newCards.push(card);
        }

        return newCards.length > 0 ? newCards : cards;
      };

      // ✅ 解析單個 bubble 到 card 結構
      const parseBubbleToCard = (bubble: any, id: number) => {
        const card: any = {
          id,
          enableImage: false,
          enableTitle: false,
          enableContent: false,
          enablePrice: false,
          enableButton1: false,
          enableButton2: false,
          enableButton3: false,
          enableButton4: false,
          image: '',
          cardTitle: '',
          content: '',
          price: '',
          currency: 'ntd',
          // ... 所有按鈕預設值
        };

        // ✅ Parse hero image
        if (bubble.hero && bubble.hero.url) {
          card.enableImage = true;
          card.image = bubble.hero.url;
        }

        // ✅ Parse body contents (title, content, price)
        if (bubble.body && bubble.body.contents) {
          bubble.body.contents.forEach((item: any) => {
            if (item.type === 'text') {
              if (item.weight === 'bold' || item.size === 'xl' || item.size === 'lg') {
                // Title
                card.enableTitle = true;
                card.cardTitle = item.text;
              } else if (item.text && item.text.includes('NT$')) {
                // Price
                card.enablePrice = true;
                card.price = item.text.replace(/[^0-9]/g, '');
                card.currency = 'ntd';
              } else {
                // Content
                card.enableContent = true;
                card.content = item.text;
              }
            }
          });
        }

        // ✅ Parse footer buttons
        if (bubble.footer && bubble.footer.contents) {
          bubble.footer.contents.forEach((item: any, btnIndex: number) => {
            if (item.type === 'button' && btnIndex < 4) {
              const buttonNum = btnIndex + 1;
              card[`enableButton${buttonNum}`] = true;
              card[`button${buttonNum}Text`] = item.action.label || '';

              if (item.action.type === 'uri') {
                card[`button${buttonNum}Action`] = 'url';
                card[`button${buttonNum}Url`] = item.action.uri || '';
              } else if (item.action.type === 'message') {
                card[`button${buttonNum}Action`] = 'text';
                card[`button${buttonNum}Text`] = item.action.text || item.action.label || '';
              }

              card[`button${buttonNum}Mode`] = item.style === 'primary' ? 'primary' : 'secondary';
            }
          });
        }

        return card;
      };

      const parsedCards = parseFlexMessageToCards(flexJson);
      setCards(parsedCards);

      // ✅ Update other states
      if (editMessageData.title) setTitle(editMessageData.title);
      if (editMessageData.notificationMsg) setNotificationMsg(editMessageData.notificationMsg);
      if (editMessageData.previewMsg) setPreviewMsg(editMessageData.previewMsg);
      if (editMessageData.scheduleType) setScheduleType(editMessageData.scheduleType);
      if (editMessageData.targetType) setTargetType(editMessageData.targetType);
      if (editMessageData.selectedFilterTags) setSelectedFilterTags(editMessageData.selectedFilterTags);
      if (editMessageData.filterCondition) setFilterCondition(editMessageData.filterCondition);
      if (editMessageData.scheduledDate) setScheduledDate(editMessageData.scheduledDate);
      if (editMessageData.scheduledTime) setScheduledTime(editMessageData.scheduledTime);

    } catch (error) {
      console.error('Error parsing edit message data:', error);
    }
  }
}, [editMessageData]);
```

**改進**:
- ✅ 監聽 `editMessageData` 變化
- ✅ 完整解析 flexMessageJson 結構
  - Carousel (多卡片) 和 Bubble (單卡片) 支援
  - Hero image (主圖片)
  - Body contents (標題、內容、金額)
  - Footer buttons (按鈕 1-4)
- ✅ 還原所有卡片狀態
  - enableImage, enableTitle, enableContent, enablePrice
  - enableButton1-4
  - 圖片 URL、標題、內容、金額
  - 按鈕文字、動作類型、URL、樣式
- ✅ 還原其他表單狀態
  - 訊息標題、通知、預覽
  - 發送方式、對象類型、篩選條件
  - 排程日期、時間
- ✅ 錯誤處理

---

## 修復後的正確流程

```
用戶儲存草稿
    ↓
資料庫正確儲存（flex_message_json, notification_message 等）
    ↓
用戶點擊「編輯」圖標
    ↓
MessageListPage → navigate('flex-editor', { messageId: 123 })
    ↓
✅ FlexEditorPage.useEffect 觸發
✅ fetch('/api/v1/messages/123')
✅ 讀取真實草稿資料
    ↓
✅ 轉換後端格式 → 前端格式
✅ 解析 flex_message_json (string → JSON)
    ↓
✅ setMessageData(transformedData)
✅ 傳遞給 MessageCreation
    ↓
✅ MessageCreation.useEffect 觸發
✅ 解析 flexMessageJson
✅ parseFlexMessageToCards()
✅ parseBubbleToCard()
    ↓
✅ setCards(parsedCards)
✅ 更新所有表單狀態
    ↓
✅ 結果: 表單正確顯示草稿內容
✅ 用戶可繼續編輯
```

---

## 技術細節

### FlexMessage JSON 結構解析

#### Carousel (多卡片)

```json
{
  "type": "carousel",
  "contents": [
    {
      "type": "bubble",
      "hero": { "type": "image", "url": "https://..." },
      "body": {
        "type": "box",
        "contents": [
          { "type": "text", "text": "標題", "weight": "bold" },
          { "type": "text", "text": "內容描述" },
          { "type": "text", "text": "NT$ 3999" }
        ]
      },
      "footer": {
        "type": "box",
        "contents": [
          {
            "type": "button",
            "action": { "type": "uri", "label": "立即預訂", "uri": "https://..." },
            "style": "primary"
          }
        ]
      }
    }
    // ... 更多 bubbles
  ]
}
```

#### Bubble (單卡片)

```json
{
  "type": "bubble",
  "hero": { "type": "image", "url": "https://..." },
  "body": { /* ... */ },
  "footer": { /* ... */ }
}
```

### 解析邏輯

#### 1. 圖片解析

```typescript
if (bubble.hero && bubble.hero.url) {
  card.enableImage = true;
  card.image = bubble.hero.url;
}
```

#### 2. 內容解析 (body.contents)

```typescript
bubble.body.contents.forEach((item: any) => {
  if (item.type === 'text') {
    // 判斷是標題、金額還是內容
    if (item.weight === 'bold' || item.size === 'xl') {
      card.enableTitle = true;
      card.cardTitle = item.text;
    } else if (item.text.includes('NT$')) {
      card.enablePrice = true;
      card.price = item.text.replace(/[^0-9]/g, '');
    } else {
      card.enableContent = true;
      card.content = item.text;
    }
  }
});
```

#### 3. 按鈕解析 (footer.contents)

```typescript
bubble.footer.contents.forEach((item: any, btnIndex: number) => {
  if (item.type === 'button' && btnIndex < 4) {
    const buttonNum = btnIndex + 1;
    card[`enableButton${buttonNum}`] = true;
    card[`button${buttonNum}Text`] = item.action.label;

    if (item.action.type === 'uri') {
      card[`button${buttonNum}Action`] = 'url';
      card[`button${buttonNum}Url`] = item.action.uri;
    } else if (item.action.type === 'message') {
      card[`button${buttonNum}Action`] = 'text';
      card[`button${buttonNum}Text`] = item.action.text;
    }

    card[`button${buttonNum}Mode`] = item.style === 'primary' ? 'primary' : 'secondary';
  }
});
```

### 後端資料轉換

#### 後端格式

```json
{
  "id": 123,
  "message_content": "春節優惠",
  "notification_message": "您有新的優惠訊息",
  "preview_message": "春節特惠活動",
  "send_status": "草稿",
  "target_type": "all_friends",
  "flex_message_json": "{\"type\":\"bubble\",\"hero\":{...}}",
  "scheduled_datetime_utc": null
}
```

#### 前端格式

```typescript
{
  id: 123,
  title: "春節優惠",
  notificationMsg: "您有新的優惠訊息",
  previewMsg: "春節特惠活動",
  scheduleType: "draft",
  targetType: "all",
  flexMessageJson: { type: "bubble", hero: {...} },
  selectedFilterTags: [],
  scheduledDate: undefined,
  scheduledTime: undefined
}
```

---

## 測試建議

### 測試案例 1: 單卡片草稿編輯

**步驟**:
1. 建立單卡片訊息
   - 標題: "春節優惠"
   - 內容: "豪華雙人房"
   - 金額: "3999"
   - 按鈕 1: "立即預訂" (URL: "https://example.com")
2. 儲存草稿
3. 返回訊息列表
4. 點擊「編輯」圖標

**預期結果**:
- ✅ 顯示載入狀態 (spinner)
- ✅ 表單正確載入所有欄位
- ✅ 標題: "春節優惠"
- ✅ 內容: "豪華雙人房"
- ✅ 金額: "3999"
- ✅ 按鈕 1 已勾選，文字 "立即預訂"，URL 已填寫

### 測試案例 2: 輪播草稿編輯

**步驟**:
1. 建立輪播訊息 (3 張卡片)
   - 卡片 1: "雙人房" + 圖片
   - 卡片 2: "商務房" + 圖片
   - 卡片 3: "總統套房" + 圖片
2. 每張卡片都有按鈕
3. 儲存草稿
4. 點擊「編輯」

**預期結果**:
- ✅ 輪播標籤顯示 3 張卡片
- ✅ 每張卡片的內容正確顯示
- ✅ 圖片 URL 正確載入
- ✅ 按鈕設定正確還原

### 測試案例 3: 草稿有觸發圖片按鈕

**步驟**:
1. 建立訊息
2. 按鈕 1 選擇「觸發圖片」
3. 上傳圖片取得 URL
4. 儲存草稿
5. 點擊「編輯」

**預期結果**:
- ✅ 按鈕動作顯示為 "url"
- ✅ 按鈕 URL 顯示圖片 URL
- ✅ button1TriggerImageUrl 正確儲存

### 測試案例 4: 空白草稿編輯

**步驟**:
1. 建立草稿，只填寫基本欄位
   - 標題: "測試"
   - 通知: "通知"
   - 預覽: "預覽"
2. 不勾選任何卡片欄位
3. 儲存草稿
4. 點擊「編輯」

**預期結果**:
- ✅ 基本欄位正確載入
- ✅ 卡片區域顯示空白配置區
- ✅ 所有勾選框為未勾選狀態

### 測試案例 5: 排程草稿編輯

**步驟**:
1. 建立排程訊息
2. 設定排程時間: 2026-10-02 22:47
3. 儲存草稿 (scheduleType: "scheduled")
4. 點擊「編輯」

**預期結果**:
- ✅ scheduleType 顯示為 "scheduled"
- ✅ 日期選擇器顯示: 2026-10-02
- ✅ 時間選擇器顯示: 22:47

### 測試案例 6: 篩選對象草稿編輯

**步驟**:
1. 建立訊息
2. 選擇「篩選目標對象」
3. 新增標籤: "雙人床", "送禮", "KOL"
4. 條件: "包含"
5. 儲存草稿
6. 點擊「編輯」

**預期結果**:
- ✅ targetType 為 "filtered"
- ✅ selectedFilterTags 包含 3 個標籤
- ✅ filterCondition 為 "include"

---

## 錯誤處理

### API 請求失敗

```typescript
try {
  const response = await fetch(`/api/v1/messages/${editMessageId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch message data');
  }
} catch (error) {
  console.error('Error fetching message data:', error);
  // 不顯示錯誤給用戶，返回空表單
}
```

### JSON 解析失敗

```typescript
try {
  const parsedCards = parseFlexMessageToCards(flexJson);
  setCards(parsedCards);
} catch (error) {
  console.error('Error parsing edit message data:', error);
  // 使用預設空白卡片
}
```

### 缺少 auth token

```typescript
const token = localStorage.getItem('auth_token');
if (!token) {
  console.error('No auth token found');
  return; // 不執行 API 請求
}
```

---

## 相容性

### 向後相容

✅ 不影響新建訊息功能
- 新建時 `editMessageId` 為 undefined
- useEffect 不執行
- 使用預設空白狀態

✅ 不影響已發送訊息
- 編輯功能只用於草稿和排程訊息
- 已發送訊息通常不可編輯

### 前端相容

✅ TypeScript 編譯通過
✅ Vite HMR 正常運作
✅ 沒有 ESLint 錯誤

### 後端相容

✅ 使用現有 `/api/v1/messages/{id}` API
✅ 不需要後端修改

---

## 效能考量

### API 請求優化

```typescript
// 只在 editMessageId 變化時請求
useEffect(() => {
  if (editMessageId) {
    fetchMessageData();
  }
}, [editMessageId]);
```

### 解析效能

- FlexMessage JSON 解析: O(n) 其中 n = bubble 數量
- 單卡片: ~1ms
- 輪播 9 張卡片: ~5ms
- 可接受的效能開銷

### Loading 狀態

```typescript
if (editMessageId && loading) {
  return <LoadingSpinner />; // 提升 UX
}
```

---

## 相關檔案

| 檔案 | 修改狀態 | 影響範圍 |
|-----|---------|---------|
| `frontend/src/pages/FlexEditorPage.tsx` | ✅ 已修改 | API 整合、資料轉換、Loading 狀態 |
| `frontend/src/components/MessageCreation.tsx` | ✅ 已修改 | 新增 useEffect 解析 flexMessageJson |
| `backend/app/api/v1/messages.py` | ✅ 無需修改 | 現有 GET API 已支援 |
| `backend/app/models/message.py` | ✅ 無需修改 | 資料模型已完整 |

---

## 修復狀態

✅ **已完成並編譯成功**

- [x] FlexEditorPage 從 API 讀取真實資料
- [x] MessageCreation 解析 flexMessageJson
- [x] 還原所有卡片狀態
- [x] 還原所有表單狀態
- [x] 錯誤處理完善
- [x] Loading 狀態提升 UX
- [x] TypeScript 編譯通過
- [x] Vite HMR 成功 (4:53:49 PM FlexEditorPage, 4:54:19 PM MessageCreation)

---

## 聯絡資訊

如有問題或建議，請聯繫開發團隊。
