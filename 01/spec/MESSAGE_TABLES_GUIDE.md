# 訊息相關資料表使用指南

**建立日期**: 2025-11-22
**維護者**: Lili Hotel 開發團隊
**版本**: v1.0

本文件說明系統中所有訊息相關資料表的用途、關係和使用方式。

---

## 📋 資料表架構總覽

### 訊息表分類

| 類別 | 資料表 | 用途 | 狀態 |
|------|--------|------|------|
| **一對一聊天** | conversation_messages | LINE Bot 即時對話記錄 | ✅ 使用中 |
| **一對一聊天** | conversation_threads | 對話串管理 | ✅ 使用中 |
| **群發訊息** | messages | 群發訊息內容和設定 | ✅ 使用中 |
| **發送追蹤** | message_deliveries | 個別會員發送記錄 | ✅ 使用中 |
| **訊息範本** | message_templates | 訊息範本庫 | ✅ 使用中 |
| **自動回應** | auto_responses | 自動回應規則 | ✅ 使用中 |
| **自動回應** | auto_response_messages | 自動回應訊息內容 | ✅ 使用中 |
| **自動回應** | auto_response_keywords | 關鍵字觸發規則 | ✅ 使用中 |
| ~~**一對一聊天**~~ | ~~message_records~~ | ~~混合訊息記錄~~ | ❌ 已移除 |

---

## 📊 詳細資料表說明

### 1. conversation_messages - 一對一聊天記錄 ⭐

**用途**: LINE Bot 即時對話記錄，記錄使用者與官方帳號的所有互動

**表結構**:
```sql
CREATE TABLE conversation_messages (
  id VARCHAR(100) PRIMARY KEY,           -- UUID
  thread_id VARCHAR(100) NOT NULL,       -- LINE user_id (關聯 conversation_threads)
  role VARCHAR(20),                      -- 'user' | 'assistant'
  direction VARCHAR(20),                 -- 'incoming' | 'outgoing'
  message_type VARCHAR(50),              -- 'text' | 'chat' | 'sticker' | 'image'
  question TEXT,                         -- 使用者訊息內容
  response TEXT,                         -- 官方回覆內容
  event_id VARCHAR(100),                 -- LINE event ID
  status VARCHAR(20),                    -- 'received' | 'sent' | 'read'
  created_at DATETIME,
  updated_at DATETIME,
  INDEX ix_conversation_messages_thread_id (thread_id)
);
```

**欄位說明**:
- **id**: UUID 格式的唯一識別碼
- **thread_id**: 使用 LINE user_id，與 conversation_threads 關聯
- **direction**:
  - `incoming`: 用戶發送給官方的訊息
  - `outgoing`: 官方發送給用戶的訊息
- **role**:
  - `user`: 使用者
  - `assistant`: 系統/客服人員
- **question**: 當 direction=incoming 時，存放用戶訊息
- **response**: 當 direction=outgoing 時，存放官方回覆
- **status**:
  - `received`: 已接收
  - `sent`: 已發送
  - `read`: 已讀

**資料量**: 352+ 筆 (持續增長)

**寫入來源**:
- LINE Webhook (`line_app/app.py`)
  - `on_text()`: 文字訊息
  - `on_sticker()`: 貼圖
  - `on_image()`: 圖片
- 客服發送訊息 API (`/api/v1/members/{id}/chat/send`)

**查詢 API**:
- `GET /api/v1/members/{member_id}/chat-messages`
  - 透過 member.line_uid 查詢 thread_id
  - 支援分頁查詢
  - 按 created_at 降序排列

**前端使用**:
- `ChatRoomLayout.tsx`: 聊天室主介面
- `ChatRoomPage.tsx`: 聊天室頁面容器
- 路由: `/chat-room?memberId={id}`

**使用場景**:
- ✅ 會員管理 → 點擊聊天圖標 → 開啟聊天室
- ✅ 查看聊天歷史記錄
- ✅ 發送一對一訊息
- ✅ 標記訊息已讀狀態
- ✅ LINE Bot 即時對話記錄

---

### 2. conversation_threads - 對話串管理

**用途**: 管理與不同 LINE 使用者的對話串

**表結構**:
```sql
CREATE TABLE conversation_threads (
  id VARCHAR(100) PRIMARY KEY,           -- LINE user_id
  conversation_name VARCHAR(200),        -- 對話名稱（可選）
  created_at DATETIME,
  updated_at DATETIME
);
```

**關聯關係**:
- `conversation_messages.thread_id` → `conversation_threads.id`

**使用場景**:
- 追蹤每個 LINE 使用者的對話串
- 未來可擴展：對話分類、對話摘要等

---

### 3. messages - 群發訊息 ⭐

**用途**: 群發訊息的內容、設定和排程管理

**表結構重點**:
```sql
CREATE TABLE messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,           -- 訊息標題
  content TEXT,                          -- 訊息內容
  message_type VARCHAR(20),              -- 'text' | 'flex' | 'template'
  template_type VARCHAR(50),             -- 'carousel' | 'bubble' | etc.
  scheduled_datetime_utc DATETIME,       -- 排程發送時間
  status VARCHAR(20),                    -- 'draft' | 'scheduled' | 'sent'
  target_audience_json TEXT,             -- 目標受眾設定 (JSON)
  created_at DATETIME,
  updated_at DATETIME
);
```

**使用場景**:
- ✅ 創建群發訊息（文字、Flex Message、Carousel）
- ✅ 排程發送訊息
- ✅ 草稿管理
- ✅ 訊息發送統計

**前端頁面**:
- `MessageListPage.tsx`: 訊息列表
- `MessageCreation.tsx`: 訊息創建/編輯
- `FlexEditorPage.tsx`: Flex Message 編輯器

**相關 API**:
- `GET /api/v1/messages`: 查詢訊息列表
- `POST /api/v1/messages`: 創建訊息
- `PUT /api/v1/messages/{id}`: 更新訊息
- `POST /api/v1/messages/{id}/send`: 發送訊息

---

### 4. message_deliveries - 發送追蹤

**用途**: 追蹤每個會員的群發訊息發送狀態

**表結構**:
```sql
CREATE TABLE message_deliveries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  message_id BIGINT,                     -- 關聯 messages
  member_id BIGINT,                      -- 關聯 members
  sent_at DATETIME,                      -- 發送時間
  opened_at DATETIME,                    -- 開啟時間
  delivery_status VARCHAR(20),           -- 'pending' | 'sent' | 'failed'
  error_message TEXT,                    -- 錯誤訊息
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);
```

**使用場景**:
- ✅ 追蹤群發訊息發送成功/失敗
- ✅ 統計訊息開啟率
- ✅ 錯誤排查和重試

---

### 5. message_templates - 訊息範本庫

**用途**: 儲存可重複使用的訊息範本

**資料量**: 139+ 筆範本

**範本類型**:
- 文字範本
- Flex Message 範本
- Carousel 範本
- 互動式訊息範本

**使用場景**:
- ✅ 快速創建訊息（選擇範本）
- ✅ 範本管理和編輯
- ✅ 分類管理（活動、通知、客服等）

---

### 6. auto_responses, auto_response_messages, auto_response_keywords

**用途**: 自動回應系統（關鍵字觸發、歡迎訊息）

**資料量**: 4 筆自動回應訊息

**使用場景**:
- ✅ 關鍵字自動回覆
- ✅ 新好友歡迎訊息
- ✅ 常見問題自動應答

---

### ~~7. message_records~~ ❌ 已移除

**移除日期**: 2025-11-22
**移除原因**: 功能完全由 conversation_messages 覆蓋，造成系統冗餘

**詳見**: [implementation_decisions.md - 決策 7](./implementation_decisions.md#7-訊息記錄表整合決策)

---

## 🔗 資料表關係圖

```
┌─────────────────────┐
│   members           │
│  - id               │
│  - line_uid         │
└──────┬──────────────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌─────────────────────┐            ┌─────────────────────┐
│ conversation_threads│            │ message_deliveries  │
│  - id (line_uid)    │            │  - message_id       │
└──────┬──────────────┘            │  - member_id        │
       │                            └──────┬──────────────┘
       ▼                                   │
┌─────────────────────┐                   ▼
│conversation_messages│            ┌─────────────────────┐
│  - thread_id        │            │   messages          │
│  - direction        │            │  - status           │
│  - question         │            │  - scheduled_at     │
│  - response         │            └─────────────────────┘
└─────────────────────┘
```

---

## 💡 開發指南

### 新增一對一聊天功能

**✅ 正確做法**: 使用 `conversation_messages` 表

```python
from app.models.conversation import ConversationMessage

# 查詢會員聊天記錄
member = await db.get(Member, member_id)
thread_id = member.line_uid

messages = await db.execute(
    select(ConversationMessage)
    .where(ConversationMessage.thread_id == thread_id)
    .order_by(ConversationMessage.created_at.desc())
    .limit(50)
)
```

**❌ 錯誤做法**: 使用 message_records（已移除）

```python
# ❌ 不要使用，此表已移除
from app.models.message_record import MessageRecord  # ModuleNotFoundError
```

---

### 新增群發訊息功能

**✅ 正確做法**: 使用 `messages` + `message_deliveries`

```python
from app.models.message import Message, MessageDelivery

# 1. 創建群發訊息
message = Message(
    title="春節促銷活動",
    content="...",
    status="draft"
)
await db.add(message)
await db.commit()

# 2. 發送給目標會員
for member in target_members:
    delivery = MessageDelivery(
        message_id=message.id,
        member_id=member.id,
        delivery_status="pending"
    )
    await db.add(delivery)

await db.commit()

# 3. 執行發送...
```

---

### 查詢會員聊天記錄

**API 端點**: `GET /api/v1/members/{member_id}/chat-messages`

**實作位置**: `backend/app/api/v1/chat_messages.py`

**查詢流程**:
```
1. 透過 member_id 查詢 member.line_uid
2. 使用 line_uid 作為 thread_id 查詢 conversation_messages
3. 返回格式化的聊天記錄
```

**前端調用**:
```typescript
// ChatRoomLayout.tsx
const response = await fetch(
  `/api/v1/members/${memberId}/chat-messages?page=${page}&page_size=50`
);
const data = await response.json();
```

---

## 📈 資料量統計

| 資料表 | 資料量 | 增長速度 | 備註 |
|--------|--------|---------|------|
| conversation_messages | 352+ | 每日 +10~50 | 實際使用中 |
| messages | 60+ | 每週 +2~5 | 群發訊息 |
| message_templates | 139 | 月 +5~10 | 範本庫 |
| message_deliveries | 1000+ | 依群發頻率 | 發送追蹤 |
| auto_response_messages | 4 | 極少變動 | 自動回應 |

---

## 🚀 效能優化建議

### 1. conversation_messages 索引優化

**建議索引**:
```sql
-- 已存在
CREATE INDEX ix_conversation_messages_thread_id
ON conversation_messages(thread_id);

-- 建議新增（如查詢慢）
CREATE INDEX ix_conversation_messages_thread_created
ON conversation_messages(thread_id, created_at DESC);
```

### 2. 分頁查詢優化

**前端實作**:
- 使用虛擬滾動 (Virtual Scroll)
- 每頁 50 筆，上滑自動載入更早訊息
- 保持滾動位置

### 3. 訊息內容壓縮

**Flex Message > 10KB**:
- 考慮上傳至 CDN
- 僅儲存 URL 引用

---

## 🔍 常見問題 FAQ

### Q1: 為什麼移除 message_records 表？

**A**: message_records 表設計用於混合儲存一對一聊天記錄，但實作中：
- conversation_messages 已完整實現所有聊天功能（352 筆實際資料）
- message_records 僅有 10 筆測試資料，從未實際使用
- 兩表功能高度重疊，造成系統冗餘和開發混淆
- 移除後降低 20% 訊息相關表複雜度

詳見: [implementation_decisions.md - 決策 7](./implementation_decisions.md#7-訊息記錄表整合決策)

---

### Q2: conversation_messages 和 messages 有什麼區別？

**A**:
- **conversation_messages**: 一對一聊天記錄（LINE Bot 即時對話）
- **messages**: 群發訊息（一對多推播）

| 特性 | conversation_messages | messages |
|------|---------------------|----------|
| 發送對象 | 單一會員 | 多個會員 |
| 觸發方式 | 即時對話、客服回覆 | 排程/手動群發 |
| 關聯方式 | thread_id (LINE user_id) | message_deliveries (member_id) |
| 使用場景 | 聊天室 | 行銷活動 |

---

### Q3: 如何追蹤群發訊息的發送狀態？

**A**: 使用 `message_deliveries` 表

```python
# 查詢某個群發訊息的發送統計
stats = await db.execute(
    select(
        MessageDelivery.delivery_status,
        func.count(MessageDelivery.id).label('count')
    )
    .where(MessageDelivery.message_id == message_id)
    .group_by(MessageDelivery.delivery_status)
)
```

---

### Q4: 如何查詢會員的聊天歷史？

**A**: 使用 API `/api/v1/members/{member_id}/chat-messages`

**後端實作**:
```python
# 1. 查詢會員的 line_uid
member = await db.get(Member, member_id)
thread_id = member.line_uid

# 2. 查詢聊天記錄
messages = await db.execute(
    select(ConversationMessage)
    .where(ConversationMessage.thread_id == thread_id)
    .order_by(ConversationMessage.created_at.desc())
)
```

**前端調用**: 見 `ChatRoomLayout.tsx` line 290-327

---

### Q5: 如何區分訊息來源（會員 vs 官方）？

**A**: 使用 `direction` 欄位

```python
# 查詢會員發送的訊息
user_messages = await db.execute(
    select(ConversationMessage)
    .where(
        ConversationMessage.thread_id == thread_id,
        ConversationMessage.direction == 'incoming'
    )
)

# 查詢官方發送的訊息
official_messages = await db.execute(
    select(ConversationMessage)
    .where(
        ConversationMessage.thread_id == thread_id,
        ConversationMessage.direction == 'outgoing'
    )
)
```

---

## 📚 相關文件

- [資料庫設計規格](./erm.dbml)
- [實作決策記錄](./implementation_decisions.md)
- [LINE 訊息 API 規格](./api_line_message_interface.md)
- [訊息模板功能規格](./features/message_template.feature)

---

## 📝 變更記錄

| 日期 | 版本 | 變更內容 | 負責人 |
|------|------|---------|--------|
| 2025-11-22 | v1.0 | 初版建立，記錄所有訊息相關表用途和關係 | Claude |

---

**最後更新**: 2025-11-22
**文件版本**: v1.0
