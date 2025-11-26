# Lili Hotel CRM 專案概述

## 專案目的
力麗飯店 LINE 官方帳號 CRM 管理系統
- 會員管理、標籤管理、訊息推播
- LINE 聊天機器人集成
- 會員互動追蹤和數據分析

## 技術棧

### Frontend (React/TypeScript)
- **框架**: React 18.3.1 + TypeScript + Vite
- **UI 組件**: Radix UI components + Tailwind CSS
- **狀態管理**: React Context API (NavigationContext, MembersContext, MessagesContext)
- **通信**: REST API + WebSocket (實時訊息推送)
- **路由**: 自定義 hash-based 路由 (NavigationContext)

### Backend (Python/FastAPI)
- **框架**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+ (異步)
- **數據庫**: MySQL 8.0+
- **LINE API**: line-bot-sdk 3.6+
- **AI**: OpenAI API

## 核心模塊
1. **會員管理** - CRUD、標籤、備註
2. **聊天室** - 即時通訊、WebSocket
3. **訊息推播** - 排程、目標篩選
4. **自動回應** - 關鍵字、時間觸發
5. **LINE API 設定** - 頻道配置

## 代碼風格和規範
- TypeScript: 嚴格模式開啟
- Naming: camelCase (變數/函數), PascalCase (組件/類型)
- 函數式組件 + React Hooks
- Context API for 狀態管理 (避免 prop drilling)
- Error boundaries and loading states
- Form handling with react-hook-form

## 命令參考
```bash
# Frontend
npm install
npm run dev      # 開發模式
npm run build    # 生產構建

# Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
alembic upgrade head  # 數據庫遷移
```

## 項目結構
```
frontend/src/
├── pages/           # 頁面組件
├── components/      # 可復用組件
├── contexts/        # React Context
├── hooks/          # 自定義 Hooks
├── types/          # TypeScript 類型
├── utils/          # 工具函數
└── assets/         # 資源文件

backend/
├── app/
│   ├── api/v1/     # API 路由
│   ├── models/     # 數據庫模型
│   ├── schemas/    # Pydantic 模式
│   ├── services/   # 業務邏輯
│   └── main.py     # 應用入口
└── migrations/     # 數據庫遷移
```

## 重要設置
- 認證: JWT Token (localStorage 存儲)
- API Base: `/api/v1/`
- 前端端口: 5173 (Vite dev server)
- 後端端口: 8000 (FastAPI)
- WebSocket: 用於即時訊息推送
