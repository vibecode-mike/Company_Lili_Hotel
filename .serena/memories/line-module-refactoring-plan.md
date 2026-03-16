# LINE 模組重構計畫

## Context

`line_app/app.py` 是一個 3,641 行的巨型單體文件，混合了 7 個功能域：webhook 處理、GPT 對話、自動回應、會員管理、推播廣播、LIFF 問卷、追蹤分析。所有功能耦合在一起，難以維護和測試。

**目標**：將 `line_app/app.py` 拆分為模組化結構，建立清晰的 service layer + API layer + webhook layer，同時保持所有現有功能正常運作。

## 架構概覽

```
line_app/
├── app.py                    # 瘦身後：Flask 初始化 + Blueprint 註冊 (~150 行)
├── config.py                 # 不變
├── db.py                     # 不變
├── services/                 # 業務邏輯層 (從 app.py 提取)
│   ├── __init__.py
│   ├── line_sdk.py           # LINE SDK 工廠 + credentials 管理
│   ├── member_service.py     # 會員/好友 CRUD、profile 取得
│   ├── conversation_service.py  # 對話 thread + message 管理
│   ├── gpt_service.py        # OpenAI 整合、記憶管理
│   ├── auto_response_service.py # 關鍵字/一律回覆/歡迎訊息
│   ├── campaign_service.py   # 推播廣播、Flex Message 建構
│   ├── survey_service.py     # LIFF 問卷 CRUD + 提交
│   ├── channel_service.py    # LINE channel 連線、webhook/LIFF 設定
│   └── tracking_service.py   # 點擊追蹤、互動標籤
├── api/                      # 結構化 REST API (新建)
│   ├── __init__.py
│   ├── responses.py          # 統一回應格式 helper
│   ├── member_api.py         # 會員列表、聊天紀錄
│   ├── chat_api.py           # 一對一發送訊息
│   ├── broadcast_api.py      # 推播建立、推播列表
│   ├── auto_response_api.py  # 自動回應 CRUD
│   ├── channel_api.py        # 頻道狀態查詢
│   └── tag_api.py            # 標籤篩選人數統計
├── webhooks/                 # Webhook 事件處理 (從 app.py 提取)
│   ├── __init__.py
│   ├── router.py             # callback 路由 + handler 註冊
│   ├── follow_handler.py     # on_follow, on_unfollow
│   ├── message_handler.py    # on_text, on_sticker, on_image, router
│   └── postback_handler.py   # on_postback
├── member_liff.py            # 不變
├── manage_botinfo.py         # 不變
├── liff_page.py              # 不變
└── usage_monitor.py          # 不變
```

## 實作步驟

### Phase 1: 建立 Service Layer（從 app.py 提取業務邏輯）— Steps 1.1-1.3 已完成

#### Step 1.1: `line_app/services/line_sdk.py` [DONE]
- `get_credentials(channel_id)` — 從 DB 取得 channel 設定
- `get_messaging_api(channel_id)` — 建立 MessagingApi instance
- `get_credentials_by_line_id(line_channel_id)` — 透過 line_channel_id 查詢
- `get_channel_access_token_by_channel_id(line_channel_id)` — 多帳號 token 查詢
- `get_messaging_api_by_line_id(line_channel_id)` — 用 LINE Channel ID 取 API
- `fetch_line_profile(user_id, channel_id)` — 取得 LINE 用戶資料
- `setup_line_webhook`, `get_login_access_token`, `setup_line_liff`
- 全域 LINE SDK singleton (config, api_client, default_handler, messaging_api)
- **來源**: app.py ~L223-L400, ~L2659-L2670

#### Step 1.2: `line_app/services/member_service.py` [DONE]
- `upsert_member`, `upsert_line_friend`, `fetch_member_profile`, `maybe_update_member_profile`
- `is_gpt_enabled_for_user`, `get_all_follower_ids`, `backfill_line_friends_on_startup`
- `_get_display_name_for_uid`, `render_template_text`, `DISPLAY_NAME_TOKEN*`
- **來源**: app.py ~L386-L1071

#### Step 1.3: `line_app/services/conversation_service.py` [DONE]
- `ensure_thread_for_user`, `insert_conversation_message`
- `get_chat_history` (新增), `get_member_conversations` (新增)
- **來源**: app.py ~L537-L697

#### Step 1.4: `line_app/services/gpt_service.py`
- `SYSTEM_PROMPT`, `user_memory`, `build_messages`, `ask_gpt`
- **來源**: app.py ~L1-L220, ~L1076-L1095

#### Step 1.5: `line_app/services/auto_response_service.py`
- `check_keyword_trigger`, `check_always_response`, `check_welcome_response`
- CRUD: `create_auto_response`, `list_auto_responses`, `update_auto_response`, `delete_auto_response`
- `delete_keyword`, `delete_reply`, `toggle_keyword`
- **來源**: app.py ~L1096-L1190 + 新增 CRUD

#### Step 1.6: `line_app/services/campaign_service.py`
- `push_campaign`, `build_user_messages_from_payload`, `_create_campaign_row`, `_add_campaign_recipients`
- Flex builders, `save_base64_image`
- `get_broadcast_list`, `get_broadcast_detail`
- **來源**: app.py ~L1191-L1855

#### Step 1.7: `line_app/services/survey_service.py`
- `register_survey_from_json`, `render_survey_html`, `save_survey_submission`, `push_survey_entry`
- **來源**: app.py ~L487-L536, ~L1861-L2515

#### Step 1.8: `line_app/services/channel_service.py`
- `setup_line_webhook`, `get_login_access_token`, `setup_line_liff`, `get_login_status`
- **來源**: app.py ~L272-L380

#### Step 1.9: `line_app/services/tracking_service.py`
- `handle_click`, `handle_track`
- **來源**: app.py ~L2534-L2786

### Phase 2: 建立 Webhook Handlers

- `webhooks/router.py` — callback 路由 + Blueprint
- `webhooks/follow_handler.py` — on_follow, on_unfollow
- `webhooks/message_handler.py` — on_text, on_sticker, on_image, router
- `webhooks/postback_handler.py` — on_postback

### Phase 3: 建立結構化 API Layer

新 API 端點掛在 `/api/v1/line/` 前綴：

- `POST /api/v1/line/message/send` — 一對一聊天
- `GET /api/v1/line/message/history` — 聊天紀錄
- `PUT /api/v1/line/message/read` — 標記已讀
- `GET /api/v1/line/members` — 會員列表
- `POST /api/v1/line/broadcast` — 建立推播
- `GET /api/v1/line/broadcast/list` — 推播列表
- `POST /api/v1/line/auto-response` — 建立自動回應
- `GET /api/v1/line/auto-response` — 自動回應列表
- `PATCH /api/v1/line/auto-response` — 編輯
- `DELETE /api/v1/line/auto-response` — 刪除
- `GET /api/v1/line/channel/status` — 頻道狀態
- `GET /api/v1/line/tags/count` — 標籤人數

### Phase 4: 瘦身 app.py + 舊路由相容

- 保留所有舊路由作為 thin wrapper
- app.py 變成 ~150 行

### Phase 5: 更新 Backend 整合

- `LineAppClient` 新增呼叫新端點的方法
- `LineAppAdapter` 改 import `services.campaign_service`

### Phase 6: 驗證

- Webhook 功能、現有 API、新 API、Backend 整合、LIFF 問卷、追蹤

## 執行順序

```
Phase 1 (Service Layer) ─── 基礎
    ├──→ Phase 2 (Webhooks)
    ├──→ Phase 3 (New API)  ──→ Phase 4 (瘦身 app.py)
    └──→ Phase 5 (Backend)  ──→ Phase 6 (驗證)
```

## 關鍵風險

| 風險 | 對策 |
|------|------|
| 全域狀態 | 集中於 line_sdk.py 和 gpt_service.py，lazy init |
| Flask g context | Service 函數顯式傳入 channel_id |
| 循環 import | late import 或依賴注入 |
| LineAppAdapter 直接 import app.py | 改為 import services.campaign_service |
| 舊路由被呼叫中 | 保留所有舊路由作為 thin wrapper |
