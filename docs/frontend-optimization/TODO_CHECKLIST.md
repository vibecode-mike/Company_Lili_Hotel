# 代碼優化執行清單

## ✅ 已完成（第一階段）

- [x] Console 語句清理（100%）
- [x] 刪除 CreateAutoReply.tsx 包裝器
- [x] AutoReplyTableStyled 添加 memo
- [x] InteractiveMessageTable 添加 memo
- [x] 重寫 flex-message/types.ts
- [x] MessageList.tsx 類型修復
- [x] 創建優化文檔

## 📋 本週待辦（Week 1）

### TypeScript 類型修復（2-3 小時）⭐ 高優先級
- [ ] flex-message/ConfigPanel.tsx - 修復 value: any
- [ ] flex-message/FlexMessageEditorNew.tsx - 修復 bodyContents: any[]
- [ ] flex-message/PreviewPanel.tsx - 修復 content: any (3 處)
- [ ] message-creation/PreviewPanel.tsx - 修復 flexMessageJson
- [ ] contexts/MessagesContext.tsx - 修復 content 類型

### 創建共享組件（1-2 小時）⭐ 高復用
- [ ] 創建 components/common/TagItem.tsx
- [ ] 在 FilterModal 中使用 TagItem
- [ ] 在 KeywordTagsInput 中使用 TagItem
- [ ] 在 MemberTagSection 中使用 TagItem

### 靜態組件優化（1 小時）⭐ 低風險
- [ ] StarbitLogo.tsx 添加 memo
- [ ] MemberAvatar.tsx - 移除 hover 狀態，用 CSS 代替
- [ ] 驗證優化效果

## 📋 下週待辦（Week 2）

### 複雜組件優化（3-4 小時）
- [ ] MessageDetailDrawer - 優化內部子組件
- [ ] Chat Room - 優化 ChatMessage 組件
- [ ] Chat Room - 優化 InfoField 組件

### 代碼清理（30 分鐘）
- [ ] 確認 MainContainer.tsx 是否使用
- [ ] 如未使用則刪除
- [ ] 如使用則添加註釋或重命名

## 📋 第三週（Week 3）

### TypeScript 配置（2-3 小時）
- [ ] 修復剩餘 any 類型（App.tsx, MessageCreation.tsx）
- [ ] 啟用 noImplicitAny
- [ ] 修復產生的類型錯誤

### 性能測試（1-2 小時）
- [ ] 使用 React DevTools Profiler 測試
- [ ] 記錄優化前後數據
- [ ] 創建性能報告

## 🎯 快速參考

### 已修復的 any 類型（4/20）
- ✅ flex-message/types.ts (2 處)
- ✅ MessageList.tsx (2 處)

### 待修復的 any 類型（16/20）
- ⏳ flex-message/ConfigPanel.tsx (1 處)
- ⏳ flex-message/FlexMessageEditorNew.tsx (2 處)
- ⏳ flex-message/PreviewPanel.tsx (3 處)
- ⏳ message-creation/PreviewPanel.tsx (2 處)
- ⏳ contexts/MessagesContext.tsx (1 處)
- ⏳ App.tsx (1 處)
- ⏳ MessageCreation.tsx (1 處)
- ✅ types/member.ts (2 處 - 類型守衛，可保留或改為 unknown)

### 已優化的組件（2/10+）
- ✅ AutoReplyTableStyled (TableHeader, AutoReplyRow)
- ✅ InteractiveMessageTable (TableHeader, MessageRow)

### 待優化的組件（8+/10+）
- ⏳ TagItem（共享組件）
- ⏳ StarbitLogo
- ⏳ MemberAvatar  
- ⏳ MessageDetailDrawer（子組件）
- ⏳ ChatMessage
- ⏳ InfoField
- ⏳ 其他...

## 📊 進度追蹤

### 總體進度
- Console 清理：100% ✅
- 代碼合併：100% ✅
- React.memo：15% 🟡
- TypeScript：20% 🟡

### Week 1 目標
- TypeScript：從 20% → 60%
- React.memo：從 15% → 70%

### Week 2 目標  
- TypeScript：從 60% → 90%
- React.memo：從 70% → 90%

### Week 3 目標
- TypeScript：從 90% → 95%（只保留合理的 any）
- React.memo：從 90% → 100%
- 啟用 noImplicitAny
- 性能測試完成

## 💡 注意事項

### 優先級排序
1. 🔴 高：TypeScript 類型修復（提升代碼質量）
2. 🟡 中：共享組件創建（減少重複）
3. 🟢 低：靜態組件優化（性能提升）

### 風險評估
- 🟢 低風險：類型修復、靜態組件 memo
- 🟡 中風險：創建共享組件（需要重構多個文件）
- 🔴 高風險：啟用 strict mode（暫不執行）

### 驗證清單
每次優化後檢查：
- [ ] 代碼編譯無錯誤
- [ ] 功能測試通過
- [ ] 無新的 console 錯誤
- [ ] TypeScript 類型檢查通過

---

**創建時間：** 2025-11-17  
**預計完成：** 3 週內完成所有優化
