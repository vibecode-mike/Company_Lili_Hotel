# Event Storming: 力麗飯店 LINE OA CRM 系統

## Actors

- **管理員** [人]: 後台管理員，負責系統設定、頻道管理、檔案上傳、消費紀錄、PMS 整合
- **超級管理員** [人]: 擁有 admin.manage 權限，管理角色與權限配置
- **系統商管理員** [人]: 系統供應商人員，管理產業、FAQ 模組授權、Token 額度
- **行銷人員** [人]: 負責推播訊息、模板管理、活動管理、互動追蹤
- **客服人員** [人]: 負責聊天室即時回覆、查看訊息歷史
- **使用者** [人]: 泛指已登入的後台人員，可執行會員搜尋、標籤管理、自動回應設定、FAQ 規則管理
- **系統** [系統]: 自動化處理，包含 LINE webhook 處理、自動貼標、卡控檢查、排程任務
- **LINE App** [系統]: Flask 服務，接收 LINE webhook 並通知 Backend
- **會員** [人]: 終端使用者，透過 LINE/Facebook/Webchat 與聊天機器人互動

## Aggregates

### Member
> 會員基本資料，整合多渠道身份（LINE/Facebook/Webchat）

| 屬性 | 說明 |
|------|------|
| id | 會員 ID |
| name | 姓名 |
| email | Email |
| phone | 電話 |
| gender | 性別 |
| birthday | 生日 |
| id_number | 身分證字號（遮蔽顯示） |
| passport_number | 護照號碼 |
| residence | 居住地 |
| line_uid | LINE UID |
| line_display_name | LINE 顯示名稱 |
| line_avatar | LINE 頭貼 URL |
| fb_customer_id | Facebook 客戶 ID |
| webchat_uid | Webchat UID |
| join_source | 加入來源（LINE/Facebook/Webchat/CRM/PMS） |
| gpt_enabled | 是否啟用 AI 回覆 |
| receive_notification | 是否接收通知 |
| internal_note | 內部備註 |
| last_interaction_at | 最後互動時間 |
| created_at | 建立時間 |

### LineFriend
> LINE 好友追蹤紀錄，獨立於 Member

| 屬性 | 說明 |
|------|------|
| line_uid | LINE UID（唯一） |
| display_name | 顯示名稱 |
| picture_url | 頭貼 URL |
| member_id | 關聯會員 ID |
| is_following | 是否追蹤中 |
| followed_at | 追蹤時間 |
| unfollowed_at | 取消追蹤時間 |
| last_interaction_at | 最後互動時間 |

### Conversation
> 對話串，跨渠道整合

| 屬性 | 說明 |
|------|------|
| id | 對話 ID |
| member_id | 會員 ID |
| channel_type | 渠道類型（line/facebook/webchat） |
| last_message_at | 最後訊息時間 |
| is_unanswered | 是否待回覆 |

### ConversationMessage
> 對話訊息記錄

| 屬性 | 說明 |
|------|------|
| id | 訊息 ID |
| conversation_id | 對話 ID |
| role | 角色（user/assistant/agent） |
| direction | 方向（incoming/outgoing） |
| message_type | 訊息類型（text/image/template） |
| content | 訊息內容 |
| message_source | 來源（manual/gpt/keyword/welcome/always/broadcast） |
| is_read | 是否已讀 |
| created_at | 建立時間 |

### MessageTemplate
> 訊息模板（文字、圖片、輪播卡片、Flex Message）

| 屬性 | 說明 |
|------|------|
| id | 模板 ID |
| template_type | 類型（text/image/carousel/flex） |
| name | 模板名稱 |
| content | 文字內容 |
| buttons | 按鈕設定（JSON） |
| notification_message | 推播通知文字 |
| is_in_library | 是否在模板庫中 |
| usage_count | 使用次數 |
| source_template_id | 來源模板 ID（複製時） |
| flex_message_json | Flex Message JSON |

### Message
> 群發訊息（推播）

| 屬性 | 說明 |
|------|------|
| id | 訊息 ID |
| template_id | 模板 ID |
| message_title | 訊息標題 |
| target_type | 受眾類型（all_friends/filtered） |
| target_filter | 篩選條件（JSON） |
| send_status | 發送狀態（draft/scheduled/sending/sent/failed） |
| platform | 渠道（LINE/Facebook） |
| channel_id | 頻道 ID |
| campaign_id | 活動 ID |
| scheduled_at | 排程時間 |
| send_time | 實際發送時間 |
| send_count | 發送人數 |
| open_count | 開啟人數 |
| click_count | 點擊人數 |
| estimated_send_count | 預估發送人數 |

### Campaign
> 行銷活動

| 屬性 | 說明 |
|------|------|
| id | 活動 ID |
| campaign_name | 活動名稱 |
| campaign_tag | 活動標籤 |
| campaign_date | 活動日期 |
| start_date | 開始日期 |
| end_date | 結束日期 |

### Tag
> 會員標籤

| 屬性 | 說明 |
|------|------|
| id | 標籤 ID |
| tag_name | 標籤名稱（最多 20 字） |
| tag_source | 來源（Manual/CRM/PMS/Survey/AI） |
| tag_type | 類型（member/interaction） |
| trigger_count | 觸發次數 |
| trigger_member_count | 觸發會員數 |
| last_triggered_at | 最後觸發時間 |

### AutoResponse
> 自動回應規則

| 屬性 | 說明 |
|------|------|
| id | 規則 ID |
| name | 規則名稱 |
| trigger_type | 觸發類型（welcome/keyword/scheduled） |
| is_enabled | 是否啟用 |
| keywords | 關鍵字清單（JSON） |
| messages | 回應訊息清單（JSON） |
| date_range | 有效日期範圍 |
| trigger_time | 觸發時段 |
| trigger_count | 觸發次數 |

### LineChannel
> LINE 頻道設定

| 屬性 | 說明 |
|------|------|
| id | 頻道 ID |
| channel_id | LINE Channel ID |
| channel_access_token | Channel Access Token |
| channel_secret | Channel Secret |
| login_channel_id | Login Channel ID |
| login_channel_secret | Login Channel Secret |
| channel_name | 頻道名稱 |
| basic_id | LINE Basic ID |
| is_active | 是否啟用 |

### FacebookChannel
> Facebook 頻道設定

| 屬性 | 說明 |
|------|------|
| id | 頻道 ID |
| page_id | Facebook Page ID |
| app_id | Facebook App ID |
| channel_name | 頻道名稱 |
| is_active | 是否啟用 |
| connection_status | 連線狀態（connected/disconnected/expired） |
| last_verified_at | 最後驗證時間 |

### PMSIntegration
> PMS 住宿管理系統整合紀錄

| 屬性 | 說明 |
|------|------|
| id | 紀錄 ID |
| id_number | 身分證字號 |
| phone | 電話 |
| member_id | 配對的會員 ID |
| match_status | 配對狀態（pending/matched/unmatched） |
| stay_records | 住宿紀錄（JSON） |

### ConsumptionRecord
> 消費紀錄

| 屬性 | 說明 |
|------|------|
| id | 紀錄 ID |
| member_id | 會員 ID |
| amount | 金額 |
| room_type | 房型 |
| stay_date | 入住日期 |
| check_in_date | 入住日期 |
| check_out_date | 退房日期 |

### InteractionLog
> 互動追蹤紀錄

| 屬性 | 說明 |
|------|------|
| id | 紀錄 ID |
| line_uid | LINE UID |
| campaign_id | 活動 ID |
| interaction_type | 互動類型（click） |
| template_id | 模板 ID |
| carousel_item_id | 輪播卡片 ID |
| component_slot | 元件位置 |
| interaction_value | 互動值（URL） |

### FAQCategory
> FAQ 大分類

| 屬性 | 說明 |
|------|------|
| id | 分類 ID |
| category_name | 分類名稱 |
| industry_id | 產業 ID |
| is_active | 是否啟用 |
| is_system_default | 是否系統預設 |
| sort_order | 排序 |

### FAQRule
> FAQ 規則（結構化知識資料）

| 屬性 | 說明 |
|------|------|
| id | 規則 ID |
| category_id | 大分類 ID |
| status | 狀態（draft/active/disabled） |
| field_values | 欄位值（JSON，依大分類定義） |
| tags | 關聯標籤 |
| created_at | 建立時間 |
| updated_at | 更新時間 |

### AiTokenUsage
> AI Token 用量

| 屬性 | 說明 |
|------|------|
| id | 紀錄 ID |
| total_quota | 總額度 |
| used_amount | 已消耗 |

### Role
> 管理員角色

| 屬性 | 說明 |
|------|------|
| role_code | 角色代碼 |
| role_name | 角色名稱 |
| is_system_role | 是否系統預設角色 |
| description | 說明 |

### Permission
> 系統權限

| 屬性 | 說明 |
|------|------|
| permission_code | 權限代碼 |
| permission_name | 權限名稱 |
| resource | 資源 |
| action | 操作 |

### Industry
> 產業（系統商管理）

| 屬性 | 說明 |
|------|------|
| id | 產業 ID |
| industry_name | 產業名稱 |

## Commands

### 登入系統
- **Actor**: 管理員
- **Aggregate**: Member（Admin Session）
- **Predecessors**: 無
- **參數**: email, password
- **Description**:
  - What: 管理員以帳號密碼登入系統，取得 JWT Token
  - Why: 驗證身份後才能存取系統功能
  - When: 進入系統時

#### Rules
- 前置（狀態）:
  - 帳號必須存在於系統中
- 前置（參數）:
  - 密碼需符合複雜度規則（8-64 字元、至少 3 種字元類型）
  - 密碼不可包含連續字元或超過 3 個重複字元
- 後置（狀態）:
  - 建立 JWT Token，到期時間為 login_time+24hr 或當日 00:00 UTC+8 取較早者
  - 若 LINE OA 已設定則導向首頁，否則導向設定頁

### 登出系統
- **Actor**: 管理員
- **Aggregate**: Member（Admin Session）
- **Predecessors**: 登入系統
- **參數**: 無
- **Description**:
  - What: 管理員登出系統，銷毀 Session
  - Why: 安全地結束操作
  - When: 點擊登出或每日 00:00 自動登出

#### Rules
- 前置（狀態）:
  - 必須已登入
- 後置（狀態）:
  - 前端清除所有 Cookie/LocalStorage/SessionStorage
  - 後端設定 session.is_active = false
  - 導向登入頁

### 會員管理
- **Actor**: 使用者
- **Aggregate**: Member, MemberTag
- **Predecessors**: 登入系統
- **參數**: name, email, phone, gender, birthday, id_number, passport_number, residence, internal_note, tags
- **Description**:
  - What: 建立、編輯、刪除會員資料與備註
  - Why: 維護 CRM 會員資料庫
  - When: 需要管理會員基本資料時

#### Rules
- 前置（狀態）:
  - 編輯/刪除時會員必須存在
- 前置（參數）:
  - 身分證字號格式驗證
  - 標籤名稱最多 20 字元
- 後置（狀態）:
  - 身分證字號預設遮蔽顯示（A12****789）
  - 問卷回覆覆寫會員資料（有值才覆寫）
  - 消費紀錄每日 02:00 從 CRM 批次同步

### 標籤管理
- **Actor**: 使用者
- **Aggregate**: Tag, MemberTag
- **Predecessors**: 登入系統
- **參數**: tag_name, tag_type (member/interaction), tag_source, member_id
- **Description**:
  - What: 建立、編輯、刪除標籤，為會員新增/移除標籤
  - Why: 分群管理會員以支援精準行銷
  - When: 需要管理標籤或為會員貼標時

#### Rules
- 前置（參數）:
  - 標籤名稱最多 20 字元，僅中英文、數字、空格
  - 不可建立重複名稱的標籤
- 前置（狀態）:
  - 外部來源標籤（CRM/PMS）為唯讀，不可由使用者編輯
- 後置（狀態）:
  - 刪除標籤需二次確認
  - 標籤操作為原子性（member_tags + interaction_tags 批次更新）
  - 相同會員相同標籤不重複貼標

### 會員標籤串接
- **Actor**: 系統
- **Aggregate**: Member, MemberTag
- **Predecessors**: 標籤管理
- **參數**: name, id_number, external_data (PMS/CRM/Survey)
- **Description**:
  - What: 外部系統事件觸發時，自動為會員新增標籤
  - Why: 自動化標籤管理，減少人工操作
  - When: PMS 住宿紀錄匯入、問卷回覆、CRM 資料同步時

#### Rules
- 前置（狀態）:
  - 以 name + id_number 配對會員，找不到則建立新會員
- 後置（狀態）:
  - 問卷自動產生標籤：性別、年齡區間、地區、生日月份
  - PMS 自動產生標籤：房型、消費等級、入住頻率
  - 相同會員 + 相同來源 + 相同紀錄不重複計數
  - 標籤來源標記（CRM/PMS/Survey）

### LINE 好友管理
- **Actor**: 系統
- **Aggregate**: LineFriend, Member
- **Predecessors**: LINE 頻道設定
- **參數**: line_uid, event_type (follow/unfollow/message)
- **Description**:
  - What: 追蹤 LINE 好友的加入/封鎖狀態，同步個人檔案
  - Why: 維護好友清單作為推播對象篩選基礎
  - When: 收到 LINE webhook 事件時

#### Rules
- 前置（狀態）:
  - Webhook 簽章驗證（HMAC-SHA256）
  - 1 秒內重複 FollowEvent 去重
- 後置（狀態）:
  - Follow: is_following=true, 呼叫 Profile API 取得 displayName/pictureUrl
  - Unfollow: is_following=false, 保留紀錄
  - 智慧同步：7 天內不重複呼叫 Profile API
  - 未追蹤者排除於推播對象外
  - 取消追蹤 90 天且無 member_id 者可清除

### LINE 頻道設定
- **Actor**: 管理員
- **Aggregate**: LineChannel
- **Predecessors**: 登入系統
- **參數**: channel_id, channel_secret, channel_access_token, login_channel_id, login_channel_secret
- **Description**:
  - What: 設定 LINE Messaging API 與 Login API 憑證，支援重新設定
  - Why: 連接 LINE OA 以啟用聊天與推播功能
  - When: 首次設定或需要更換 LINE OA 時

#### Rules
- 前置（參數）:
  - Channel ID、Secret、Access Token 不可為空
  - 須勾選「我已完成 LINE 原生後台設定」
- 後置（狀態）:
  - 兩階段驗證：先驗 Access Token（Get Bot Info API）→ 再驗 webhook 連通
  - 驗證成功後儲存設定，顯示 LINE 帳號 ID
  - 重新設定需二次確認，保留會員資料僅替換憑證

### Facebook 頻道管理
- **Actor**: 管理員
- **Aggregate**: FacebookChannel, Member
- **Predecessors**: 登入系統
- **參數**: page_id, app_id, channel_name, jwt_token
- **Description**:
  - What: 建立、同步、驗證 Facebook 頻道，同步 FB 會員
  - Why: 連接 Facebook Messenger 以支援多渠道客服
  - When: 需要設定或維護 Facebook 整合時

#### Rules
- 前置（參數）:
  - 需有效的 Meta JWT Token
- 後置（狀態）:
  - 同步：從外部 API 同步頻道清單
  - 驗證：外部不存在的頻道自動刪除，過期的自動停用
  - 會員同步：清除舊 fb_customer 欄位 → 建立/更新（以 email 配對）→ 刪除三渠道皆空的孤立會員

### 訊息模板管理
- **Actor**: 行銷人員
- **Aggregate**: MessageTemplate
- **Predecessors**: 登入系統
- **參數**: template_type, name, content, buttons, image_url, carousel_items, flex_message_json
- **Description**:
  - What: 建立、編輯訊息模板（文字/圖片/輪播/Flex），管理模板庫與複製
  - Why: 為推播訊息提供可複用的內容模板
  - When: 準備推播內容時

#### Rules
- 前置（參數）:
  - 文字最長 2000 字元
  - 圖片最大 1MB，自動裁切 1:1 或 1.91:1
  - 輪播卡片 2-9 張
  - 金額為非負整數
- 後置（狀態）:
  - 儲存時自動產生 JSON（非編輯過程中）
  - 複製模板遞增來源 usage_count
  - 跨渠道切換時自動轉換欄位（隱藏不支援的欄位）

### 建立推播訊息
- **Actor**: 行銷人員
- **Aggregate**: Message, MessageDelivery, Campaign
- **Predecessors**: 訊息模板管理
- **參數**: template_id, target_type, target_filter, scheduled_at, platform, channel_id, campaign_id, interaction_tags
- **Description**:
  - What: 建立群發訊息，設定受眾篩選與排程，發送推播
  - Why: 執行精準行銷推播
  - When: 需要向特定會員群體發送訊息時

#### Rules
- 前置（參數）:
  - 模板選擇後不可變更來源
  - 篩選邏輯：include AND NOT exclude（兩者皆可選填）
  - 配額不足時按鈕停用
  - 受眾為 0 時可儲存草稿但不可發送
- 後置（狀態）:
  - 即時更新預估發送人數
  - UTC 時間轉換（台灣 +8）
  - 並行編輯採 last-write-wins
  - 發送失敗時標記 failed，建立重試草稿

### 活動管理
- **Actor**: 行銷人員
- **Aggregate**: Campaign
- **Predecessors**: 登入系統
- **參數**: campaign_name, campaign_tag, campaign_date, start_date, end_date
- **Description**:
  - What: 建立、編輯、刪除行銷活動，關聯推播訊息
  - Why: 組織管理行銷活動
  - When: 規劃行銷活動時

#### Rules
- 前置（參數）:
  - 活動名稱必填
- 後置（狀態）:
  - 活動可關聯多筆推播訊息

### 自動回應管理
- **Actor**: 使用者
- **Aggregate**: AutoResponse
- **Predecessors**: 登入系統
- **參數**: name, trigger_type, keywords, messages, enabled, date_range, trigger_time
- **Description**:
  - What: 建立、編輯、刪除、啟停自動回應規則（歡迎/關鍵字/排程）
  - Why: 自動化回覆常見問題，減少客服負擔
  - When: 需要設定自動回應邏輯時

#### Rules
- 前置（參數）:
  - 每組回應最多 20 個關鍵字
  - 每次觸發最多 5 則回應訊息
  - 關鍵字不區分大小寫，部分匹配
- 前置（狀態）:
  - 回應優先順序：人工 > AI > 自動回應（keyword > scheduled > welcome）
  - 人工介入後 10 分鐘失效
- 後置（狀態）:
  - 關鍵字衝突時最新版本優先
  - 排程支援跨日（如 18:00-09:00）
  - 多則訊息間隔 1-2 秒發送

### Facebook 自動回覆管理
- **Actor**: 管理員
- **Aggregate**: FacebookAutoResponse（外部 Meta API）
- **Predecessors**: Facebook 頻道管理
- **參數**: keyword_id, enabled, basic_id, jwt_token
- **Description**:
  - What: 更新/刪除 Facebook 自動回覆關鍵字與模板
  - Why: 管理 Facebook Messenger 的自動回覆
  - When: 需要維護 FB 自動回應時

#### Rules
- 前置（參數）:
  - 需有效的 Meta JWT Token
- 後置（狀態）:
  - 所有操作委託至外部 FB API

### 檔案上傳
- **Actor**: 管理員
- **Aggregate**: UploadedFile
- **Predecessors**: 登入系統
- **參數**: file (multipart)
- **Description**:
  - What: 上傳/刪除圖片檔案
  - Why: 提供模板與推播所需的圖片資源
  - When: 編輯模板或推播時需要圖片

#### Rules
- 前置（參數）:
  - 最大 5MB，格式：JPG/JPEG/PNG/GIF
  - PNG 自動轉換為 JPEG（quality=95）
- 後置（狀態）:
  - 產生唯一檔名：{datetime}_{UUID}.jpg
  - 回傳公開 URL

### 互動追蹤
- **Actor**: 系統
- **Aggregate**: InteractionLog, Tag
- **Predecessors**: 建立推播訊息
- **參數**: line_uid, campaign_id, interaction_type, template_id, carousel_item_id, component_slot, interaction_value
- **Description**:
  - What: 記錄使用者點擊推播內容的互動事件，自動貼互動標籤
  - Why: 追蹤推播成效，支援數據分析
  - When: 使用者點擊推播訊息中的按鈕或圖片時

#### Rules
- 後置（狀態）:
  - 自動為會員新增互動標籤（唯一索引：同會員+同模板 = 計一次）
  - 更新 trigger_count, trigger_member_count, last_triggered_at

### PMS 系統整合
- **Actor**: 管理員
- **Aggregate**: PMSIntegration, Member, ConsumptionRecord
- **Predecessors**: 登入系統
- **參數**: id_number, phone, stay_records, member_id
- **Description**:
  - What: 匯入 PMS 住宿紀錄，配對會員，同步消費紀錄
  - Why: 整合飯店住宿管理系統資料
  - When: PMS 資料需要匯入 CRM 時

#### Rules
- 前置（參數）:
  - 支援多 PMS 系統（Adapter Pattern）
  - API Key 加密儲存（AES-256）
- 後置（狀態）:
  - 會員配對：name + id_number，找不到則建立
  - 衝突解決：最新時間戳優先，空值不覆寫
  - 批次處理 10K+ 筆紀錄，5 分鐘超時

### 消費紀錄管理
- **Actor**: 管理員
- **Aggregate**: ConsumptionRecord
- **Predecessors**: 登入系統
- **參數**: member_id, amount, room_type, stay_date, check_in_date, check_out_date
- **Description**:
  - What: 建立、編輯、刪除消費紀錄，查詢會員消費摘要
  - Why: 維護會員消費歷史，支援會員分析
  - When: 需要管理消費資料時

#### Rules
- 前置（狀態）:
  - 會員必須存在
- 後置（狀態）:
  - 寫入失敗時 DB rollback

### LINE 訊息通知
- **Actor**: LINE App
- **Aggregate**: ConversationMessage, Conversation
- **Predecessors**: LINE 頻道設定
- **參數**: line_uid, message_text, timestamp, message_id, direction, source
- **Description**:
  - What: LINE App 通知 Backend 有新訊息，儲存並推送至前端
  - Why: 實現即時聊天功能
  - When: LINE App 收到使用者訊息或發送自動回覆時

#### Rules
- 前置（狀態）:
  - 會員需存在（找不到則跳過）
- 後置（狀態）:
  - Upsert：message_id 存在則更新，否則建立
  - 手動訊息跳過 SSE 推送（避免重複）
  - Unix timestamp 轉換為中文時間格式
  - 更新 thread last_message_at

### FAQ 大分類管理
- **Actor**: 使用者 / 系統商管理員
- **Aggregate**: FAQCategory, Industry
- **Predecessors**: 登入系統, FAQ 模組授權
- **參數**: category_id, is_active
- **Description**:
  - What: 啟用/關閉 FAQ 大分類，管理 Token 用量與語氣設定
  - Why: 控制 AI 聊天機器人引用的知識範圍
  - When: 需要調整 AI 回答範圍或設定時

#### Rules
- 前置（狀態）:
  - 需 faq.view 或 faq.manage 權限
  - 大分類為系統預設，不可新增/編輯/刪除
- 後置（狀態）:
  - 關閉大分類後前台不再引用其下規則
  - Token 耗盡自動停用 AI，降級至 auto_response

### FAQ 規則管理
- **Actor**: 使用者
- **Aggregate**: FAQRule, FAQRuleVersion, MemberTag
- **Predecessors**: FAQ 大分類管理
- **參數**: category_id, field_values, status, tag_name
- **Description**:
  - What: 新增、編輯、刪除、啟停 FAQ 規則，發佈至正式環境，版本回復
  - Why: 維護 AI 聊天機器人引用的結構化知識內容
  - When: 需要更新 AI 知識庫時

#### Rules
- 前置（狀態）:
  - 需 faq.manage 權限，發佈需 faq.publish 權限
  - 每個大分類最多 20 筆規則
- 前置（參數）:
  - 必填欄位驗證（依大分類欄位定義）
- 後置（狀態）:
  - 新增/編輯後狀態為「測試(未發佈)」
  - 前台繼續引用上一已啟用版本
  - 發佈時所有測試規則 → 已啟用，產生版本快照
  - 最多保留 2 個版本（當前 + 上一已啟用）
  - AI 引用規則時自動為會員貼標

### AI 聊天回答
- **Actor**: 會員（透過渠道）/ LINE App / 系統
- **Aggregate**: ConversationMessage, MemberTag, AiTokenUsage
- **Predecessors**: FAQ 規則管理, LINE 頻道設定
- **參數**: member_id, message, channel, conversation_id
- **Description**:
  - What: 收集已啟用 FAQ 規則作為 prompt context，呼叫 LLM 生成回答，自動貼標
  - Why: 提供 24/7 AI 客服，減少人工負擔
  - When: 會員透過 LINE/FB/Webchat 發送訊息時

#### Rules
- 前置（狀態）:
  - Token 額度充足
  - gpt_enabled = true（非手動模式）
  - 已啟用規則存在
- 後置（狀態）:
  - 僅引用已啟用規則（已停用、未發佈不引用）
  - 已關閉大分類下規則不引用
  - AI 無法回答 → 標記「待人工回覆」
  - 自動貼標（不重複）
  - Token 消耗記錄
  - Token 耗盡 → 回傳降級信號（TOKEN_EXHAUSTED），渠道改走 auto_response
  - 渠道端不直接呼叫 OpenAI，統一透過 Backend POST /api/v1/ai/chat
  - 回應優先順序：人工 > AI > keyword > always

### FAQ 系統商管理
- **Actor**: 系統商管理員
- **Aggregate**: Industry, FaqModuleAuth, AiTokenUsage
- **Predecessors**: 無
- **參數**: industry_name, client_id, total_quota
- **Description**:
  - What: 管理產業定義、為客戶開通 FAQ 模組授權、設定 Token 額度
  - Why: 控制客戶對 FAQ 模組的使用權限與資源
  - When: 客戶申請開通 FAQ 功能或需要調整額度時

#### Rules
- 前置（狀態）:
  - 須為系統商管理員
- 後置（狀態）:
  - 授權與 Token 額度獨立管理
  - 客戶端 Token 額度為唯讀

### 權限管理
- **Actor**: 超級管理員
- **Aggregate**: Role, Permission, AdminRole, RolePermission
- **Predecessors**: 登入系統
- **參數**: role_code, role_name, permission_codes, admin_id, role_codes
- **Description**:
  - What: 建立/刪除角色、配置角色權限、指派管理員角色
  - Why: 基於角色的存取控制，確保系統安全性
  - When: 需要調整管理員權限時

#### Rules
- 前置（狀態）:
  - 需 admin.manage 權限
  - 系統預設角色（superadmin/admin/staff）不可刪除
  - 有管理員使用中的自訂角色不可刪除
- 後置（狀態）:
  - 管理員可擁有多角色，最終權限為聯集
  - 權限變更立即生效（事件驅動快取失效 + 1 小時 TTL）
  - 不需重新登入

## Read Models

### 查詢會員清單
- **Actor**: 使用者
- **Aggregates**: Member, Tag
- **回傳欄位**: id, line_display_name, line_avatar, name, email, phone, join_source, tags, created_at, last_interaction_at, is_unanswered
- **Description**:
  - What: 搜尋與篩選會員清單，支援分頁、排序
  - Why: 快速找到目標會員進行管理
  - When: 進入會員管理頁面時

#### Rules
- 前置（參數）:
  - LINE 名稱/姓名：模糊搜尋（LIKE %pattern%）
  - Email：前綴/包含/網域搜尋
  - 電話：精確匹配
  - 標籤：勾選篩選（OR 邏輯）
- 後置（回應）:
  - 依 last_interaction_at 降序排序
  - 分頁（預設 page_size=20）

### 查詢訊息紀錄
- **Actor**: 客服人員
- **Aggregates**: Conversation, ConversationMessage, Member
- **回傳欄位**: message list (content, sender, timestamp, is_read, message_source), member profile snippet, tags, notes
- **Description**:
  - What: 查看會員的聊天訊息歷史，支援即時更新
  - Why: 客服人員需要查看對話上下文
  - When: 進入聊天室時

#### Rules
- 後置（回應）:
  - 初始載入 50 則，捲動載入更多
  - SSE 即時推送新訊息（< 100ms）
  - 時間格式：12 小時制 + 時段（上午/中午/下午/晚上/凌晨）
  - 訊息來源標籤：人工回覆/訊息推播/自動回應

### 查詢訊息數據成效
- **Actor**: 行銷人員
- **Aggregates**: Message, MessageDelivery, InteractionLog
- **回傳欄位**: message_title, send_time, send_count, open_count, click_count, open_rate, click_rate, content_preview
- **Description**:
  - What: 查看推播訊息的發送與互動成效數據
  - Why: 評估行銷推播效果
  - When: 需要分析推播成效時

#### Rules
- 後置（回應）:
  - Open = COUNT(DISTINCT member_id) WHERE read=true
  - Click = COUNT(DISTINCT line_id) FROM InteractionLog
  - 草稿：無數據；排程中：倒數計時；已發送：完整統計
  - 支援時間區間篩選

### 查詢標籤統計
- **Actor**: 品牌管理者
- **Aggregates**: Tag, InteractionLog
- **回傳欄位**: tag_name, trigger_count, trigger_member_count, last_triggered_at, trend_data
- **Description**:
  - What: 查看標籤使用統計與趨勢圖表
  - Why: 了解會員互動偏好與行銷效果
  - When: 需要分析標籤使用情況時

#### Rules
- 後置（回應）:
  - trigger_count = 所有觸發次數；trigger_member_count = 不重複會員數
  - 同會員+不同模板 = +2 count, +1 member；同會員+同模板 = 不計
  - 趨勢圖：7/30/90 天雙軸圖表
  - 支援排序（觸發次數/最近觸發）

### 查詢活動追蹤統計
- **Actor**: 行銷人員
- **Aggregates**: Campaign, InteractionLog
- **回傳欄位**: campaign_id, total_interactions, unique_members, interactions_by_type, carousel_stats
- **Description**:
  - What: 查看活動的互動追蹤統計與明細
  - Why: 分析活動成效
  - When: 需要檢視活動表現時

#### Rules
- 後置（回應）:
  - 支援篩選：template_id, interaction_type, 日期區間
  - 分頁（limit/offset）

### 查詢 Meta 用戶資料
- **Actor**: 管理員
- **Aggregates**: Member, LineFriend, FacebookFriend, WebchatFriend, Tag
- **回傳欄位**: member profile, channel-specific display_name, member_tags, interaction_tags
- **Description**:
  - What: 查詢會員在不同渠道的資料與標籤
  - Why: 提供跨渠道的會員全貌
  - When: 客服需要查看會員多渠道資料時

#### Rules
- 前置（參數）:
  - 以 customer_id + channel 查詢
- 後置（回應）:
  - 自動選擇渠道優先序：Facebook > LINE > Webchat
  - 回傳 member_tags (type=1) + interaction_tags (type=2)

### 查詢 FAQ 資訊
- **Actor**: 使用者
- **Aggregates**: FAQCategory, FAQRule, AiTokenUsage, AiToneConfig, FaqModuleAuth
- **回傳欄位**: categories (name, is_active, published_rule_count), rules (status, field_values), token_usage, tone_setting, module_auth_status
- **Description**:
  - What: 查詢 FAQ 大分類列表、規則清單、Token 用量、語氣設定、模組授權狀態
  - Why: 提供 FAQ 管理頁面所需的所有資料
  - When: 進入 FAQ 管理頁面時

#### Rules
- 前置（狀態）:
  - 需 faq.view 權限
  - FAQ 模組需已開通授權
- 後置（回應）:
  - 大分類列表含全域最後更新時間
  - Token 額度為唯讀（系統商設定）

### FAQ 測試聊天
- **Actor**: 使用者
- **Aggregates**: FAQRule, AiTokenUsage
- **回傳欄位**: answer, referenced_rules, tokens_used
- **Description**:
  - What: 在測試聊天視窗發送提問並取得 AI 回答
  - Why: 驗證規則修改效果再發佈
  - When: 在 FAQ 管理頁面進行測試時

#### Rules
- 前置（狀態）:
  - 需 faq.manage 權限
- 前置（參數）:
  - 版本選擇：測試+正式（引用 draft+active）或僅正式（僅 active）
- 後置（回應）:
  - AI 回答 + 引用的規則清單 + Token 消耗量
  - 規則儲存後即時更新（顯示提示「當前有新的測試規則」）

### 查詢管理員權限
- **Actor**: 超級管理員
- **Aggregates**: Role, Permission, AdminRole, RolePermission
- **回傳欄位**: roles (role_code, role_name, is_system_role), permissions (permission_code, resource, action), admin_permissions (union of role permissions)
- **Description**:
  - What: 查詢角色清單與管理員的最終權限
  - Why: 管理權限配置
  - When: 進入權限管理頁面時

#### Rules
- 後置（回應）:
  - 管理員最終權限 = 所有角色權限的聯集

### 聊天室多渠道
- **Actor**: 客服人員
- **Aggregates**: Member, Conversation, ConversationMessage
- **回傳欄位**: integrated message timeline, channel labels, member cross-channel profile
- **Description**:
  - What: 跨渠道整合聊天記錄，支援渠道切換回覆
  - Why: 統一管理不同渠道的會員對話
  - When: 客服在聊天室操作時

#### Rules
- 前置（狀態）:
  - Webchat OAuth 登入 → 以 email 優先合併會員
- 後置（回應）:
  - 最後互動時間 = max(各渠道 last_interaction_at)
  - 預設回覆渠道 = 最新互動渠道
  - LINE/FB 24 小時回覆窗口
  - Webchat 離線偵測（60 秒寬限）

### SSE 即時推送
- **Actor**: 系統
- **Aggregates**: ConversationMessage
- **回傳欄位**: SSE event stream (new_message, read_status)
- **Description**:
  - What: 建立 SSE 連線接收即時聊天訊息
  - Why: 前端即時更新聊天內容
  - When: 客服開啟聊天室時

#### Rules
- 後置（回應）:
  - Server-Sent Events 串流
  - 自動重連（EventSource 內建）

### 卡控流程
- **Actor**: 系統
- **Aggregates**: LineChannel, Admin
- **回傳欄位**: config_complete (boolean), authorization_status
- **Description**:
  - What: 檢查 LINE OA 設定完整性與授權狀態，控制功能存取
  - Why: 確保系統基礎設定完成才能使用功能
  - When: 每次功能存取時

#### Rules
- 前置（狀態）:
  - 檢查 Messaging API 三欄位皆非空
- 後置（回應）:
  - 設定不完整 → Toast「請先完成基本設定」
  - 授權過期 → 強制登出
