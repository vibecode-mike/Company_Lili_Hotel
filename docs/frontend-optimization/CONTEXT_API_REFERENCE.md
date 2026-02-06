# Context API 快速參考

## 🚀 新的獨立 Contexts（推薦使用）

### MembersContext

```typescript
import { useMembers } from './contexts/MembersContext';

// 在組件中使用
const {
  members,           // Member[] - 所有會員列表
  setMembers,        // (members: Member[]) => void - 設置會員列表
  addMember,         // (member: Member) => void - 添加會員
  updateMember,      // (id: string, updates: Partial<Member>) => void - 更新會員
  deleteMember,      // (id: string) => void - 刪除會員
  getMemberById,     // (id: string) => Member | undefined - 根據 ID 查找會員
  totalMembers       // number - 會員總數
} = useMembers();
```

**何時使用：** 當組件需要操作會員數據時

**性能優勢：** 只有會員數據變更時才重新渲染

---

### MessagesContext

```typescript
import { useMessages } from './contexts/MessagesContext';

// 在組件中使用
const {
  messages,          // Message[] - 所有訊息列表
  setMessages,       // (messages: Message[]) => void - 設置訊息列表
  addMessage,        // (message: Message) => void - 添加訊息
  updateMessage,     // (id: string, updates: Partial<Message>) => void - 更新訊息
  deleteMessage,     // (id: string) => void - 刪除訊息
  getMessageById,    // (id: string) => Message | undefined - 根據 ID 查找訊息
  totalMessages      // number - 訊息總數
} = useMessages();
```

**何時使用：** 當組件需要操作訊息數據時

**性能優勢：** 只有訊息數據變更時才重新渲染

---

### AutoRepliesContext

```typescript
import { useAutoReplies } from './contexts/AutoRepliesContext';

// 在組件中使用
const {
  autoReplies,        // AutoReply[] - 所有自動回覆列表
  setAutoReplies,     // (replies: AutoReply[]) => void - 設置自動回覆列表
  addAutoReply,       // (reply: AutoReply) => void - 添加自動回覆
  updateAutoReply,    // (id: string, updates: Partial<AutoReply>) => void - 更新自動回覆
  deleteAutoReply,    // (id: string) => void - 刪除自動回覆
  getAutoReplyById,   // (id: string) => AutoReply | undefined - 根據 ID 查找自動回覆
  toggleAutoReply,    // (id: string) => void - 切換啟用/停用狀態
  totalAutoReplies,   // number - 自動回覆總數
  activeAutoReplies   // number - 啟用中的自動回覆數量
} = useAutoReplies();
```

**何時使用：** 當組件需要操作自動回覆數據時

**性能優勢：** 只有自動回覆數據變更時才重新渲染

---

### TagsContext

```typescript
import { useTags } from './contexts/TagsContext';

// 在組件中使用
const {
  allTags,           // string[] - 從所有數據源聚合的標籤（已排序）
  addTag,            // (tag: string) => void - 添加標籤（實際上標籤會自動出現）
  removeTag          // (tag: string) => void - 從所有數據源中移除標籤
} = useTags();
```

**何時使用：** 當組件需要顯示或管理標籤時

**特殊說明：** 
- `allTags` 自動從 members、messages、autoReplies 收集標籤
- `removeTag` 會從所有三個數據源中移除指定標籤
- 此 Context 會訂閱所有三個數據源，但標籤變更相對較少

**性能優勢：** 標籤數據集中管理，避免在多個組件中重複計算

---

## 🔄 向後兼容 API（不推薦）

### useData (Legacy)

```typescript
import { useData } from './contexts/DataContext';

// ⚠️ 會訂閱所有數據變更！
const {
  // 會員相關
  members,
  setMembers,
  addMember,
  updateMember,
  deleteMember,
  getMemberById,
  
  // 訊息相關
  messages,
  setMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  getMessageById,
  
  // 自動回覆相關
  autoReplies,
  setAutoReplies,
  addAutoReply,
  updateAutoReply,
  deleteAutoReply,
  getAutoReplyById,
  toggleAutoReply,
  
  // 標籤相關
  allTags,
  addTag,
  removeTag,
  
  // 統計
  stats: {
    totalMembers,
    totalMessages,
    totalAutoReplies,
    activeAutoReplies
  }
} = useData();
```

**⚠️ 性能警告：** 任何數據變更都會觸發組件重新渲染！

**遷移建議：** 改用對應的獨立 Hook

---

## 📊 使用場景對照表

| 場景 | 舊用法 | 新用法（推薦） | 性能提升 |
|------|--------|--------------|---------|
| 會員列表頁 | `useData()` | `useMembers()` | ✅ 高 |
| 訊息列表頁 | `useData()` | `useMessages()` | ✅ 高 |
| 自動回覆頁 | `useData()` | `useAutoReplies()` | ✅ 高 |
| 標籤選擇器 | `useData()` | `useTags()` | ✅ 中 |
| 統計儀表板 | `useData()` | 多個 Hook | ✅ 中 |
| 只需操作方法 | `useData()` | 對應 Hook | ✅ 低 |

---

## 💡 最佳實踐

### ✅ DO - 推薦做法

```typescript
// 1. 只訂閱需要的數據
function MemberList() {
  const { members } = useMembers();
  return <div>{members.map(...)}</div>;
}

// 2. 多個數據源時明確列出
function Dashboard() {
  const { totalMembers } = useMembers();
  const { totalMessages } = useMessages();
  const { allTags } = useTags();
  
  return (
    <div>
      <Stats members={totalMembers} messages={totalMessages} />
      <TagCloud tags={allTags} />
    </div>
  );
}

// 3. 只需操作方法時也使用對應 Hook
function AddMemberButton() {
  const { addMember } = useMembers();
  return <button onClick={() => addMember(...)}>添加</button>;
}

// 4. 與 memo 結合使用
const MemberCard = memo(({ member }: { member: Member }) => {
  return <div>{member.username}</div>;
});

function MemberList() {
  const { members } = useMembers();
  return (
    <div>
      {members.map(m => <MemberCard key={m.id} member={m} />)}
    </div>
  );
}
```

### ❌ DON'T - 避免的做法

```typescript
// 1. 不要在只需要會員數據的組件中使用 useData
function MemberList() {
  const { members } = useData(); // ❌ 會訂閱所有數據變更
  return <div>{members.map(...)}</div>;
}

// 2. 不要解構不需要的數據
function MemberList() {
  const { 
    members,
    messages,      // ❌ 不需要但還是會訂閱
    autoReplies    // ❌ 不需要但還是會訂閱
  } = useData();
  return <div>{members.map(...)}</div>;
}

// 3. 不要在多個組件中重複計算標籤
function MyComponent() {
  const { members, messages } = useData();
  // ❌ 應該使用 useTags()
  const allTags = [...new Set([
    ...members.flatMap(m => m.tags),
    ...messages.flatMap(m => m.tags)
  ])];
}
```

---

## 🎯 快速決策樹

```
需要使用數據？
│
├─ 只需要會員數據？ → useMembers()
├─ 只需要訊息數據？ → useMessages()
├─ 只需要自動回覆數據？ → useAutoReplies()
├─ 只需要標籤數據？ → useTags()
│
├─ 需要多種數據？
│  └─ 分別使用對應的 Hook
│
└─ 需要所有數據？
   └─ 使用 useData()（但考慮是否真的需要所有數據）
```

---

## 📈 性能對比示例

### 場景：更新一個會員的資料

#### 使用 useData()
```typescript
// Component A - 會員列表
const { members } = useData(); // ❌ 會重新渲染

// Component B - 訊息列表
const { messages } = useData(); // ❌ 也會重新渲染（不必要）

// Component C - 自動回覆列表
const { autoReplies } = useData(); // ❌ 也會重新渲染（不必要）
```
**結果：** 3 個組件都重新渲染

#### 使用獨立 Hooks
```typescript
// Component A - 會員列表
const { members } = useMembers(); // ✅ 會重新渲染（必要的）

// Component B - 訊息列表
const { messages } = useMessages(); // ✅ 不會重新渲染

// Component C - 自動回覆列表
const { autoReplies } = useAutoReplies(); // ✅ 不會重新渲染
```
**結果：** 只有 1 個組件重新渲染

**性能提升：** 減少了 66% 的不必要渲染！

---

## 🔗 相關文檔

- [完整遷移指南](./CONTEXT_MIGRATION_GUIDE.md)
- [重構總結](./CONTEXT_REFACTOR_SUMMARY.md)
- [原始 DataContext.tsx](./contexts/DataContext.tsx)

---

**最後更新：** 2025-11-17
