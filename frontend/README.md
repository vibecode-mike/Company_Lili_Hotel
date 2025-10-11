# 力麗飯店 LineOA CRM 前端項目

基於 React + TypeScript + Ant Design 的前端管理系統

## 技術棧

- **框架**: React 18 + TypeScript 5
- **構建工具**: Vite 5
- **UI 組件庫**: Ant Design 5
- **狀態管理**: Zustand + TanStack Query (React Query)
- **路由**: React Router DOM 6
- **HTTP 客戶端**: Axios

## 開始使用

### 安裝依賴
```bash
npm install
```

### 啟動開發服務器
```bash
npm run dev
```

應用將在 http://localhost:5173 啟動

### 構建生產版本
```bash
npm run build
```

## 後端 API 配置

默認後端地址: `http://127.0.0.1:8700`

## 已實現功能

### 會員管理
- ✅ 會員列表查看（分頁、搜索、排序）
- ✅ 會員詳情查看
- ✅ 會員標籤管理

### 待實現功能
- 活動與訊息推播
- 標籤管理
- 訊息記錄
- 自動回應設置
- 數據分析儀表板
