# React Hooks 優化進度追蹤

**開始日期：** 2025-11-18  
**目標完成：** 2025-12-18（4 週）  
**當前狀態：** 🔄 進行中

---

## 📊 總體進度

| 階段 | 任務數 | 已完成 | 進行中 | 待開始 | 完成率 |
|------|--------|--------|--------|--------|--------|
| **第一週** | 26 | 0 | 0 | 26 | 0% |
| **第二週** | 20 | 0 | 0 | 20 | 0% |
| **第三週** | 15 | 0 | 0 | 15 | 0% |
| **第四週** | 8 | 0 | 0 | 8 | 0% |
| **總計** | **69** | **0** | **0** | **69** | **0%** |

---

## 🎯 第一週：useEffect 依賴修復（26 處）

### 配置 ESLint（優先）

- [ ] **任務 0.1:** 更新 `.eslintrc.json` 配置
  - 狀態：⏳ 待開始
  - 預計時間：30 分鐘
  - 負責人：-
  
```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "error"
  }
}
```

---

### FilterModal.tsx（3 處）⭐

#### 問題 1.1: 全局鍵盤事件（第 79 行）

- [ ] **修復 useEffect 依賴數組**
  - 狀態：⏳ 待開始
  - 問題：缺少 `handleConfirm`, `isInputFocused` 依賴
  - 風險：🔴 高（可能使用過時的 state）
  
**當前代碼：**
```typescript
useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isInputFocused) {
      handleConfirm();
    }
  };
  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, []); // ❌ 缺少依賴
```

**修復方案：**
```typescript
const handleConfirmCallback = useCallback(() => {
  if (selectedTags.length > 0) {
    onConfirm?.(selectedTags, isInclude);
    onClose();
  }
}, [selectedTags, isInclude, onConfirm, onClose]);

useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isInputFocused) {
      handleConfirmCallback();
    }
  };
  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, [handleConfirmCallback, isInputFocused]); // ✅ 完整依賴
```

---

#### 問題 1.2: 滾動條更新（第 148 行）

- [ ] **修復 useEffect 依賴數組**
  - 狀態：⏳ 待開始
  - 問題：應該用 useMemo 代替 useEffect
  - 風險：🟡 中（不必要的副作用）

**當前代碼：**
```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (scrollContainerRef.current) {
      const containerHeight = scrollContainerRef.current.clientHeight;
      const contentHeight = scrollContainerRef.current.scrollHeight;
      const scrollbarHeight = Math.max(
        30,
        (containerHeight / contentHeight) * containerHeight
      );
      setScrollbarHeight(scrollbarHeight);
    }
  }, 0);
  return () => clearTimeout(timeoutId);
}, [availableTags.length, scrollTop]);
```

**修復方案：**
```typescript
// 方案 1: 使用 useMemo（推薦）
const scrollbarHeight = useMemo(() => {
  if (!scrollContainerRef.current) return 30;
  const containerHeight = scrollContainerRef.current.clientHeight;
  const contentHeight = scrollContainerRef.current.scrollHeight;
  return Math.max(30, (containerHeight / contentHeight) * containerHeight);
}, [availableTags.length, scrollTop]);

// 不再需要 setScrollbarHeight 和 useEffect

// 方案 2: 保留 useEffect 但添加依賴
useEffect(() => {
  if (scrollContainerRef.current) {
    const containerHeight = scrollContainerRef.current.clientHeight;
    const contentHeight = scrollContainerRef.current.scrollHeight;
    const newHeight = Math.max(30, (containerHeight / contentHeight) * containerHeight);
    setScrollbarHeight(newHeight);
  }
}, [availableTags.length, scrollTop]);
```

---

#### 問題 1.3: 滾動條拖拽（第 156 行）

- [ ] **修復 useEffect 依賴數組**
  - 狀態：⏳ 待開始
  - 問題：缺少多個依賴
  - 風險：🔴 高

**當前代碼：**
```typescript
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingScrollbar || !scrollContainerRef.current) return;
    // ... 使用了多個 state 但未列入依賴
  };
  // ...
}, [isDraggingScrollbar]); // ❌ 不完整
```

**修復方案：**
```typescript
const handleMouseMoveCallback = useCallback((e: MouseEvent) => {
  if (!scrollContainerRef.current) return;
  // ... 邏輯
}, [/* 實際依賴 */]);

useEffect(() => {
  if (!isDraggingScrollbar) return;
  
  const handleMouseMove = (e: MouseEvent) => {
    handleMouseMoveCallback(e);
  };
  
  const handleMouseUp = () => {
    setIsDraggingScrollbar(false);
  };
  
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDraggingScrollbar, handleMouseMoveCallback]);
```

---

### DateTimePicker.tsx（3 處）

#### 問題 2.1-2.3: 類似的點擊外部關閉邏輯

- [ ] **統一修復 3 處 useEffect**
  - 狀態：⏳ 待開始
  - 問題：缺少依賴
  - 風險：🟡 中

**修復方案：**
```typescript
const handleClickOutsideCallback = useCallback((event: MouseEvent) => {
  if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
    setIsOpen(false);
  }
}, []);

useEffect(() => {
  if (!isOpen) return;
  
  document.addEventListener('mousedown', handleClickOutsideCallback);
  return () => document.removeEventListener('mousedown', handleClickOutsideCallback);
}, [isOpen, handleClickOutsideCallback]);
```

---

### MessageCreation.tsx（3 處）

#### 問題 3.1: 空的 useEffect（第 104 行）

- [ ] **刪除不必要的 useEffect**
  - 狀態：⏳ 待開始
  - 問題：空邏輯，只是監聽
  - 風險：🟢 低（可直接刪除）

**當前代碼：**
```typescript
useEffect(() => {
  // Flex Message JSON is ready for use
}, [flexMessageJson]);
```

**修復方案：**
```typescript
// ✅ 直接刪除此 useEffect
```

---

#### 問題 3.2: 表單變更監聽（第 170 行）

- [ ] **優化表單變更檢測**
  - 狀態：⏳ 待開始
  - 問題：依賴過多，每次輸入都觸發
  - 風險：🟡 中

**修復方案：**
```typescript
// 使用 useMemo 代替 useEffect
const hasUnsavedChanges = useMemo(() => {
  return Boolean(
    title || 
    description || 
    selectedMessageType ||
    triggerImageUrl ||
    textMessageContent ||
    flexMessageJson
  );
}, [title, description, selectedMessageType, triggerImageUrl, textMessageContent, flexMessageJson]);

// 直接使用 hasUnsavedChanges，不需要 setHasUnsavedChanges
```

---

#### 問題 3.3: 清理 URL 對象（第 214 行）

- [ ] **保持現有實現（正確）**
  - 狀態：✅ 正確
  - 說明：cleanup function 的正確用法

**當前代碼：**
```typescript
useEffect(() => {
  return () => {
    if (triggerImageUrl) {
      URL.revokeObjectURL(triggerImageUrl);
    }
  };
}, [triggerImageUrl]); // ✅ 正確
```

---

### 其他組件（17 處）

#### 問題 4: MemberInfoPanel.tsx（1 處）

- [ ] **修復表單初始化邏輯**
  - 狀態：⏳ 待開始
  - 問題：可能缺少依賴

---

#### 問題 5-26: 批量修復

- [ ] ChatMessageList.tsx
- [ ] ChatRoomLayout.tsx
- [ ] MemberNoteEditor.tsx
- [ ] FlexMessageEditorNew.tsx
- [ ] PreviewPanel.tsx
- [ ] ToastProvider.tsx
- [ ] AuthContext.tsx
- [ ] AppStateContext.tsx
- [ ] InboxContainerNormal.tsx
- [ ] MainContainer-6001-3170.tsx
- [ ] MemberInfoPanelComplete.tsx
- [ ] MessageDetailDrawer.tsx
- [ ] carousel.tsx (shadcn)
- [ ] sidebar.tsx (shadcn)

---

## 🎯 第二週：useCallback 優化（20 處）

### AutoReplyTableStyled.tsx

- [ ] **5.1:** 添加 `handleSort` useCallback
- [ ] **5.2:** 添加 `handleRowClick` useCallback
- [ ] **5.3:** 添加 `handleToggle` useCallback

### InteractiveMessageTable.tsx

- [ ] **6.1:** 添加 `handleSort` useCallback
- [ ] **6.2:** 添加 `handleRowClick` useCallback
- [ ] **6.3:** 添加 `handleEdit` useCallback

### MemberListContainer.tsx

- [ ] **7.1:** 添加 `handleOpenChat` useCallback
- [ ] **7.2:** 添加 `handleViewDetail` useCallback
- [ ] **7.3:** 添加 `handleSearch` useCallback

### FilterModal.tsx

- [ ] **8.1:** 添加 `handleTagClick` useCallback
- [ ] **8.2:** 添加 `handleConfirm` useCallback
- [ ] **8.3:** 添加 `handleClear` useCallback

### MessageList.tsx

- [ ] **9.1:** 添加 `handleMessageClick` useCallback
- [ ] **9.2:** 添加 `handleMemberClick` useCallback
- [ ] **9.3:** 添加 `handleEdit` useCallback
- [ ] **9.4:** 添加 `handleDelete` useCallback

### Context 函數優化

- [ ] **10.1:** MembersContext - 所有操作函數
- [ ] **10.2:** MessagesContext - 所有操作函數
- [ ] **10.3:** AutoRepliesContext - 所有操作函數
- [ ] **10.4:** TagsContext - 所有操作函數

---

## 🎯 第三週：useMemo 和 React.memo（15 處）

### useMemo 優化（8 處）

#### 列表過濾/排序

- [ ] **11.1:** MemberListContainer - 會員列表過濾
  ```typescript
  const filteredMembers = useMemo(() => 
    members.filter(m => m.name.includes(searchQuery)),
    [members, searchQuery]
  );
  ```

- [ ] **11.2:** AutoReplyTableStyled - 自動回應排序
- [ ] **11.3:** InteractiveMessageTable - 訊息過濾
- [ ] **11.4:** FilterModal - 標籤過濾
- [ ] **11.5:** ChatMessageList - 訊息分組

#### 複雜計算

- [ ] **11.6:** FlexMessageEditor - Flex JSON 生成
- [ ] **11.7:** MessageCreation - 表單驗證
- [ ] **11.8:** MemberDetailPage - 數據轉換

---

### React.memo 優化（7 處）

#### 共享組件

- [ ] **12.1:** 創建 `components/common/TagItem.tsx`
  ```typescript
  const TagItem = memo(function TagItem({ tag, selected, onClick, onRemove }) {
    // ... 實現
  });
  ```

- [ ] **12.2:** 優化 KeywordTagsInput 使用 TagItem
- [ ] **12.3:** 優化 FilterModal 使用 TagItem

#### 靜態組件

- [ ] **12.4:** StarbitLogo.tsx - 整體 memo
- [ ] **12.5:** Breadcrumb.tsx - 整體 memo

#### 子組件優化

- [ ] **12.6:** MessageDetailDrawer - 拆分子組件
- [ ] **12.7:** ChatMessageList - ChatMessage memo

---

## 🎯 第四週：新特性應用（8 處）

### useDeferredValue（4 處）

- [ ] **13.1:** SearchContainer - 搜索輸入延遲
  ```typescript
  const deferredQuery = useDeferredValue(searchQuery);
  ```

- [ ] **13.2:** FilterModal - 標籤搜索延遲
- [ ] **13.3:** MemberListContainer - 會員搜索延遲
- [ ] **13.4:** MessageList - 訊息搜索延遲

---

### useTransition（4 處）

- [ ] **14.1:** MessageList - 視圖切換
  ```typescript
  const [isPending, startTransition] = useTransition();
  
  const handleViewChange = (view) => {
    startTransition(() => setCurrentView(view));
  };
  ```

- [ ] **14.2:** FilterModal - 應用篩選
- [ ] **14.3:** TabPanel - 標籤頁切換
- [ ] **14.4:** 頁面路由 - 路由切換

---

## 📊 性能測試檢查清單

### 每週測試項目

#### 第一週完成後

- [ ] ESLint 無 hooks 警告
- [ ] 所有 useEffect 功能正常
- [ ] 無控制台錯誤

#### 第二週完成後

- [ ] React DevTools Profiler 測試
- [ ] 列表項重渲染次數 < 優化前的 40%
- [ ] 事件處理響應正常

#### 第三週完成後

- [ ] 列表過濾性能提升 50%+
- [ ] memo 組件不重渲染（props 未變時）
- [ ] 整體渲染次數減少 40%+

#### 第四週完成後

- [ ] 搜索輸入無卡頓
- [ ] 標籤頁切換流暢
- [ ] Lighthouse 性能分數 > 85
- [ ] FPS > 55

---

## 🔧 測試腳本使用

### 運行 ESLint 檢查

```bash
# 檢查所有 hooks 問題
npm run lint:hooks

# 或手動
npx eslint src/ --ext .tsx --rule 'react-hooks/exhaustive-deps: error'
```

### 運行性能分析

```bash
# 生成性能報告
npm run analyze:performance

# 對比優化前後
npm run compare:performance before.json after.json
```

---

## 📈 每週進度報告

### 第一週（2025-11-18 ~ 2025-11-24）

**目標：** 修復所有 useEffect 依賴問題

| 指標 | 目標 | 實際 | 達成 |
|------|------|------|------|
| useEffect 修復 | 26 處 | - | - |
| ESLint 警告 | 0 | - | - |
| 功能測試通過 | 100% | - | - |

**遇到的問題：**
- 

**解決方案：**
- 

---

### 第二週（2025-11-25 ~ 2025-12-01）

**目標：** 添加必要的 useCallback

| 指標 | 目標 | 實際 | 達成 |
|------|------|------|------|
| useCallback 添加 | 20 處 | - | - |
| 重渲染減少 | 50% | - | - |
| 性能測試通過 | ✅ | - | - |

**遇到的問題：**
- 

**解決方案：**
- 

---

### 第三週（2025-12-02 ~ 2025-12-08）

**目標：** useMemo 和 React.memo 優化

| 指標 | 目標 | 實際 | 達成 |
|------|------|------|------|
| useMemo 添加 | 8 處 | - | - |
| React.memo 添加 | 7 處 | - | - |
| 計算時間減少 | 40% | - | - |

**遇到的問題：**
- 

**解決方案：**
- 

---

### 第四週（2025-12-09 ~ 2025-12-15）

**目標：** 應用 React 18 新特性

| 指標 | 目標 | 實際 | 達成 |
|------|------|------|------|
| useDeferredValue | 4 處 | - | - |
| useTransition | 4 處 | - | - |
| Lighthouse 分數 | > 85 | - | - |
| FPS | > 55 | - | - |

**遇到的問題：**
- 

**解決方案：**
- 

---

## ✅ 最終驗收標準

### 必須達成（P0）

- [ ] ✅ 所有 ESLint hooks 警告清除
- [ ] ✅ 不必要重渲染減少 60%+
- [ ] ✅ 所有功能測試通過
- [ ] ✅ 無性能回歸

### 應該達成（P1）

- [ ] ✅ Lighthouse 性能分數 > 85
- [ ] ✅ 列表滾動 FPS > 55
- [ ] ✅ 用戶操作響應 < 100ms
- [ ] ✅ 搜索輸入無明顯延遲

### 可選達成（P2）

- [ ] ✅ 創建性能監控儀表板
- [ ] ✅ 建立性能回歸測試
- [ ] ✅ 編寫優化最佳實踐文檔

---

**最後更新：** 2025-11-18  
**下次更新：** 每週五更新進度  
**負責人：** 開發團隊
