# Facebook 單一訊息發送功能整合指南

## 目標
探索現有架構，為會員管理頁聊天室整合 Facebook 單一訊息發送功能。
API: `{FB_API_URL}/api/v1/admin/meta_page/message/single`
Request: `{ "recipient": "email", "text": "訊息內容" }`

---

## 1. 前端聊天室架構 (React/TypeScript)

### 關鍵文件結構
```
frontend/src/
├── components/chat-room/
│   ├── ChatRoomLayout.tsx       (核心邏輯，訊息發送、WebSocket)
│   ├── ChatBubble.tsx           (訊息氣泡組件)
│   ├── ChatInput.tsx            (輸入框組件)
│   ├── PlatformSwitcher.tsx     (平台切換器：LINE/Facebook/Webchat)
│   ├── ResponseModeIndicator.tsx (回覆模式指示)
│   ├── MemberInfoPanel.tsx      (左側會員資訊卡)
│   └── types.ts                 (TypeScript 定義)
├── pages/ChatRoomPage.tsx       (路由容器)
└── contexts/
    └── NavigationContext.tsx    (導航和參數管理)
```

### 訊息發送流程 (ChatRoomLayout.tsx)

**入口**: `handleSendMessage()` 函數 (行 661-741)

```typescript
// 1. 取得平台信息
const platform = currentPlatform || 'LINE';

// 2. 構建請求 body
const requestBody = {
  text: trimmedText,
  platform,
  jwt_token?: jwtToken  // Facebook 需要
};

// 3. 發送到後端
POST /api/v1/members/{member.id}/chat/send
{
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(requestBody)
}

// 4. 成功後清空輸入框並重新載入訊息
setMessageInput('');
await loadChatMessages(1, false);
```

### 平台切換機制
- **PlatformSwitcher 組件**: 選擇 LINE/Facebook/Webchat
- **currentPlatform 狀態**: 追蹤當前選擇平台
- **threadsMap**: 儲存 `{ "LINE": thread_id, "Facebook": thread_id, ... }`
- **WebSocket 監聽**: 依 `currentPlatform` 訂閱對應的 thread

### 訊息加載邏輯
```typescript
// 載入訊息 API
GET /api/v1/members/{member_id}/chat-messages
  ?page=1&page_size=6&platform=Facebook&jwt_token=XXX

// 回應格式
{
  code: 200,
  data: {
    messages: [
      {
        id: string,
        type: "user" | "official",
        text: string,
        time: string,           // 格式化時間 "下午 03:30"
        timestamp: string,      // ISO 格式完整時間戳
        isRead: boolean,
        source?: string
      }
    ],
    total: number,
    page: number,
    page_size: number,
    has_more: boolean
  }
}
```

---

## 2. 後端 API 架構 (FastAPI/Python)

### 關鍵文件結構
```
backend/app/
├── api/v1/
│   ├── chat_messages.py         (聊天記錄 API)
│   ├── members.py               (會員相關 API，包含發送訊息)
│   └── ...
├── clients/
│   └── fb_message_client.py     (Facebook HTTP 客戶端)
├── models/
│   ├── member.py                (會員模型)
│   ├── conversation.py          (對話訊息模型)
│   └── fb_channel.py            (FB 頻道設定模型)
├── schemas/
│   └── fb_channel.py            (Pydantic 驗證模式)
├── services/
│   └── chatroom_service.py      (對話服務)
└── integrations/
    └── facebook_api.py          (Facebook Graph API 工具)
```

### 訊息發送端點

**URL**: `POST /api/v1/members/{member_id}/chat/send`
**檔案**: `/backend/app/api/v1/members.py` (行 740-850)

#### 請求格式
```python
{
    "text": str,                    # 訊息內容
    "platform": str = "LINE",       # "LINE" | "Facebook" | "Webchat"
    "jwt_token": str | None    # Facebook 需要
}
```

#### 回應格式
```python
{
    "success": True,
    "message_id": str,
    "thread_id": str,
    "sent_at": str  # ISO 格式時間戳
}
```

#### Facebook 特定邏輯 (行 806-829)
```python
elif platform == "Facebook":
    # 1. 檢查 jwt_token
    if not jwt_token:
        raise HTTPException(status_code=400, detail="缺少 jwt_token")

    # 2. 使用 FbMessageClient 發送訊息
    fb_client = FbMessageClient()
    send_result = await fb_client.send_message(
        recipient_email=member.email,    # 使用會員 email
        text=text,
        jwt_token=jwt_token
    )

    if not send_result.get("ok"):
        raise HTTPException(status_code=500, detail="發送失敗")

    # 3. 成功後寫入對話訊息記錄
    msg = await chatroom_service.append_message(
        member, "Facebook", "outgoing", text, message_source="manual"
    )
    
    return { "success": True, ... }
```

### Facebook 訊息客戶端

**檔案**: `/backend/app/clients/fb_message_client.py`

#### send_message() 方法 (行 31-62)
```python
async def send_message(
    self, 
    recipient_email: str,  # 會員 Email
    text: str,            # 訊息內容
    jwt_token: str   # Bearer token
) -> dict:
    """
    調用外部 FB API：
    POST {FB_API_URL}/api/v1/admin/meta_page/message/single
    {
        "recipient": "member@example.com",
        "text": "訊息內容"
    }
    """
    headers = {"Authorization": f"Bearer {jwt_token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{self.base_url}/api/v1/admin/meta_page/message/single",
            json={"recipient": recipient_email, "text": text},
            headers=headers
        )
        
        result = response.json()
        return {"ok": True, **result}  # 或 {"ok": False, "error": "..."}
```

### 訊息記錄服務

**檔案**: `/backend/app/services/chatroom_service.py`

#### append_message() 方法 (行 52-75)
```python
async def append_message(
    self,
    member: Member,
    platform: str,          # "LINE" | "Facebook" | "Webchat"
    direction: str,         # "incoming" | "outgoing"
    content: str,           # 訊息內容
    message_source: Optional[str] = None  # "manual" | "gpt" | "keyword" 等
) -> ConversationMessage:
    """
    寫入對話訊息到資料庫
    - 建立或更新 thread (thread_id = platform_uid)
    - 建立 message 記錄
    """
    thread = await self.upsert_thread(member, platform)
    message = ConversationMessage(
        id=uuid4(),
        thread_id=thread.id,
        platform=platform,
        direction=direction,
        question=content if direction == "incoming" else None,
        response=content if direction == "outgoing" else None,
        message_source=message_source,
        created_at=datetime.utcnow()
    )
    await self.db.add(message)
    await self.db.flush()
    return message
```

### 聊天記錄查詢端點

**URL**: `GET /api/v1/members/{member_id}/chat-messages`
**檔案**: `/backend/app/api/v1/chat_messages.py` (行 139-268)

#### Facebook 特定邏輯 (行 177-230)
```python
if resolved_platform == "Facebook":
    if not jwt_token:
        raise HTTPException(status_code=400, detail="缺少 jwt_token")

    # 呼叫 FbMessageClient.get_chat_history()
    fb_client = FbMessageClient()
    fb_result = await fb_client.get_chat_history(member.email, jwt_token)

    # 轉換外部 API 格式為內部格式
    messages = []
    for item in fb_result.get("data", []):
        direction = (item.get("direction") or "outgoing").lower()
        is_incoming = direction in {"ingoing", "incoming"}
        
        msg = ChatMessage(
            id=f"fb_{idx}_{timestamp}",
            type="user" if is_incoming else "official",
            text=_extract_fb_template_text(msg_content),
            time=format_chat_time(dt),
            timestamp=format_iso_utc(dt),
            isRead=True,
            source="external" if not is_incoming else None
        )
```

---

## 3. 資料模型 (SQLAlchemy)

### Member 模型
```python
# 會員關鍵欄位：
class Member:
    id: int
    email: str              # ✅ Facebook 訊息使用
    line_uid: str           # LINE 使用
    fb_customer_id: str     # Facebook customer ID
    webchat_uid: str        # Webchat 使用
    
    # Facebook 特定欄位
    fb_avatar: str
    fb_customer_name: str
    
    # 聯絡方式
    lastChatTime: datetime
    internal_note: str
    gpt_enabled: bool
```

### ConversationMessage 模型
```python
class ConversationMessage:
    id: str (UUID)
    thread_id: str          # = platform_uid (platform:uid)
    platform: str           # "LINE" | "Facebook" | "Webchat"
    direction: str          # "incoming" | "outgoing"
    question: str           # 用戶訊息（direction="incoming"）
    response: str           # 官方回覆（direction="outgoing"）
    message_source: str     # "manual" | "gpt" | "keyword" | "welcome" 等
    created_at: datetime
    status: str             # "unread" | "read" 等
```

### ConversationThread 模型
```python
class ConversationThread:
    id: str                 # platform_uid
    member_id: int          # 關聯會員
    platform: str           # "LINE" | "Facebook" | "Webchat"
    platform_uid: str       # line_uid / fb_customer_id / webchat_uid
    last_message_at: datetime
```

---

## 4. 現有流程總結

### Facebook 訊息發送流程圖
```
ChatRoomLayout.handleSendMessage()
    ↓
    ├─ 驗證: messageInput 非空, member.id 存在
    ├─ 取得: currentPlatform = "Facebook"
    ├─ 取得: jwt_token from localStorage
    │
    → POST /api/v1/members/{member.id}/chat/send
        {
            text: "訊息內容",
            platform: "Facebook",
            jwt_token: "Bearer ..."
        }
    
    → Backend: send_member_chat_message()
        ├─ 查詢會員：Member.id = member_id
        ├─ 檢查：member.email 存在
        │
        → FbMessageClient.send_message(
            recipient_email: member.email,
            text: "訊息內容",
            jwt_token: "Bearer ..."
        )
        
        → HTTP: POST {FB_API_URL}/api/v1/admin/meta_page/message/single
            {
                "recipient": "member@example.com",
                "text": "訊息內容"
            }
            Header: Authorization: Bearer ...
        
        ├─ 成功 (ok=true)
        │  └─ ChatroomService.append_message(
        │       member, "Facebook", "outgoing", text, "manual"
        │     )
        │     └─ 寫入 ConversationMessage 記錄
        │
        └─ 失敗 (ok=false)
           └─ 返回 HTTPException 500
    
    ← 成功回應
        {
            "success": true,
            "message_id": "...",
            "sent_at": "2025-11-22T10:30:00Z"
        }
    
    → Frontend:
        ├─ 清空 messageInput
        ├─ 調用 loadChatMessages(1, false)
        │  └─ GET /api/v1/members/{member.id}/chat-messages?platform=Facebook
        │     └─ 重新載入訊息列表
        └─ 自動滾動到底部
```

### Facebook 訊息加載流程圖
```
ChatRoomLayout.loadChatMessages(pageNum, append)
    ↓
    → 構建 URL: /api/v1/members/{member.id}/chat-messages
               ?page=1&page_size=6&platform=Facebook&jwt_token=XXX
    
    → Backend: get_chat_messages()
        ├─ 查詢會員：Member.id = member_id
        ├─ 檢查：platform = "Facebook"
        │
        → FbMessageClient.get_chat_history(
            email: member.email,
            jwt_token: "Bearer ..."
        )
        
        → HTTP: GET {FB_API_URL}/api/v1/admin/meta_page/message/history
                    ?email=member@example.com
                Header: Authorization: Bearer ...
        
        ├─ 成功 (ok=true)
        │  ├─ 取得: fb_result = { data: [{direction, message, time}, ...] }
        │  ├─ 轉換: 提取訊息文字 (_extract_fb_template_text)
        │  ├─ 格式化: 時間戳轉換為本地時區
        │  └─ 構建: ChatMessage[] 清單
        │
        └─ 失敗 (ok=false)
           └─ 返回 HTTPException 500
    
    ← ChatMessagesResponse
        {
            messages: [
                { id, type, text, time, timestamp, isRead, source },
                ...
            ],
            total: number,
            page: number,
            page_size: number,
            has_more: boolean
        }
    
    → Frontend:
        ├─ setMessages(newMessages) 或 append
        ├─ setHasMore(has_more)
        └─ 渲染訊息列表
```

---

## 5. 關鍵集成要點

### ✅ 已實現的功能
1. **平台切換**: PlatformSwitcher 支援 LINE/Facebook/Webchat
2. **訊息發送**: `/api/v1/members/{member.id}/chat/send` 支援多平台
3. **訊息查詢**: `/api/v1/members/{member.id}/chat-messages` 支援多平台
4. **Facebook 客戶端**: FbMessageClient 提供發送和查詢方法
5. **訊息記錄**: ConversationMessage 統一存儲所有平台訊息
6. **WebSocket**: 實時訊息推送機制

### ⚠️ 需要驗證的環節
1. **jwt_token 來源**: 確認 localStorage 中 `jwt_token` 的存儲和更新機制
2. **FB_API_URL 配置**: 確認 settings.FB_API_URL 的值
3. **會員 email 必填**: 確保所有 Facebook 會員都有 email 欄位
4. **平台初始化**: 確認 currentPlatform 默認值和切換邏輯
5. **錯誤處理**: 網絡錯誤、授權失敗、發送失敗的用戶提示

### 🔧 可能的改進點
1. **訊息模板**: 支援 Flex Message 或 Button Message 格式
2. **批量發送**: 擴展至支援群發訊息
3. **訊息狀態**: 追蹤「發送中」、「已發送」、「已讀」等狀態
4. **重試機制**: 發送失敗自動重試
5. **媒體支援**: 支援圖片、檔案等附件
6. **訊息審查**: 內容審核、敏感詞過濾

---

## 6. 重要檔案位置對應表

| 功能 | 前端文件 | 後端文件 |
|------|--------|--------|
| 聊天室主組件 | `frontend/src/components/chat-room/ChatRoomLayout.tsx` | - |
| 訊息發送 | `ChatRoomLayout::handleSendMessage()` | `backend/app/api/v1/members.py::send_member_chat_message()` |
| 訊息加載 | `ChatRoomLayout::loadChatMessages()` | `backend/app/api/v1/chat_messages.py::get_chat_messages()` |
| 平台切換 | `frontend/src/components/chat-room/PlatformSwitcher.tsx` | - |
| Facebook 客戶端 | - | `backend/app/clients/fb_message_client.py::FbMessageClient` |
| 訊息記錄 | - | `backend/app/services/chatroom_service.py::ChatroomService` |
| WebSocket | `frontend/src/hooks/useWebSocket.ts` | - |
| 會員數據 | `frontend/src/contexts/MembersContext.tsx` | `backend/app/api/v1/members.py` |

---

## 7. 環境變數檢查清單

- [ ] `FB_API_URL` - FB 外部 API 地址 (配置位置: `backend/app/config.py`)
- [ ] `jwt_token` - 前端 localStorage 中的 Facebook 授權 token
- [ ] `DATABASE_URL` - MySQL 連接字串
- [ ] `SECRET_KEY` - JWT 密鑰
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` - LINE 渠道 token
- [ ] `LINE_APP_URL` - LINE 應用服務地址 (預設: `http://localhost:3001`)

---

## 8. API 測試指令參考

### 發送 Facebook 訊息
```bash
curl -X POST http://localhost:8000/api/v1/members/1/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "text": "測試訊息",
    "platform": "Facebook",
    "jwt_token": "Bearer {FB_JWT_TOKEN}"
  }'
```

### 查詢 Facebook 訊息
```bash
curl -X GET "http://localhost:8000/api/v1/members/1/chat-messages?page=1&page_size=6&platform=Facebook&jwt_token={FB_JWT_TOKEN}" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

---

## 文件修訂日期
最後更新: 2025-01-05
