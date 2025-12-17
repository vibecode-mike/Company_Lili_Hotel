# Facebook Messenger API 規格文件

> 供開發團隊對接使用的 API 接口規格與 PRD

---

## 目錄

1. [專案概述](#專案概述)
2. [技術架構](#技術架構)
3. [API 端點總覽](#api-端點總覽)
4. [認證機制](#認證機制)
5. [API 詳細規格](#api-詳細規格)
   - [5.1 Webhook 處理](#51-webhook-處理)
   - [5.2 頻道管理 API](#52-頻道管理-api)
   - [5.3 好友管理 API](#53-好友管理-api)
   - [5.4 對話記錄 API](#54-對話記錄-api)
   - [5.5 訊息發送 API](#55-訊息發送-api)
   - [5.6 自動回覆 API](#56-自動回覆-api)
   - [5.7 Messenger Profile API](#57-messenger-profile-api)
   - [5.8 點擊追蹤 API](#58-點擊追蹤-api)
6. [資料模型](#資料模型)
7. [錯誤處理](#錯誤處理)
8. [環境配置](#環境配置)

---

## 專案概述

### 目標
擴充現有 `meta_page_backend` Go 服務，實現完整的 Facebook Messenger 整合功能，包括：
- Webhook 事件處理
- 多粉專（多租戶）支援
- 會員管理與同步
- 自動回覆（GPT + 關鍵字）
- 廣播訊息發送
- 點擊追蹤

### 服務資訊
| 項目 | 值 |
|------|-----|
| 服務名稱 | meta_page_backend |
| 語言/框架 | Go 1.21+ / Gin |
| Port | 11204 |
| Base URL | `http://localhost:11204/api/v1` |
| 資料庫 | MySQL 8.0 (lili_hotel) |

---

## 技術架構

```
┌─────────────────────────────────────────────────────────────┐
│                    meta_page_backend                         │
│                      Go/Gin:11204                            │
├─────────────────────────────────────────────────────────────┤
│  Handlers Layer                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │ webhook   │ │ channel   │ │ message   │ │ tracking  │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │ graph_api │ │ gpt       │ │ keyword   │ │ member    │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Repositories Layer                                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │ channel   │ │ friend    │ │ member    │ │ message   │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Models (GORM)                                               │
│  fb_channel | fb_friend | member | conversation | ...        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   MySQL 8.0    │
                    │  (lili_hotel)  │
                    └─────────────────┘
```

---

## API 端點總覽

### Webhook (Facebook 呼叫)
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/meta_hook` | Webhook 驗證 |
| POST | `/meta_hook` | 接收 Webhook 事件 |

### 頻道管理
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/meta_page/channels` | 列出所有頻道 |
| GET | `/meta_page/channels/:id` | 取得單一頻道 |
| POST | `/meta_page/channels` | 新增頻道 |
| PUT | `/meta_page/channels/:id` | 更新頻道 |
| DELETE | `/meta_page/channels/:id` | 刪除頻道 |
| POST | `/meta_page/channels/:id/verify` | 驗證 Token |

### 好友管理
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/meta_page/channels/:page_id/friends` | 列出粉專好友 |
| GET | `/meta_page/channels/:page_id/friends/:fb_uid` | 取得單一好友 |
| POST | `/meta_page/channels/:page_id/friends/:fb_uid/sync` | 同步好友資料 |

### 對話記錄
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/meta_page/channels/:page_id/conversations` | 列出對話 |
| GET | `/meta_page/channels/:page_id/conversations/:fb_uid` | 取得對話記錄 |

### 訊息發送
| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/meta_page/message` | 發送文字訊息 |
| POST | `/meta_page/message/template` | 發送 Template 訊息 |
| POST | `/meta_page/message/broadcast` | 廣播訊息 |

### 自動回覆
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/meta_page/channels/:page_id/auto_responses` | 列出自動回覆 |
| POST | `/meta_page/channels/:page_id/auto_responses` | 新增自動回覆 |
| PUT | `/meta_page/channels/:page_id/auto_responses/:id` | 更新自動回覆 |
| DELETE | `/meta_page/channels/:page_id/auto_responses/:id` | 刪除自動回覆 |

### Messenger Profile
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/meta_page/channels/:page_id/messenger_profile` | 取得設定 |
| POST | `/meta_page/channels/:page_id/messenger_profile` | 設定 Persistent Menu |
| DELETE | `/meta_page/channels/:page_id/messenger_profile` | 刪除設定 |

### 點擊追蹤
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/__fb_click` | 點擊追蹤 (302 重導向) |

---

## 認證機制

### 內部 API 認證
使用 JWT Bearer Token（與現有 FastAPI 後端共用）

```http
Authorization: Bearer <jwt_token>
```

### Facebook Webhook 驗證
使用 `hub.verify_token` 驗證

---

## API 詳細規格

### 5.1 Webhook 處理

#### GET `/api/v1/meta_hook` - Webhook 驗證

Facebook 設定 Webhook 時會發送驗證請求。

**Query Parameters:**
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| hub.mode | string | ✅ | 必須為 "subscribe" |
| hub.verify_token | string | ✅ | 驗證 Token |
| hub.challenge | string | ✅ | 挑戰碼 |

**Response:**
- 成功：回傳 `hub.challenge` 值
- 失敗：HTTP 403

**範例:**
```http
GET /api/v1/meta_hook?hub.mode=subscribe&hub.verify_token=my_token&hub.challenge=12345
```

---

#### POST `/api/v1/meta_hook` - 接收 Webhook 事件

接收 Facebook 發送的事件通知。

**Request Headers:**
| Header | 說明 |
|--------|------|
| X-Hub-Signature-256 | HMAC-SHA256 簽名 |

**Request Body:**
```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1234567890,
      "messaging": [
        {
          "sender": { "id": "USER_PSID" },
          "recipient": { "id": "PAGE_ID" },
          "timestamp": 1234567890,
          "message": {
            "mid": "MESSAGE_ID",
            "text": "用戶訊息內容"
          }
        }
      ]
    }
  ]
}
```

**支援的事件類型:**

| 事件 | 說明 | 處理邏輯 |
|------|------|----------|
| `message` | 文字訊息 | 儲存記錄、觸發自動回覆 |
| `message.attachments` | 附件訊息 | 儲存記錄 |
| `postback` | 按鈕點擊 | 處理 payload、記錄互動標籤 |
| `messaging_optins` | Get Started | 發送歡迎訊息 |

**Response:**
```json
// 必須立即返回 200，避免 Facebook 重試
HTTP 200 OK
```

**內部處理流程:**
```
1. 解析 Webhook Payload
2. 依 Page ID 查詢頻道配置
3. 跳過未啟用的頻道
4. 處理 messaging 事件：
   a. Upsert fb_friends 記錄
   b. 儲存 conversation_messages
   c. 觸發自動回覆流程
5. 返回 200 OK
```

---

### 5.2 頻道管理 API

#### GET `/api/v1/meta_page/channels` - 列出所有頻道

**Query Parameters:**
| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| page | int | 1 | 頁碼 |
| limit | int | 20 | 每頁筆數 (max: 100) |
| is_active | bool | - | 篩選啟用狀態 |
| business_account_id | string | - | 篩選企業帳號 |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "page_id": "123456789",
        "page_name": "力麗酒店",
        "app_id": "APP_ID",
        "business_account_id": "BIZ_001",
        "is_active": true,
        "token_expires_at": "2025-12-31T23:59:59Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

---

#### POST `/api/v1/meta_page/channels` - 新增頻道

**Request Body:**
```json
{
  "page_id": "123456789",
  "page_name": "力麗酒店",
  "page_access_token": "EAAG...",
  "app_id": "APP_ID",
  "business_account_id": "BIZ_001",
  "webhook_verify_token": "my_verify_token"
}
```

**Validation Rules:**
| 欄位 | 規則 |
|------|------|
| page_id | required, unique |
| page_access_token | required |
| page_name | optional, max 200 chars |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "page_id": "123456789",
    "page_name": "力麗酒店",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### POST `/api/v1/meta_page/channels/:id/verify` - 驗證 Token

驗證 Page Access Token 是否有效。

**Response (成功):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "page_id": "123456789",
    "page_name": "力麗酒店",
    "permissions": ["pages_messaging", "pages_read_engagement"]
  }
}
```

**Response (失敗):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The access token is invalid or expired"
  }
}
```

---

### 5.3 好友管理 API

#### GET `/api/v1/meta_page/channels/:page_id/friends` - 列出粉專好友

**Query Parameters:**
| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| page | int | 1 | 頁碼 |
| limit | int | 20 | 每頁筆數 |
| is_active | bool | - | 篩選狀態 |
| search | string | - | 搜尋名稱 |
| sort | string | last_interaction_at | 排序欄位 |
| order | string | desc | 排序方向 |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "fb_uid": "PSID_123",
        "page_id": "123456789",
        "fb_display_name": "王小明",
        "fb_picture_url": "https://...",
        "member_id": 100,
        "is_active": true,
        "gpt_enabled": true,
        "first_interaction_at": "2024-01-01T10:00:00Z",
        "last_interaction_at": "2024-06-15T14:30:00Z",
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

---

#### POST `/api/v1/meta_page/channels/:page_id/friends/:fb_uid/sync` - 同步好友資料

從 Facebook Graph API 重新抓取用戶資料。

**Response:**
```json
{
  "success": true,
  "data": {
    "fb_uid": "PSID_123",
    "fb_display_name": "王小明",
    "fb_picture_url": "https://platform-lookaside.fbsbx.com/...",
    "synced_at": "2024-06-15T14:30:00Z"
  }
}
```

---

### 5.4 對話記錄 API

#### GET `/api/v1/meta_page/channels/:page_id/conversations` - 列出對話

**Query Parameters:**
| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| page | int | 1 | 頁碼 |
| limit | int | 20 | 每頁筆數 |
| sort | string | last_message_at | 排序欄位 |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "fb_uid": "PSID_123",
        "fb_display_name": "王小明",
        "fb_picture_url": "https://...",
        "last_message": "請問有空房嗎？",
        "last_message_at": "2024-06-15T14:30:00Z",
        "unread_count": 2
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

#### GET `/api/v1/meta_page/channels/:page_id/conversations/:fb_uid` - 取得對話記錄

**Query Parameters:**
| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| page | int | 1 | 頁碼 |
| limit | int | 50 | 每頁筆數 (max: 100) |
| before | datetime | - | 取得此時間之前的訊息 |
| after | datetime | - | 取得此時間之後的訊息 |

**Response:**
```json
{
  "success": true,
  "data": {
    "friend": {
      "fb_uid": "PSID_123",
      "fb_display_name": "王小明",
      "fb_picture_url": "https://..."
    },
    "messages": [
      {
        "id": 1001,
        "mid": "m_xxx",
        "direction": "incoming",
        "content_type": "text",
        "content": "請問有空房嗎？",
        "source": null,
        "created_at": "2024-06-15T14:30:00Z"
      },
      {
        "id": 1002,
        "mid": "m_yyy",
        "direction": "outgoing",
        "content_type": "text",
        "content": "您好！目前雙人房有空房...",
        "source": "gpt",
        "created_at": "2024-06-15T14:30:05Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

**Message Source 類型:**
| source | 說明 |
|--------|------|
| null | 人工發送 |
| gpt | GPT 自動回覆 |
| keyword | 關鍵字回覆 |
| always | 永久回覆 |
| welcome | 歡迎訊息 |
| broadcast | 廣播訊息 |

---

### 5.5 訊息發送 API

#### POST `/api/v1/meta_page/message` - 發送文字訊息

**Request Body:**
```json
{
  "page_id": "123456789",
  "recipient_id": "PSID_123",
  "message": {
    "text": "感謝您的詢問，我們會盡快回覆！"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recipient_id": "PSID_123",
    "message_id": "m_xxx"
  }
}
```

---

#### POST `/api/v1/meta_page/message/template` - 發送 Template 訊息

**支援的 Template 類型:**
- `generic` - Carousel / Cards
- `button` - 按鈕訊息

**Request Body (Generic Template):**
```json
{
  "page_id": "123456789",
  "recipient_id": "PSID_123",
  "template_type": "generic",
  "elements": [
    {
      "title": "雙人精緻客房",
      "subtitle": "NT$3,500/晚，含早餐",
      "image_url": "https://example.com/room1.jpg",
      "buttons": [
        {
          "type": "web_url",
          "url": "https://example.com/book?room=1",
          "title": "立即預訂"
        },
        {
          "type": "postback",
          "title": "了解更多",
          "payload": "ROOM_INFO_1"
        }
      ]
    },
    {
      "title": "豪華家庭房",
      "subtitle": "NT$5,500/晚，含早餐",
      "image_url": "https://example.com/room2.jpg",
      "buttons": [
        {
          "type": "web_url",
          "url": "https://example.com/book?room=2",
          "title": "立即預訂"
        }
      ]
    }
  ]
}
```

**Request Body (Button Template):**
```json
{
  "page_id": "123456789",
  "recipient_id": "PSID_123",
  "template_type": "button",
  "text": "請選擇服務項目：",
  "buttons": [
    {
      "type": "postback",
      "title": "訂房服務",
      "payload": "SERVICE_BOOKING"
    },
    {
      "type": "postback",
      "title": "客服諮詢",
      "payload": "SERVICE_SUPPORT"
    },
    {
      "type": "web_url",
      "url": "https://example.com",
      "title": "官方網站"
    }
  ]
}
```

**Button Types:**
| type | 說明 | 必要欄位 |
|------|------|----------|
| web_url | 開啟網頁 | url, title |
| postback | 發送 Postback | payload, title |
| phone_number | 撥打電話 | payload (電話號碼), title |

**Response:**
```json
{
  "success": true,
  "data": {
    "recipient_id": "PSID_123",
    "message_id": "m_xxx"
  }
}
```

---

#### POST `/api/v1/meta_page/message/broadcast` - 廣播訊息

**Request Body:**
```json
{
  "page_id": "123456789",
  "message": {
    "text": "【限時優惠】訂房享8折優惠！"
  },
  "target": {
    "tags": ["VIP", "住宿過"],
    "within_24h": false
  },
  "tracking": {
    "campaign_id": 100,
    "message_id": "broadcast_001"
  }
}
```

**Target Options:**
| 欄位 | 類型 | 說明 |
|------|------|------|
| tags | string[] | 目標標籤（AND 邏輯） |
| exclude_tags | string[] | 排除標籤 |
| within_24h | bool | 僅發送給 24 小時內互動過的用戶 |
| fb_uids | string[] | 指定發送對象（優先於 tags） |

**Message Tag 自動處理:**
- 24 小時內互動：使用 `RESPONSE` 類型
- 24 小時外：使用 `MESSAGE_TAG` + `CONFIRMED_EVENT_UPDATE`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_recipients": 150,
    "sent": 148,
    "failed": 2,
    "failures": [
      {
        "fb_uid": "PSID_456",
        "error": "User has blocked the page"
      }
    ]
  }
}
```

---

### 5.6 自動回覆 API

#### GET `/api/v1/meta_page/channels/:page_id/auto_responses` - 列出自動回覆

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "keyword",
      "name": "訂房關鍵字",
      "keywords": ["訂房", "預約", "空房"],
      "content": {
        "text": "感謝您的訂房詢問！請問您預計入住的日期是？"
      },
      "is_active": true,
      "priority": 10,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "type": "welcome",
      "name": "歡迎訊息",
      "content": {
        "text": "歡迎來到力麗酒店！有任何問題都可以詢問我們。"
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 3,
      "type": "always",
      "name": "預設回覆",
      "content": {
        "text": "感謝您的訊息，我們會盡快回覆您！"
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Auto Response Types:**
| type | 說明 | 觸發條件 |
|------|------|----------|
| keyword | 關鍵字回覆 | 訊息包含指定關鍵字 |
| welcome | 歡迎訊息 | Get Started 按鈕點擊 |
| always | 永久回覆 | 無其他回覆時 |

---

#### POST `/api/v1/meta_page/channels/:page_id/auto_responses` - 新增自動回覆

**Request Body (關鍵字):**
```json
{
  "type": "keyword",
  "name": "訂房關鍵字",
  "keywords": ["訂房", "預約", "空房"],
  "content": {
    "text": "感謝您的訂房詢問！"
  },
  "is_active": true,
  "priority": 10
}
```

**Request Body (Template 回覆):**
```json
{
  "type": "keyword",
  "name": "房型查詢",
  "keywords": ["房型", "房間"],
  "content": {
    "template_type": "generic",
    "elements": [
      {
        "title": "雙人精緻客房",
        "subtitle": "NT$3,500/晚",
        "image_url": "https://..."
      }
    ]
  },
  "is_active": true
}
```

---

### 5.7 Messenger Profile API

#### POST `/api/v1/meta_page/channels/:page_id/messenger_profile` - 設定 Messenger Profile

設定 Get Started 按鈕和 Persistent Menu。

**Request Body:**
```json
{
  "get_started": {
    "payload": "GET_STARTED"
  },
  "persistent_menu": [
    {
      "locale": "default",
      "composer_input_disabled": false,
      "call_to_actions": [
        {
          "type": "postback",
          "title": "訂房服務",
          "payload": "MENU_BOOKING"
        },
        {
          "type": "postback",
          "title": "客服諮詢",
          "payload": "MENU_SUPPORT"
        },
        {
          "type": "web_url",
          "title": "官方網站",
          "url": "https://example.com"
        }
      ]
    }
  ],
  "greeting": [
    {
      "locale": "default",
      "text": "歡迎來到力麗酒店！點擊「開始使用」開始對話。"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": "success"
  }
}
```

---

### 5.8 點擊追蹤 API

#### GET `/__fb_click` - 點擊追蹤

用於追蹤廣播訊息中的按鈕點擊。

**Query Parameters:**
| 參數 | 類型 | 說明 |
|------|------|------|
| mid | string | 訊息 ID |
| uid | string | 用戶 FB UID |
| btn | string | 按鈕 ID |
| url | string | 目標 URL |

**Response:**
```http
HTTP 302 Found
Location: {url}
```

**追蹤邏輯:**
1. 記錄點擊事件到 `message_clicks` 表
2. 若 btn 以 `tag:` 開頭，記錄互動標籤
3. 302 重導向到目標 URL

---

## 資料模型

### fb_channels (頻道)

```sql
CREATE TABLE fb_channels (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  page_id VARCHAR(50) UNIQUE NOT NULL COMMENT 'Facebook Page ID',
  page_name VARCHAR(200) COMMENT '粉專名稱',
  page_access_token TEXT NOT NULL COMMENT 'Long-lived Token',
  app_id VARCHAR(50) COMMENT 'FB App ID',
  business_account_id VARCHAR(50) COMMENT '企業帳號 ID',
  webhook_verify_token VARCHAR(100) COMMENT 'Webhook 驗證 Token',
  is_active BOOLEAN DEFAULT 1,
  token_expires_at DATETIME COMMENT 'Token 到期時間',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_business_account (business_account_id),
  INDEX idx_is_active (is_active)
);
```

### fb_friends (好友)

```sql
CREATE TABLE fb_friends (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  fb_uid VARCHAR(100) NOT NULL COMMENT 'Page-Scoped User ID',
  page_id VARCHAR(50) NOT NULL COMMENT '所屬粉專',
  fb_display_name VARCHAR(200) COMMENT '顯示名稱',
  fb_picture_url VARCHAR(500) COMMENT '頭像 URL',
  member_id BIGINT COMMENT '關聯會員 ID',
  is_active BOOLEAN DEFAULT 1,
  gpt_enabled BOOLEAN DEFAULT 1 COMMENT '是否啟用 GPT',
  first_interaction_at DATETIME COMMENT '首次互動時間',
  last_interaction_at DATETIME COMMENT '最近互動時間',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_page_fb_uid (page_id, fb_uid),
  INDEX idx_member_id (member_id),
  INDEX idx_last_interaction (last_interaction_at),
  FOREIGN KEY (member_id) REFERENCES members(id)
);
```

### conversation_messages (訊息記錄)

```sql
CREATE TABLE conversation_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL,
  channel_type ENUM('line', 'facebook', 'webchat') NOT NULL,
  channel_id VARCHAR(50) NOT NULL COMMENT 'page_id for FB',
  sender_id VARCHAR(100) NOT NULL COMMENT 'fb_uid for FB',
  mid VARCHAR(200) COMMENT 'Facebook Message ID',
  direction ENUM('incoming', 'outgoing') NOT NULL,
  content_type ENUM('text', 'image', 'video', 'audio', 'file', 'template') DEFAULT 'text',
  content TEXT,
  content_json JSON COMMENT '結構化內容',
  source VARCHAR(50) COMMENT 'gpt/keyword/always/welcome/broadcast',
  status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_conversation (conversation_id),
  INDEX idx_channel (channel_type, channel_id),
  INDEX idx_sender (sender_id),
  INDEX idx_created (created_at)
);
```

### auto_responses (自動回覆)

```sql
CREATE TABLE auto_responses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  channel_type ENUM('line', 'facebook') NOT NULL,
  channel_id VARCHAR(50) NOT NULL COMMENT 'page_id for FB',
  type ENUM('keyword', 'welcome', 'always') NOT NULL,
  name VARCHAR(100) COMMENT '回覆名稱',
  keywords JSON COMMENT '關鍵字陣列',
  content JSON NOT NULL COMMENT '回覆內容',
  is_active BOOLEAN DEFAULT 1,
  priority INT DEFAULT 0 COMMENT '優先順序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_channel (channel_type, channel_id),
  INDEX idx_type (type),
  INDEX idx_active_priority (is_active, priority DESC)
);
```

---

## 錯誤處理

### 錯誤回應格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### 錯誤代碼

| HTTP | Code | 說明 |
|------|------|------|
| 400 | INVALID_REQUEST | 請求格式錯誤 |
| 400 | VALIDATION_ERROR | 欄位驗證失敗 |
| 401 | UNAUTHORIZED | 未授權 |
| 403 | FORBIDDEN | 權限不足 |
| 404 | NOT_FOUND | 資源不存在 |
| 404 | CHANNEL_NOT_FOUND | 頻道不存在 |
| 404 | FRIEND_NOT_FOUND | 好友不存在 |
| 409 | DUPLICATE_ENTRY | 資料重複 |
| 422 | INVALID_TOKEN | Token 無效 |
| 429 | RATE_LIMITED | 請求過於頻繁 |
| 500 | INTERNAL_ERROR | 內部錯誤 |
| 502 | GRAPH_API_ERROR | Facebook API 錯誤 |

### Facebook Graph API 錯誤處理

```json
{
  "success": false,
  "error": {
    "code": "GRAPH_API_ERROR",
    "message": "Failed to send message",
    "details": {
      "fb_error_code": 190,
      "fb_error_subcode": 460,
      "fb_message": "Invalid OAuth access token"
    }
  }
}
```

---

## 環境配置

### 必要環境變數

```bash
# 服務配置
PORT=11204
GIN_MODE=release  # debug | release

# 資料庫
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lili_hotel
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=10

# Facebook/Meta
FB_APP_ID=your_app_id
FB_APP_SECRET=your_app_secret
FB_VERIFY_TOKEN=your_verify_token
META_API_VERSION=v24.0

# OpenAI GPT
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=2048

# 追蹤
TRACKING_BASE_URL=https://your-domain.com

# 日誌
LOG_LEVEL=info  # debug | info | warn | error
```

### 健康檢查端點

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": "24h30m15s",
  "db": "connected"
}
```

---

## 附錄

### Facebook 24 小時政策

| 情境 | messaging_type | tag | 說明 |
|------|----------------|-----|------|
| 用戶主動發送訊息後 24 小時內 | RESPONSE | - | 無限制回覆 |
| 24 小時外 | MESSAGE_TAG | CONFIRMED_EVENT_UPDATE | 已確認活動更新 |
| 24 小時外 | MESSAGE_TAG | POST_PURCHASE_UPDATE | 購買後更新 |
| 24 小時外 | MESSAGE_TAG | ACCOUNT_UPDATE | 帳戶更新 |

### 自動回覆優先順序

```
1. GPT 回覆（若用戶 gpt_enabled = true）
2. 關鍵字回覆（依 priority 排序）
3. 永久回覆（always）
4. 無回覆
```

### Page-Scoped User ID (PSID)

- 同一 Facebook 用戶在不同粉專會有不同的 PSID
- PSID 格式：純數字字串
- 需使用 `(page_id, fb_uid)` 組合來唯一識別用戶
