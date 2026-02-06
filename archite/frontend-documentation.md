# 力麗飯店 LINE OA CRM 前端架構設計文檔

**版本**: v0.2.0
**日期**: 2025-12-06
**文檔狀態**: 正式版 (已更新 - 基於實際代碼庫)

---

## 目錄

1. [項目概述](#1-項目概述)
2. [技術架構](#2-技術架構)
3. [項目結構](#3-項目結構)
4. [核心功能模塊](#4-核心功能模塊)
5. [組件設計](#5-組件設計)
6. [狀態管理](#6-狀態管理)
7. [路由導航](#7-路由導航)
8. [類型系統](#8-類型系統)
9. [工具函數](#9-工具函數)
10. [性能優化](#10-性能優化)
11. [附錄](#11-附錄)

---

## 1. 項目概述

### 1.1 項目背景

力麗飯店 LINE OA CRM 前端是一個現代化的 React 單頁應用程式 (SPA)，為飯店行銷和客服人員提供直觀、高效的會員管理與訊息推播界面。系統採用最新的前端技術棧，實現了完整的多渠道官方帳號管理功能。

### 1.2 核心功能

- **會員管理**: 會員列表、詳情查看、標籤管理、備註編輯、互動記錄追蹤、多渠道整合
- **群發訊息**: 訊息創建、Flex Message 編輯、目標受眾選擇、排程設置、輪播訊息、多平台發送
- **自動回應**: 關鍵字設置、回應類型配置、啟用狀態管理、使用統計、多渠道支持
- **聊天室**: 一對一聊天、訊息歷史、會員信息側邊欄、即時通訊
- **標籤系統**: 會員標籤與互動標籤管理、標籤篩選、標籤統計
- **渠道管理**: LINE/Facebook/Instagram 多渠道整合、渠道狀態監控
- **身份驗證**: 用戶登入、會話管理、權限控制

### 1.3 技術亮點

- 🚀 **現代化技術棧**: React 18.3.1 + TypeScript + Vite 6.3.5
- ⚡ **極速構建**: SWC 編譯器，比 Babel 快 20x
- 🎨 **設計系統**: shadcn/ui + 45+ Radix UI 組件
- 🏗️ **組件化架構**: 329 個 TypeScript 文件，模塊化清晰
- ♿ **無障礙訪問**: 完整的 ARIA 支持，鍵盤導航
- 🎯 **類型安全**: 完整的 TypeScript 類型定義與驗證系統
- 🔄 **React Router v7**: 使用最新版 React Router DOM 7.9.6
- 📱 **多渠道支持**: LINE/Facebook/Instagram 統一管理
- 🔐 **身份驗證**: 內建認證系統與會話管理
- 📝 **表單驗證**: React Hook Form 7.55.0 集成

---

## 2. 技術架構

### 2.1 核心技術棧

#### 框架與工具
```json
{
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "typescript": "via @types/node 20.10.0",
  "vite": "6.3.5",
  "@vitejs/plugin-react-swc": "3.10.2"
}
```

#### 路由與導航
```json
{
  "react-router-dom": "7.9.6"
}
```

#### UI 組件庫
```json
{
  "@radix-ui/react-*": "30+ packages",
  "lucide-react": "0.487.0",
  "class-variance-authority": "0.7.1",
  "clsx": "*",
  "tailwind-merge": "*"
}
```

#### 表單與驗證
```json
{
  "react-hook-form": "7.55.0",
  "date-fns": "*",
  "react-day-picker": "8.10.1",
  "input-otp": "1.4.2"
}
```

#### 其他工具
```json
{
  "sonner": "2.0.3",              // Toast 通知
  "recharts": "2.15.2",            // 圖表
  "embla-carousel-react": "8.6.0", // 輪播
  "cmdk": "1.1.1",                 // 命令面板
  "vaul": "1.1.2",                 // 抽屜組件
  "next-themes": "0.4.6",          // 主題管理
  "react-resizable-panels": "2.1.7" // 可調整面板
}
```

### 2.2 架構圖

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                               │
│              (Chrome, Firefox, Safari)                   │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                  React Application                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  App.tsx                         │   │
│  │         (React Router + AppContent)              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Context Providers (8層)                │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │  AuthProvider (身份驗證 - 最外層)         │ │   │
│  │  │  NavigationProvider (路由狀態)             │ │   │
│  │  │  LineChannelStatusProvider (渠道狀態)      │ │   │
│  │  │  AppStateProvider (UI 狀態)                │ │   │
│  │  │  MembersProvider (會員數據)                │ │   │
│  │  │  MessagesProvider (訊息數據)               │ │   │
│  │  │  AutoRepliesProvider (自動回應數據)        │ │   │
│  │  │  TagsProvider (標籤數據)                   │ │   │
│  │  │  ToastProvider (通知系統 - 最內層)         │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Page Components (7個)               │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┐ │   │
│  │  │ Member   │ Message  │ Auto     │ Chat     │ │   │
│  │  │ Mgmt     │ List     │ Reply    │ Room     │ │   │
│  │  │ Detail   │ Flex     │ LINE API │          │ │   │
│  │  └──────────┴──────────┴──────────┴──────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Business Components (20+)               │   │
│  │  ┌────────┬────────┬────────┬────────────────┐  │   │
│  │  │Message │ Auto   │ Chat   │ Flex Message   │  │   │
│  │  │Creation│ Reply  │ Room   │ Editor         │  │   │
│  │  │Carousel│Keyword │Member  │ Channel        │  │   │
│  │  │Editor  │Tags    │TagEdit │ Selector       │  │   │
│  │  └────────┴────────┴────────┴────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Common Components                     │   │
│  │  ┌────────┬────────┬────────┬────────────────┐  │   │
│  │  │Sidebar │Common  │Shared  │ Layouts        │  │   │
│  │  │Logo    │Icons   │Utils   │ Chat-Room      │  │   │
│  │  └────────┴────────┴────────┴────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         UI Components (shadcn/ui - 45+)          │   │
│  │  ┌────────┬────────┬────────┬────────────────┐  │   │
│  │  │Button  │Input   │Dialog  │ Table          │  │   │
│  │  │Select  │Card    │Tooltip │ Dropdown       │  │   │
│  │  │Badge   │Alert   │Calendar│ (45+ 組件)     │  │   │
│  │  └────────┴────────┴────────┴────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│              Backend API (FastAPI)                       │
│         http://localhost:8700/api/v1/*                   │
└─────────────────────────────────────────────────────────┘
```

### 2.3 分層架構

#### 展示層 (Presentation Layer)
- **職責**: UI 渲染、用戶交互、狀態展示
- **組成**: Page Components (7個), Business Components (20+), UI Components (45+)
- **特點**: 純展示邏輯，無業務邏輯

#### 業務邏輯層 (Business Logic Layer)
- **職責**: 數據處理、業務規則、狀態管理
- **組成**: 8 層 Context Providers, Custom Hooks (2個)
- **特點**: 集中式業務邏輯處理

#### 數據訪問層 (Data Access Layer)
- **職責**: API 調用、數據轉換
- **組成**: Context 內部 API 調用、數據轉換函數
- **特點**: 統一的數據請求接口

---

## 3. 項目結構

### 3.1 完整目錄樹

```
frontend/
├── index.html                    # HTML 入口
├── package.json                  # 依賴配置
├── package-lock.json            # 依賴鎖定
├── vite.config.ts               # Vite 構建配置
├── build/                        # 構建輸出目錄 (生產環境)
├── README.md                     # 項目說明文檔
└── src/
    ├── main.tsx                  # 應用入口
    ├── App.tsx                   # 根組件 (React Router 集成)
    ├── index.css                 # Tailwind CSS
    │
    ├── assets/                   # 靜態資源 (2個圖片)
    │
    ├── components/               # 業務組件 (21個根組件)
    │   ├── ArrowButton.tsx
    │   ├── AutoReply.tsx
    │   ├── AutoReplyTableStyled.tsx
    │   ├── CarouselMessageEditor.tsx  # 輪播訊息編輯器
    │   ├── ChannelSelector.tsx        # 渠道選擇器 (NEW)
    │   ├── ChatRoom.tsx
    │   ├── CreateAutoReplyInteractive.tsx
    │   ├── DateTimePicker.tsx
    │   ├── FilterModal.tsx
    │   ├── InteractiveMessageTable.tsx
    │   ├── KeywordTagsInput.tsx
    │   ├── LineApiSettings.tsx
    │   ├── LineApiSettingsContent.tsx
    │   ├── MemberTagEditModal.tsx
    │   ├── MessageCreation.tsx
    │   ├── MessageDetailDrawer.tsx    # 訊息詳情抽屜 (NEW)
    │   ├── MessageList.tsx
    │   ├── Sidebar.tsx
    │   ├── StarbitLogo.tsx
    │   ├── ToastProvider.tsx
    │   ├── TriggerTimeOptions.tsx
    │   └── carouselStructure.ts
    │
    │   ├── auth/                 # 身份驗證組件 (2個)
    │   │   ├── AuthContext.tsx   # 認證狀態管理
    │   │   └── Login.tsx         # 登入頁面
    │   │
    │   ├── chat-room/            # 聊天室子組件 (7個)
    │   │   ├── ChatInput.tsx
    │   │   ├── ChatMessageList.tsx
    │   │   ├── ChatRoomLayout.tsx
    │   │   ├── MemberAvatar.tsx
    │   │   ├── MemberInfoPanel.tsx
    │   │   ├── MemberNoteEditor.tsx
    │   │   └── MemberTagSection.tsx
    │   │
    │   ├── common/               # 通用組件
    │   │   ├── Breadcrumb.tsx
    │   │   ├── Containers.tsx
    │   │   ├── PreviewContainers.tsx
    │   │   ├── SearchContainers.tsx
    │   │   ├── icons/            # 圖標組件
    │   │   │   ├── ChannelIcon.tsx     # 渠道圖標 (NEW)
    │   │   │   ├── MemberSourceIcon.tsx # 會員來源圖標 (NEW)
    │   │   │   └── index.ts
    │   │   ├── styles.ts
    │   │   └── index.ts
    │   │
    │   ├── figma/                # Figma 導入組件 (1個)
    │   │   └── ImageWithFallback.tsx
    │   │
    │   ├── flex-message/         # Flex Message 編輯器 (4個)
    │   │   ├── ConfigPanel.tsx
    │   │   ├── FlexMessageEditorNew.tsx
    │   │   ├── PreviewPanel.tsx
    │   │   └── types.ts
    │   │
    │   ├── layouts/              # 佈局組件
    │   │
    │   ├── message-creation/     # 群發消息創建子組件 (4個)
    │   │   ├── PreviewPanel.tsx
    │   │   ├── ScheduleSettings.tsx
    │   │   ├── TargetAudienceSelector.tsx
    │   │   └── index.ts
    │   │
    │   ├── shared/               # 共享組件
    │   │
    │   └── ui/                   # shadcn/ui 組件 (45個)
    │       ├── accordion.tsx
    │       ├── alert-dialog.tsx
    │       ├── alert.tsx
    │       ├── aspect-ratio.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── breadcrumb.tsx
    │       ├── button.tsx
    │       ├── calendar.tsx
    │       ├── card.tsx
    │       ├── carousel.tsx
    │       ├── chart.tsx
    │       ├── checkbox.tsx
    │       ├── collapsible.tsx
    │       ├── command.tsx
    │       ├── context-menu.tsx
    │       ├── dialog.tsx
    │       ├── drawer.tsx
    │       ├── dropdown-menu.tsx
    │       ├── form.tsx
    │       ├── hover-card.tsx
    │       ├── input-otp.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── menubar.tsx
    │       ├── navigation-menu.tsx
    │       ├── pagination.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── radio-group.tsx
    │       ├── resizable.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── slider.tsx
    │       ├── sonner.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── toggle-group.tsx
    │       ├── toggle.tsx
    │       ├── tooltip.tsx
    │       ├── use-mobile.ts
    │       └── utils.ts
    │
    ├── contexts/                 # Context 狀態管理 (9個)
    │   ├── AppProviders.tsx      # 統一 Provider 包裝
    │   ├── AppStateContext.tsx   # UI 狀態
    │   ├── AutoRepliesContext.tsx # 自動回應數據 (NEW)
    │   ├── LineChannelStatusContext.tsx # 渠道狀態 (NEW)
    │   ├── MembersContext.tsx    # 會員數據 (NEW)
    │   ├── MessagesContext.tsx   # 訊息數據 (NEW)
    │   ├── NavigationContext.tsx # 路由導航狀態
    │   ├── TagsContext.tsx       # 標籤數據 (NEW)
    │   └── (auth/)               # 身份驗證 Context (位於 components/auth/)
    │
    ├── hooks/                    # 自定義 Hooks (2個)
    │   ├── useMessageForm.ts     # 訊息表單邏輯
    │   └── useWebSocket.ts       # WebSocket 連接
    │
    ├── imports/                  # Figma 導入組件 (150+個)
    │   ├── 251103會員管理MemberManagementV01.tsx
    │   ├── MainContainer-6001-1415.tsx  # 會員管理頁面
    │   ├── MainContainer-6001-3170.tsx  # 會員詳情頁面
    │   └── svg-*.ts              # 70+ SVG 圖標文件
    │
    ├── pages/                    # 頁面組件 (7個)
    │   ├── AutoReplyPage.tsx
    │   ├── ChatRoomPage.tsx
    │   ├── FlexEditorPage.tsx
    │   ├── LineApiSettingsPage.tsx
    │   ├── MemberDetailPage.tsx
    │   ├── MemberManagementPage.tsx
    │   └── MessageListPage.tsx
    │
    ├── scripts/                  # 構建腳本
    │
    ├── styles/                   # 樣式文件
    │   └── globals.css
    │
    ├── types/                    # TypeScript 類型定義 (3個)
    │   ├── api.ts                # API 類型定義 (NEW)
    │   ├── channel.ts            # 渠道類型定義 (NEW)
    │   └── member.ts             # 會員類型定義
    │
    ├── utils/                    # 工具函數 (4個)
    │   ├── imageCropper.ts       # 圖片裁剪
    │   ├── interactionTags.ts    # 互動標籤處理
    │   ├── memberSource.ts       # 會員來源處理
    │   └── memberTime.ts         # 會員時間格式化
    │
    └── guidelines/               # 開發指南
        └── Guidelines.md
```

### 3.2 文件統計

| 類別 | 數量 | 說明 |
|------|------|------|
| **總 TypeScript 文件** | 329 | .ts + .tsx 文件 |
| **UI 組件** | 45 | shadcn/ui 組件庫 |
| **業務組件 (根級別)** | 21 | 頁面級業務組件 |
| **業務組件 (子組件)** | 23+ | 功能模塊子組件 (含 auth) |
| **頁面組件** | 7 | 獨立頁面 |
| **Context 文件** | 9 | 狀態管理 (含 AuthProvider) |
| **Hooks** | 2 | 自定義 Hooks |
| **Utils** | 4 | 工具函數 |
| **Types** | 3 | 類型定義文件 |
| **Figma 導入組件** | 150+ | 設計稿轉代碼 |

---

## 4. 核心功能模塊

### 4.1 會員管理模塊

#### 功能描述
會員管理模塊提供完整的會員 CRUD 操作、標籤管理、互動記錄追蹤、多渠道來源支持等功能。

#### 核心組件

**1. 會員管理頁面** (`MemberManagementPage.tsx`)
- 會員列表展示 (表格形式)
- 多條件搜索與篩選 (渠道來源、標籤、時間)
- 分頁控制
- 快速操作 (查看詳情、進入聊天)

**2. 會員詳情頁面** (`MemberDetailPage.tsx`)
- 會員基本資料展示
- 渠道來源顯示 (LINE/Facebook/Instagram/CRM/PMS/ERP/系統)
- 標籤管理 (會員標籤 + 互動標籤)
- 備註編輯
- 互動歷史追蹤

#### 數據結構

```typescript
interface Member {
  id: string;
  username: string;           // LINE user name
  realName: string;           // 真實姓名
  tags: BackendTag[];         // 所有標籤
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
  createdAt: string;
  lastChatTime?: string;
  lastInteractionAt?: string;
  lineUid?: string;
  lineName?: string;
  lineAvatar?: string;
  channelId?: string;         // 渠道 ID
  joinSource?: MemberSourceType; // 加入來源
  idNumber?: string;
  residence?: string;
  passportNumber?: string;
  internalNote?: string;
}
```

### 4.2 群發訊息模塊

#### 功能描述
群發訊息模塊支持創建、編輯、排程發送多平台群發訊息，集成 Flex Message 編輯器，提供豐富的互動訊息類型。

#### 核心組件

**1. 訊息列表頁面** (`MessageListPage.tsx`)
- 訊息列表展示
- 狀態篩選 (已排程/草稿/已發送)
- 平台篩選 (LINE/Facebook/Instagram)
- 搜索功能
- 快速操作 (編輯、刪除、發送)

**2. 訊息創建頁面** (`FlexEditorPage.tsx`)
- Flex Message 編輯器集成
- 渠道選擇器 (ChannelSelector)
- 目標受眾選擇器
- 排程設置
- 預覽面板

**3. 渠道選擇器** (`ChannelSelector.tsx`) - NEW
- 支持 LINE/Facebook/Instagram 選擇
- 渠道圖標顯示
- 單選/多選模式
 - 渠道切換管理（availablePlatforms 都可切換；若無 thread/資料則顯示空訊息）

#### 數據結構

```typescript
interface Message {
  id: number;
  messageContent: string;
  messageTitle?: string;
  notificationMessage?: string;
  targetType: string;
  targetFilter?: {
    include?: string[];
    exclude?: string[];
  };
  scheduleType: string;
  scheduledAt?: string;
  sendStatus: string;
  sendCount?: number;
  openCount?: number;
  clickCount?: number;
  flexMessageJson?: FlexMessage;
  interactionTags?: string[];
  platform?: MessagePlatform; // LINE/Facebook/Instagram
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 自動回應模塊

#### 功能描述
自動回應模塊允許設置關鍵字觸發、時間觸發、歡迎訊息等自動回應規則，支持多渠道配置。

#### 核心組件

**1. 自動回應頁面** (`AutoReplyPage.tsx`)
- 自動回應規則展示
- 渠道篩選 (LINE/Facebook)
- 啟用/停用開關
- 觸發統計
- 快速操作 (編輯、刪除)

**2. 創建自動回應** (`CreateAutoReplyInteractive.tsx`)
- 渠道選擇
- 觸發類型選擇
- 關鍵字配置 (KeywordTagsInput)
- 回應內容編輯
- 時間範圍設置

#### 數據結構

```typescript
interface AutoReply {
  id: number;
  keywords: Array<{ keyword?: string; name?: string }>;
  replyMessages: Array<{ content?: string; sequenceOrder?: number }>;
  isEnabled: boolean;
  platform?: AutoReplyChannel; // LINE/Facebook
}
```

### 4.4 聊天室模塊

#### 功能描述
聊天室模塊提供一對一聊天功能，支持訊息歷史查看、人工回覆、會員信息展示。

#### 核心組件

**1. 聊天室頁面** (`ChatRoomPage.tsx`)
- 三欄布局: 會員列表 | 聊天窗口 | 會員信息
- 響應式設計
- 側邊欄收合

**2. 聊天室布局** (`ChatRoomLayout.tsx`)
- 會員列表側邊欄
- 聊天訊息列表 (ChatMessageList)
- 聊天輸入框 (ChatInput)
- 會員信息面板 (MemberInfoPanel)

### 4.5 LINE API 設置模塊

#### 功能描述
LINE API 設置模塊提供 LINE Messaging API 配置管理功能，支持 Channel ID、Secret、Access Token 的設定和驗證。

#### 核心組件

**1. LINE API 設置頁面** (`LineApiSettingsPage.tsx`)
- Messaging API 配置區塊
- 渠道狀態監控
- 連線狀態驗證
- 設定保存與更新

---

## 5. 組件設計

### 5.1 組件分類

#### 頁面組件 (Page Components) - 7個
- **MemberManagementPage**: 會員管理列表
- **MemberDetailPage**: 會員詳情
- **MessageListPage**: 群發訊息列表
- **FlexEditorPage**: Flex Message 編輯器
- **AutoReplyPage**: 自動回應管理
- **ChatRoomPage**: 聊天室
- **LineApiSettingsPage**: LINE API 設置

#### 業務組件 (Business Components) - 21個根組件
- **MessageCreation**: 訊息創建主組件
- **CarouselMessageEditor**: 輪播訊息編輯器
- **ChannelSelector**: 渠道選擇器 (NEW)
- **AutoReply**: 自動回應主組件
- **CreateAutoReplyInteractive**: 互動式自動回應創建
- **ChatRoom**: 聊天室主組件
- **MemberTagEditModal**: 會員標籤編輯模態框
- **MessageDetailDrawer**: 訊息詳情抽屜 (NEW)
- **FilterModal**: 篩選模態框
- **LineApiSettings**: LINE API 設置
- 等等...

#### 通用組件 (Common Components)
- **Sidebar**: 側邊欄導航
- **Breadcrumb**: 面包屑導航
- **ChannelIcon**: 渠道圖標 (NEW)
- **MemberSourceIcon**: 會員來源圖標 (NEW)
- **Containers**: 容器組件
- **SearchContainers**: 搜索容器

#### UI 組件 (UI Components) - 45個
- shadcn/ui 組件庫的完整實現
- 包括 Button, Input, Dialog, Table, Select 等基礎組件

### 5.2 組件設計原則

#### 單一職責原則
每個組件只負責一個功能模塊，保持組件簡潔。

#### 組件組合優於繼承
使用組件組合構建複雜功能。

#### Props 設計
- 必需屬性優先
- 提供合理的默認值
- 使用 TypeScript 類型約束

---

## 6. 狀態管理

### 6.1 Context API 架構

#### 八層 Context 系統

```
AuthProvider (最外層 - 身份驗證)
  ↓
NavigationProvider (路由狀態)
  ↓
LineChannelStatusProvider (渠道狀態監控) - NEW
  ↓
AppStateProvider (UI 狀態)
  ↓
MembersProvider (會員數據管理) - NEW
  ↓
MessagesProvider (訊息數據管理) - NEW
  ↓
AutoRepliesProvider (自動回應數據管理) - NEW
  ↓
TagsProvider (標籤數據管理) - NEW
  ↓
ToastProvider (通知系統 - 最內層)
  ↓
Application Components
```

### 6.2 NavigationContext (路由管理)

#### 功能職責
- 頁面導航控制 (集成 React Router)
- URL 狀態同步
- 頁面參數傳遞
- 瀏覽器歷史記錄管理

#### 頁面類型

```typescript
type Page =
  | 'message-list'
  | 'auto-reply'
  | 'member-management'
  | 'member-detail'
  | 'chat-room'
  | 'flex-editor'
  | 'line-api-settings'
  | 'login';
```

#### API 方法

```typescript
interface NavigationContextType {
  currentPage: Page;
  params: NavigationParams;
  navigate: (page: Page, params?: NavigationParams) => void;
}

// 專用 Hooks
const navigate = useNavigate();
const currentPage = useCurrentPage();
```

### 6.3 LineChannelStatusContext (渠道狀態) - NEW

#### 功能職責
- 監控 LINE/Facebook/Instagram 渠道連接狀態
- 渠道配置驗證
- 渠道切換管理
- 渠道錯誤處理

#### 狀態結構

```typescript
interface LineChannelStatus {
  isConnected: boolean;
  channelName?: string;
  lastSync?: string;
  error?: string;
}
```

### 6.4 MembersContext (會員數據) - NEW

#### 功能職責
- 會員列表管理
- 會員 CRUD 操作
- 標籤管理
- 搜索與篩選
- 數據轉換 (後端格式 → 前端格式)

#### 數據轉換

```typescript
function transformBackendMember(backend: BackendMember): Member {
  return {
    id: backend.id,
    username: backend.line_name || backend.username,
    realName: backend.real_name,
    tags: backend.tags || [],
    // ... 其他欄位轉換
  };
}
```

#### API 方法

```typescript
interface MembersContextType {
  members: Member[];
  getMemberById: (id: string) => Member | undefined;
  createMember: (data: CreateMemberData) => Promise<void>;
  updateMember: (id: string, data: UpdateMemberData) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addTag: (memberId: string, tag: BackendTag) => Promise<void>;
  removeTag: (memberId: string, tagId: number) => Promise<void>;
}
```

### 6.5 MessagesContext (訊息數據) - NEW

#### 功能職責
- 訊息列表管理
- 訊息 CRUD 操作
- 配額狀態管理
- 平台篩選
- 數據轉換

#### 配額狀態

```typescript
interface QuotaStatus {
  total: number;
  used: number;
  remaining: number;
  resetDate?: string;
}
```

#### API 方法

```typescript
interface MessagesContextType {
  messages: Message[];
  quotaStatus: QuotaStatus;
  getMessageById: (id: number) => Message | undefined;
  createMessage: (data: CreateMessageData) => Promise<void>;
  updateMessage: (id: number, data: UpdateMessageData) => Promise<void>;
  deleteMessage: (id: number) => Promise<void>;
}
```

### 6.6 AutoRepliesContext (自動回應數據) - NEW

#### 功能職責
- 自動回應列表管理
- 自動回應 CRUD 操作
- 啟用/停用控制
- 渠道篩選

#### API 方法

```typescript
interface AutoRepliesContextType {
  autoReplies: AutoReply[];
  getAutoReplyById: (id: number) => AutoReply | undefined;
  createAutoReply: (data: CreateAutoReplyData) => Promise<void>;
  updateAutoReply: (id: number, data: UpdateAutoReplyData) => Promise<void>;
  deleteAutoReply: (id: number) => Promise<void>;
  toggleAutoReply: (id: number) => Promise<void>;
}
```

### 6.7 TagsContext (標籤數據) - NEW

#### 功能職責
- 標籤列表管理
- 標籤 CRUD 操作
- 標籤類型篩選 (會員標籤 / 互動標籤)
- 標籤統計

#### API 方法

```typescript
interface TagsContextType {
  tags: BackendTag[];
  memberTags: BackendTag[];
  interactionTags: BackendTag[];
  createTag: (data: CreateTagData) => Promise<void>;
  updateTag: (id: number, data: UpdateTagData) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
}
```

### 6.8 AppStateContext (UI 狀態)

#### 功能職責
- 側邊欄開關狀態
- 主題設置
- 模態框管理
- 載入狀態

### 6.9 AuthProvider (身份驗證)

#### 功能職責
- 用戶認證狀態管理
- Token 存儲與管理
- 登入/登出流程
- 權限檢查

---

## 7. 路由導航

### 7.1 React Router v7 集成

#### 設計理念
使用 React Router DOM 7.9.6 + 自定義 NavigationContext 實現完整路由管理。

#### 路由配置 (App.tsx)

```typescript
const routes = [
  { path: '/login', element: <Login /> },
  { path: '/member-management', element: <MemberManagementPage /> },
  { path: '/member-detail/:id', element: <MemberDetailPage /> },
  { path: '/message-list', element: <MessageListPage /> },
  { path: '/flex-editor', element: <FlexEditorPage /> },
  { path: '/auto-reply', element: <AutoReplyPage /> },
  { path: '/chat-room', element: <ChatRoomPage /> },
  { path: '/line-api-settings', element: <LineApiSettingsPage /> },
];
```

### 7.2 頁面路由映射

| 路由路徑 | 頁面組件 | 說明 | 權限要求 |
|---------|---------|------|---------|
| `/login` | `Login` | 用戶登入 | 公開 |
| `/member-management` | `MemberManagementPage` | 會員管理列表 | 需登入 |
| `/member-detail/:id` | `MemberDetailPage` | 會員詳情 | 需登入 |
| `/message-list` | `MessageListPage` | 群發訊息列表 | 需登入 |
| `/flex-editor` | `FlexEditorPage` | Flex Message 編輯器 | 需登入 |
| `/auto-reply` | `AutoReplyPage` | 自動回應列表 | 需登入 |
| `/chat-room` | `ChatRoomPage` | 聊天室 | 需登入 |
| `/line-api-settings` | `LineApiSettingsPage` | LINE API 設置 | 管理員 |

### 7.3 URL 同步機制

#### URL 與頁面狀態雙向同步

```typescript
// URL → Page State
const pageFromUrl = getPageFromUrl(location.pathname);

// Page State → URL
const navigate = useNavigate();
navigate(pageToPath(page));
```

---

## 8. 類型系統

### 8.1 API 類型定義 (`types/api.ts`)

#### 後端數據類型

```typescript
// 標籤
export interface BackendTag {
  id?: number;
  name: string;
  type: 'member' | 'interaction';
}

// 會員
export interface BackendMember {
  id: string;
  username: string;
  real_name: string;
  tags?: BackendTag[];
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
  created_at: string;
  last_chat_time?: string;
  last_interaction_at?: string;
  line_uid?: string;
  line_name?: string;
  line_avatar?: string;
  channel_id?: string;
  join_source?: string;
  // ... 其他欄位
}

// 自動回應
export interface BackendAutoReply {
  id: number;
  keywords: BackendKeyword[];
  reply_messages: BackendReplyMessage[];
  is_enabled: boolean;
}

// 訊息
export interface BackendMessage {
  id: number;
  message_content: string;
  message_title?: string;
  target_type: string;
  target_filter?: {
    include?: string[];
    exclude?: string[];
  };
  schedule_type: string;
  scheduled_at?: string;
  send_status: string;
  send_count?: number;
  open_count?: number;
  click_count?: number;
  flex_message_json?: FlexMessage;
  platform?: string;
  // ... 其他欄位
}
```

#### Flex Message 類型

```typescript
export interface FlexBubble {
  type: 'bubble';
  hero?: any;
  body?: any;
  footer?: any;
  styles?: any;
  [key: string]: any;
}

export interface FlexCarousel {
  type: 'carousel';
  contents: FlexBubble[];
}

export type FlexMessage = FlexBubble | FlexCarousel;
```

### 8.2 渠道類型定義 (`types/channel.ts`) - NEW

#### 核心渠道類型

```typescript
// 核心渠道平台
export type ChannelPlatform = 'LINE' | 'Facebook' | 'Instagram';

// 自動回應渠道（子集）
export type AutoReplyChannel = Extract<ChannelPlatform, 'LINE' | 'Facebook'>;

// 訊息推播平台（子集）
export type MessagePlatform = Extract<ChannelPlatform, 'LINE' | 'Facebook' | 'Instagram'>;

// 會員來源類型（包含渠道 + 其他來源）
export type MemberSourceType = ChannelPlatform | 'CRM' | 'PMS' | 'ERP' | '系統';
```

#### 類型守衛函數

```typescript
export function isChannelPlatform(value: unknown): value is ChannelPlatform;
export function isAutoReplyChannel(value: unknown): value is AutoReplyChannel;
export function isMessagePlatform(value: unknown): value is MessagePlatform;
export function isMemberSourceType(value: unknown): value is MemberSourceType;
```

#### 配置對象

```typescript
export interface ChannelConfig {
  value: ChannelPlatform;
  label: string;
  emoji: string;
  description?: string;
}

export const CHANNEL_CONFIGS: Record<ChannelPlatform, ChannelConfig> = {
  LINE: { value: 'LINE', label: 'LINE', emoji: '📱' },
  Facebook: { value: 'Facebook', label: 'Facebook', emoji: '👥' },
  Instagram: { value: 'Instagram', label: 'Instagram', emoji: '📷' },
};
```

### 8.3 會員類型定義 (`types/member.ts`)

```typescript
export interface Member {
  id: string;
  username: string;
  realName: string;
  tags: BackendTag[];
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
  createdAt: string;
  lastChatTime?: string;
  // ... 其他欄位
}
```

---

## 9. 工具函數

### 9.1 圖片裁剪 (`utils/imageCropper.ts`)

#### 功能
- 圖片自動裁剪為 1:1 比例
- Canvas 基礎圖片處理

### 9.2 互動標籤處理 (`utils/interactionTags.ts`)

#### 功能
- 標籤陣列格式化
- 標籤去重
- 標籤驗證

### 9.3 會員來源處理 (`utils/memberSource.ts`)

#### 功能
- 會員來源圖標獲取
- 來源類型驗證
- 來源配置查詢

### 9.4 會員時間格式化 (`utils/memberTime.ts`)

#### 功能
- 時間格式化顯示
- 相對時間計算
- 時區轉換

---

## 10. 性能優化

### 10.1 代碼分割

#### React.lazy 動態導入
```typescript
const MemberManagementPage = lazy(() => import('./pages/MemberManagementPage'));
```

### 10.2 Vite 構建優化

#### SWC 編譯器
- 比 Babel 快 20x
- TypeScript 原生支持

#### 代碼壓縮
- Terser 壓縮
- CSS 最小化

### 10.3 組件優化

#### React.memo
- 避免不必要的重新渲染
- Props 淺比較優化

#### useMemo / useCallback
- 計算結果緩存
- 回調函數穩定化

---

## 11. 附錄

### 11.1 技術決策記錄

#### 為什麼使用 React Router v7？
- 現代化路由解決方案
- TypeScript 完整支持
- 與 NavigationContext 無縫集成
- 社區活躍，生態完善

#### 為什麼使用 Context API 而非 Redux？
- 項目規模適中
- 避免過度工程化
- 學習曲線平緩
- 與 React Hooks 完美集成

#### 為什麼採用多 Context 分層架構？
- 關注點分離
- 性能優化（避免不必要的重新渲染）
- 易於測試和維護
- 清晰的數據流向

### 11.2 開發規範

#### 命名約定
- 組件: PascalCase (例: `MemberManagementPage`)
- 變量/函數: camelCase (例: `getMemberById`)
- 常量: UPPER_SNAKE_CASE (例: `API_BASE_URL`)
- 類型/接口: PascalCase (例: `BackendMember`)

#### 文件組織
- 一個文件一個組件
- 相關組件放在同一目錄
- 導出使用 index.ts 統一管理

#### TypeScript 使用
- 優先使用 interface
- 避免使用 any
- 善用類型守衛函數
- 使用 readonly 保護不可變數據

### 11.3 測試策略

#### 單元測試
- 工具函數測試
- 類型守衛函數測試

#### 組件測試
- UI 組件測試
- 業務組件集成測試

#### E2E 測試
- 關鍵用戶流程測試

### 11.4 部署指南

#### 生產構建
```bash
npm run build
```

#### 環境變量
```env
VITE_API_BASE_URL=https://api.example.com
VITE_WS_URL=wss://ws.example.com
```

---

## 更新日誌

### v0.2.0 (2025-12-06)
- ✅ 更新技術棧版本 (React Router v7.9.6)
- ✅ 新增 8 層 Context 架構說明
- ✅ 新增完整類型系統文檔 (api.ts, channel.ts, member.ts)
- ✅ 新增工具函數文檔
- ✅ 新增渠道選擇器組件
- ✅ 新增會員來源圖標組件
- ✅ 更新項目結構（329 個 TS 文件）
- ✅ 更新組件統計數據
- ✅ 新增 LineChannelStatusContext 說明
- ✅ 新增 MembersContext/MessagesContext/AutoRepliesContext/TagsContext 詳細說明
- ✅ 移除過時的 Figma 組件說明（已整合到 imports 目錄）

### v0.1.1 (2025-11-13)
- 初始版本
