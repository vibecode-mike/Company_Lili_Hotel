# React Hooks 優化實例

**目的：** 提供具體的代碼示例，展示如何修復常見的 Hooks 使用問題

---

## 📚 目錄

1. [useEffect 依賴修復](#1-useeffect-依賴修復)
2. [useCallback 優化](#2-usecallback-優化)
3. [useMemo 優化](#3-usememo-優化)
4. [React.memo 應用](#4-reactmemo-應用)
5. [useDeferredValue 應用](#5-usedeferredvalue-應用)
6. [useTransition 應用](#6-usetransition-應用)
7. [常見錯誤和修復](#7-常見錯誤和修復)

---

## 1. useEffect 依賴修復

### 問題 1.1: 缺少依賴導致閉包陷阱

#### ❌ 錯誤示例

```typescript
function FilterModal({ onConfirm, onClose }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [isInclude, setIsInclude] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleConfirm = () => {
    if (selectedTags.length > 0) {
      onConfirm(selectedTags, isInclude);
      onClose();
    }
  };

  // ❌ 問題：缺少依賴，會使用過時的 state
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isInputFocused) {
        handleConfirm(); // 使用的是初始的 handleConfirm
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []); // ❌ 缺少: handleConfirm, isInputFocused

  return (
    // ... JSX
  );
}
```

**問題：**
- `handleConfirm` 函數在每次渲染時都是新的
- useEffect 只執行一次，捕獲的是初始的 `handleConfirm`
- 按 Enter 時使用的是過時的 `selectedTags` 和 `isInclude`

---

#### ✅ 修復方案 1: 使用 useCallback 穩定函數引用

```typescript
function FilterModal({ onConfirm, onClose }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [isInclude, setIsInclude] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // ✅ 使用 useCallback 創建穩定的函數引用
  const handleConfirm = useCallback(() => {
    if (selectedTags.length > 0) {
      onConfirm(selectedTags, isInclude);
      onClose();
    }
  }, [selectedTags, isInclude, onConfirm, onClose]); // 包含所有依賴

  // ✅ 現在可以安全地將 handleConfirm 加入依賴
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isInputFocused) {
        handleConfirm();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleConfirm, isInputFocused]); // ✅ 完整依賴

  return (
    // ... JSX
  );
}
```

**改善：**
- ✅ 函數引用穩定，不會每次渲染都變化
- ✅ useEffect 依賴完整，ESLint 不會警告
- ✅ 始終使用最新的 state

---

#### ✅ 修復方案 2: 在 effect 內部定義函數（推薦簡單場景）

```typescript
function FilterModal({ onConfirm, onClose }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [isInclude, setIsInclude] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // ✅ 在 effect 內部定義函數，確保使用最新的 state
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isInputFocused) {
        // 直接在這裡處理邏輯
        if (selectedTags.length > 0) {
          onConfirm(selectedTags, isInclude);
          onClose();
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedTags, isInclude, isInputFocused, onConfirm, onClose]); // ✅ 完整依賴

  return (
    // ... JSX
  );
}
```

**改善：**
- ✅ 更簡單，不需要額外的 useCallback
- ✅ 依賴清晰，一目了然
- ⚠️ 缺點：每次依賴變化都重新註冊事件（性能影響小）

---

### 問題 1.2: 使用 useEffect 更新狀態（應該用 useMemo）

#### ❌ 錯誤示例

```typescript
function FilterModal() {
  const [scrollbarHeight, setScrollbarHeight] = useState(30);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);

  // ❌ 問題：使用 useEffect 計算派生狀態
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scrollContainerRef.current) {
        const containerHeight = scrollContainerRef.current.clientHeight;
        const contentHeight = scrollContainerRef.current.scrollHeight;
        const newHeight = Math.max(
          30,
          (containerHeight / contentHeight) * containerHeight
        );
        setScrollbarHeight(newHeight);
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [availableTags.length, scrollTop]); // 每次都延遲計算

  return <div>{/* ... */}</div>;
}
```

**問題：**
- 使用 useEffect 計算派生狀態
- 需要額外的 setTimeout
- 造成額外的渲染

---

#### ✅ 修復方案 1: 使用 useMemo（推薦）

```typescript
function FilterModal() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);

  // ✅ 使用 useMemo 計算派生狀態
  const scrollbarHeight = useMemo(() => {
    if (!scrollContainerRef.current) return 30;
    
    const containerHeight = scrollContainerRef.current.clientHeight;
    const contentHeight = scrollContainerRef.current.scrollHeight;
    
    return Math.max(30, (containerHeight / contentHeight) * containerHeight);
  }, [availableTags.length, scrollTop]); // 只在依賴變化時重新計算

  return (
    <div>
      <div style={{ height: scrollbarHeight }}>{/* 滾動條 */}</div>
    </div>
  );
}
```

**改善：**
- ✅ 不需要額外的 state
- ✅ 同步計算，無延遲
- ✅ 減少一次渲染
- ✅ 代碼更簡潔

---

#### ✅ 修復方案 2: 使用 useLayoutEffect（需要同步更新）

```typescript
function FilterModal() {
  const [scrollbarHeight, setScrollbarHeight] = useState(30);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);

  // ✅ 如果必須用 effect，使用 useLayoutEffect 避免閃爍
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      const containerHeight = scrollContainerRef.current.clientHeight;
      const contentHeight = scrollContainerRef.current.scrollHeight;
      const newHeight = Math.max(
        30,
        (containerHeight / contentHeight) * containerHeight
      );
      setScrollbarHeight(newHeight);
    }
  }, [availableTags.length, scrollTop]);

  return <div>{/* ... */}</div>;
}
```

**改善：**
- ✅ 同步執行，在瀏覽器繪製前完成
- ✅ 避免閃爍
- ⚠️ 仍然需要額外的渲染

---

## 2. useCallback 優化

### 問題 2.1: 列表項事件處理導致重渲染

#### ❌ 錯誤示例

```typescript
interface Message {
  id: string;
  title: string;
  content: string;
}

// MessageRow 已經用 memo 優化
const MessageRow = memo(function MessageRow({
  message,
  onEdit,
  onDelete
}: {
  message: Message;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  console.log('MessageRow 渲染:', message.id);
  
  return (
    <div>
      <h3>{message.title}</h3>
      <button onClick={() => onEdit(message.id)}>編輯</button>
      <button onClick={() => onDelete(message.id)}>刪除</button>
    </div>
  );
});

// ❌ 問題：每次渲染都創建新函數
function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);

  // ❌ 每次渲染都是新函數
  const handleEdit = (id: string) => {
    console.log('編輯', id);
    // ... 編輯邏輯
  };

  const handleDelete = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  return (
    <div>
      {messages.map(message => (
        <MessageRow
          key={message.id}
          message={message}
          onEdit={handleEdit}    // ❌ 每次都是新函數，導致 MessageRow 重渲染
          onDelete={handleDelete} // ❌ 每次都是新函數，導致 MessageRow 重渲染
        />
      ))}
    </div>
  );
}
```

**問題：**
- `handleEdit` 和 `handleDelete` 每次渲染都是新函數
- 即使 `MessageRow` 用了 `memo`，props 每次都不同，還是會重渲染
- 有 10 條訊息就會重渲染 10 次

---

#### ✅ 修復方案

```typescript
// ✅ 使用 useCallback 穩定函數引用
function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);

  // ✅ 使用 useCallback 創建穩定的函數引用
  const handleEdit = useCallback((id: string) => {
    console.log('編輯', id);
    // ... 編輯邏輯
  }, []); // 不依賴任何 state，可以為空數組

  // ✅ 使用函數式更新，避免依賴 messages
  const handleDelete = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []); // 使用函數式更新，不需要依賴 messages

  return (
    <div>
      {messages.map(message => (
        <MessageRow
          key={message.id}
          message={message}
          onEdit={handleEdit}    // ✅ 穩定引用，不會導致重渲染
          onDelete={handleDelete} // ✅ 穩定引用，不會導致重渲染
        />
      ))}
    </div>
  );
}
```

**改善：**
- ✅ 函數引用穩定，不會每次都創建新函數
- ✅ `MessageRow` 只在 `message` 變化時重渲染
- ✅ 大幅減少重渲染次數

**性能對比：**
```
優化前：更新 1 條訊息 → 重渲染 10 次（所有行）
優化後：更新 1 條訊息 → 重渲染 1 次（只有變化的行）
改善：↓ 90% 重渲染
```

---

## 3. useMemo 優化

### 問題 3.1: 列表過濾/排序未優化

#### ❌ 錯誤示例

```typescript
interface Member {
  id: string;
  name: string;
  tags: string[];
  createTime: string;
}

function MemberList({ members }: { members: Member[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createTime'>('name');

  // ❌ 問題：每次渲染都重新計算
  const filteredMembers = members
    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return a.createTime.localeCompare(b.createTime);
    });

  return (
    <div>
      <input 
        value={searchQuery} 
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="搜索會員..."
      />
      <button onClick={() => setSortBy('name')}>按姓名排序</button>
      <button onClick={() => setSortBy('createTime')}>按時間排序</button>
      
      {filteredMembers.map(member => (
        <div key={member.id}>{member.name}</div>
      ))}
    </div>
  );
}
```

**問題：**
- 即使 `members`、`searchQuery`、`sortBy` 都沒變，每次渲染都重新計算
- 數據量大時（1000+ 條）會明顯卡頓
- 不必要的 CPU 消耗

---

#### ✅ 修復方案

```typescript
function MemberList({ members }: { members: Member[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createTime'>('name');

  // ✅ 使用 useMemo 緩存計算結果
  const filteredMembers = useMemo(() => {
    console.log('重新計算 filteredMembers'); // 驗證只在必要時計算
    
    return members
      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return a.createTime.localeCompare(b.createTime);
      });
  }, [members, searchQuery, sortBy]); // ✅ 只在依賴變化時重新計算

  return (
    <div>
      <input 
        value={searchQuery} 
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="搜索會員..."
      />
      <button onClick={() => setSortBy('name')}>按姓名排序</button>
      <button onClick={() => setSortBy('createTime')}>按時間排序</button>
      
      {filteredMembers.map(member => (
        <div key={member.id}>{member.name}</div>
      ))}
    </div>
  );
}
```

**改善：**
- ✅ 只在 `members`、`searchQuery` 或 `sortBy` 變化時重新計算
- ✅ 其他狀態變化（如 hover）不會觸發計算
- ✅ 大數據量時性能提升明顯

**性能對比：**
```
場景：1000 條會員數據

優化前：
- 每次渲染都計算（包括 hover、focus 等）
- 計算時間：~50ms
- 渲染卡頓明顯

優化後：
- 只在搜索或排序時計算
- 其他操作幾乎無延遲
- 改善：↓ 80% 計算時間
```

---

## 4. React.memo 應用

### 問題 4.1: 列表項組件重複渲染

#### ❌ 錯誤示例

```typescript
// ❌ 未使用 memo
function TagItem({ 
  tag, 
  selected, 
  onClick 
}: { 
  tag: { id: string; name: string }; 
  selected: boolean;
  onClick: () => void;
}) {
  console.log('TagItem 渲染:', tag.name);
  
  return (
    <div 
      className={`tag ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {tag.name}
    </div>
  );
}

function TagSelector() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const allTags = [/* 100 個標籤 */];

  const handleToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  return (
    <div>
      {allTags.map(tag => (
        <TagItem
          key={tag.id}
          tag={tag}
          selected={selectedTags.includes(tag.id)}
          onClick={() => handleToggle(tag.id)}
        />
      ))}
    </div>
  );
}
```

**問題：**
- 選擇 1 個標籤，所有 100 個 `TagItem` 都重渲染
- 即使 99 個標籤的 props 沒變，還是重渲染
- 效能浪費

---

#### ✅ 修復方案

```typescript
// ✅ 使用 memo 優化
const TagItem = memo(function TagItem({ 
  tag, 
  selected, 
  onClick 
}: { 
  tag: { id: string; name: string }; 
  selected: boolean;
  onClick: () => void;
}) {
  console.log('TagItem 渲染:', tag.name);
  
  return (
    <div 
      className={`tag ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {tag.name}
    </div>
  );
});

function TagSelector() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const allTags = [/* 100 個標籤 */];

  // ✅ 使用 useCallback 穩定函數引用
  const handleToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  return (
    <div>
      {allTags.map(tag => (
        <TagItem
          key={tag.id}
          tag={tag}
          selected={selectedTags.includes(tag.id)}
          onClick={() => handleToggle(tag.id)} // ⚠️ 這裡還有優化空間
        />
      ))}
    </div>
  );
}
```

**問題：**
- 已經用了 `memo`，但還是重渲染
- 原因：`onClick={() => handleToggle(tag.id)}` 每次都是新函數

---

#### ✅ 最終優化方案

```typescript
// ✅ 進一步優化 onClick
const TagItem = memo(function TagItem({ 
  tag, 
  selected, 
  onToggle 
}: { 
  tag: { id: string; name: string }; 
  selected: boolean;
  onToggle: (id: string) => void; // 改為接收 id
}) {
  console.log('TagItem 渲染:', tag.name);
  
  return (
    <div 
      className={`tag ${selected ? 'selected' : ''}`}
      onClick={() => onToggle(tag.id)} // 在組件內部創建閉包
    >
      {tag.name}
    </div>
  );
});

function TagSelector() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const allTags = [/* 100 個標籤 */];

  const handleToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  return (
    <div>
      {allTags.map(tag => (
        <TagItem
          key={tag.id}
          tag={tag}
          selected={selectedTags.includes(tag.id)}
          onToggle={handleToggle} // ✅ 穩定引用
        />
      ))}
    </div>
  );
}
```

**改善：**
- ✅ 選擇 1 個標籤，只重渲染 2 個組件（被選和取消選的）
- ✅ 其他 98 個組件不重渲染
- ✅ 性能提升：↓ 98% 重渲染

---

## 5. useDeferredValue 應用

### 場景：搜索大量數據時輸入卡頓

#### ❌ 問題示例

```typescript
function MemberSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const allMembers = [/* 10000 個會員 */];

  // ❌ 每次輸入都立即過濾 10000 條數據
  const filteredMembers = useMemo(() => 
    allMembers.filter(m => m.name.includes(searchQuery)),
    [allMembers, searchQuery]
  );

  return (
    <div>
      <input 
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)} // 輸入卡頓
        placeholder="搜索會員..."
      />
      <div>找到 {filteredMembers.length} 個結果</div>
      {filteredMembers.map(member => (
        <MemberRow key={member.id} member={member} />
      ))}
    </div>
  );
}
```

**問題：**
- 每次輸入都立即過濾 10000 條數據
- 過濾耗時 ~100ms，導致輸入卡頓
- 用戶體驗差

---

#### ✅ 修復方案：使用 useDeferredValue

```typescript
import { useDeferredValue, useMemo } from 'react';

function MemberSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const allMembers = [/* 10000 個會員 */];

  // ✅ 延遲更新搜索查詢
  const deferredQuery = useDeferredValue(searchQuery);

  // ✅ 使用延遲的查詢進行過濾
  const filteredMembers = useMemo(() => 
    allMembers.filter(m => m.name.includes(deferredQuery)),
    [allMembers, deferredQuery] // 使用 deferredQuery
  );

  const isPending = searchQuery !== deferredQuery;

  return (
    <div>
      <input 
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)} // ✅ 立即響應，無卡頓
        placeholder="搜索會員..."
      />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        找到 {filteredMembers.length} 個結果
        {isPending && ' (搜索中...)'}
      </div>
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        {filteredMembers.map(member => (
          <MemberRow key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
```

**改善：**
- ✅ 輸入框立即響應，無延遲
- ✅ 列表渲染延遲執行，不阻塞輸入
- ✅ 提供視覺反饋（透明度變化）
- ✅ 用戶體驗提升 80%+

**工作原理：**
```
用戶輸入 "John"：

J → searchQuery: "J" (立即)
     deferredQuery: "" (延遲)
     輸入框顯示 "J"，列表顯示舊結果

Jo → searchQuery: "Jo" (立即)
      deferredQuery: "J" (延遲)
      輸入框顯示 "Jo"，列表顯示 "J" 的結果

Joh → searchQuery: "Joh" (立即)
       deferredQuery: "Jo" (延遲)
       輸入框顯示 "Joh"，列表顯示 "Jo" 的結果

John → searchQuery: "John" (立即)
        deferredQuery: "Joh" (延遲)
        最終同步 → deferredQuery: "John"
```

---

## 6. useTransition 應用

### 場景：標籤頁切換卡頓

#### ❌ 問題示例

```typescript
function Dashboard() {
  const [activeTab, setActiveTab] = useState('members');

  return (
    <div>
      <div>
        <button onClick={() => setActiveTab('members')}>
          會員列表
        </button>
        <button onClick={() => setActiveTab('messages')}>
          訊息列表
        </button>
        <button onClick={() => setActiveTab('analytics')}>
          數據分析
        </button>
      </div>

      {/* ❌ 切換到分析頁面時，需要渲染大量圖表，導致卡頓 */}
      {activeTab === 'members' && <MemberList />}
      {activeTab === 'messages' && <MessageList />}
      {activeTab === 'analytics' && <AnalyticsDashboard />} {/* 耗時組件 */}
    </div>
  );
}
```

**問題：**
- 切換到 "數據分析" 時，UI 凍結 ~500ms
- 按鈕點擊後沒有反應，用戶以為沒點到
- 用戶體驗差

---

#### ✅ 修復方案：使用 useTransition

```typescript
import { useTransition } from 'react';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('members');
  const [isPending, startTransition] = useTransition();

  // ✅ 將標籤頁切換標記為非緊急更新
  const handleTabChange = (tab: string) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <div>
        <button 
          onClick={() => handleTabChange('members')}
          disabled={isPending}
        >
          會員列表
        </button>
        <button 
          onClick={() => handleTabChange('messages')}
          disabled={isPending}
        >
          訊息列表
        </button>
        <button 
          onClick={() => handleTabChange('analytics')}
          disabled={isPending}
        >
          數據分析 {isPending && '(載入中...)'}
        </button>
      </div>

      {/* ✅ 切換時保持響應，顯示載入狀態 */}
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        {activeTab === 'members' && <MemberList />}
        {activeTab === 'messages' && <MessageList />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>

      {isPending && (
        <div className="loading-spinner">載入中...</div>
      )}
    </div>
  );
}
```

**改善：**
- ✅ 按鈕立即響應（變為 disabled 狀態）
- ✅ 顯示載入指示器
- ✅ 新內容準備好後才切換
- ✅ UI 不會凍結
- ✅ 用戶體驗提升 90%+

---

## 7. 常見錯誤和修復

### 錯誤 7.1: 過度使用 useCallback/useMemo

#### ❌ 過度優化

```typescript
function Button({ onClick, children }) {
  // ❌ 不必要：簡單組件不需要這些優化
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const buttonText = useMemo(() => {
    return children.toString();
  }, [children]);

  return <button onClick={handleClick}>{buttonText}</button>;
}
```

**問題：**
- `useCallback` 和 `useMemo` 本身也有成本
- 簡單組件優化反而降低性能

---

#### ✅ 正確做法

```typescript
// ✅ 簡單組件不需要優化
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// ✅ 只在需要時優化
const ExpensiveListItem = memo(function ExpensiveListItem({ data, onAction }) {
  // 複雜的渲染邏輯...
  const processedData = useMemo(() => {
    // 複雜的計算...
    return expensiveTransform(data);
  }, [data]);

  return <div>{/* ... */}</div>;
});
```

---

### 錯誤 7.2: 依賴數組中的對象/數組

#### ❌ 錯誤用法

```typescript
function UserProfile({ user }) {
  // ❌ user 是對象，每次都是新引用
  useEffect(() => {
    fetchUserDetails(user.id);
  }, [user]); // 即使 user.id 沒變，user 對象變了還是會執行

  // ❌ options 每次渲染都是新對象
  const options = { sort: 'name', limit: 10 };
  const data = useMemo(() => {
    return processData(rawData, options);
  }, [rawData, options]); // options 每次都不同，useMemo 失效
}
```

---

#### ✅ 正確做法

```typescript
function UserProfile({ user }) {
  // ✅ 只依賴需要的屬性
  useEffect(() => {
    fetchUserDetails(user.id);
  }, [user.id]); // 只依賴 id

  // ✅ 使用 useMemo 穩定對象引用
  const options = useMemo(() => ({ 
    sort: 'name', 
    limit: 10 
  }), []); // 穩定引用

  const data = useMemo(() => {
    return processData(rawData, options);
  }, [rawData, options]); // 現在 options 穩定了
}
```

---

### 錯誤 7.3: useEffect 中的異步函數

#### ❌ 錯誤用法

```typescript
function DataFetcher({ userId }) {
  const [data, setData] = useState(null);

  // ❌ useEffect 不能是 async 函數
  useEffect(async () => {
    const response = await fetch(`/api/users/${userId}`);
    const json = await response.json();
    setData(json);
  }, [userId]); // ❌ ESLint 錯誤

  return <div>{data?.name}</div>;
}
```

---

#### ✅ 正確做法

```typescript
function DataFetcher({ userId }) {
  const [data, setData] = useState(null);

  // ✅ 在 useEffect 內部定義 async 函數
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const json = await response.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      }
    }

    fetchData();

    // ✅ 清理函數防止內存洩漏
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return <div>{data?.name}</div>;
}
```

---

## 📝 總結

### 優化檢查清單

**useEffect：**
- [ ] 是否包含所有依賴？
- [ ] 是否需要清理函數？
- [ ] 是否應該用 useMemo 代替？
- [ ] 是否需要 useLayoutEffect？

**useCallback：**
- [ ] 是否傳遞給 memo 組件？
- [ ] 是否在列表中使用？
- [ ] 依賴數組是否正確？
- [ ] 是否過度使用？

**useMemo：**
- [ ] 計算是否昂貴？
- [ ] 是否創建對象/數組？
- [ ] 依賴數組是否正確？
- [ ] 是否過度使用？

**React.memo：**
- [ ] 是否是列表項組件？
- [ ] props 是否頻繁變化？
- [ ] 是否有內部狀態？
- [ ] 是否配合 useCallback 使用？

**React 18 新特性：**
- [ ] 搜索是否用 useDeferredValue？
- [ ] 大數據切換是否用 useTransition？
- [ ] 是否提供視覺反饋？

---

**相關文檔：**
- `/HOOKS_OPTIMIZATION_PLAN.md` - 完整優化計劃
- `/HOOKS_OPTIMIZATION_TRACKER.md` - 進度追蹤
- `/MEMO_OPTIMIZATION_GUIDE.md` - React.memo 指南
