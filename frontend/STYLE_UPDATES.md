# 前端樣式更新摘要

## 更新日期
2025-10-08

## 更新目標
將前端介面樣式對齊 `/ui/` 目錄中的原型圖設計規範。

## 主要變更

### 1. 配色方案 ✅
- **主色**: #3B82F6（藍色）
- **背景色**: #F8F9FA
- **文字色**: #1F2937（深灰）
- **次要文字**: #6B7280（灰色）

### 2. Logo 與品牌 ✅
- 採用 **STARBIT MARKETING** 品牌
- SVG icon：藍色漸層方塊圖案
- 字體：粗體 16px + 副標題大寫

### 3. 導航選單 ✅
- 採用分組導航結構：
  - 群發訊息（活動與訊息推播、建立群發訊息）
  - 標籤管理（標籤管理、標籤追蹤）
  - 會員管理（會員列表、訊息紀錄）
  - 設定（自動回應、數據分析、系統設定）
- 使用 Emoji 圖標
- 選中狀態：藍色背景 #EFF6FF + 左邊框 3px

### 4. 表格樣式 ✅
- 圓角：12px
- 標題背景：#F9FAFB（淺灰）
- 標題文字：#6B7280（灰色）+ 粗體大寫
- 懸停效果：#F9FAFB 背景

### 5. 按鈕樣式 ✅
- 主要按鈕：深灰背景 #1F2937 + 白色文字
- 圓角：8px
- 字重：600

## 新增檔案

### 樣式相關
- `src/styles/theme.ts` - 全局主題變數配置
- `src/styles/global.css` - 全局樣式與 Ant Design 覆蓋

### 組件相關
- `src/components/Layout/MainLayout.tsx` - 更新主布局
- `src/components/Layout/MainLayout.css` - 主布局樣式
- `src/components/common/StyledTable.tsx` - 自定義表格組件
- `src/components/common/StyledTable.css` - 表格樣式

### 頁面相關
- `src/features/members/pages/MemberListPage.css` - 會員列表頁樣式

### 文檔
- `DESIGN_GUIDE.md` - 設計規範指南
- `STYLE_UPDATES.md` - 本文件

## 技術實現

### Ant Design 主題配置
在 `main.tsx` 中使用 `ConfigProvider` 配置：
```typescript
const antdTheme = {
  token: {
    colorPrimary: '#3B82F6',
    borderRadius: 8,
    // ...
  },
  components: {
    Layout: { /* ... */ },
    Menu: { /* ... */ },
    Button: { /* ... */ },
    Table: { /* ... */ },
  },
}
```

### 樣式覆蓋策略
1. 全局 CSS 覆蓋 Ant Design 預設樣式
2. 組件級 CSS 提供細節樣式
3. 自定義組件封裝（StyledTable）

### 類型修復
- 將 `enum` 改為 `const` 對象 + 類型推導
- 避免 TypeScript `erasableSyntaxOnly` 錯誤

## 使用方式

### 1. 使用 StyledTable
```tsx
import StyledTable from '@/components/common/StyledTable';

<StyledTable
  columns={columns}
  dataSource={data}
  pagination={...}
/>
```

### 2. 使用主題變數
```tsx
import { theme } from '@/styles/theme';

<div style={{ color: theme.colors.primary }}>
  內容
</div>
```

### 3. 頁面結構範本
```tsx
<div className="page-container">
  <div className="breadcrumb">...</div>
  <div className="page-header">...</div>
  <div className="toolbar">...</div>
  <div className="stats-info">...</div>
  <StyledTable ... />
</div>
```

## 後續建議

### 待完成頁面
以下頁面需要套用新樣式：
- [ ] 活動與訊息推播列表
- [ ] 建立群發訊息
- [ ] 標籤管理
- [ ] 自動回應設置
- [ ] 數據分析儀表板

### 優化建議
1. 考慮使用 CSS-in-JS（styled-components/emotion）統一管理樣式
2. 建立更多可復用組件（StatusBadge、Thumbnail 等）
3. 實現響應式設計以支援移動裝置
4. 添加深色模式支援

## 測試結果

✅ TypeScript 編譯通過
✅ Vite 打包成功
✅ 樣式規範符合原型圖設計

## 參考資料

- 原型圖位置: `/data2/lili_hotel/ui/`
- 設計指南: `frontend/DESIGN_GUIDE.md`
- 主題配置: `frontend/src/styles/theme.ts`
