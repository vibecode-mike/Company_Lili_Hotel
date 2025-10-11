# 設計規範指南

本專案採用符合原型圖的設計系統，確保視覺一致性。

## 配色方案

### 主色系
- **主色藍**: `#3B82F6`
- **淺藍色**: `#60A5FA`
- **藍色背景**: `#EFF6FF`
- **淺藍背景**: `#DBEAFE`

### 灰階
- **深灰（文字）**: `#1F2937`
- **灰色（次要文字）**: `#6B7280`
- **淺灰**: `#9CA3AF`
- **更淺灰（邊框）**: `#D1D5DB`
- **淺灰背景**: `#F9FAFB`
- **灰色背景**: `#F3F4F6`

### 背景色
- **主背景**: `#F8F9FA`
- **白色**: `#FFFFFF`

### 狀態色
- **成功**: `#059669` / 背景 `#D1FAE5`
- **警告**: `#D97706` / 背景 `#FEF3C7`
- **資訊**: `#2563EB` / 背景 `#DBEAFE`
- **錯誤**: `#DC2626` / 背景 `#FEE2E2`

## Logo 與品牌

### STARBIT MARKETING
- 位置：側邊欄頂部
- SVG Icon：藍色漸層方塊
- 字體：粗體 16px
- 副標題：大寫字母間距 2px

## 導航選單

### 分組結構
1. **群發訊息**
   - 📊 活動與訊息推播
   - ✉️ 建立群發訊息

2. **標籤管理**
   - 🏷️ 標籤管理
   - 📈 標籤追蹤

3. **會員管理**
   - 👥 會員列表
   - 💬 訊息紀錄

4. **設定**
   - 🤖 自動回應
   - 📊 數據分析
   - ⚙️ 系統設定

### 樣式規範
- 選中狀態：藍色背景 `#EFF6FF` + 左邊框 3px `#3B82F6`
- 懸停狀態：灰色背景 `#F3F4F6`
- 圖標：Emoji 16px

## 表格樣式

### 容器
- 圓角：`12px`
- 背景：白色
- 陰影：`0 1px 3px rgba(0, 0, 0, 0.1)`

### 標題列
- 背景：`#F9FAFB`
- 文字色：`#6B7280`
- 字體：12px 粗體大寫
- 邊框：`#E5E7EB`

### 內容列
- 邊框：`#F3F4F6`
- 懸停背景：`#F9FAFB`
- Padding：16px

## 組件使用

### 使用 StyledTable
```tsx
import StyledTable from '@/components/common/StyledTable';

<StyledTable
  columns={columns}
  dataSource={data}
  pagination={...}
/>
```

### 使用主題變數
```tsx
import { theme } from '@/styles/theme';

const MyComponent = () => (
  <div style={{ color: theme.colors.primary }}>
    內容
  </div>
);
```

### 頁面結構範本
```tsx
<div className="page-container">
  <div className="breadcrumb">
    分類 <span>&gt;</span> 頁面名稱
  </div>

  <div className="page-header">
    <h1 className="page-title">頁面標題</h1>
    <p className="page-description">頁面描述</p>
  </div>

  <div className="toolbar">
    <div className="search-filter">
      <Input placeholder="搜尋..." />
    </div>
    <Button type="primary">+ 建立</Button>
  </div>

  <div className="stats-info">
    統計資訊
  </div>

  <StyledTable ... />
</div>
```

## 按鈕規範

### 主要按鈕
- 背景：`#1F2937`（深灰）
- 文字：白色
- 圓角：8px
- 字重：600

### 次要按鈕
- 邊框：`#D1D5DB`
- 文字：`#1F2937`

## 輸入框規範

- 圓角：8px
- 邊框：`#D1D5DB`
- Focus 狀態：`#3B82F6` + 陰影

## 標籤規範

- 背景：`#EFF6FF`
- 文字：`#3B82F6`
- 圓角：4px
- 字體：12px

## 狀態徽章

### 已發送
- 背景：`#D1FAE5`
- 文字：`#059669`

### 已排程
- 背景：`#DBEAFE`
- 文字：`#2563EB`

### 草稿
- 背景：`#FEF3C7`
- 文字：`#D97706`

## 佈局規範

### 側邊欄
- 寬度：240px
- 背景：白色
- 右邊框：`#E5E7EB`

### 主內容區
- 背景：`#F8F9FA`
- Padding：32px 40px

## 檔案結構

```
frontend/src/
├── styles/
│   ├── theme.ts          # 主題變數
│   └── global.css        # 全局樣式
├── components/
│   ├── Layout/
│   │   ├── MainLayout.tsx
│   │   └── MainLayout.css
│   └── common/
│       ├── StyledTable.tsx
│       └── StyledTable.css
└── features/
    └── [feature]/
        └── pages/
            ├── [Page].tsx
            └── [Page].css
```

## 開發建議

1. 使用 `StyledTable` 代替原生 `Table`
2. 引用 `theme.ts` 中的顏色變數
3. 遵循原型圖的間距和圓角規範
4. 使用 Emoji 作為導航圖標
5. 保持頁面結構一致性
