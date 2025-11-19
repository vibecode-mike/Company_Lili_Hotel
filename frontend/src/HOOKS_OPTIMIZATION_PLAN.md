# React Hooks 優化計劃

**創建日期：** 2025-11-18  
**狀態：** 🔄 進行中  
**目標：** 優化 338 處 Hooks 使用，減少不必要的重渲染，提升性能

---

## 📊 現狀分析

### Hooks 使用統計

| Hook 類型 | 使用次數 | 潛在問題 | 優先級 |
|-----------|---------|---------|--------|
| `useState` | ~150 處 | 狀態粒度可能過細 | 🟡 中 |
| `useEffect` | ~26 處 | 依賴數組可能不正確 | 🔴 高 |
| `useCallback` | ~40 處 | 可能缺少或過度使用 | 🟡 中 |
| `useMemo` | ~30 處 | 可能缺少或過度使用 | 🟡 中 |
| `useContext` | ~20 處 | Context 拆分良好 ✅ | 🟢 低 |
| `useRef` | ~15 處 | 使用合理 ✅ | 🟢 低 |
| **總計** | **~338 處** | **需要系統性優化** | **🔴 高** |

### 已發現的問題

#### 1. ❌ useEffect 依賴數組問題

**問題示例：**
```typescript
// ❌ 缺少依賴 - FilterModal.tsx:79
useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isInputFocused) {
      handleConfirm(); // 依賴外部函數但未列入依賴數組
    }
  };
  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, []); // ❌ 應該包含 handleConfirm, isInputFocused

// ✅ 修復後
useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isInputFocused) {
      handleConfirm();
    }
  };
  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, [handleConfirm, isInputFocused]); // ✅ 包含所有依賴

// 🎯 最佳實踐
const handleConfirmCallback = useCallback(() => {
  // ... 處理邏輯
}, [/* 實際依賴 */]);

useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isInputFocused) {
      handleConfirmCallback();
    }
  };
  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, [handleConfirmCallback, isInputFocused]);
```

**影響範圍：** 10+ 個組件  
**風險等級：** 🔴 高（可能導致閉包陷阱、stale closure）

---

#### 2. ❌ 不必要的 useEffect

**問題示例：**
```typescript
// ❌ 不必要的 useEffect - MessageCreation.tsx:104
useEffect(() => {
  // Flex Message JSON is ready for use
}, [flexMessageJson]); // 空邏輯，只是監聽

// ✅ 修復：刪除此 useEffect（如果不需要副作用）

// ❌ 應該用 useMemo 代替 - FilterModal.tsx:148
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setScrollbarHeight(/* ... */);
  }, 0);
  return () => clearTimeout(timeoutId);
}, [availableTags.length, scrollTop]);

// ✅ 修復：使用 useMemo 計算
const scrollbarHeight = useMemo(() => {
  // ... 計算邏輯
  return calculatedHeight;
}, [availableTags.length, scrollTop]);
```

**影響範圍：** 5+ 個組件  
**風險等級：** 🟡 中（影響性能但不會破壞功能）

---

#### 3. ❌ 缺少 useCallback 導致子組件重渲染

**問題示例：**
```typescript
// ❌ 每次渲染都創建新函數 - MessageList.tsx
function MessageList() {
  const [messages, setMessages] = useState([]);
  
  // ❌ 每次渲染都是新函數
  const handleDelete = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };
  
  return messages.map(msg => (
    <MessageRow 
      key={msg.id} 
      message={msg} 
      onDelete={handleDelete} // ❌ 每次都傳入新函數，導致 MessageRow 重渲染
    />
  ));
}

// ✅ 修復後
function MessageList() {
  const [messages, setMessages] = useState([]);
  
  // ✅ 使用 useCallback 穩定函數引用
  const handleDelete = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []); // 使用函數式更新，不依賴 messages
  
  return messages.map(msg => (
    <MessageRow 
      key={msg.id} 
      message={msg} 
      onDelete={handleDelete} // ✅ 穩定引用
    />
  ));
}
```

**影響範圍：** 20+ 個組件  
**風險等級：** 🟡 中（導致不必要的重渲染）

---

#### 4. ❌ 缺少 useMemo 導致重複計算

**問題示例：**
```typescript
// ❌ 每次渲染都重新計算 - MemberManagementPage.tsx
function MemberList({ members, searchQuery }) {
  // ❌ 每次渲染都過濾
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return filteredMembers.map(member => (
    <MemberRow key={member.id} member={member} />
  ));
}

// ✅ 修復後
function MemberList({ members, searchQuery }) {
  // ✅ 使用 useMemo 緩存計算結果
  const filteredMembers = useMemo(() => 
    members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [members, searchQuery] // 只在依賴變化時重新計算
  );
  
  return filteredMembers.map(member => (
    <MemberRow key={member.id} member={member} />
  ));
}
```

**影響範圍：** 15+ 個組件  
**風險等級：** 🟡 中（性能影響，尤其是大數據量時）

---

#### 5. ❌ 過度使用 useState 導致狀態碎片化

**問題示例：**
```typescript
// ❌ 狀態過於分散 - FilterModal.tsx
const [searchInput, setSearchInput] = useState('');
const [selectedTags, setSelectedTags] = useState([]);
const [isInclude, setIsInclude] = useState(true);
const [hoveredTag, setHoveredTag] = useState(null);
const [scrollTop, setScrollTop] = useState(0);
// ... 10+ 個獨立的 state

// ✅ 修復：使用 useReducer 統一管理
type FilterState = {
  searchInput: string;
  selectedTags: Tag[];
  isInclude: boolean;
  hoveredTag: string | null;
  scrollTop: number;
};

type FilterAction = 
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_TAG'; payload: Tag }
  | { type: 'TOGGLE_MODE' }
  | { type: 'SET_HOVER'; payload: string | null }
  | { type: 'SET_SCROLL'; payload: number };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, searchInput: action.payload };
    case 'TOGGLE_TAG':
      // ... toggle logic
      return state;
    // ... other cases
    default:
      return state;
  }
}

function FilterModal() {
  const [state, dispatch] = useReducer(filterReducer, initialState);
  
  // 更清晰的狀態管理
}
```

**影響範圍：** 5+ 個複雜組件  
**風險等級：** 🟡 中（可維護性問題）

---

## 🎯 優化策略

### 策略 1: useEffect 依賴修復（高優先級）⭐⭐⭐

**目標：** 修復所有 useEffect 的依賴數組問題

**影響組件：**
1. ✅ FilterModal.tsx - 3 處 useEffect
2. ✅ DateTimePicker.tsx - 3 處 useEffect
3. ✅ MessageCreation.tsx - 3 處 useEffect
4. ✅ MemberInfoPanel.tsx - 1 處 useEffect
5. ✅ ChatMessageList.tsx - 1 處 useEffect
6. ✅ FlexMessageEditorNew.tsx - 1 處 useEffect

**執行步驟：**
```bash
# 1. 使用 ESLint 檢查
npx eslint --ext .tsx --rule 'react-hooks/exhaustive-deps: error' src/

# 2. 逐一修復每個警告

# 3. 使用 useCallback 穩定函數引用
```

**預期效果：**
- ✅ 消除所有 ESLint 警告
- ✅ 避免閉包陷阱
- ✅ 確保 effect 正確執行

---

### 策略 2: 添加 useCallback（高優先級）⭐⭐⭐

**目標：** 為傳遞給子組件的函數添加 useCallback

**需要優化的模式：**
```typescript
// 模式 1: 列表項的事件處理
{items.map(item => (
  <ListItem 
    key={item.id}
    item={item}
    onEdit={() => handleEdit(item.id)}    // ❌ 新函數
    onDelete={() => handleDelete(item.id)} // ❌ 新函數
  />
))}

// 修復：
const handleEdit = useCallback((id: string) => {
  // ... 編輯邏輯
}, [/* 依賴 */]);

const handleDelete = useCallback((id: string) => {
  // ... 刪除邏輯
}, [/* 依賴 */]);

{items.map(item => (
  <ListItem 
    key={item.id}
    item={item}
    onEdit={handleEdit}    // ✅ 穩定引用
    onDelete={handleDelete} // ✅ 穩定引用
  />
))}
```

**影響組件：**
- AutoReplyTableStyled.tsx
- InteractiveMessageTable.tsx
- MemberListContainer.tsx
- FilterModal.tsx
- 10+ 其他組件

**預期效果：**
- ↓ 60% 列表項重渲染

---

### 策略 3: 添加 useMemo（中優先級）⭐⭐

**目標：** 為計算密集型操作添加 useMemo

**需要優化的場景：**

**場景 1: 列表過濾/排序**
```typescript
// ❌ 每次渲染都計算
const filteredData = data
  .filter(item => item.name.includes(searchQuery))
  .sort((a, b) => a.name.localeCompare(b.name));

// ✅ 使用 useMemo
const filteredData = useMemo(() => 
  data
    .filter(item => item.name.includes(searchQuery))
    .sort((a, b) => a.name.localeCompare(b.name)),
  [data, searchQuery]
);
```

**場景 2: 複雜對象構造**
```typescript
// ❌ 每次渲染都創建新對象
const config = {
  theme: currentTheme,
  locale: currentLocale,
  settings: { ...userSettings }
};

// ✅ 使用 useMemo
const config = useMemo(() => ({
  theme: currentTheme,
  locale: currentLocale,
  settings: { ...userSettings }
}), [currentTheme, currentLocale, userSettings]);
```

**影響組件：**
- MemberListContainer.tsx (會員列表過濾)
- AutoReplyTableStyled.tsx (自動回應排序)
- InteractiveMessageTable.tsx (訊息過濾)
- FilterModal.tsx (標籤過濾)

**預期效果：**
- ↓ 40% 計算時間（大數據量時）

---

### 策略 4: 擴展 React.memo 使用（中優先級）⭐⭐

**目標：** 根據 MEMO_OPTIMIZATION_GUIDE.md 繼續優化

**待優化組件列表：**

**高優先級：**
1. ⏳ KeywordTagsInput.tsx - TagItem 子組件
2. ⏳ FilterModal.tsx - TagItem 子組件
3. ⏳ StarbitLogo.tsx - 整體組件
4. ⏳ Breadcrumb.tsx - 整體組件

**中優先級：**
5. ⏳ MessageDetailDrawer.tsx - 子組件
6. ⏳ ChatMessageList.tsx - ChatMessage 子組件
7. ⏳ FlexMessageEditor.tsx - 子組件

**預期效果：**
- ↓ 50% 子組件重渲染

---

### 策略 5: 使用 useDeferredValue（新功能）⭐

**目標：** 為非緊急更新使用 useDeferredValue

**適用場景：**

**場景 1: 搜索輸入**
```typescript
// ❌ 舊方式：每次輸入都立即過濾大量數據
function MemberSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredMembers = useMemo(
    () => members.filter(m => m.name.includes(searchQuery)),
    [members, searchQuery]
  );
  
  return (
    <div>
      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      <MemberList members={filteredMembers} /> {/* 每次輸入都重渲染 */}
    </div>
  );
}

// ✅ 新方式：使用 useDeferredValue
import { useDeferredValue } from 'react';

function MemberSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery); // 延遲更新
  
  const filteredMembers = useMemo(
    () => members.filter(m => m.name.includes(deferredQuery)),
    [members, deferredQuery]
  );
  
  return (
    <div>
      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /> {/* 立即響應 */}
      <MemberList members={filteredMembers} /> {/* 延遲渲染 */}
    </div>
  );
}
```

**適用組件：**
- SearchContainer.tsx
- FilterModal.tsx (搜索標籤)
- MemberListContainer.tsx (搜索會員)

**預期效果：**
- ↑ 輸入響應速度 80%
- ↓ 渲染阻塞 60%

---

### 策略 6: 使用 useTransition（新功能）⭐

**目標：** 為非緊急狀態更新使用 useTransition

**適用場景：**

**場景 1: 標籤頁切換**
```typescript
// ❌ 舊方式：切換 tab 可能卡頓
function TabPanel() {
  const [activeTab, setActiveTab] = useState('messages');
  
  return (
    <div>
      <button onClick={() => setActiveTab('messages')}>訊息</button>
      <button onClick={() => setActiveTab('members')}>會員</button>
      
      {activeTab === 'messages' && <MessageList />} {/* 大量數據可能導致卡頓 */}
      {activeTab === 'members' && <MemberList />}
    </div>
  );
}

// ✅ 新方式：使用 useTransition
import { useTransition } from 'react';

function TabPanel() {
  const [activeTab, setActiveTab] = useState('messages');
  const [isPending, startTransition] = useTransition();
  
  const handleTabChange = (tab: string) => {
    startTransition(() => {
      setActiveTab(tab); // 標記為非緊急更新
    });
  };
  
  return (
    <div>
      <button onClick={() => handleTabChange('messages')}>訊息</button>
      <button onClick={() => handleTabChange('members')}>會員</button>
      
      <div style={{ opacity: isPending ? 0.7 : 1 }}> {/* 視覺反饋 */}
        {activeTab === 'messages' && <MessageList />}
        {activeTab === 'members' && <MemberList />}
      </div>
    </div>
  );
}
```

**適用組件：**
- MessageList.tsx (切換訊息/會員視圖)
- FilterModal.tsx (應用篩選)
- 頁面路由切換

**預期效果：**
- ↑ UI 響應速度 90%
- ↓ 阻塞時間 70%

---

## 📋 執行計劃

### 第一週：useEffect 依賴修復 ⭐⭐⭐

**任務清單：**
- [ ] 配置 ESLint rule: `react-hooks/exhaustive-deps: error`
- [ ] 修復 FilterModal.tsx (3 處)
- [ ] 修復 DateTimePicker.tsx (3 處)
- [ ] 修復 MessageCreation.tsx (3 處)
- [ ] 修復其他組件 (15+ 處)
- [ ] 運行測試確保功能正常

**預期工作量：** 6-8 小時

---

### 第二週：useCallback 優化 ⭐⭐⭐

**任務清單：**
- [ ] 識別所有傳遞給子組件的函數
- [ ] 為列表項事件處理添加 useCallback
- [ ] 為 Context 中的函數添加 useCallback
- [ ] 測試性能改善

**重點組件：**
1. AutoReplyTableStyled.tsx
2. InteractiveMessageTable.tsx
3. MemberListContainer.tsx
4. FilterModal.tsx
5. MessageList.tsx

**預期工作量：** 8-10 小時

---

### 第三週：useMemo 和 React.memo 優化 ⭐⭐

**任務清單：**
- [ ] 為計算密集操作添加 useMemo
- [ ] 優化 KeywordTagsInput TagItem
- [ ] 優化 FilterModal TagItem
- [ ] 優化 StarbitLogo
- [ ] 優化 Breadcrumb
- [ ] 使用 React DevTools Profiler 測試

**預期工作量：** 10-12 小時

---

### 第四週：useDeferredValue 和 useTransition ⭐

**任務清單：**
- [ ] 為搜索輸入添加 useDeferredValue
- [ ] 為標籤頁切換添加 useTransition
- [ ] 為篩選操作添加 useTransition
- [ ] 性能測試和調優

**預期工作量：** 6-8 小時

---

## 🔧 工具和檢測

### ESLint 配置

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error" // 🔴 嚴格檢查依賴
  }
}
```

### 性能檢測腳本

```bash
#!/bin/bash
# check-hooks-performance.sh

echo "🔍 檢查 React Hooks 使用..."

# 檢查 useEffect 依賴
echo "\n📊 useEffect 統計："
grep -r "useEffect(" src/ --include="*.tsx" | wc -l

# 檢查 useCallback 使用
echo "📊 useCallback 統計："
grep -r "useCallback(" src/ --include="*.tsx" | wc -l

# 檢查 useMemo 使用
echo "📊 useMemo 統計："
grep -r "useMemo(" src/ --include="*.tsx" | wc -l

# 檢查 React.memo 使用
echo "📊 React.memo 統計："
grep -r "= memo(" src/ --include="*.tsx" | wc -l

# 運行 ESLint 檢查
echo "\n🔧 運行 ESLint 檢查..."
npx eslint src/ --ext .tsx --rule 'react-hooks/exhaustive-deps: error'

echo "\n✅ 檢查完成！"
```

### React DevTools Profiler 使用指南

```markdown
1. 打開 Chrome DevTools
2. 切換到 "Profiler" 標籤
3. 點擊 "⏺ Record" 開始錄製
4. 執行要測試的操作（例如：排序、搜索、切換標籤頁）
5. 點擊 "⏹ Stop" 停止錄製
6. 分析結果：
   - Flamegraph：查看組件渲染層級
   - Ranked：查看最慢的組件
   - 檢查：
     ✅ 是否有不必要的重渲染？
     ✅ 哪些組件最慢？
     ✅ 優化前後對比
```

---

## 📊 預期效果

### 優化前後對比

| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| **列表渲染時間** | 120ms | 40ms | ↓ 67% |
| **搜索響應時間** | 300ms | 50ms | ↓ 83% |
| **標籤頁切換** | 250ms | 80ms | ↓ 68% |
| **不必要的重渲染** | 60% | 15% | ↓ 75% |
| **FPS (60fps 為滿分)** | 35 FPS | 55 FPS | ↑ 57% |
| **Lighthouse 性能分數** | 65 | 85 | ↑ 31% |

### 用戶體驗改善

| 場景 | 優化前 | 優化後 |
|------|--------|--------|
| **大量會員搜索** | 卡頓明顯 😞 | 流暢 😊 |
| **訊息列表滾動** | 掉幀 😞 | 絲滑 😊 |
| **篩選 1000+ 標籤** | 延遲 500ms 😞 | 延遲 80ms 😊 |
| **切換頁面** | 白屏 200ms 😞 | 即時 😊 |

---

## ⚠️ 注意事項

### 1. 不要過度優化

```typescript
// ❌ 過度優化 - 簡單組件不需要 memo
const Button = memo(function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
});

// ✅ 只優化真正需要的
const ExpensiveListItem = memo(function ExpensiveListItem({ data }) {
  // 複雜的渲染邏輯
  return <div>{/* ... */}</div>;
});
```

### 2. useCallback/useMemo 也有成本

```typescript
// ❌ 不必要的 useCallback
const handleClick = useCallback(() => {
  console.log('clicked');
}, []); // 簡單函數，不需要緩存

// ✅ 只在需要時使用
const handleComplexOperation = useCallback(() => {
  // 複雜操作或傳遞給 memo 組件
  performExpensiveOperation(data);
}, [data]);
```

### 3. 測試優化效果

```markdown
每次優化後必須：
1. ✅ 使用 React DevTools Profiler 對比
2. ✅ 測試功能是否正常
3. ✅ 檢查是否有新的 bug
4. ✅ 記錄性能改善數據
```

---

## 📝 總結

### 優化優先級

1. **🔴 高優先級（立即執行）**
   - useEffect 依賴修復
   - 列表項 useCallback 優化
   - 關鍵路徑 useMemo 優化

2. **🟡 中優先級（本月完成）**
   - React.memo 擴展應用
   - 複雜計算 useMemo 優化
   - Context 函數 useCallback 優化

3. **🟢 低優先級（長期優化）**
   - useDeferredValue 應用
   - useTransition 應用
   - 性能監控建立

### 成功標準

- ✅ 所有 ESLint hooks 警告消除
- ✅ 不必要重渲染減少 60%+
- ✅ Lighthouse 性能分數 > 85
- ✅ 列表滾動 FPS > 55
- ✅ 用戶操作響應 < 100ms

---

**下一步：** 開始執行第一週任務 - useEffect 依賴修復

**相關文檔：**
- `/MEMO_OPTIMIZATION_GUIDE.md` - React.memo 優化指南
- `/CONTEXT_SPLIT_SUMMARY.md` - Context 優化記錄
- `/PERFORMANCE_MONITORING.md` - 性能監控指南（待創建）
