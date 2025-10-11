# 力麗飯店 LineOA CRM 後端架構文檔

## 1. 技術棧

### 1.1 核心技術
- **語言**: Python 3.11+
- **Web框架**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+
- **數據庫**: MySQL 8.0+
- **文件存儲**: 本地文件系統

### 1.2 第三方服務集成
- **LINE Messaging API**: 官方帳號消息推送
- **德安 PMS 系統**: 會員資料同步

### 1.3 開發工具
- **API文檔**: Swagger/OpenAPI 3.0
- **代碼規範**: Black + Flake8 + isort
- **測試框架**: Pytest
- **遷移工具**: Alembic

---

## 2. 項目目錄結構

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI 應用入口
│   ├── config.py                    # 配置管理
│   ├── database.py                  # 數據庫連接
│   ├── dependencies.py              # 依賴注入
│   │
│   ├── api/                         # API路由層
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # 認證授權
│   │   │   ├── members.py           # 會員管理
│   │   │   ├── campaigns.py         # 活動推播
│   │   │   ├── templates.py         # 消息模板
│   │   │   ├── tags.py              # 標籤管理
│   │   │   ├── auto_responses.py    # 自動回應
│   │   │   ├── analytics.py         # 數據分析
│   │   │   └── messages.py          # 消息記錄
│   │
│   ├── core/                        # 核心功能
│   │   ├── __init__.py
│   │   ├── security.py              # 安全相關（JWT、密碼加密）
│   │   ├── pagination.py            # 分頁處理
│   │   ├── exceptions.py            # 自定義異常
│   │   └── middleware.py            # 中間件
│   │
│   ├── models/                      # 數據模型（SQLAlchemy）
│   │   ├── __init__.py
│   │   ├── base.py                  # Base Model
│   │   ├── user.py                  # 用戶模型
│   │   ├── member.py                # 會員模型
│   │   ├── tag.py                   # 標籤模型
│   │   ├── campaign.py              # 活動模型
│   │   ├── template.py              # 模板模型
│   │   ├── auto_response.py         # 自動回應模型
│   │   ├── message.py               # 消息模型
│   │   └── consumption.py           # 消費記錄模型
│   │
│   ├── schemas/                     # Pydantic Schemas（請求/響應）
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── member.py
│   │   ├── tag.py
│   │   ├── campaign.py
│   │   ├── template.py
│   │   ├── auto_response.py
│   │   ├── message.py
│   │   └── common.py                # 通用Schema
│   │
│   ├── services/                    # 業務邏輯層
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── member_service.py
│   │   ├── campaign_service.py
│   │   ├── template_service.py
│   │   ├── tag_service.py
│   │   ├── auto_response_service.py
│   │   ├── message_service.py
│   │   ├── analytics_service.py
│   │   └── pms_sync_service.py      # PMS 同步服務
│   │
│   ├── integrations/                # 第三方集成
│   │   ├── __init__.py
│   │   ├── line_api.py              # LINE Messaging API
│   │   ├── pms_api.py               # 德安 PMS API
│   │   └── file_storage.py          # 本地文件存儲
│   │
│   ├── workers/                     # 後台任務（使用 BackgroundTasks）
│   │   ├── __init__.py
│   │   ├── campaign_worker.py       # 推播任務
│   │   ├── auto_response_worker.py  # 自動回應任務
│   │   └── sync_worker.py           # 數據同步任務
│   │
│   └── utils/                       # 工具函數
│       ├── __init__.py
│       ├── logger.py                # 日誌工具
│       ├── validators.py            # 驗證器
│       └── helpers.py               # 幫助函數
│
├── migrations/                      # Alembic 數據庫遷移
│   └── versions/
│
├── tests/                           # 測試文件
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_api/
│   ├── test_services/
│   └── test_models/
│
├── scripts/                         # 腳本文件
│   ├── init_db.py                   # 初始化數據庫
│   └── seed_data.py                 # 種子數據
│
├── .env.example                     # 環境變量示例
├── .gitignore
├── requirements.txt                 # 依賴列表
├── alembic.ini                      # Alembic 配置
├── pytest.ini                       # Pytest 配置
└── README.md
```

---

## 3. 數據庫設計

### 3.1 ER 圖概述

```
┌─────────────────┐
│     users       │ (系統用戶)
│─────────────────│
│ id (PK)         │
│ username        │
│ password_hash   │
│ role            │
└─────────────────┘

┌──────────────────────┐         ┌─────────────────────┐
│      members         │         │   member_tags       │
│──────────────────────│         │─────────────────────│
│ id (PK)              │◄───┐    │ id (PK)             │
│ line_uid             │    │    │ name                │
│ line_display_name    │    │    │ type (member)       │
│ name                 │    │    │ source              │
│ gender               │    │    │ member_count        │
│ birthday             │    │    └─────────────────────┘
│ email                │    │              ▲
│ phone                │    │              │
│ id_number (unique)   │    │              │
│ source               │    │    ┌─────────┴──────────────┐
│ created_at           │    │    │ member_tag_relations   │
│ last_interaction_at  │    └────┤────────────────────────│
└──────────────────────┘         │ id (PK)                │
         │                       │ member_id (FK)         │
         │                       │ tag_id (FK)            │
         │                       │ tagged_at              │
         │                       └────────────────────────┘
         │
         │                       ┌─────────────────────┐
         │                       │ interaction_tags    │
         │                       │─────────────────────│
         ├──────────────────────►│ id (PK)             │
         │                       │ name                │
         │                       │ type (interaction)  │
         │                       │ campaign_id (FK)    │
         │                       │ trigger_count       │
         │                       └─────────────────────┘
         │
         │                       ┌─────────────────────┐
         │                       │ consumption_records │
         │                       │─────────────────────│
         └──────────────────────►│ id (PK)             │
                                 │ member_id (FK)      │
                                 │ order_number        │
                                 │ room_type           │
                                 │ amount              │
                                 │ check_in_date       │
                                 │ check_out_date      │
                                 └─────────────────────┘

┌───────────────────────┐         ┌──────────────────────┐
│     campaigns         │         │  message_templates   │
│───────────────────────│         │──────────────────────│
│ id (PK)               │◄────────│ id (PK)              │
│ title                 │         │ type                 │
│ template_id (FK)      │─────────►│ content              │
│ target_audience       │         │ buttons              │
│ scheduled_at          │         │ images               │
│ status                │         │ notification_text    │
│ sent_count            │         │ preview_text         │
│ opened_count          │         └──────────────────────┘
│ clicked_count         │
└───────────────────────┘                  │
         │                                 │
         │                                 ▼
         │                    ┌──────────────────────────┐
         │                    │ template_carousel_items  │
         │                    │──────────────────────────│
         │                    │ id (PK)                  │
         │                    │ template_id (FK)         │
         │                    │ image_url                │
         │                    │ title                    │
         │                    │ description              │
         │                    │ action_url               │
         │                    │ interaction_tag_id (FK)  │
         │                    │ sort_order               │
         │                    └──────────────────────────┘
         │
         ▼
┌───────────────────────┐
│  campaign_recipients  │
│───────────────────────│
│ id (PK)               │
│ campaign_id (FK)      │
│ member_id (FK)        │
│ sent_at               │
│ opened_at             │
│ clicked_at            │
│ status                │
└───────────────────────┘

┌───────────────────────┐         ┌──────────────────────────┐
│   auto_responses      │         │ auto_response_keywords   │
│───────────────────────│         │──────────────────────────│
│ id (PK)               │◄────────│ id (PK)                  │
│ name                  │         │ auto_response_id (FK)    │
│ trigger_type          │         │ keyword                  │
│ content               │         │ match_count              │
│ is_active             │         └──────────────────────────┘
│ trigger_time_start    │
│ trigger_time_end      │
│ trigger_count         │
└───────────────────────┘

┌───────────────────────┐
│      messages         │
│───────────────────────│
│ id (PK)               │
│ member_id (FK)        │
│ campaign_id (FK)      │
│ content               │
│ direction (in/out)    │
│ message_type          │
│ sender_type           │
│ sender_id             │
│ created_at            │
│ read_at               │
└───────────────────────┘

┌───────────────────────┐
│  tag_trigger_logs     │
│───────────────────────│
│ id (PK)               │
│ member_id (FK)        │
│ tag_id (FK)           │
│ campaign_id (FK)      │
│ triggered_at          │
│ trigger_source        │
└───────────────────────┘
```

### 3.2 表結構詳細設計

#### 3.2.1 users (系統用戶表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 用戶ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用戶名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 郵箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密碼雜湊 |
| full_name | VARCHAR(100) | | 全名 |
| role | ENUM | NOT NULL | 角色：admin/marketing/customer_service |
| is_active | BOOLEAN | DEFAULT TRUE | 是否啟用 |
| last_login_at | DATETIME | | 最後登入時間 |
| created_at | DATETIME | NOT NULL | 創建時間 |
| updated_at | DATETIME | | 更新時間 |

#### 3.2.2 members (會員表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 會員ID |
| line_uid | VARCHAR(100) | UNIQUE | LINE UID |
| line_display_name | VARCHAR(100) | | LINE 顯示名稱 |
| line_picture_url | VARCHAR(500) | | LINE 頭像URL |
| first_name | VARCHAR(50) | | 名 |
| last_name | VARCHAR(50) | | 姓 |
| gender | ENUM | | 性別：male/female/other |
| birthday | DATE | | 生日 |
| email | VARCHAR(100) | | 電子信箱 |
| phone | VARCHAR(20) | | 手機號碼 |
| id_number | VARCHAR(50) | UNIQUE | 身分證/護照號碼 |
| source | ENUM | NOT NULL | 來源：line/crm/system |
| accept_marketing | BOOLEAN | DEFAULT TRUE | 是否接收優惠通知 |
| notes | TEXT | | 內部備註 |
| created_at | DATETIME | NOT NULL | 創建時間 |
| last_interaction_at | DATETIME | | 最後互動時間 |
| updated_at | DATETIME | | 更新時間 |

#### 3.2.3 member_tags (會員標籤表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 標籤ID |
| name | VARCHAR(50) | UNIQUE, NOT NULL | 標籤名稱 |
| type | ENUM | NOT NULL | 類型：member |
| source | ENUM | NOT NULL | 來源：api/manual |
| description | VARCHAR(200) | | 描述 |
| member_count | INT | DEFAULT 0 | 會員數量 |
| created_at | DATETIME | NOT NULL | 創建時間 |
| updated_at | DATETIME | | 更新時間 |

#### 3.2.4 interaction_tags (互動標籤表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 標籤ID |
| name | VARCHAR(50) | NOT NULL | 標籤名稱 |
| type | ENUM | NOT NULL | 類型：interaction |
| campaign_id | BIGINT | FK | 關聯活動ID |
| description | VARCHAR(200) | | 描述 |
| trigger_count | INT | DEFAULT 0 | 觸發次數 |
| created_at | DATETIME | NOT NULL | 創建時間 |
| updated_at | DATETIME | | 更新時間 |

#### 3.2.5 member_tag_relations (會員標籤關聯表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | ID |
| member_id | BIGINT | FK, NOT NULL | 會員ID |
| tag_id | BIGINT | FK, NOT NULL | 標籤ID (member_tags/interaction_tags) |
| tag_type | ENUM | NOT NULL | 標籤類型：member/interaction |
| tagged_at | DATETIME | NOT NULL | 標記時間 |

**索引**: UNIQUE(member_id, tag_id, tag_type)

#### 3.2.6 campaigns (活動推播表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 活動ID |
| title | VARCHAR(100) | NOT NULL | 活動標題 |
| template_id | BIGINT | FK, NOT NULL | 消息模板ID |
| target_audience | JSON | NOT NULL | 目標受眾條件 |
| trigger_condition | JSON | | 觸發條件（如：加入好友7-29天） |
| scheduled_at | DATETIME | | 排程時間 |
| sent_at | DATETIME | | 實際發送時間 |
| status | ENUM | NOT NULL | 狀態：draft/scheduled/sent/failed |
| sent_count | INT | DEFAULT 0 | 發送人數 |
| opened_count | INT | DEFAULT 0 | 開啟次數 |
| clicked_count | INT | DEFAULT 0 | 點擊次數 |
| created_by | BIGINT | FK | 創建者ID |
| created_at | DATETIME | NOT NULL | 創建時間 |
| updated_at | DATETIME | | 更新時間 |

#### 3.2.7 message_templates (消息模板表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 模板ID |
| type | ENUM | NOT NULL | 類型：text/text_button/image_click/image_card |
| name | VARCHAR(100) | | 模板名稱 |
| content | TEXT | | 文字內容 |
| buttons | JSON | | 按鈕配置 |
| notification_text | VARCHAR(100) | | 通知訊息 |
| preview_text | VARCHAR(100) | | 訊息預覽 |
| interaction_tag_id | BIGINT | FK | 互動標籤ID |
| interaction_result | JSON | | 互動結果配置 |
| created_at | DATETIME | NOT NULL | 創建時間 |
| updated_at | DATETIME | | 更新時間 |

#### 3.2.8 template_carousel_items (輪播圖卡片表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | ID |
| template_id | BIGINT | FK, NOT NULL | 模板ID |
| image_url | VARCHAR(500) | NOT NULL | 圖片URL |
| title | VARCHAR(100) | | 標題 |
| description | VARCHAR(200) | | 描述 |
| price | DECIMAL(10,2) | | 金額 |
| action_url | VARCHAR(500) | | 動作URL |
| interaction_tag_id | BIGINT | FK | 互動標籤ID |
| sort_order | INT | DEFAULT 0 | 排序 |
| created_at | DATETIME | NOT NULL | 創建時間 |

#### 3.2.9 campaign_recipients (推播對象記錄表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | ID |
| campaign_id | BIGINT | FK, NOT NULL | 活動ID |
| member_id | BIGINT | FK, NOT NULL | 會員ID |
| sent_at | DATETIME | | 發送時間 |
| opened_at | DATETIME | | 開啟時間 |
| clicked_at | DATETIME | | 點擊時間 |
| status | ENUM | NOT NULL | 狀態：pending/sent/opened/clicked/failed |
| error_message | VARCHAR(500) | | 錯誤訊息 |

**索引**: UNIQUE(campaign_id, member_id)

#### 3.2.10 auto_responses (自動回應表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | ID |
| name | VARCHAR(100) | NOT NULL | 規則名稱 |
| trigger_type | ENUM | NOT NULL | 觸發類型：welcome/keyword/time |
| content | TEXT | NOT NULL | 回應內容 |
| template_id | BIGINT | FK | 模板ID（未來擴展） |
| is_active | BOOLEAN | DEFAULT TRUE | 是否啟用 |
| trigger_time_start | TIME | | 觸發時間開始 |
| trigger_time_end | TIME | | 觸發時間結束 |
| trigger_count | INT | DEFAULT 0 | 觸發次數 |
| success_rate | DECIMAL(5,2) | DEFAULT 0 | 發送成功率 |
| created_at | DATETIME | NOT NULL | 創建時間 |
| updated_at | DATETIME | | 更新時間 |

#### 3.2.11 auto_response_keywords (自動回應關鍵字表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | ID |
| auto_response_id | BIGINT | FK, NOT NULL | 自動回應ID |
| keyword | VARCHAR(50) | NOT NULL | 關鍵字 |
| match_count | INT | DEFAULT 0 | 匹配次數 |
| created_at | DATETIME | NOT NULL | 創建時間 |

**索引**: UNIQUE(auto_response_id, keyword)

#### 3.2.12 messages (消息記錄表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 消息ID |
| member_id | BIGINT | FK, NOT NULL | 會員ID |
| campaign_id | BIGINT | FK | 活動ID |
| content | TEXT | NOT NULL | 消息內容 |
| direction | ENUM | NOT NULL | 方向：incoming/outgoing |
| message_type | ENUM | NOT NULL | 類型：text/image/template |
| sender_type | ENUM | | 發送者類型：manual/auto/campaign |
| sender_id | BIGINT | FK | 發送者ID (users.id) |
| read_at | DATETIME | | 已讀時間 |
| created_at | DATETIME | NOT NULL | 創建時間 |

#### 3.2.13 consumption_records (消費記錄表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 記錄ID |
| member_id | BIGINT | FK, NOT NULL | 會員ID |
| order_number | VARCHAR(50) | UNIQUE, NOT NULL | 訂單編號 |
| room_type | VARCHAR(100) | | 房型 |
| amount | DECIMAL(10,2) | NOT NULL | 金額 |
| check_in_date | DATE | | 入住日期 |
| check_out_date | DATE | | 退房日期 |
| nights | INT | | 住宿天數 |
| source | ENUM | NOT NULL | 來源：pms/manual |
| created_at | DATETIME | NOT NULL | 創建時間 |
| synced_at | DATETIME | | 同步時間 |

#### 3.2.14 tag_trigger_logs (標籤觸發日誌表)

| 欄位名 | 類型 | 約束 | 說明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 日誌ID |
| member_id | BIGINT | FK, NOT NULL | 會員ID |
| tag_id | BIGINT | FK, NOT NULL | 標籤ID |
| campaign_id | BIGINT | FK | 活動ID |
| trigger_source | ENUM | NOT NULL | 觸發來源：click/interaction/manual |
| triggered_at | DATETIME | NOT NULL | 觸發時間 |

---

## 4. API 接口設計

### 4.1 統一響應格式

#### 成功響應
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2025-10-08T10:30:00Z"
}
```

#### 失敗響應
```json
{
  "code": 400,
  "message": "Invalid request parameters",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2025-10-08T10:30:00Z"
}
```

#### 分頁響應
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5
  },
  "timestamp": "2025-10-08T10:30:00Z"
}
```

### 4.2 認證與授權

#### POST /api/v1/auth/login
**說明**: 用戶登入

**請求體**:
```json
{
  "username": "admin@hotel.com",
  "password": "password123"
}
```

**響應**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "系統管理員",
      "role": "admin"
    }
  }
}
```

#### POST /api/v1/auth/refresh
**說明**: 刷新 Token

**請求頭**: `Authorization: Bearer {token}`

**響應**: 同登入響應

#### GET /api/v1/auth/me
**說明**: 獲取當前用戶信息

**請求頭**: `Authorization: Bearer {token}`

**響應**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@hotel.com",
    "full_name": "系統管理員",
    "role": "admin",
    "last_login_at": "2025-10-08T10:00:00Z"
  }
}
```

---

### 4.3 會員管理

#### GET /api/v1/members
**說明**: 獲取會員列表（支持搜索、篩選、分頁）

**請求參數**:
```
?search=王小明             # 搜尋（姓名/Email/手機）
&tags=1,2                 # 標籤ID（逗號分隔）
&source=line              # 來源篩選
&sort_by=last_interaction_at  # 排序欄位
&order=desc               # 排序方向
&page=1                   # 頁碼
&page_size=20             # 每頁數量
```

**響應**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "line_uid": "U1234567890abcdef",
        "line_display_name": "小明的日常",
        "first_name": "小明",
        "last_name": "王",
        "email": "wang.ming@email.com",
        "phone": "0912-345-678",
        "tags": [
          {"id": 1, "name": "VIP會員", "type": "member"},
          {"id": 5, "name": "中秋活動", "type": "interaction"}
        ],
        "created_at": "2024-08-15T14:30:00Z",
        "last_interaction_at": "2025-10-02T16:45:00Z"
      }
    ],
    "total": 256,
    "page": 1,
    "page_size": 20,
    "total_pages": 13
  }
}
```

#### GET /api/v1/members/{id}
**說明**: 獲取會員詳情

**響應**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "line_uid": "U1234567890abcdef",
    "line_display_name": "小明的日常",
    "line_picture_url": "https://...",
    "first_name": "小明",
    "last_name": "王",
    "gender": "male",
    "birthday": "1988-05-20",
    "email": "wang.ming@email.com",
    "phone": "0912-345-678",
    "id_number": "A123456789",
    "source": "line",
    "accept_marketing": true,
    "notes": "常預訂商務房型...",
    "tags": [
      {"id": 1, "name": "VIP會員", "type": "member"},
      {"id": 2, "name": "商務客", "type": "member"},
      {"id": 5, "name": "中秋活動", "type": "interaction"}
    ],
    "consumption_summary": {
      "total_amount": 85600,
      "total_orders": 8,
      "average_amount": 10700
    },
    "created_at": "2024-08-15T14:30:00Z",
    "last_interaction_at": "2025-10-02T16:45:00Z"
  }
}
```

#### POST /api/v1/members
**說明**: 新增會員

**請求體**:
```json
{
  "email": "new.member@email.com",
  "phone": "0987-654-321",
  "first_name": "小華",
  "last_name": "李",
  "gender": "female",
  "id_number": "B987654321"
}
```

**響應**: 同會員詳情

#### PUT /api/v1/members/{id}
**說明**: 更新會員資料

**請求體**: 同新增會員（部分欄位可選）

**響應**: 同會員詳情

#### DELETE /api/v1/members/{id}
**說明**: 刪除會員

**響應**:
```json
{
  "code": 200,
  "message": "Member deleted successfully"
}
```

#### GET /api/v1/members/{id}/consumption-records
**說明**: 獲取會員消費記錄

**請求參數**: `?page=1&page_size=10`

**響應**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "order_number": "#2025091501",
        "room_type": "商務雙人房",
        "amount": 18000,
        "check_in_date": "2025-09-15",
        "check_out_date": "2025-09-18",
        "nights": 3,
        "created_at": "2025-09-15T10:00:00Z"
      }
    ],
    "total": 8,
    "page": 1,
    "page_size": 10
  }
}
```

#### POST /api/v1/members/{id}/tags
**說明**: 為會員添加標籤

**請求體**:
```json
{
  "tag_ids": [1, 2, 5]
}
```

**響應**:
```json
{
  "code": 200,
  "message": "Tags added successfully",
  "data": {
    "member_id": 1,
    "tags": [...]
  }
}
```

#### DELETE /api/v1/members/{id}/tags/{tag_id}
**說明**: 移除會員標籤

**響應**: 成功訊息

#### PUT /api/v1/members/{id}/notes
**說明**: 更新會員備註

**請求體**:
```json
{
  "notes": "常預訂商務房型，偏好高樓層..."
}
```

**響應**: 成功訊息

---

### 4.4 標籤管理

#### GET /api/v1/tags
**說明**: 獲取標籤列表

**請求參數**:
```
?type=member              # 標籤類型：member/interaction
&search=VIP               # 搜尋標籤名稱
&page=1
&page_size=50
```

**響應**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "VIP會員",
        "type": "member",
        "source": "api",
        "member_count": 128,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "page_size": 50
  }
}
```

#### POST /api/v1/tags
**說明**: 創建標籤

**請求體**:
```json
{
  "name": "新標籤",
  "type": "member",
  "source": "manual",
  "description": "標籤描述"
}
```

**響應**: 同標籤詳情

#### PUT /api/v1/tags/{id}
**說明**: 更新標籤

**請求體**: 同創建標籤

#### DELETE /api/v1/tags/{id}
**說明**: 刪除標籤

**響應**: 成功訊息

#### GET /api/v1/tags/statistics
**說明**: 獲取標籤統計數據

**響應**:
```json
{
  "code": 200,
  "data": {
    "total_tags": 42,
    "member_tags": 18,
    "interaction_tags": 24,
    "most_used_tag": {
      "id": 1,
      "name": "VIP會員",
      "member_count": 128
    }
  }
}
```

---

### 4.5 消息模板

#### GET /api/v1/templates
**說明**: 獲取模板列表

**請求參數**: `?type=image_card&page=1&page_size=20`

**響應**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "中秋優惠模板",
        "type": "image_card",
        "created_at": "2025-09-01T00:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "page_size": 20
  }
}
```

#### GET /api/v1/templates/{id}
**說明**: 獲取模板詳情

**響應**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "type": "image_card",
    "name": "中秋優惠模板",
    "content": null,
    "notification_text": "中秋特別優惠來了！",
    "preview_text": "點擊查看詳情",
    "interaction_tag_id": 5,
    "carousel_items": [
      {
        "id": 1,
        "image_url": "https://cdn.hotel.com/001.jpg",
        "title": "商務優惠方案",
        "description": "週一至週四 8 折",
        "price": 3200,
        "action_url": "https://hotel.com/offers/business",
        "interaction_tag_id": 6,
        "sort_order": 1
      }
    ],
    "created_at": "2025-09-01T00:00:00Z"
  }
}
```

#### POST /api/v1/templates
**說明**: 創建消息模板

**請求體**:
```json
{
  "type": "image_card",
  "name": "新模板",
  "notification_text": "通知訊息",
  "preview_text": "預覽文字",
  "interaction_tag_id": 5,
  "carousel_items": [
    {
      "image_url": "https://...",
      "title": "標題",
      "description": "描述",
      "price": 1000,
      "action_url": "https://...",
      "interaction_tag_id": 6,
      "sort_order": 1
    }
  ]
}
```

**響應**: 同模板詳情

#### PUT /api/v1/templates/{id}
**說明**: 更新模板

#### DELETE /api/v1/templates/{id}
**說明**: 刪除模板

---

### 4.6 活動與訊息推播

#### GET /api/v1/campaigns
**說明**: 獲取活動列表

**請求參數**:
```
?status=sent              # 狀態篩選
&start_date=2025-09-01    # 開始日期
&end_date=2025-09-30      # 結束日期
&page=1
&page_size=20
```

**響應**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "中秋送禮 KOL",
        "template": {
          "id": 1,
          "type": "image_card",
          "name": "中秋模板"
        },
        "status": "sent",
        "sent_count": 100,
        "opened_count": 80,
        "clicked_count": 40,
        "open_rate": 80.0,
        "click_rate": 40.0,
        "scheduled_at": "2025-10-02T22:47:00Z",
        "sent_at": "2025-10-02T22:47:00Z",
        "created_at": "2025-10-01T10:00:00Z"
      }
    ],
    "total": 6,
    "summary": {
      "total": 6,
      "sent": 2,
      "scheduled": 2,
      "draft": 2
    }
  }
}
```

#### GET /api/v1/campaigns/{id}
**說明**: 獲取活動詳情

**響應**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "中秋送禮 KOL",
    "template_id": 1,
    "template": { ... },
    "target_audience": {
      "type": "tags",
      "include_tags": [1, 2],
      "exclude_tags": [3]
    },
    "trigger_condition": {
      "type": "friend_days",
      "days_range": [7, 29]
    },
    "scheduled_at": "2025-10-02T22:47:00Z",
    "status": "sent",
    "sent_count": 100,
    "opened_count": 80,
    "clicked_count": 40,
    "created_by": {
      "id": 1,
      "username": "admin",
      "full_name": "系統管理員"
    },
    "created_at": "2025-10-01T10:00:00Z"
  }
}
```

#### POST /api/v1/campaigns
**說明**: 創建活動

**請求體**:
```json
{
  "title": "新活動標題",
  "template_id": 1,
  "target_audience": {
    "type": "all"  // 或 "tags"
  },
  "trigger_condition": null,
  "scheduled_at": "2025-10-10T10:00:00Z"
}
```

**響應**: 同活動詳情

#### PUT /api/v1/campaigns/{id}
**說明**: 更新活動（僅草稿或排程狀態可修改）

#### DELETE /api/v1/campaigns/{id}
**說明**: 刪除活動（僅草稿可刪除）

#### POST /api/v1/campaigns/{id}/send
**說明**: 立即發送活動

**響應**:
```json
{
  "code": 200,
  "message": "Campaign sent successfully",
  "data": {
    "campaign_id": 1,
    "sent_count": 100,
    "sent_at": "2025-10-08T10:30:00Z"
  }
}
```

#### GET /api/v1/campaigns/{id}/recipients
**說明**: 獲取活動發送對象列表

**請求參數**: `?status=opened&page=1&page_size=20`

**響應**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "member": {
          "id": 1,
          "name": "王小明",
          "email": "wang.ming@email.com"
        },
        "sent_at": "2025-10-02T22:47:00Z",
        "opened_at": "2025-10-03T08:15:00Z",
        "clicked_at": "2025-10-03T08:20:00Z",
        "status": "clicked"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

#### GET /api/v1/campaigns/{id}/preview
**說明**: 預覽活動發送效果

**響應**: 返回渲染後的消息預覽內容

---

### 4.7 自動回應

#### GET /api/v1/auto-responses
**說明**: 獲取自動回應列表

**請求參數**: `?trigger_type=keyword&is_active=true`

**響應**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "新好友歡迎訊息",
      "trigger_type": "welcome",
      "content": "歡迎加入力麗飯店...",
      "is_active": true,
      "trigger_count": 1248,
      "success_rate": 98.5,
      "created_at": "2025-09-20T00:00:00Z"
    }
  ]
}
```

#### GET /api/v1/auto-responses/{id}
**說明**: 獲取自動回應詳情

**響應**:
```json
{
  "code": 200,
  "data": {
    "id": 2,
    "name": "優惠方案查詢",
    "trigger_type": "keyword",
    "content": "目前推出的優惠方案：...",
    "keywords": [
      {"id": 1, "keyword": "優惠", "match_count": 320},
      {"id": 2, "keyword": "折扣", "match_count": 256}
    ],
    "is_active": true,
    "trigger_count": 856,
    "success_rate": 100.0,
    "created_at": "2025-10-01T00:00:00Z"
  }
}
```

#### POST /api/v1/auto-responses
**說明**: 創建自動回應

**請求體**:
```json
{
  "name": "新自動回應",
  "trigger_type": "keyword",
  "content": "回應內容",
  "keywords": ["關鍵字1", "關鍵字2"],
  "is_active": true
}
```

**響應**: 同自動回應詳情

#### PUT /api/v1/auto-responses/{id}
**說明**: 更新自動回應

#### DELETE /api/v1/auto-responses/{id}
**說明**: 刪除自動回應

#### PATCH /api/v1/auto-responses/{id}/toggle
**說明**: 切換自動回應啟用狀態

**請求體**:
```json
{
  "is_active": false
}
```

---

### 4.8 消息記錄

#### GET /api/v1/messages
**說明**: 獲取消息記錄列表

**請求參數**:
```
?member_id=1              # 會員ID
&direction=incoming       # 方向
&start_date=2025-10-01
&end_date=2025-10-08
&page=1
&page_size=50
```

**響應**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "member": {
          "id": 1,
          "name": "王小明"
        },
        "content": "您好，請問平日有商務房的優惠嗎？",
        "direction": "incoming",
        "message_type": "text",
        "sender_type": null,
        "read_at": "2025-10-02T14:32:00Z",
        "created_at": "2025-10-02T14:30:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "page_size": 50
  }
}
```

#### GET /api/v1/messages/conversation/{member_id}
**說明**: 獲取與指定會員的對話記錄

**請求參數**: `?page=1&page_size=50`

**響應**: 同消息列表

#### POST /api/v1/messages
**說明**: 發送消息

**請求體**:
```json
{
  "member_id": 1,
  "content": "感謝您的詢問...",
  "message_type": "text",
  "scheduled_at": null  // 可選：排程發送
}
```

**響應**:
```json
{
  "code": 200,
  "message": "Message sent successfully",
  "data": {
    "id": 2,
    "member_id": 1,
    "content": "感謝您的詢問...",
    "direction": "outgoing",
    "created_at": "2025-10-08T10:30:00Z"
  }
}
```

---

### 4.9 數據分析

#### GET /api/v1/analytics/overview
**說明**: 獲取總覽數據

**請求參數**: `?start_date=2025-10-01&end_date=2025-10-08`

**響應**:
```json
{
  "code": 200,
  "data": {
    "kpi": {
      "total_messages_sent": 12458,
      "average_open_rate": 68.5,
      "average_click_rate": 42.3,
      "conversion_rate": 18.7
    },
    "trends": {
      "messages_sent_trend": 15.3,
      "open_rate_trend": 8.2,
      "click_rate_trend": -2.1,
      "conversion_rate_trend": 12.5
    }
  }
}
```

#### GET /api/v1/analytics/campaign-performance
**說明**: 獲取活動成效數據

**請求參數**: `?start_date=2025-10-01&end_date=2025-10-08&limit=10`

**響應**:
```json
{
  "code": 200,
  "data": [
    {
      "campaign_id": 1,
      "title": "中秋送禮 KOL",
      "sent_count": 100,
      "opened_count": 80,
      "clicked_count": 40,
      "conversion_count": 25,
      "open_rate": 80.0,
      "click_rate": 40.0,
      "conversion_rate": 25.0
    }
  ]
}
```

#### GET /api/v1/analytics/tag-distribution
**說明**: 獲取標籤分布數據

**響應**:
```json
{
  "code": 200,
  "data": [
    {
      "tag_id": 5,
      "tag_name": "中秋活動",
      "trigger_count": 156,
      "percentage": 18.5
    }
  ]
}
```

#### GET /api/v1/analytics/trends
**說明**: 獲取趨勢數據（用於折線圖）

**請求參數**: `?metric=sent,opened,clicked&start_date=2025-09-01&end_date=2025-10-01`

**響應**:
```json
{
  "code": 200,
  "data": {
    "dates": ["2025-09-01", "2025-09-02", "..."],
    "series": [
      {
        "name": "sent",
        "data": [120, 135, 128, "..."]
      },
      {
        "name": "opened",
        "data": [85, 92, 88, "..."]
      },
      {
        "name": "clicked",
        "data": [45, 52, 48, "..."]
      }
    ]
  }
}
```

#### POST /api/v1/analytics/export
**說明**: 導出報表

**請求體**:
```json
{
  "report_type": "campaign_performance",
  "format": "excel",  // 或 "pdf"
  "start_date": "2025-09-01",
  "end_date": "2025-10-01"
}
```

**響應**:
```json
{
  "code": 200,
  "data": {
    "download_url": "https://cdn.hotel.com/reports/xxx.xlsx",
    "expires_at": "2025-10-08T11:30:00Z"
  }
}
```

---

### 4.10 PMS 系統集成

#### POST /api/v1/pms/sync
**說明**: 手動觸發 PMS 數據同步

**請求體**:
```json
{
  "sync_type": "members",  // members / consumption_records
  "force": false           // 是否強制全量同步
}
```

**響應**:
```json
{
  "code": 200,
  "message": "Sync task created",
  "data": {
    "task_id": "abc123",
    "status": "pending"
  }
}
```

#### GET /api/v1/pms/sync-status/{task_id}
**說明**: 查詢同步任務狀態

**響應**:
```json
{
  "code": 200,
  "data": {
    "task_id": "abc123",
    "status": "completed",
    "synced_count": 256,
    "failed_count": 2,
    "started_at": "2025-10-08T10:00:00Z",
    "completed_at": "2025-10-08T10:05:00Z"
  }
}
```

---

## 5. 系統架構

### 5.1 分層架構

```
┌─────────────────────────────────────────────┐
│          Client (Web / Mobile)              │
└─────────────────┬───────────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────────┐
│           API Gateway / Nginx               │
│        (負載均衡、SSL終止、限流)              │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         FastAPI Application                 │
│  ┌─────────────────────────────────────┐   │
│  │      API Layer (路由)                │   │
│  └──────────────┬──────────────────────┘   │
│  ┌──────────────▼──────────────────────┐   │
│  │   Service Layer (業務邏輯)           │   │
│  └──────────────┬──────────────────────┘   │
│  ┌──────────────▼──────────────────────┐   │
│  │   Repository Layer (數據訪問)        │   │
│  └──────────────┬──────────────────────┘   │
│  │              │                           │
│  │  ┌───────────▼───────────────┐          │
│  │  │ Background Tasks (後台任務) │          │
│  │  │  - 消息推播                 │          │
│  │  │  - PMS 數據同步             │          │
│  │  │  - 自動回應處理             │          │
│  │  └─────────────────────────────┘          │
└─────────────────┼───────────────────────────┘
                  │
            ┌─────▼──────┐
            │   MySQL    │
            │  Database  │
            └────────────┘

┌─────────────────────────────────────────────┐
│         External Services                   │
│  - LINE Messaging API                       │
│  - 德安 PMS 系統                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Local File Storage                  │
│  - 圖片存儲 (/uploads/images/)              │
│  - 文件存儲 (/uploads/files/)               │
└─────────────────────────────────────────────┘
```

### 5.2 數據流

#### 消息推播流程
```
1. 用戶在後台創建活動 → API 保存活動信息
2. 排程時間到達 → 後台任務觸發（使用 APScheduler）
3. 查詢目標受眾 → 根據標籤篩選會員
4. 批量發送消息 → 調用 LINE API（分批處理，避免超時）
5. 記錄發送結果 → 更新統計數據
6. 追蹤用戶互動 → 觸發標籤自動打標
```

#### PMS 數據同步流程
```
1. 定時任務觸發（每小時，使用 APScheduler）
2. 調用 PMS API 獲取增量數據
3. 數據清洗與轉換
4. 比對身分證/手機號碼匹配會員
5. 更新會員資料與消費記錄
6. 記錄同步日誌
```

### 5.3 文件存儲策略

#### 本地文件存儲結構
```
/uploads/
├── images/                    # 圖片文件
│   ├── templates/             # 模板圖片
│   ├── members/               # 會員頭像
│   └── temp/                  # 臨時文件
└── exports/                   # 導出文件
    ├── reports/               # 報表文件
    └── temp/                  # 臨時導出
```

#### 文件上傳處理
- **圖片格式**: JPG, PNG, WebP
- **大小限制**: 單個文件 ≤ 10MB
- **命名規則**: `{timestamp}_{uuid}.{ext}`
- **存儲路徑**: `/uploads/images/{category}/{filename}`
- **訪問方式**: `/static/uploads/images/{category}/{filename}`

#### 圖片處理
- 自動壓縮（質量 80%）
- 生成縮略圖（最大寬度 800px）
- 支持 1:1 比例裁剪

### 5.4 安全機制

1. **認證**: JWT Token，有效期 1 小時
2. **授權**: 基於角色的訪問控制（RBAC）
3. **敏感數據加密**:
   - 密碼使用 bcrypt 加密
   - 身分證號碼使用 AES-256 加密存儲
4. **API 限流**:
   - 登入接口：5 次/分鐘
   - 一般接口：100 次/分鐘
   - 消息發送：50 次/分鐘
5. **CORS**: 僅允許指定域名訪問
6. **SQL 注入防護**: 使用 ORM 參數化查詢

---

## 6. 部署方案

### 6.1 開發環境
```bash
# 使用 Docker Compose
docker-compose up -d
```

### 6.2 生產環境

#### 服務器配置
- **應用服務器**: 1-2 台
  - CPU: 4 核
  - 內存: 8GB
  - 存儲: SSD 200GB（含文件存儲空間）
  - 系統: Ubuntu 22.04 LTS

- **數據庫服務器**: 1 主 1 從（可選）
  - CPU: 4 核
  - 內存: 8GB
  - 存儲: SSD 500GB

#### 部署步驟
```bash
# 1. 克隆代碼
git clone <repository>

# 2. 創建虛擬環境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 3. 安裝依賴
pip install -r requirements.txt

# 4. 創建上傳目錄
mkdir -p uploads/images/templates
mkdir -p uploads/images/members
mkdir -p uploads/exports/reports

# 5. 數據庫遷移
alembic upgrade head

# 6. 啟動服務（包含後台任務調度）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## 7. 監控與日誌

### 7.1 應用監控
- **工具**: Prometheus + Grafana
- **指標**:
  - API 響應時間
  - 請求成功率
  - 數據庫查詢性能
  - Celery 任務執行情況

### 7.2 日誌管理
- **日誌文件**: 按日期輪轉（logs/app-{date}.log）
- **日誌級別**:
  - ERROR: 錯誤信息
  - WARNING: 警告信息
  - INFO: 關鍵操作日誌
  - DEBUG: 詳細調試信息（僅開發環境）

### 7.3 告警機制
- API 錯誤率超過 5%
- 數據庫連接池耗盡
- 後台任務執行失敗
- 磁盤空間使用率超過 80%

---

## 8. 性能優化

### 8.1 數據庫優化
- 為常用查詢字段添加索引
- 使用連接池（最大連接數: 20）
- 定期執行 ANALYZE 優化查詢計劃
- 大表分區（如 messages 表按月分區）

### 8.2 API 優化
- 使用異步 I/O（asyncio）
- 批量操作減少數據庫往返
- 分頁查詢避免大結果集
- 使用連接池管理數據庫連接

### 8.3 後台任務優化
- 使用 APScheduler 管理定時任務
- 使用 FastAPI BackgroundTasks 處理異步操作
- 批量發送消息（每批 100 條，避免 API 限流）
- 任務執行失敗重試機制（最多重試 3 次）

---

## 9. 測試策略

### 9.1 單元測試
- 覆蓋率目標: ≥ 80%
- 測試框架: Pytest
- Mock 外部依賴

### 9.2 集成測試
- 測試 API 端點
- 測試數據庫操作
- 測試第三方集成

### 9.3 壓力測試
- 工具: Locust
- 目標:
  - 並發用戶: 1000
  - 響應時間: P95 < 500ms
  - 錯誤率: < 1%

---

## 10. 版本控制與 CI/CD

### 10.1 Git 工作流
- 主分支: `main`
- 開發分支: `develop`
- 功能分支: `feature/*`
- 修復分支: `bugfix/*`

### 10.2 CI/CD 流程
```yaml
# GitHub Actions 示例
1. 代碼提交到 develop
2. 運行自動化測試
3. 代碼審查通過
4. 合併到 main
5. 自動部署到測試環境
6. 手動部署到生產環境
```

---

## 附錄

### A. 環境變量配置

```bash
# .env
DATABASE_URL=mysql+aiomysql://user:pass@localhost:3306/hotel_crm

SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

LINE_CHANNEL_ACCESS_TOKEN=your-line-token
LINE_CHANNEL_SECRET=your-line-secret

PMS_API_URL=https://pms.dexon.com.tw/api
PMS_API_KEY=your-pms-api-key

# 文件存儲配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp

# 定時任務配置
PMS_SYNC_INTERVAL=3600  # 每小時同步一次（秒）
```

### B. 常用命令

```bash
# 創建數據庫遷移
alembic revision --autogenerate -m "Add new table"

# 執行遷移
alembic upgrade head

# 回滾遷移
alembic downgrade -1

# 運行測試
pytest

# 運行測試並生成覆蓋率報告
pytest --cov=app --cov-report=html

# 代碼格式化
black app/
isort app/

# 代碼檢查
flake8 app/

# 清理臨時文件
rm -rf uploads/images/temp/*
rm -rf uploads/exports/temp/*

# 啟動開發服務器（含熱重載）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### C. 後台任務實現示例

#### 使用 APScheduler 管理定時任務

```python
# app/main.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def start_scheduler():
    # PMS 數據同步（每小時執行一次）
    scheduler.add_job(
        sync_pms_data,
        trigger=IntervalTrigger(hours=1),
        id="pms_sync",
        name="PMS Data Sync",
        replace_existing=True
    )

    # 檢查並發送排程消息（每分鐘檢查一次）
    scheduler.add_job(
        check_scheduled_campaigns,
        trigger=IntervalTrigger(minutes=1),
        id="campaign_check",
        name="Check Scheduled Campaigns",
        replace_existing=True
    )

    scheduler.start()

@app.on_event("shutdown")
async def shutdown_scheduler():
    scheduler.shutdown()
```

#### 使用 BackgroundTasks 處理異步操作

```python
# 發送消息時使用後台任務
from fastapi import BackgroundTasks

@router.post("/campaigns/{id}/send")
async def send_campaign(
    id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    campaign = await campaign_service.get_by_id(db, id)

    # 添加後台任務
    background_tasks.add_task(
        send_campaign_messages,
        campaign_id=id
    )

    return {"message": "Campaign sending started"}

async def send_campaign_messages(campaign_id: int):
    """後台任務：批量發送消息"""
    async with get_db_session() as db:
        recipients = await get_campaign_recipients(db, campaign_id)

        # 分批發送，每批 100 條
        for batch in chunks(recipients, 100):
            await send_batch_messages(batch)
            await asyncio.sleep(1)  # 避免 API 限流
```

### D. 文件上傳處理示例

```python
# app/api/v1/upload.py
from fastapi import UploadFile, File, HTTPException
from app.integrations.file_storage import FileStorage

@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    category: str = "templates"
):
    # 驗證文件類型
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files are allowed")

    # 驗證文件大小
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(400, "File size exceeds 10MB")

    # 保存文件
    file_storage = FileStorage()
    file_path = await file_storage.save_image(
        contents,
        filename=file.filename,
        category=category
    )

    return {
        "filename": file.filename,
        "path": file_path,
        "url": f"/static/uploads/{file_path}"
    }
```

```python
# app/integrations/file_storage.py
import os
import uuid
from datetime import datetime
from PIL import Image
from io import BytesIO

class FileStorage:
    def __init__(self):
        self.base_dir = "uploads"
        self.ensure_directories()

    def ensure_directories(self):
        """確保目錄存在"""
        dirs = [
            "uploads/images/templates",
            "uploads/images/members",
            "uploads/images/temp",
            "uploads/exports/reports",
        ]
        for dir_path in dirs:
            os.makedirs(dir_path, exist_ok=True)

    async def save_image(
        self,
        file_content: bytes,
        filename: str,
        category: str = "templates"
    ) -> str:
        """保存圖片並壓縮"""
        # 生成唯一文件名
        ext = filename.split(".")[-1]
        unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{ext}"

        # 文件路徑
        file_path = f"images/{category}/{unique_filename}"
        full_path = os.path.join(self.base_dir, file_path)

        # 圖片處理（壓縮）
        image = Image.open(BytesIO(file_content))

        # 如果圖片過大，調整尺寸
        max_width = 1200
        if image.width > max_width:
            ratio = max_width / image.width
            new_size = (max_width, int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        # 保存圖片（壓縮質量 80%）
        image.save(full_path, quality=80, optimize=True)

        return file_path

    def delete_file(self, file_path: str):
        """刪除文件"""
        full_path = os.path.join(self.base_dir, file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
```

---

**文檔版本**: v1.0
**最後更新**: 2025-10-08
**維護者**: 開發團隊
