# 會員管理到聊天室的完整流程分析

## 概述
用戶從會員管理頁面進入聊天室的整個流程，涉及導航、數據加載、狀態管理三個主要方面。

## 1. 會員管理頁面點擊聊天圖標流程

**文件**: `/frontend/src/pages/MemberManagementPage.tsx`

### 入口點
- 頁面加載時調用 `fetchMembers()` 獲取會員列表
- MemberListContainer 組件接收 `onOpenChat` 回調

### 點擊聊天圖標的處理
```typescript
onOpenChat={(member) => {
  const memberName = member.username || member.realName || '會員資訊';
  navigate('chat-room', { memberId: member.id, memberName });
}}
```

**關鍵點**:
- 使用 `useNavigation()` hook 獲取 `navigate` 函數
- 傳遞參數: `{ memberId: string, memberName: string }`
- 導航目標: `'chat-room'` 頁面

---

## 2. 導航上下文的狀態轉移

**文件**: `/frontend/src/contexts/NavigationContext.tsx`

### NavigationContext 的職責
```typescript
interface NavigationContextType {
  currentPage: Page;           // 當前頁面
  params: NavigationParams;    // 導航參數 { memberId, memberName, ... }
  navigate: (page: Page, params?: NavigationParams) => void;
  reset: () => void;
}
```

### navigate 函數的執行流
```typescript
const navigate = useCallback((page: Page, newParams: NavigationParams = {}) => {
  setCurrentPage(page);      // 更新當前頁面
  setParams(newParams);      // 更新導航參數
  // 注: localStorage 儲存由 useEffect 統一處理
}, []);

// useEffect 監聽頁面和參數變化
useEffect(() => {
  persistState(currentPage, params);  // 保存到 localStorage 和 URL hash
}, [currentPage, params]);
```

### 狀態持久化
- **localStorage**: 保存 `{ page, params }` 用於頁面刷新恢復
- **URL hash**: 同步 `#chat-room?memberId=xxx&memberName=yyy`
- **初始化**: 應用啟動時從 hash 或 localStorage 恢復狀態

---

## 3. ChatRoomPage 的初始化

**文件**: `/frontend/src/pages/ChatRoomPage.tsx`

### 頁面組件結構
```typescript
export default function ChatRoomPage() {
  const { params, navigate } = useNavigation();              // 獲取導航參數
  const { getMemberById } = useMembers();                    // 獲取會員數據

  // 從導航參數中獲取 memberId
  const member = params.memberId ? getMemberById(params.memberId) : undefined;
  const fallbackMemberName = params.memberName;              // 備用名稱

  return (
    <MainLayout currentPage="members">
      <ChatRoom
        member={member}                                       // 可能為 undefined!
        fallbackMemberName={fallbackMemberName}
        onNavigateMembers={() => navigate('member-management')}
        onNavigateMemberDetail={(memberId) => {...}}
      />
    </MainLayout>
  );
}
```

### 問題點 (為什麼需要重新整理才能看到對話)
1. **會員數據同步延遲**: 
   - ChatRoomPage 獲取 `member = getMemberById(params.memberId)`
   - 如果 MembersContext 中還沒加載會員列表，`member` 將為 `undefined`
   - ChatRoom 組件此時顯示 "找不到會員資料"

2. **頁面導航順序**:
   - MemberManagementPage 調用 `fetchMembers()` (useEffect)
   - 同時調用 `navigate('chat-room', ...)` 
   - ChatRoomPage 可能在會員列表加載完成前就渲染了

---

## 4. ChatRoom 組件的初始化和訊息加載

**文件**: `/frontend/src/components/ChatRoom.tsx`

### 聊天室主體 (ChatRoomLayout)
```typescript
<ChatRoom
  member={member}                     // 可能為 undefined
  fallbackMemberName={fallbackMemberName}
/>
```

### ChatRoomLayout 的核心邏輯

**文件**: `/frontend/src/components/chat-room/ChatRoomLayout.tsx`

#### 會員詳情加載
```typescript
// 當初始會員數據存在時，獲取完整詳情
useEffect(() => {
  if (!initialMember?.id) return;
  
  const loadMemberDetail = async () => {
    setIsLoadingMember(true);
    const fullMember = await fetchMemberById(initialMember.id);  // API 調用
    if (fullMember) {
      setMember(fullMember);
    }
    setIsLoadingMember(false);
  };
  
  loadMemberDetail();
}, [initialMember?.id, fetchMemberById]);
```

#### 聊天訊息加載
```typescript
// 當會員 ID 變化時，加載聊天訊息
useEffect(() => {
  if (member?.id) {
    loadChatMessages(1, false);  // 加載第一頁訊息
  }
}, [member?.id, loadChatMessages]);

// loadChatMessages 函數
const loadChatMessages = useCallback(async (pageNum: number = 1, append: boolean = false) => {
  if (!member?.id) return;
  
  setIsLoading(true);
  try {
    const response = await fetch(
      `/api/v1/members/${member.id}/chat-messages?page=${pageNum}&page_size=6`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const result = await response.json();
    if (result.code === 200 && result.data) {
      const { messages: newMessages, has_more } = result.data;
      const reversedMessages = [...newMessages].reverse();  // API 返回降序，需反轉
      
      setMessages(reversedMessages);
      setHasMore(has_more);
    }
  } finally {
    setIsLoading(false);
  }
}, [member?.id]);
```

### WebSocket 實時訊息監聽
```typescript
// 建立 WebSocket 連線，監聽新訊息
useWebSocket(member?.id?.toString(), handleNewMessage);

const handleNewMessage = useCallback((wsMessage: any) => {
  if (wsMessage.type === 'new_message' && wsMessage.data) {
    // 新訊息添加到列表末尾
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === wsMessage.data.id);
      if (exists) return prev;  // 避免重複
      return [...prev, wsMessage.data];
    });
    
    // 自動滾動到底部
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  }
}, [member]);
```

---

## 5. MessagesContext (訊息推播管理)

**文件**: `/frontend/src/contexts/MessagesContext.tsx`

### 注意: 這個 Context 用於訊息推播管理，NOT 聊天訊息

```typescript
interface Message {
  id: string;
  title: string;
  status: '已排程' | '草稿' | '已發送' | '發送失敗';
  // ... 推播訊息相關字段
}
```

### 與聊天室的區別
- **MessagesContext**: 管理推播訊息（如行銷活動訊息）
- **ChatRoomLayout**: 直接管理聊天訊息狀態 (useState)
- 兩者互不影響

---

## 6. 完整數據流圖

```
MemberManagementPage
    ↓ fetchMembers() ↓ navigate('chat-room', {memberId, memberName})
NavigationContext (更新 currentPage='chat-room', params={memberId, memberName})
    ↓ 保存到 localStorage + URL hash
ChatRoomPage (應用路由切換)
    ↓ getMemberById(params.memberId) [可能為 undefined]
ChatRoom → ChatRoomLayout (initialMember)
    ↓
    ├─→ fetchMemberById(id) ← API 調用 (獲取完整會員詳情)
    │    ↓ setMember(fullMember)
    │
    └─→ loadChatMessages(1) ← API 調用 (獲取聊天訊息)
         ↓
         ├─→ setMessages(reversedMessages)
         │
         └─→ useWebSocket() ← 建立 WebSocket
              ↓
              新訊息到達 → setMessages(prev => [...prev, newMsg])
```

---

## 為什麼需要重新整理才能看到對話? (根本原因)

### 場景分析
1. **初次進入聊天室**:
   - NavigationContext 立即更新到 'chat-room'
   - ChatRoomPage 渲染，但 MembersContext 中的 `member` 還未加載
   - ChatRoomLayout 無法獲取 `initialMember`，不能調用 `fetchMemberById`
   - 不能調用 `loadChatMessages`，訊息為空

2. **刷新頁面後**:
   - URL hash 或 localStorage 恢復導航狀態
   - MembersContext 重新初始化，調用 `fetchMembers()`
   - 等 members 加載完成後，ChatRoomPage 獲取到 `member` 對象
   - ChatRoomLayout 才能正確加載訊息

### 根本問題
**MembersContext 和 NavigationContext 的初始化順序沒有同步機制**

---

## 優化建議

### 短期解決方案
1. 在 ChatRoomPage 中，如果 `member` 為 undefined，主動調用 `fetchMemberById(params.memberId)`
2. 等待會員數據加載完成再渲染 ChatRoom

### 長期架構改進
1. 使用獨立的 ChatRoomContext 管理聊天室狀態
2. 實現數據預加載 (Prefetch) 機制
3. 使用 Suspense 和 Concurrent 特性

---

## 關鍵文件清單

| 文件 | 用途 |
|------|------|
| `/frontend/src/pages/MemberManagementPage.tsx` | 會員列表頁面，聊天圖標入口 |
| `/frontend/src/pages/ChatRoomPage.tsx` | 聊天室頁面容器 |
| `/frontend/src/components/ChatRoom.tsx` | 聊天室主組件 |
| `/frontend/src/components/chat-room/ChatRoomLayout.tsx` | 聊天室核心邏輯（訊息加載、WebSocket） |
| `/frontend/src/contexts/NavigationContext.tsx` | 路由和導航參數管理 |
| `/frontend/src/contexts/MembersContext.tsx` | 會員數據管理 |
| `/frontend/src/contexts/MessagesContext.tsx` | 訊息推播數據管理 |
| `/frontend/src/hooks/useWebSocket.ts` | WebSocket 連線 Hook |
