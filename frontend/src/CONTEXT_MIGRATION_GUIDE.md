# DataContext 拆分 - 遷移指南

## 🎯 目標

將單一的 `DataContext` 拆分為 4 個獨立的 Context，以提升性能並減少 30-40% 的不必要重新渲染。

## 📊 架構變更

### 之前（單一 Context）
```
DataContext
├── Members 數據
├── Messages 數據
├── AutoReplies 數據
└── Tags 數據
```
**問題：** 任何數據變更都會觸發所有消費組件重新渲染

### 之後（獨立 Contexts）
```
MembersContext      ← 只處理會員數據
MessagesContext     ← 只處理訊息數據
AutoRepliesContext  ← 只處理自動回覆數據
TagsContext         ← 聚合所有標籤
```
**優勢：** 每個 Context 只在其數據變更時觸發重新渲染

## 🔄 API 變更

### 1. 舊的用法（仍然支援，但不推薦）

```typescript
import { useData } from './contexts/DataContext';

function MyComponent() {
  const { 
    members, 
    messages, 
    autoReplies,
    addMember,
    addMessage
  } = useData();
  
  // ⚠️ 這樣會訂閱所有數據變更！
  // 任何一個數據更新都會觸發此組件重新渲染
}
```

### 2. 新的用法（推薦）

```typescript
import { useMembers } from './contexts/MembersContext';
import { useTags } from './contexts/TagsContext';

function MyComponent() {
  // ✅ 只訂閱需要的數據
  const { members, addMember } = useMembers();
  const { allTags } = useTags();
  
  // 現在只有 members 或 tags 變更時才會重新渲染
  // messages 和 autoReplies 的變更不會影響此組件
}
```

## 📁 新的 Context 文件結構

```
/contexts/
├── MembersContext.tsx       ← 會員數據管理
├── MessagesContext.tsx      ← 訊息數據管理
├── AutoRepliesContext.tsx   ← 自動回覆數據管理
├── TagsContext.tsx          ← 標籤聚合管理
├── DataContext.tsx          ← 兼容層（向後兼容）
├── DataContext.legacy.tsx   ← 舊版參考
└── AppProviders.tsx         ← 更新為使用新 Contexts
```

## 🔌 可用的 Hooks

### MembersContext
```typescript
import { useMembers } from './contexts/MembersContext';

const {
  members,              // Member[]
  setMembers,           // (members: Member[]) => void
  addMember,            // (member: Member) => void
  updateMember,         // (id: string, updates: Partial<Member>) => void
  deleteMember,         // (id: string) => void
  getMemberById,        // (id: string) => Member | undefined
  totalMembers          // number
} = useMembers();
```

### MessagesContext
```typescript
import { useMessages } from './contexts/MessagesContext';

const {
  messages,             // Message[]
  setMessages,          // (messages: Message[]) => void
  addMessage,           // (message: Message) => void
  updateMessage,        // (id: string, updates: Partial<Message>) => void
  deleteMessage,        // (id: string) => void
  getMessageById,       // (id: string) => Message | undefined
  totalMessages         // number
} = useMessages();
```

### AutoRepliesContext
```typescript
import { useAutoReplies } from './contexts/AutoRepliesContext';

const {
  autoReplies,          // AutoReply[]
  setAutoReplies,       // (replies: AutoReply[]) => void
  addAutoReply,         // (reply: AutoReply) => void
  updateAutoReply,      // (id: string, updates: Partial<AutoReply>) => void
  deleteAutoReply,      // (id: string) => void
  getAutoReplyById,     // (id: string) => AutoReply | undefined
  toggleAutoReply,      // (id: string) => void
  totalAutoReplies,     // number
  activeAutoReplies     // number
} = useAutoReplies();
```

### TagsContext
```typescript
import { useTags } from './contexts/TagsContext';

const {
  allTags,              // string[] - 從所有數據源聚合的標籤
  addTag,               // (tag: string) => void
  removeTag             // (tag: string) => void - 從所有數據中移除
} = useTags();
```

## 🚀 遷移步驟

### 步驟 1: 識別組件使用的數據

```typescript
// 檢查你的組件實際使用哪些數據
function MemberList() {
  const { members, messages, autoReplies } = useData(); // ❌ 舊用法
  
  // 實際只用到 members
  return (
    <div>
      {members.map(m => <div key={m.id}>{m.username}</div>)}
    </div>
  );
}
```

### 步驟 2: 更新為只訂閱需要的數據

```typescript
import { useMembers } from './contexts/MembersContext';

function MemberList() {
  const { members } = useMembers(); // ✅ 新用法
  
  return (
    <div>
      {members.map(m => <div key={m.id}>{m.username}</div>)}
    </div>
  );
}
```

### 步驟 3: 如果需要多個數據源

```typescript
import { useMembers } from './contexts/MembersContext';
import { useMessages } from './contexts/MessagesContext';
import { useTags } from './contexts/TagsContext';

function Dashboard() {
  const { members, totalMembers } = useMembers();
  const { messages, totalMessages } = useMessages();
  const { allTags } = useTags();
  
  return (
    <div>
      <p>會員數: {totalMembers}</p>
      <p>訊息數: {totalMessages}</p>
      <p>標籤數: {allTags.length}</p>
    </div>
  );
}
```

## 📋 常見遷移場景

### 場景 1: 只需要統計數據

**之前：**
```typescript
import { useStats } from './contexts/DataContext';

const stats = useStats(); // 訂閱所有數據變更
```

**之後：**
```typescript
import { useMembers } from './contexts/MembersContext';
import { useMessages } from './contexts/MessagesContext';

const { totalMembers } = useMembers();
const { totalMessages } = useMessages();
```

### 場景 2: 只需要操作方法

**之前：**
```typescript
const { addMember, updateMember } = useData(); // 訂閱所有數據
```

**之後：**
```typescript
import { useMembers } from './contexts/MembersContext';

const { addMember, updateMember } = useMembers(); // 只訂閱會員數據
```

### 場景 3: 標籤管理

**之前：**
```typescript
const { allTags, removeTag } = useData();
```

**之後：**
```typescript
import { useTags } from './contexts/TagsContext';

const { allTags, removeTag } = useTags();
```

## ⚡ 性能提升示例

### 場景：訊息列表頁面

**之前：**
```typescript
// MessageList.tsx
function MessageList() {
  const { messages } = useData();
  // ❌ 會員數據變更時也會重新渲染此組件
  // ❌ 自動回覆數據變更時也會重新渲染此組件
  
  return <div>{messages.map(...)}</div>;
}
```

**之後：**
```typescript
// MessageList.tsx
function MessageList() {
  const { messages } = useMessages();
  // ✅ 只有訊息數據變更時才重新渲染
  // ✅ 會員或自動回覆變更時不會重新渲染
  
  return <div>{messages.map(...)}</div>;
}
```

## 🔍 檢查遷移進度

使用以下命令搜索還在使用舊 API 的文件：

```bash
# 搜索使用 useData 的文件
grep -r "useData()" --include="*.tsx" --include="*.ts"

# 搜索從 DataContext 導入的文件
grep -r "from.*DataContext" --include="*.tsx" --include="*.ts"
```

## 📝 注意事項

1. **向後兼容性**：舊的 `useData()` 仍然可用，但會訂閱所有數據變更
2. **漸進式遷移**：可以逐步遷移，不需要一次性改完所有組件
3. **TypeScript 支援**：所有新 Context 都有完整的類型定義
4. **測試**：遷移後請測試組件功能是否正常

## ✅ 完成檢查清單

- [x] 創建 MembersContext.tsx
- [x] 創建 MessagesContext.tsx
- [x] 創建 AutoRepliesContext.tsx
- [x] 創建 TagsContext.tsx
- [x] 更新 AppProviders.tsx
- [x] 更新 DataContext.tsx 為兼容層
- [x] 遷移 App.tsx
- [ ] 遷移其他使用 useData 的組件
- [ ] 測試所有功能
- [ ] 性能測試和驗證

## 🎉 預期收益

- ✅ 減少 30-40% 的不必要組件重新渲染
- ✅ 更好的代碼組織和可維護性
- ✅ 更精確的性能優化控制
- ✅ 更清晰的數據依賴關係
