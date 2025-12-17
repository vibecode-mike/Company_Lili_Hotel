# Facebook 功能實現計畫 - 仿照 line_app 架構

## 專案概述

仿照 `/data2/lili_hotel/line_app/` 的架構，實現 Facebook Messenger 相關功能，整合至現有的 CRM 系統。

---

## 現況分析

### 已存在的 LINE 實現 (`line_app/`)

| 組件 | 狀態 | 說明 |
|------|------|------|
| Webhook Handler | ✅ 完整 | Flask app.py (~3,500 行) |
| 會員管理 | ✅ 完整 | `line_friends` 表 + `upsert_member()` |
| 訊息發送 | ✅ 完整 | Push/Reply 雙向 |
| 自動回覆 | ✅ 完整 | GPT + 關鍵字 + 永久回覆 |
| 廣播推送 | ✅ 完整 | Campaign + 追蹤 |
| 配額監控 | ✅ 完整 | `usage_monitor.py` |
| 多租戶 | ✅ 完整 | `line_channels` 表 |

### 已存在的 Facebook 相關程式

| 組件 | 狀態 | 位置 |
|------|------|------|
| Go 後端服務 | ✅ 獨立運行 | `meta_page_backend/` (port 11204) |
| 資料庫欄位 | ✅ 已有 | `members.fb_uid`, `fb_avatar`, `fb_name` |
| 前端編輯器 | ✅ 已有 | `FacebookMessageEditor.tsx` |
| 後端 Stub | ⚠️ 未實現 | `message_service.py` 有 `NotImplementedError` |
| FacebookFriend 模型 | ❌ 缺失 | 需建立 |
| 整合層 | ❌ 缺失 | Python ↔ Go 未串接 |

---

## LINE vs Facebook 差異對照

| 功能 | LINE | Facebook | 處理方式 |
|------|------|----------|----------|
| 已讀回執 | ✅ 可取得 | ❌ 無法取得 | FB 不追蹤已讀狀態 |
| 訊息視窗 | 7天 (Push) / 無限 (Reply) | 24小時政策 | 需記錄 `last_interaction_at` |
| Rich Menu | ✅ 支援 | ❌ 不支援 | 使用 Persistent Menu 替代 |
| Flex Message | ✅ 專屬格式 | ❌ Generic Template | 已有轉換器 |
| 好友API | ✅ Followers API | ⚠️ 有限 (需對話過) | 只能追蹤已互動用戶 |
| LIFF | ✅ 內嵌網頁 | ❌ 無 | 使用 WebView URL 替代 |
| Quota | ✅ 有配額API | ❌ 無直接API | 依 Rate Limit 處理 |

---

## 決策確認

| 決策項目 | 選擇 |
|----------|------|
| 服務架構 | **純 Go 實現** (合併 fb_app + meta_page_backend) |
| 多頁面支援 | **是，多租戶** (使用現有 `fb_channels` 表) |
| GPT 整合 | **完整整合** (與 LINE 相同) |
| 部署 Port | **11204** (擴充現有 Go 服務) |

### 多租戶架構設計

```
┌─────────────────────────────────────────────────────────┐
│                    FB 企業客戶 A                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 粉專 Page 1  │  │ 粉專 Page 2  │  │ 粉專 Page 3  │  │
│  │ (力麗酒店)   │  │ (力麗民宿)   │  │ (力麗餐廳)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    FB 企業客戶 B                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 粉專 Page 4  │  │ 粉專 Page 5  │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘

規則：
- 一個企業客戶可綁定多個粉專 (1:N)
- 一個粉專只能屬於一個企業客戶 (獨佔綁定)
```

### fb_channels 表結構 (確認/擴充)

```sql
-- 現有 fb_channels 表，需確認是否包含以下欄位
fb_channels:
  id                  BIGINT PRIMARY KEY
  page_id             VARCHAR(50) UNIQUE NOT NULL  -- Facebook Page ID (獨佔)
  page_name           VARCHAR(200)                 -- 粉專名稱
  page_access_token   TEXT NOT NULL                -- 長期 Token
  app_id              VARCHAR(50)                  -- FB App ID
  business_account_id VARCHAR(50)                  -- FB 企業帳號 ID (用於分組)
  webhook_verify_token VARCHAR(100)                -- Webhook 驗證 Token
  is_active           BOOLEAN DEFAULT 1
  token_expires_at    DATETIME                     -- Token 到期時間
  created_at          DATETIME
  updated_at          DATETIME

  INDEX idx_business_account (business_account_id)  -- 企業客戶查詢
  UNIQUE idx_page_id (page_id)                      -- 確保粉專獨佔
```

### fb_friends 表結構 (已存在)

```sql
-- 現有 fb_friends 表，需確認欄位結構
-- 確認是否包含 page_id 欄位 (多粉專支援必需)
fb_friends:
  id                   -- PK
  fb_uid               -- Facebook User ID (Page-Scoped)
  page_id              -- 所屬粉專 (多粉專必需，若無需新增)
  fb_display_name      -- 顯示名稱
  fb_picture_url       -- 頭像 URL
  member_id            -- FK → members
  is_active            -- 是否有效
  first_interaction_at -- 首次互動時間
  last_interaction_at  -- 最近互動時間
  ...

  -- 若需支援多粉專，確保有：
  UNIQUE (page_id, fb_uid)  -- 同一粉專下用戶唯一
```

**重要：** Facebook User ID (fb_uid) 是 Page-Scoped，同一用戶在不同粉專會有不同 ID

---

## 實現架構

### 純 Go 統一架構 (合併 fb_app + meta_page_backend)

```
                    ┌─────────────────┐
                    │   Nginx/LB      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌─────────────────────────────────────────┐
│   line_app    │   │         meta_page_backend               │
│  Flask:3001   │   │            Go/Gin:11204                 │
│               │   │                                         │
│ - Webhook     │   │  ┌─────────────┐  ┌─────────────┐      │
│ - Auto-reply  │   │  │  Webhook    │  │  Auto-Reply │      │
│ - GPT         │   │  │  Handler    │  │  (GPT+關鍵字)│      │
│ - Push        │   │  └─────────────┘  └─────────────┘      │
└───────────────┘   │  ┌─────────────┐  ┌─────────────┐      │
        │           │  │  Message    │  │  Member     │      │
        │           │  │  Sender     │  │  Sync       │      │
        │           │  └─────────────┘  └─────────────┘      │
        │           │  ┌─────────────┐  ┌─────────────┐      │
        │           │  │  Graph API  │  │  Multi-Page │      │
        │           │  │  Client     │  │  Router     │      │
        │           │  └─────────────┘  └─────────────┘      │
        │           └─────────────────────────────────────────┘
        │                              │
        └──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   MySQL 8.0    │
              │  (lili_hotel)  │
              │                │
              │ - fb_channels  │
              │ - fb_friends   │
              │ - members      │
              │ - conversations│
              └────────────────┘
```

### 優點
- **統一技術棧**: 全 Go 實現，無 Python ↔ Go 通訊開銷
- **高效能**: Go 原生高併發，適合 Webhook 處理
- **易部署**: 單一服務，無多服務協調問題
- **易維護**: 程式碼集中管理

### 目錄結構 (擴充 meta_page_backend)

```
lili_hotel/
├── meta_page_backend/               # 擴充為完整 FB 處理服務 (Port 11204)
│   ├── main.go                      # 服務入口
│   ├── config/
│   │   └── config.go                # 配置管理 (含 OpenAI, DB)
│   │
│   ├── handlers/
│   │   ├── webhook_handler.go       # Webhook 接收 + 多粉專路由
│   │   ├── message_handler.go       # 訊息發送 (text, template)
│   │   ├── auto_response_handler.go # 新增：自動回覆處理
│   │   ├── user_handler.go          # 用戶 Profile 取得
│   │   └── channel_handler.go       # 新增：頻道管理 CRUD
│   │
│   ├── services/
│   │   ├── gpt_service.go           # 新增：OpenAI GPT 整合
│   │   ├── keyword_service.go       # 新增：關鍵字匹配
│   │   ├── member_service.go        # 新增：會員同步
│   │   └── graph_api_service.go     # Graph API 封裝
│   │
│   ├── models/
│   │   ├── fb_channel.go            # 對應 fb_channels 表
│   │   ├── fb_friend.go             # 對應 fb_friends 表
│   │   ├── member.go                # 對應 members 表
│   │   ├── conversation.go          # 對應 conversation_messages 表
│   │   └── auto_response.go         # 對應 auto_responses 表
│   │
│   ├── repositories/
│   │   ├── channel_repo.go          # 頻道資料存取
│   │   ├── friend_repo.go           # FB 好友資料存取
│   │   ├── member_repo.go           # 會員資料存取
│   │   └── message_repo.go          # 訊息記錄存取
│   │
│   ├── routers/
│   │   └── router.go                # 路由定義
│   │
│   └── utils/
│       └── helpers.go               # 工具函數
│
├── backend/                         # FastAPI 後端 (保持不變)
│   └── app/models/
│       ├── fb_friend.py             # SQLAlchemy 模型 (供後台 API 用)
│       └── fb_channel.py
│
└── docs/
    └── facebook_token_setup.md      # Token 申請流程文件
```

---

## 詳細實現計畫

### 5.1 一對一訊息紀錄 API

**目標**: 抓取聊天紀錄、最近聊天時間、首次對話時間

**實現步驟**:

1. **建立 `facebook_friends` 表** (類似 `line_friends`)
   ```sql
   CREATE TABLE facebook_friends (
     id BIGINT PRIMARY KEY AUTO_INCREMENT,
     fb_uid VARCHAR(100) UNIQUE NOT NULL,
     fb_display_name VARCHAR(200),
     fb_picture_url VARCHAR(500),
     member_id BIGINT REFERENCES members(id),
     is_active BOOLEAN DEFAULT 1,
     first_interaction_at DATETIME,
     last_interaction_at DATETIME,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
     INDEX idx_member_id (member_id),
     INDEX idx_last_interaction (last_interaction_at)
   );
   ```

2. **Webhook 處理 - 接收訊息 (純 Go 實現)**
   ```go
   // meta_page_backend/handlers/webhook_handler.go
   func HandleWebhook(c *gin.Context) {
       var payload WebhookPayload
       if err := c.BindJSON(&payload); err != nil {
           c.Status(400)
           return
       }

       // 遍歷所有 entry (可能同時收到多個粉專的事件)
       for _, entry := range payload.Entry {
           pageID := entry.ID  // 收到訊息的粉專 ID

           // 1. 查詢該粉專配置
           channel, err := repositories.GetChannelByPageID(pageID)
           if err != nil || !channel.IsActive {
               continue
           }

           // 2. 處理每個 messaging 事件
           for _, msg := range entry.Messaging {
               senderID := msg.Sender.ID

               // 3. 確保 fb_friends 記錄存在
               repositories.UpsertFbFriend(pageID, senderID)

               // 4. 存入 conversation_messages
               repositories.SaveMessage(pageID, senderID, msg.Message.Text, "incoming")

               // 5. 觸發自動回覆
               services.ProcessAutoResponse(channel, senderID, msg.Message.Text)
           }
       }

       c.Status(200)  // 必須快速回應 200，避免 Facebook 重試
   }
   ```

3. **API 端點** (多粉專支援)
   - `GET /api/v1/facebook/pages/{page_id}/conversations` - 列出該粉專所有對話
   - `GET /api/v1/facebook/pages/{page_id}/conversations/{fb_uid}` - 取得特定對話記錄
   - `GET /api/v1/facebook/pages/{page_id}/friends` - 列出該粉專的好友
   - `GET /api/v1/facebook/business/{business_account_id}/pages` - 列出企業客戶的所有粉專

**差異處理**:
- Facebook 無法主動獲取所有好友列表，只能在用戶發送訊息時記錄
- 不追蹤「已讀」狀態

---

### 5.2 會員資料 API

**目標**: 抓取會員資料（姓名、頭像、FB ID）

**實現步驟 (純 Go)**:

1. **呼叫 Graph API 取得 Profile**
   ```go
   // meta_page_backend/services/graph_api_service.go
   func GetUserProfile(pageAccessToken, userID string) (*UserProfile, error) {
       url := fmt.Sprintf("https://graph.facebook.com/%s/%s", config.APIVersion, userID)

       resp, err := http.Get(url + "?fields=first_name,last_name,profile_pic&access_token=" + pageAccessToken)
       if err != nil {
           return nil, err
       }
       defer resp.Body.Close()

       var profile UserProfile
       json.NewDecoder(resp.Body).Decode(&profile)
       return &profile, nil
   }
   ```

2. **同步至 members + fb_friends 表**
   ```go
   // meta_page_backend/services/member_service.go
   func SyncFbMember(pageID, fbUID string) error {
       // 1. 取得頻道 Token
       channel, _ := repositories.GetChannelByPageID(pageID)

       // 2. 呼叫 Graph API
       profile, _ := GetUserProfile(channel.PageAccessToken, fbUID)

       // 3. 更新 fb_friends
       repositories.UpdateFbFriend(pageID, fbUID, profile.FirstName+" "+profile.LastName, profile.ProfilePic)

       // 4. 更新 members (若已綁定)
       repositories.UpdateMemberFbInfo(fbUID, profile)

       return nil
   }
   ```

3. **觸發時機**:
   - Webhook 收到訊息時自動同步
   - 管理後台手動同步 API

**差異處理**:
- Facebook profile_pic 有過期時間，需定期更新
- 姓名分為 first_name + last_name，組合後存入

---

### 5.3 主動發群訊息 Push API

**目標**: 發送廣播訊息，可追蹤點擊紀錄和互動標籤

**實現步驟 (純 Go)**:

1. **發送訊息 (遵循 24 小時政策)**
   ```go
   // meta_page_backend/services/graph_api_service.go
   func SendMessage(pageAccessToken, recipientID string, message interface{}, messagingType string, tag string) error {
       url := fmt.Sprintf("https://graph.facebook.com/%s/me/messages?access_token=%s",
           config.APIVersion, pageAccessToken)

       payload := map[string]interface{}{
           "recipient":      map[string]string{"id": recipientID},
           "message":        message,
           "messaging_type": messagingType,
       }
       if tag != "" {
           payload["tag"] = tag
       }

       jsonData, _ := json.Marshal(payload)
       resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
       // 處理回應...
       return err
   }
   ```

2. **Message Tag 策略** (突破 24 小時限制)
   - `CONFIRMED_EVENT_UPDATE`: 已確認活動更新
   - `POST_PURCHASE_UPDATE`: 購買後更新
   - `ACCOUNT_UPDATE`: 帳戶更新

3. **廣播流程**
   ```go
   // meta_page_backend/handlers/message_handler.go
   func BroadcastToFacebook(c *gin.Context) {
       var req BroadcastRequest
       c.BindJSON(&req)

       channel, _ := repositories.GetChannelByPageID(req.PageID)
       friends, _ := repositories.GetFbFriendsByPageID(req.PageID, req.TargetTags)

       for _, friend := range friends {
           // 檢查 24 小時視窗
           messagingType := "RESPONSE"
           tag := ""
           if time.Since(friend.LastInteractionAt) > 24*time.Hour {
               messagingType = "MESSAGE_TAG"
               tag = "CONFIRMED_EVENT_UPDATE"
           }

           err := SendMessage(channel.PageAccessToken, friend.FbUID, req.Message, messagingType, tag)
           repositories.SaveDeliveryStatus(req.MessageID, friend.FbUID, err == nil)
       }

       c.JSON(200, gin.H{"ok": true})
   }
   ```

4. **點擊追蹤**
   ```go
   // 在按鈕 URL 加入追蹤參數
   func AddTrackingParams(url, messageID, fbUID, buttonID string) string {
       return fmt.Sprintf("%s/__fb_click?mid=%s&uid=%s&btn=%s",
           config.TrackingBase, messageID, fbUID, buttonID)
   }
   ```

5. **互動標籤記錄 (Postback 處理)**
   ```go
   // meta_page_backend/handlers/webhook_handler.go
   func handlePostback(pageID, senderID string, postback Postback) {
       payload := postback.Payload
       if strings.HasPrefix(payload, "tag:") {
           tagName := payload[4:]
           repositories.AddInteractionTag(pageID, senderID, tagName)
       }
   }
   ```

**差異處理**:
- 無法追蹤「已讀」，只能追蹤「送達」和「點擊」
- 24 小時外需使用 Message Tag，有使用限制

---

### 5.4 觸發自動回覆 Reply API

**目標**: 關鍵字觸發、歡迎訊息、點擊追蹤

**實現步驟 (純 Go)**:

1. **關鍵字匹配**
   ```go
   // meta_page_backend/services/keyword_service.go
   func CheckKeywordResponse(pageID, text string) (*AutoResponse, bool) {
       // 查詢該粉專的關鍵字設定
       autoResponses, _ := repositories.GetAutoResponsesByPageID(pageID, "keyword")

       for _, ar := range autoResponses {
           for _, keyword := range ar.Keywords {
               if strings.Contains(text, keyword) {
                   return &ar, true
               }
           }
       }
       return nil, false
   }
   ```

2. **歡迎訊息 (Get Started Button)**
   ```go
   // meta_page_backend/handlers/webhook_handler.go
   func handleGetStarted(channel *FbChannel, senderID string) {
       // Get Started 等同 LINE 的 Follow 事件
       welcome, _ := repositories.GetWelcomeResponse(channel.PageID)
       if welcome != nil {
           SendMessage(channel.PageAccessToken, senderID, welcome.Content, "RESPONSE", "")
           repositories.SaveMessage(channel.PageID, senderID, welcome.Content, "outgoing", "welcome")
       }
   }
   ```

3. **設定 Persistent Menu + Get Started**
   ```go
   // meta_page_backend/services/graph_api_service.go
   func SetupMessengerProfile(pageAccessToken string, menu []MenuItem) error {
       url := fmt.Sprintf("https://graph.facebook.com/%s/me/messenger_profile?access_token=%s",
           config.APIVersion, pageAccessToken)

       payload := map[string]interface{}{
           "get_started": map[string]string{"payload": "GET_STARTED"},
           "persistent_menu": []map[string]interface{}{
               {
                   "locale": "default",
                   "call_to_actions": menu,
               },
           },
       }

       jsonData, _ := json.Marshal(payload)
       _, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
       return err
   }
   ```

4. **GPT 自動回覆**
   ```go
   // meta_page_backend/services/gpt_service.go
   func AskGPT(pageID, senderID, userMessage string) (string, error) {
       // 1. 檢查該用戶是否啟用 GPT
       friend, _ := repositories.GetFbFriend(pageID, senderID)
       if !friend.GPTEnabled {
           return "", nil
       }

       // 2. 取得對話歷史 (最近 5 輪)
       history, _ := repositories.GetConversationHistory(pageID, senderID, 5)

       // 3. 建立 OpenAI 請求
       messages := buildOpenAIMessages(history, userMessage)

       // 4. 呼叫 OpenAI API
       client := openai.NewClient(config.OpenAIAPIKey)
       resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
           Model:    config.OpenAIModel,
           Messages: messages,
       })

       if err != nil {
           return "", err
       }

       return resp.Choices[0].Message.Content, nil
   }

   // 自動回覆處理流程
   func ProcessAutoResponse(channel *FbChannel, senderID, text string) {
       // 優先順序: GPT → 關鍵字 → 永久回覆
       var response string
       var source string

       // 1. 嘗試 GPT
       if gptResp, err := AskGPT(channel.PageID, senderID, text); err == nil && gptResp != "" {
           response = gptResp
           source = "gpt"
       } else if kwResp, found := CheckKeywordResponse(channel.PageID, text); found {
           // 2. 嘗試關鍵字
           response = kwResp.Content
           source = "keyword"
       } else if alwaysResp, _ := repositories.GetAlwaysResponse(channel.PageID); alwaysResp != nil {
           // 3. 永久回覆
           response = alwaysResp.Content
           source = "always"
       }

       if response != "" {
           SendMessage(channel.PageAccessToken, senderID, map[string]string{"text": response}, "RESPONSE", "")
           repositories.SaveMessage(channel.PageID, senderID, response, "outgoing", source)
       }
   }
   ```

**差異處理**:
- Facebook 無 Rich Menu，使用 Persistent Menu 替代
- Get Started 按鈕等同 LINE 的 Follow 事件

---

### 5.5 基本設定 Setting API

**目標**: 前台 Token、Page ID 等設定

**實現步驟**:

1. **使用現有 `fb_channels` 表** (已存在於資料庫)
   - 確認欄位是否包含：`page_id`, `page_access_token`, `is_active`
   - 如有缺少欄位再用 migration 補充

2. **API 端點**
   ```
   POST /api/v1/facebook/channels          # 新增 FB 頻道
   GET  /api/v1/facebook/channels          # 列出所有頻道
   PUT  /api/v1/facebook/channels/{id}     # 更新頻道設定
   DELETE /api/v1/facebook/channels/{id}   # 刪除頻道
   POST /api/v1/facebook/channels/{id}/verify  # 驗證 Token 有效性
   ```

3. **Token 驗證**
   ```go
   // meta_page_backend/services/graph_api_service.go
   func VerifyPageToken(pageID, accessToken string) bool {
       url := fmt.Sprintf("https://graph.facebook.com/%s/me?access_token=%s", config.APIVersion, accessToken)
       resp, err := http.Get(url)
       if err != nil {
           return false
       }
       defer resp.Body.Close()

       if resp.StatusCode != 200 {
           return false
       }

       var data map[string]interface{}
       json.NewDecoder(resp.Body).Decode(&data)
       return data["id"] == pageID
   }
   ```

---

### 5.6 Setting FB Token 流程

**目標**: Meta Business Developer 從 Dev 到驗證商用申請

**說明文件 (非程式實現)**:

#### 申請流程:

1. **Meta for Developers 設定**
   - 建立 Facebook App (Business 類型)
   - 新增 Messenger 產品
   - 設定 Webhook URL: `https://your-domain.com/api/v1/fb/webhook`
   - 訂閱事件: `messages`, `messaging_postbacks`, `messaging_optins`

2. **頁面連結**
   - 從 App Settings → Messenger → 連結粉絲專頁
   - 授權權限: `pages_messaging`, `pages_read_engagement`

3. **取得 Page Access Token**
   - 方式 A: Graph API Explorer 手動產生 (開發用)
   - 方式 B: OAuth 流程自動換取 (生產用)

   ```
   OAuth URL:
   https://www.facebook.com/v24.0/dialog/oauth
   ?client_id={app_id}
   &redirect_uri={redirect_uri}
   &scope=pages_messaging,pages_read_engagement
   ```

4. **Long-Lived Token 換取**
   ```
   GET https://graph.facebook.com/{api-version}/oauth/access_token
   ?grant_type=fb_exchange_token
   &client_id={app-id}
   &client_secret={app-secret}
   &fb_exchange_token={short-lived-token}
   ```

5. **商業驗證 (Business Verification)**
   - 提交營業登記證明
   - 等待 Meta 審核 (1-3 個工作天)
   - 通過後可解除 API 限制

6. **進階權限申請** (可選)
   - `pages_messaging_subscriptions`: 訂閱式訊息
   - 需提交使用情境說明

---

## Go 服務完整擴充計畫 (meta_page_backend)

### 現有端點 (已實現)

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/v1/meta_hook` | GET | Webhook 驗證 |
| `/api/v1/meta_hook` | POST | 接收 Webhook 事件 |
| `/api/v1/meta_page/feed` | GET | 取得粉專貼文 |
| `/api/v1/meta_page/comment` | GET/POST/DELETE | 留言管理 |
| `/api/v1/meta_page/message` | POST | 發送訊息 |
| `/api/v1/meta_user/profile` | GET | 取得用戶資料 |

### 需新增端點 (純 Go 實現)

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/v1/meta_page/message/template` | POST | 發送 Template 訊息 (carousel) |
| `/api/v1/meta_page/message/broadcast` | POST | 廣播訊息至多用戶 |
| `/api/v1/meta_page/channels` | CRUD | 多租戶頻道管理 |
| `/api/v1/meta_page/channels/{page_id}/friends` | GET | 列出粉專好友 |
| `/api/v1/meta_page/channels/{page_id}/conversations` | GET | 列出對話 |
| `/api/v1/meta_page/messenger_profile` | POST | 設定 Persistent Menu |
| `/api/v1/meta_page/auto_responses` | CRUD | 自動回覆設定 |
| `/__fb_click` | GET | 點擊追蹤 |

### Go 服務修改清單

```go
// 1. 多租戶支援 - 對應現有 fb_channels 表
// meta_page_backend/models/fb_channel.go
type FbChannel struct {
    ID                 int64  `json:"id" gorm:"primaryKey"`
    PageID             string `json:"page_id" gorm:"column:page_id;uniqueIndex"`
    PageName           string `json:"page_name" gorm:"column:page_name"`
    PageAccessToken    string `json:"page_access_token" gorm:"column:page_access_token"`
    AppID              string `json:"app_id,omitempty" gorm:"column:app_id"`
    BusinessAccountID  string `json:"business_account_id" gorm:"column:business_account_id;index"`
    WebhookVerifyToken string `json:"webhook_verify_token,omitempty"`
    IsActive           bool   `json:"is_active" gorm:"column:is_active;default:true"`
    TokenExpiresAt     *time.Time `json:"token_expires_at,omitempty"`
}

// GetChannelByPageID 根據 Page ID 查詢頻道配置
func GetChannelByPageID(pageID string) (*FbChannel, error) {
    // 從 DB 查詢，用於 Webhook 路由
}

// 2. 修改 webhook_handler.go - 多粉專路由
func handleWebhook(c *gin.Context) {
    // 1. 解析 Webhook 事件
    var payload WebhookPayload
    c.BindJSON(&payload)

    // 2. 從事件中取得 Page ID (recipient.id)
    for _, entry := range payload.Entry {
        pageID := entry.ID  // 這是收到訊息的粉專 ID

        // 3. 查詢該粉專的配置
        channel, err := GetChannelByPageID(pageID)
        if err != nil || !channel.IsActive {
            continue  // 跳過未註冊或停用的粉專
        }

        // 4. 處理訊息並觸發自動回覆
        processMessaging(channel, entry.Messaging)
    }

    // 5. 立即返回 200 OK 給 Facebook (避免重試)
    c.Status(200)
}

// 3. 新增 template 訊息發送
// POST /api/v1/meta_page/message/template
func sendTemplateMessage(c *gin.Context) {
    // 支援 generic template (carousel)
    // 支援 button template
}

// 4. 新增 Messenger Profile 設定
// POST /api/v1/meta_page/messenger_profile
func setMessengerProfile(c *gin.Context) {
    // 設定 Get Started button
    // 設定 Persistent Menu
}
```

### Go 依賴套件

```go
// go.mod 新增依賴
require (
    github.com/gin-gonic/gin v1.9.1
    github.com/sashabaranov/go-openai v1.17.9  // OpenAI GPT
    gorm.io/gorm v1.25.5                       // ORM
    gorm.io/driver/mysql v1.5.2                // MySQL 驅動
    github.com/sirupsen/logrus v1.9.3          // 日誌
)
```

---

## 實現優先順序 (純 Go)

### Phase 1: 基礎設施 (2 天)

| 順序 | 項目 | 檔案 | 時程 |
|------|------|------|------|
| 1.1 | 資料庫確認/遷移 | 確認 `fb_channels` + `fb_friends` 表結構 | 0.5天 |
| 1.2 | Go Models | `models/fb_channel.go`, `fb_friend.go`, `member.go` | 0.5天 |
| 1.3 | Go Repositories | `repositories/*.go` (CRUD 操作) | 0.5天 |
| 1.4 | 配置管理 | `config/config.go` (含 OpenAI, DB 連線) | 0.5天 |

### Phase 2: 核心功能 (4 天)

| 順序 | 項目 | 說明 | 時程 |
|------|------|------|------|
| 2.1 | Webhook 增強 | 多粉專路由 + 事件分發 | 1天 |
| 2.2 | 訊息紀錄 | 存入 conversation_messages | 0.5天 |
| 2.3 | 會員同步 | Profile API + fb_friends 更新 | 0.5天 |
| 2.4 | GPT 整合 | `services/gpt_service.go` (OpenAI API) | 1天 |
| 2.5 | 關鍵字回覆 | `services/keyword_service.go` | 0.5天 |
| 2.6 | 歡迎訊息 | Get Started 處理 | 0.5天 |

### Phase 3: 廣播與管理 (2 天)

| 順序 | 項目 | 說明 | 時程 |
|------|------|------|------|
| 3.1 | Template 訊息 | 發送 Carousel/Button 訊息 | 0.5天 |
| 3.2 | 廣播 API | 24小時政策 + Message Tag | 0.5天 |
| 3.3 | 點擊追蹤 | `/__fb_click` 端點 | 0.5天 |
| 3.4 | 頻道管理 API | fb_channels CRUD | 0.5天 |

### Phase 4: 整合與測試 (1 天)

| 順序 | 項目 | 說明 | 時程 |
|------|------|------|------|
| 4.1 | FastAPI 整合 | 後端 message_service 呼叫 Go API | 0.5天 |
| 4.2 | 測試 | 功能測試 + 文件 | 0.5天 |

**總計: 約 9 個工作天**

---

## 關鍵檔案清單

### Go 服務擴充 (meta_page_backend/)

| 檔案 | 說明 | 類型 |
|------|------|------|
| **config/** | | |
| `config/config.go` | 配置管理 (OpenAI, DB, Meta API) | 新增 |
| **models/** | | |
| `models/fb_channel.go` | FbChannel 模型 | 新增 |
| `models/fb_friend.go` | FbFriend 模型 | 新增 |
| `models/member.go` | Member 模型 | 新增 |
| `models/conversation.go` | Conversation 模型 | 新增 |
| `models/auto_response.go` | AutoResponse 模型 | 新增 |
| **repositories/** | | |
| `repositories/channel_repo.go` | 頻道 CRUD | 新增 |
| `repositories/friend_repo.go` | FB 好友 CRUD | 新增 |
| `repositories/member_repo.go` | 會員 CRUD | 新增 |
| `repositories/message_repo.go` | 訊息記錄 | 新增 |
| **services/** | | |
| `services/graph_api_service.go` | Meta Graph API 封裝 | 新增 |
| `services/gpt_service.go` | OpenAI GPT 整合 | 新增 |
| `services/keyword_service.go` | 關鍵字匹配 | 新增 |
| `services/member_service.go` | 會員同步 | 新增 |
| **handlers/** | | |
| `handlers/webhook_handler.go` | Webhook 處理 (增強) | 修改 |
| `handlers/message_handler.go` | 訊息發送 (增強) | 修改 |
| `handlers/auto_response_handler.go` | 自動回覆處理 | 新增 |
| `handlers/channel_handler.go` | 頻道管理 CRUD | 新增 |
| `handlers/tracking_handler.go` | 點擊追蹤 | 新增 |
| **routers/** | | |
| `routers/router.go` | 註冊新路由 | 修改 |

### 資料庫遷移 (backend/migrations/)

| 檔案 | 說明 |
|------|------|
| ~~建立新表~~ | **已存在** `fb_channels` 和 `fb_friends` 表 |
| `xxx_add_fb_page_id_column.py` | (若需要) 為 `fb_friends` 新增 `page_id` 欄位 |
| `xxx_add_business_account_id.py` | (若需要) 為 `fb_channels` 新增 `business_account_id` 欄位 |

### FastAPI 後端整合 (backend/app/)

| 檔案 | 說明 | 類型 |
|------|------|------|
| `models/fb_friend.py` | FbFriend SQLAlchemy 模型 | 新增/確認 |
| `models/fb_channel.py` | FbChannel SQLAlchemy 模型 | 新增/確認 |
| `services/message_service.py` | FB 發送改呼叫 Go API | 修改 |

### 文件

| 檔案 | 說明 |
|------|------|
| `docs/facebook_token_setup.md` | Token 申請流程 |
| `meta_page_backend/README.md` | Go 服務部署說明 |

---

## 環境變數 (meta_page_backend/.env)

```bash
# Facebook/Meta 配置
FB_APP_ID=your_app_id
FB_APP_SECRET=your_app_secret
FB_VERIFY_TOKEN=your_verify_token
META_API_VERSION=v24.0

# 服務配置
PORT=11204
GIN_MODE=release

# 資料庫配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=xxx
DB_NAME=lili_hotel

# OpenAI GPT 配置
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=2048

# 追蹤配置
TRACKING_BASE_URL=https://your-domain.com
```

---

## 規格對照表 (純 Go 實現)

| 規格 | 實現位置 (meta_page_backend/) | 狀態 |
|------|-------------------------------|------|
| 5.1 一對一訊息紀錄 | `handlers/webhook_handler.go` + `repositories/message_repo.go` | 待實現 |
| 5.2 會員資料 API | `services/graph_api_service.go` + `services/member_service.go` | 待實現 |
| 5.3 主動發群訊息 | `handlers/message_handler.go` (broadcast + template) | 待實現 |
| 5.4 觸發自動回覆 | `services/gpt_service.go` + `services/keyword_service.go` | 待實現 |
| 5.5 基本設定 API | `handlers/channel_handler.go` + 現有 `fb_channels` 表 | 待實現 |
| 5.6 Token 流程 | `docs/facebook_token_setup.md` | 待撰寫 |

---

## 架構總覽

```
┌──────────────────────────────────────────────────────────────┐
│                    meta_page_backend (Go)                    │
│                         Port: 11204                          │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  Webhook   │  │ Auto-Reply │  │  Broadcast │             │
│  │  Handler   │─→│  GPT/KW    │  │   Handler  │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│         │              │              │                      │
│         ▼              ▼              ▼                      │
│  ┌─────────────────────────────────────────────┐            │
│  │              Services Layer                  │            │
│  │  graph_api | gpt | keyword | member          │            │
│  └─────────────────────────────────────────────┘            │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────┐            │
│  │            Repositories Layer                │            │
│  │  channel | friend | member | message         │            │
│  └─────────────────────────────────────────────┘            │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────┐            │
│  │              Models (GORM)                   │            │
│  │  fb_channel | fb_friend | member | ...       │            │
│  └─────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌────────────────────┐
              │     MySQL 8.0     │
              │   (lili_hotel)    │
              │                   │
              │ - fb_channels     │
              │ - fb_friends      │
              │ - members         │
              │ - conversations   │
              │ - auto_responses  │
              └────────────────────┘
```
