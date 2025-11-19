# 力麗飯店 LINE OA CRM 後端架構設計文檔

**版本**: v0.2
**日期**: 2024-11-15
**文檔狀態**: 正式版

---

## 文檔變更記錄

| 版本 | 日期 | 變更內容 | 修訂人 |
|------|------|---------|-------|
| v0.2 | 2024-11-15 | - 明確區分 Messages（群發訊息）與 Campaigns（活動管理）<br>- 新增 MessageDelivery 發送追蹤表<br>- 實施混合儲存策略（DB + CDN）<br>- 新增 notification_text、preview_text 欄位<br>- 完整的自動回應關聯表設計<br>- 更新所有 API 接口文檔 | Claude |
| v0.1 | 2024-11-12 | 初始版本 | 開發團隊 |

---

## 目錄

1. [項目概述](#1-項目概述)
2. [技術架構](#2-技術架構)
3. [系統架構設計](#3-系統架構設計)
4. [數據庫設計](#4-數據庫設計)
5. [API 接口設計](#5-api-接口設計)
6. [核心業務模塊](#6-核心業務模塊)
7. [安全設計](#7-安全設計)
8. [性能優化策略](#8-性能優化策略)
9. [部署架構](#9-部署架構)
10. [附錄](#10-附錄)

---

## 1. 項目概述

### 1.1 項目背景

力麗飯店 LINE OA CRM 管理後台是一個為飯店行業打造的 SaaS 服務平台，旨在解決傳統飯店行銷中存在的精準分眾不足、人力成本高、客戶洞察缺乏等問題。系統通過整合 LINE 官方帳號與德安 PMS 系統，實現標籤化會員管理和精準行銷活動推播。

### 1.2 核心目標

- 建立可控 LINE OA 的 CRM 管理後台
- 整合德安 PMS 會員管理系統資料
- 支援排程訊息推送與活動上架
- 提供點擊標籤追蹤與分析
- 實現基於會員標籤的指向性行銷

### 1.3 成功指標

- PMS 與 LINE OA 整合完成，會員比對成功率 ≥ 95%
- 排程與活動訊息推播成功率 ≥ 99%
- 依標籤推播的行銷轉換率提升 ≥ 25%
- 建立 3 種以上活動標籤自動化行銷場景

### 1.4 用戶角色

| 角色 | 職責 | 權限 |
|------|------|------|
| 管理員 (ADMIN) | 系統配置、用戶管理、全局數據查看 | 完整權限 |
| 行銷人員 (MARKETING) | 活動創建、訊息推播、數據分析 | 讀取、編輯、推播 |
| 客服人員 (CUSTOMER_SERVICE) | 會員溝通、標籤管理、訊息回覆 | 讀取、編輯 |

---

## 2. 技術架構

### 2.1 技術棧

#### 核心框架
- **Python**: 3.11.13
- **FastAPI**: 0.104.1 (現代異步 Web 框架)
- **Uvicorn**: 0.24.0 (ASGI 服務器)
- **Pydantic**: 2.5.0 (數據驗證與序列化)

#### 數據庫與 ORM
- **數據庫**: MySQL 8.0
- **ORM**: SQLAlchemy 2.0.23 (異步支持)
- **數據庫遷移**: Alembic 1.12.1
- **異步驅動**: aiomysql 0.2.0

#### 認證與安全
- **JWT**: python-jose 3.3.0
- **密碼加密**: passlib[bcrypt] 1.7.4, bcrypt 4.1.1
- **加密算法**: HS256

#### 第三方集成
- **LINE Messaging API**: line-bot-sdk 3.6.0
- **OpenAI**: openai 1.3.7 (GPT-4 智能客服)
- **任務調度**: APScheduler 3.10.4

#### 工具庫
- **HTTP 客戶端**: httpx 0.25.2
- **圖片處理**: Pillow 10.1.0
- **文檔處理**: openpyxl 3.1.2, reportlab 4.0.7
- **異步文件**: aiofiles 23.2.1

### 2.2 架構原則

1. **異步優先**: 全面採用 async/await 模式，提升並發性能
2. **分層設計**: API Layer → Service Layer → Repository Layer
3. **類型安全**: 使用 Pydantic 2.x 嚴格類型驗證
4. **RESTful 規範**: 遵循 REST API 設計原則
5. **統一新架構**: Messages（群發訊息）與 Campaigns（活動管理）職責清晰分離
6. **可擴展性**: 模塊化設計，易於添加新功能

---

## 3. 系統架構設計

### 3.1 整體架構圖

```
┌─────────────────────────────────────────────────────────┐
│                    前端應用層                              │
│              React + TypeScript + Vite                   │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                   Nginx 反向代理                          │
│              (靜態資源 + API 路由轉發)                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  FastAPI 應用層                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API v1 路由層                        │   │
│  │  ┌────────┬────────┬────────┬────────┬────────┐ │   │
│  │  │ 會員   │ 訊息   │ 標籤   │ 自動   │ PMS    │ │   │
│  │  │ API    │ API    │ API    │ 回應   │ API    │ │   │
│  │  └────────┴────────┴────────┴────────┴────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              業務邏輯層 (Services)                │   │
│  │  ┌────────┬────────┬────────┬────────┬────────┐ │   │
│  │  │Member  │Campaign│ Tag    │ Auto   │ LINE   │ │   │
│  │  │Service │Service │Service │Response│Bot     │ │   │
│  │  └────────┴────────┴────────┴────────┴────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              數據訪問層 (Models)                  │   │
│  │  ┌────────┬────────┬────────┬────────┬────────┐ │   │
│  │  │Member  │Message │ Tag    │Template│ PMS    │ │   │
│  │  │Model   │Model   │Model   │Model   │Model   │ │   │
│  │  └────────┴────────┴────────┴────────┴────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   MySQL 數據庫                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  會員表 │ 標籤表 │ 訊息表 │ 模板表 │ 追蹤表   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   外部系統集成                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  LINE    │  │  德安    │  │  OpenAI  │              │
│  │Messaging │  │   PMS    │  │   GPT-4  │              │
│  │   API    │  │  系統    │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   任務調度系統                             │
│              APScheduler (排程推播)                       │
└─────────────────────────────────────────────────────────┘
```

### 3.2 項目目錄結構

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI 應用入口
│   ├── config.py                 # 配置管理
│   ├── database.py               # 數據庫連接
│   │
│   ├── api/                      # API 路由層
│   │   └── v1/
│   │       ├── __init__.py       # 路由註冊
│   │       ├── auth.py           # 認證授權
│   │       ├── members.py        # 會員管理
│   │       ├── campaigns.py      # 群發訊息(舊)
│   │       ├── campaigns_new.py  # 活動管理(新)
│   │       ├── tags.py           # 標籤管理
│   │       ├── auto_responses.py # 自動回應
│   │       ├── templates.py      # 模板管理
│   │       ├── pms_integrations.py # PMS整合
│   │       ├── consumption_records.py # 消費記錄
│   │       ├── surveys.py        # 問卷管理
│   │       ├── tracking.py       # 追蹤統計
│   │       └── upload.py         # 文件上傳
│   │
│   ├── models/                   # 數據模型
│   │   ├── base.py
│   │   ├── member.py
│   │   ├── campaign.py           # 群發訊息(messages表)
│   │   ├── new_campaign.py       # 活動管理(campaigns表)
│   │   ├── tag.py
│   │   ├── template.py
│   │   ├── auto_response.py
│   │   ├── pms_integration.py
│   │   ├── consumption_record.py
│   │   └── ...
│   │
│   ├── schemas/                  # Pydantic Schemas
│   │   ├── member.py
│   │   ├── campaign.py
│   │   ├── template.py
│   │   ├── auth.py
│   │   ├── common.py
│   │   └── ...
│   │
│   ├── services/                 # 業務邏輯層
│   │   ├── campaign_service.py
│   │   ├── member_service.py
│   │   ├── linebot_service.py
│   │   ├── survey_service.py
│   │   ├── tracking_service.py
│   │   └── scheduler.py
│   │
│   ├── integrations/             # 第三方集成
│   │   ├── line_api.py
│   │   └── openai_service.py
│   │
│   ├── core/                     # 核心功能
│   │   ├── security.py           # JWT、密碼加密
│   │   ├── exceptions.py         # 自定義異常
│   │   └── pagination.py         # 分頁功能
│   │
│   └── utils/                    # 工具函數
│       └── image_handler.py
│
├── migrations/                   # Alembic 遷移
│   ├── versions/
│   └── env.py
│
├── public/                       # 靜態資源
│   └── uploads/                  # 上傳文件
│
├── scripts/                      # 腳本文件
├── requirements.txt              # Python 依賴
├── alembic.ini                   # Alembic 配置
└── .env                          # 環境配置
```

### 3.3 分層架構說明

#### API Layer (控制層)
- **職責**: HTTP 請求處理、參數驗證、響應格式化
- **工具**: FastAPI Router, Pydantic Schema
- **原則**: 薄控制層，不包含業務邏輯

#### Service Layer (業務邏輯層)
- **職責**: 業務流程編排、複雜邏輯處理、外部系統集成
- **特點**: 事務管理、錯誤處理、數據轉換
- **原則**: 單一職責，高內聚低耦合

#### Repository Layer (數據訪問層)
- **職責**: 數據庫 CRUD 操作、查詢優化
- **工具**: SQLAlchemy ORM
- **原則**: 封裝數據訪問邏輯

---

## 4. 數據庫設計

### 4.1 數據庫 ER 圖（簡化版）

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Members   │◄──────│ Member_Tags  │──────►│Interaction  │
│  (會員表)   │  1:N  │  (會員標籤)  │  N:1  │   Tags      │
└─────────────┘       └──────────────┘       │(互動標籤定義)│
       │                                       └─────────────┘
       │ 1:N                                          │
       │                                              │
       ▼                                              ▼
┌─────────────┐                              ┌──────────────┐
│  Message    │                              │  Member      │
│  Records    │                              │Interaction   │
│(一對一訊息) │                              │  Records     │
└─────────────┘                              │(互動記錄)    │
                                              └──────────────┘
┌─────────────┐       ┌──────────────┐
│  Messages   │◄──────│  Message     │
│ (群發訊息)  │  1:N  │ Recipients   │
└─────────────┘       │(推播對象)    │
       │              └──────────────┘
       │ N:1
       ▼
┌─────────────┐       ┌──────────────┐
│  Message    │◄──────│  Template    │
│ Templates   │  1:N  │  Carousel    │
│(訊息模板)   │       │   Items      │
└─────────────┘       │(輪播圖卡)    │
                      └──────────────┘

┌─────────────┐       ┌──────────────┐
│  Campaigns  │       │     PMS      │
│(活動管理-新)│       │ Integrations │
└─────────────┘       │(PMS系統整合) │
                      └──────────────┘
                             │ N:1
                             ▼
                      ┌──────────────┐
                      │ Consumption  │
                      │   Records    │
                      │(消費記錄)    │
                      └──────────────┘

┌─────────────┐       ┌──────────────┐
│    Auto     │◄──────│     Auto     │
│  Responses  │  1:N  │   Response   │
│(自動回應)   │       │   Keywords   │
└─────────────┘       │(關鍵字配置)  │
                      └──────────────┘
```

### 4.2 核心數據表詳細設計

#### 4.2.1 Members (會員表)

```sql
CREATE TABLE members (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- LINE 相關資訊
    line_uid VARCHAR(100) UNIQUE NOT NULL COMMENT 'LINE UID',
    line_avatar VARCHAR(500) COMMENT 'LINE 頭像 URL',
    line_name VARCHAR(100) COMMENT 'LINE 顯示名稱',

    -- 基本資訊
    name VARCHAR(32) COMMENT '會員姓名',
    gender CHAR(1) COMMENT '性別：0=不透漏/1=男/2=女',
    birthday DATE COMMENT '生日',
    email VARCHAR(100) COMMENT '電子信箱',
    phone VARCHAR(20) COMMENT '手機號碼',
    id_number VARCHAR(50) UNIQUE COMMENT '身分證/護照號碼',
    residence VARCHAR(100) COMMENT '居住地',

    -- 系統資訊
    join_source VARCHAR(20) NOT NULL DEFAULT 'LINE'
        COMMENT '加入來源：LINE/CRM/PMS/ERP/系統',
    receive_notification BOOLEAN DEFAULT TRUE COMMENT '是否接收優惠通知',
    internal_note TEXT COMMENT '內部備註',
    last_interaction_at DATETIME COMMENT '最後互動時間',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_line_uid (line_uid),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_id_number (id_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**字段說明**:
- `line_uid`: LINE 官方帳號用戶唯一識別碼
- `last_interaction_at`: 僅會員主動發送訊息時更新，被動接收推播不更新
- `join_source`: 用於追蹤會員來源渠道

#### 4.2.2 Member_Tags (會員標籤表)

```sql
CREATE TABLE member_tags (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 關聯
    member_id BIGINT NOT NULL COMMENT '所屬會員',
    message_id BIGINT COMMENT '觸發來源訊息ID',

    -- 標籤資訊
    tag_name VARCHAR(20) NOT NULL COMMENT '標籤名稱',
    tag_source VARCHAR(20) NOT NULL COMMENT '標籤來源：CRM/PMS/問券/後台自訂',

    -- 統計資訊
    trigger_count INT DEFAULT 0 COMMENT '觸發次數',
    trigger_member_count INT DEFAULT 0 COMMENT '觸發會員數',
    last_triggered_at DATETIME COMMENT '最近觸發時間',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,

    -- 唯一約束（去重設計）
    UNIQUE KEY unique_member_tag_trigger (member_id, tag_name, message_id),

    -- 索引
    INDEX idx_member_id (member_id),
    INDEX idx_message_id (message_id),
    INDEX idx_tag_name (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**去重邏輯**:
- 同一會員對相同標籤在同一訊息中重複觸發僅計算一次
- 不同訊息來源可累計觸發次數

#### 4.2.3 Interaction_Tags (互動標籤定義表)

```sql
CREATE TABLE interaction_tags (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 標籤資訊
    tag_name VARCHAR(20) NOT NULL COMMENT '標籤名稱',
    tag_source VARCHAR(20) NOT NULL COMMENT '標籤來源：訊息模板/問券模板',

    -- 統計資訊
    trigger_count INT DEFAULT 0 COMMENT '觸發次數',
    trigger_member_count INT DEFAULT 0 COMMENT '觸發會員數',
    last_triggered_at DATETIME COMMENT '最近觸發時間',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 索引
    UNIQUE KEY unique_tag_name (tag_name),
    INDEX idx_tag_source (tag_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4.2.4 Messages (群發訊息表)

```sql
CREATE TABLE messages (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 關聯
    template_id BIGINT COMMENT '使用的訊息模板ID',
    campaign_id BIGINT COMMENT '關聯的活動ID',

    -- 訊息內容
    message_content TEXT COMMENT '訊息內容（用於列表顯示）',
    notification_text VARCHAR(200) COMMENT '通知推播文字（顯示在手機通知欄）',
    preview_text VARCHAR(200) COMMENT '通知預覽文字（用於預覽顯示）',
    flex_message_json MEDIUMTEXT COMMENT 'Flex Message JSON（最大 16MB）',
    interaction_tags JSON COMMENT '互動標籤',
    thumbnail VARCHAR(500) COMMENT '縮圖 URL',

    -- 發送配置
    send_time DATETIME COMMENT '傳送時間',
    send_status VARCHAR(20) DEFAULT '草稿'
        COMMENT '發送狀態：草稿/排程發送/已發送/發送失敗',
    scheduled_date DATE COMMENT '排程發送日期',
    scheduled_time TIME COMMENT '排程發送時間',
    failure_reason TEXT COMMENT '發送失敗原因',

    -- 目標對象
    target_type VARCHAR(20) DEFAULT '所有好友'
        COMMENT '傳送對象類型：所有好友/篩選目標對象',
    target_filter JSON COMMENT '篩選條件',
    trigger_condition VARCHAR(100) COMMENT '特定觸發條件',

    -- 統計資訊
    send_count INT DEFAULT 0 COMMENT '傳送人數',
    open_count INT DEFAULT 0 COMMENT '開啟次數',
    click_count INT DEFAULT 0 COMMENT '點擊次數',
    estimated_send_count INT DEFAULT 0 COMMENT '預計發送好友人數',
    available_quota INT DEFAULT 0 COMMENT '可用訊息配額',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE RESTRICT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,

    -- 索引
    INDEX idx_send_status (send_status),
    INDEX idx_send_time (send_time),
    INDEX idx_campaign_id (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**狀態轉換規則**:
- 草稿 ⇄ 排程發送 (可雙向轉換)
- 排程發送 → 已發送/發送失敗 (不可逆)

**不變條件**:
- `available_quota < estimated_send_count` 時，系統阻擋發送

#### 4.2.5 Message_Templates (訊息模板表)

```sql
CREATE TABLE message_templates (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 模板類型
    template_type VARCHAR(20) NOT NULL
        COMMENT '模板類型：text/text_button/image_click/image_card',

    -- 文字內容
    text_content TEXT COMMENT '文字內容',

    -- 圖片資訊
    image_url VARCHAR(500) COMMENT '圖片 URL',
    image_aspect_ratio VARCHAR(10) DEFAULT '1:1' COMMENT '圖片比例',

    -- 圖卡資訊
    title VARCHAR(100) COMMENT '標題',
    description TEXT COMMENT '內文描述',
    amount INT COMMENT '金額數值',

    -- 按鈕配置
    buttons JSON COMMENT '按鈕配置（JSON數組）',
    button_count INT DEFAULT 0 COMMENT '按鈕數量',

    -- 互動標籤
    interaction_tag_id BIGINT COMMENT '互動標籤ID',

    -- 動作配置
    action_type VARCHAR(20) COMMENT '動作類型：開啟網址/觸發文字/觸發圖片',
    action_url VARCHAR(500) COMMENT 'URL 網址',
    action_text TEXT COMMENT '觸發的訊息文字',
    action_image VARCHAR(500) COMMENT '觸發的圖片',

    -- 通知配置
    notification_message VARCHAR(100) COMMENT '通知訊息',
    preview_message VARCHAR(100) COMMENT '訊息預覽',

    -- 輪播配置
    carousel_count INT DEFAULT 1 COMMENT '輪播圖卡數量（2-9張）',

    -- Flex Message 混合儲存策略（v0.2 新增）
    flex_message_json MEDIUMTEXT COMMENT 'Flex Message JSON（< 10KB 存 DB）',
    flex_message_url VARCHAR(500) COMMENT 'CDN 儲存 URL（≥ 10KB 存 CDN）',
    flex_message_size INT COMMENT 'JSON 大小（bytes）',
    storage_type VARCHAR(10) COMMENT '儲存類型：database/cdn',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (interaction_tag_id) REFERENCES interaction_tags(id)
        ON DELETE SET NULL,

    -- 索引
    INDEX idx_template_type (template_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**模板類型**:
- `text`: 純文字（Template01）
- `text_button`: 文字按鈕確認型（Template02）
- `image_click`: 圖片點擊型（Template03）
- `image_card`: 圖卡按鈕型（Template04）

#### 4.2.6 Template_Carousel_Items (輪播圖卡表)

```sql
CREATE TABLE template_carousel_items (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 關聯
    template_id BIGINT NOT NULL COMMENT '所屬模板ID',

    -- 圖卡資訊
    image_url VARCHAR(500) NOT NULL COMMENT '圖片 URL',
    title VARCHAR(100) COMMENT '標題',
    description TEXT COMMENT '內文描述',
    amount INT COMMENT '金額',

    -- 排序
    order_index INT DEFAULT 0 COMMENT '排序順序',

    -- 互動配置
    image_click_action_type VARCHAR(20) COMMENT '圖片點擊動作類型',
    image_click_action_value VARCHAR(500) COMMENT '圖片點擊動作值',
    interaction_tag_id BIGINT COMMENT '互動標籤ID',

    -- 按鈕配置
    action_button JSON COMMENT '動作按鈕1',
    action_button2 JSON COMMENT '動作按鈕2',

    -- 統計
    click_count INT DEFAULT 0 COMMENT '點擊次數',
    unique_click_count INT DEFAULT 0 COMMENT '不重複點擊次數',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (template_id) REFERENCES message_templates(id)
        ON DELETE CASCADE,
    FOREIGN KEY (interaction_tag_id) REFERENCES interaction_tags(id)
        ON DELETE SET NULL,

    -- 索引
    INDEX idx_template_id (template_id),
    INDEX idx_order_index (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4.2.7 Campaigns (活動管理表 - 新)

```sql
CREATE TABLE campaigns (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 活動資訊
    campaign_name VARCHAR(100) NOT NULL COMMENT '活動名稱',
    campaign_tag VARCHAR(50) COMMENT '活動標籤',
    description TEXT COMMENT '活動描述',

    -- 活動時間
    campaign_date DATE COMMENT '活動日期',
    start_date DATE COMMENT '開始日期',
    end_date DATE COMMENT '結束日期',

    -- 活動狀態
    status VARCHAR(20) DEFAULT 'active'
        COMMENT '活動狀態：active/inactive/completed',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_campaign_date (campaign_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**與 Messages 的關係**:
- Campaign 1:N Messages（一個活動可包含多條消息）
- Messages.campaign_id 外鍵關聯（可選）
- 活動統計由關聯的多條消息聚合而來

**使用場景**:
- 母親節促銷活動（包含3條推播消息）
- 聖誕節活動（包含歡迎消息、提醒消息、最後召集消息）
- 會員日活動（包含預告、正式開始、結束感謝）

#### 4.2.7.1 Message_Deliveries (訊息發送追蹤表 - v0.2 新增)

```sql
CREATE TABLE message_deliveries (
    -- 主鍵
    delivery_id VARCHAR(50) PRIMARY KEY COMMENT '發送記錄唯一識別碼',

    -- 關聯
    message_id BIGINT NOT NULL COMMENT '群發訊息ID',
    member_id BIGINT NOT NULL COMMENT '會員ID',

    -- 發送狀態
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        COMMENT '狀態：pending/sending/sent/failed/opened/clicked',

    -- 時間追蹤
    sent_at DATETIME COMMENT '實際發送時間（UTC）',
    opened_at DATETIME COMMENT '開啟時間（UTC）',
    clicked_at DATETIME COMMENT '點擊時間（UTC）',

    -- 失敗處理
    failure_reason VARCHAR(500) COMMENT '發送失敗原因',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,

    -- 唯一約束
    UNIQUE KEY uq_message_delivery_member (message_id, member_id),

    -- 索引
    INDEX idx_member_status (member_id, delivery_status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_delivery_status (delivery_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**delivery_status 狀態流轉**:
```
pending → sending → sent → opened → clicked
          ↓
        failed
```

**業務價值**:
- ✅ 追蹤每個會員的發送狀態
- ✅ 支援失敗重試機制
- ✅ 精準統計開啟率、點擊率
- ✅ 實現「需回覆會員」功能
- ✅ 支援億級消息追蹤（通過索引優化）

**數據保留策略**:
- 最近 6 個月：保留完整 delivery 記錄
- 6 個月後：聚合為統計數據，刪除明細
- 長期保存：messages 表的 send_count、open_count、click_count 永久保留

#### 4.2.8 Auto_Responses (自動回應表)

```sql
CREATE TABLE auto_responses (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 關聯
    template_id BIGINT COMMENT '使用的訊息模板ID',

    -- 觸發配置
    trigger_type VARCHAR(20) NOT NULL
        COMMENT '觸發類型：welcome/keyword/time',
    response_content TEXT COMMENT '回應內容',

    -- 關鍵字配置
    keywords JSON COMMENT '關鍵字列表（最多20組）',

    -- 時間配置
    trigger_time_start TIME COMMENT '指定時間區間起始',
    trigger_time_end TIME COMMENT '指定時間區間結束',
    date_range_start DATE COMMENT '指定日期區間起始',
    date_range_end DATE COMMENT '指定日期區間結束',

    -- 狀態
    is_active BOOLEAN DEFAULT TRUE COMMENT '啟用狀態',

    -- 統計
    trigger_count INT DEFAULT 0 COMMENT '觸發次數',
    success_rate DECIMAL(5,2) DEFAULT 100.00 COMMENT '成功率',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (template_id) REFERENCES message_templates(id)
        ON DELETE SET NULL,

    -- 索引
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4.2.8.1 Auto_Response_Keywords (自動回應關鍵字表 - v0.2 補充)

```sql
CREATE TABLE auto_response_keywords (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 關聯
    response_id BIGINT NOT NULL COMMENT '自動回應ID',

    -- 關鍵字配置
    keyword_text VARCHAR(100) NOT NULL COMMENT '關鍵字文本',
    match_type VARCHAR(20) DEFAULT 'exact'
        COMMENT '匹配類型：exact（精確）/partial（部分）',

    -- 統計
    trigger_count INT DEFAULT 0 COMMENT '觸發次數',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (response_id) REFERENCES auto_responses(id) ON DELETE CASCADE,

    -- 唯一約束
    UNIQUE KEY uq_response_keyword (response_id, keyword_text),

    -- 索引
    INDEX idx_keyword (keyword_text),
    INDEX idx_response_id (response_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**關係說明**:
- AutoResponse 1:N AutoResponseKeyword（一個規則多個關鍵字）
- 最多 20 組關鍵字（業務規則限制）

#### 4.2.8.2 Auto_Response_Messages (自動回應訊息表 - v0.2 補充)

```sql
CREATE TABLE auto_response_messages (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 關聯
    response_id BIGINT NOT NULL COMMENT '自動回應ID',

    -- 訊息內容
    message_content TEXT NOT NULL COMMENT '訊息內容',

    -- 排序
    sequence_order INT NOT NULL COMMENT '訊息序號（1-5）',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (response_id) REFERENCES auto_responses(id) ON DELETE CASCADE,

    -- 唯一約束
    UNIQUE KEY uq_response_sequence (response_id, sequence_order),

    -- 索引
    INDEX idx_response_id (response_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**關係說明**:
- AutoResponse 1:N AutoResponseMessage（一個規則 1-5 條消息）
- sequence_order 保證消息發送順序

**業務規則**:
- 每個自動回應支援 1-5 筆訊息
- 訊息按 sequence_order 順序發送
- 關鍵字觸發時，依序發送所有關聯訊息

#### 4.2.9 PMS_Integrations (PMS 系統整合表)

```sql
CREATE TABLE pms_integrations (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 關聯
    member_id BIGINT COMMENT '關聯的會員ID',

    -- 身份識別
    id_number VARCHAR(50) COMMENT '身分證字號',
    phone VARCHAR(20) COMMENT '手機號碼',

    -- 住宿資訊
    stay_records JSON COMMENT '住宿紀錄資訊',
    room_type VARCHAR(50) COMMENT '房型',
    stay_date DATE COMMENT '住宿日期',

    -- 匹配狀態
    match_status VARCHAR(20) DEFAULT 'pending'
        COMMENT '匹配狀態：matched/pending/failed',
    match_rate DECIMAL(5,2) COMMENT '匹配率',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,

    -- 索引
    INDEX idx_member_id (member_id),
    INDEX idx_id_number (id_number),
    INDEX idx_phone (phone),
    INDEX idx_match_status (match_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**匹配邏輯**:
1. 優先使用 `id_number` 匹配
2. 若失敗則使用 `phone` 匹配
3. 目標匹配成功率 ≥ 95%

#### 4.2.10 Consumption_Records (消費記錄表)

```sql
CREATE TABLE consumption_records (
    -- 主鍵
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 關聯
    member_id BIGINT NOT NULL COMMENT '所屬會員',
    pms_integration_id BIGINT COMMENT 'PMS整合記錄ID',

    -- 消費資訊
    consumption_time DATETIME NOT NULL COMMENT '消費時間',
    amount DECIMAL(10,2) NOT NULL COMMENT '消費金額',
    room_type VARCHAR(50) COMMENT '房型或套餐',
    stay_duration INT COMMENT '住宿天數',

    -- 時間戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 外鍵
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (pms_integration_id) REFERENCES pms_integrations(id)
        ON DELETE SET NULL,

    -- 索引
    INDEX idx_member_id (member_id),
    INDEX idx_consumption_time (consumption_time),
    INDEX idx_amount (amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.3 數據表統計

| 類別 | 數據表 | 說明 |
|------|--------|------|
| 會員相關 | members, member_tags, member_interaction_records, message_records, consumption_records, pms_integrations | **6張表** |
| **訊息推播** | **messages, message_deliveries, message_templates, template_carousel_items** | **4張表**（含 v0.2 新增） |
| **活動管理** | **campaigns** | **1張表** |
| 標籤系統 | member_tags, interaction_tags, tag_trigger_logs | 3張表 |
| **自動回應** | **auto_responses, auto_response_keywords, auto_response_messages** | **3張表**（v0.2 補充） |
| PMS 整合 | pms_integrations, consumption_records | 2張表 |
| 問卷系統 | survey_templates, surveys, survey_questions, survey_responses | 4張表 |
| 系統管理 | users | 1張表 |
| **總計** | | **24張核心表**（v0.2 新增 2 張表） |

**v0.2 變更摘要**:
- ✅ 新增 `message_deliveries` 表（訊息發送追蹤）
- ✅ 新增 `auto_response_messages` 表（自動回應訊息）
- ✅ `messages` 表新增 `notification_text`、`preview_text` 欄位
- ✅ `message_templates` 表實施混合儲存策略欄位

### 4.4 索引策略

#### 高頻查詢索引
```sql
-- 會員查詢
CREATE INDEX idx_members_line_uid ON members(line_uid);
CREATE INDEX idx_members_email_phone ON members(email, phone);
CREATE INDEX idx_members_last_interaction ON members(last_interaction_at DESC);

-- 標籤查詢
CREATE INDEX idx_member_tags_member_tag ON member_tags(member_id, tag_name);
CREATE INDEX idx_interaction_tags_name ON interaction_tags(tag_name);

-- 訊息查詢
CREATE INDEX idx_messages_status_time ON messages(send_status, send_time DESC);
CREATE INDEX idx_message_recipients_member ON message_recipients(member_id, message_id);

-- PMS 匹配
CREATE INDEX idx_pms_id_phone ON pms_integrations(id_number, phone);
```

#### 複合索引優化
```sql
-- 會員搜索與篩選
CREATE INDEX idx_members_search ON members(
    line_name, name, email, phone, last_interaction_at DESC
);

-- 訊息統計查詢
CREATE INDEX idx_messages_stats ON messages(
    send_status, send_time, send_count, open_count, click_count
);
```

### 4.5 混合儲存策略（v0.2 新增）

#### 策略目標

優化 Flex Message JSON 的儲存，平衡數據庫性能與訪問效率。

#### 存儲判斷邏輯

**閾值：10KB**

| JSON 大小 | 儲存位置 | storage_type | 儲存欄位 | 性能特點 |
|-----------|---------|--------------|----------|---------|
| < 10KB | 數據庫 | `database` | `flex_message_json` | 快速訪問，無額外 HTTP 請求 |
| ≥ 10KB | CDN | `cdn` | `flex_message_url` | 減輕 DB 負載，利用 CDN 加速 |

#### 實現流程

**1. 保存流程**

```python
def save_flex_message(template: MessageTemplate, flex_json: dict):
    """
    保存 Flex Message，根據大小選擇儲存策略

    Args:
        template: 訊息模板對象
        flex_json: Flex Message JSON 數據
    """
    # 計算 JSON 大小
    json_string = json.dumps(flex_json, ensure_ascii=False)
    json_size = len(json_string.encode('utf-8'))

    # 記錄大小
    template.flex_message_size = json_size

    # 判斷儲存策略
    if json_size < 10 * 1024:  # 10KB
        # 策略 A：直接存入數據庫
        template.storage_type = 'database'
        template.flex_message_json = json_string
        template.flex_message_url = None
        logger.info(f"Template {template.id}: Stored in DB ({json_size} bytes)")

    else:
        # 策略 B：上傳到 CDN
        template.storage_type = 'cdn'

        # 生成唯一檔案名
        filename = f"flex_message_{template.id}_{uuid.uuid4().hex}.json"

        # 上傳到 CDN
        cdn_url = upload_to_cdn(
            content=json_string,
            filename=filename,
            content_type='application/json'
        )

        template.flex_message_url = cdn_url
        template.flex_message_json = None
        logger.info(f"Template {template.id}: Stored in CDN ({json_size} bytes) - {cdn_url}")

    return template
```

**2. 讀取流程**

```python
def get_flex_message(template: MessageTemplate) -> dict:
    """
    讀取 Flex Message，根據儲存類型選擇讀取策略

    Args:
        template: 訊息模板對象

    Returns:
        Flex Message JSON 對象
    """
    if template.storage_type == 'database':
        # 從數據庫讀取
        if not template.flex_message_json:
            raise ValueError(f"Template {template.id}: JSON not found in database")

        flex_message = json.loads(template.flex_message_json)
        logger.debug(f"Template {template.id}: Loaded from DB")

    elif template.storage_type == 'cdn':
        # 從 CDN 讀取
        if not template.flex_message_url:
            raise ValueError(f"Template {template.id}: CDN URL not found")

        try:
            response = httpx.get(template.flex_message_url, timeout=5.0)
            response.raise_for_status()
            flex_message = response.json()
            logger.debug(f"Template {template.id}: Loaded from CDN")

        except httpx.HTTPError as e:
            logger.error(f"CDN fetch failed: {e}")
            raise ValueError(f"Failed to fetch from CDN: {e}")

    else:
        raise ValueError(f"Invalid storage_type: {template.storage_type}")

    return flex_message
```

**3. CDN 上傳實現**

```python
async def upload_to_cdn(
    content: str,
    filename: str,
    content_type: str = 'application/json'
) -> str:
    """
    上傳內容到 CDN

    Args:
        content: 檔案內容
        filename: 檔案名稱
        content_type: MIME 類型

    Returns:
        CDN URL
    """
    # 配置 CDN（示例使用 AWS S3）
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY,
        aws_secret_access_key=settings.AWS_SECRET_KEY,
        region_name=settings.AWS_REGION
    )

    # 上傳到 S3
    bucket_name = settings.CDN_BUCKET_NAME
    object_key = f"flex_messages/{filename}"

    s3_client.put_object(
        Bucket=bucket_name,
        Key=object_key,
        Body=content.encode('utf-8'),
        ContentType=content_type,
        CacheControl='public, max-age=31536000',  # 1年緩存
    )

    # 生成 CloudFront URL
    cdn_url = f"https://{settings.CDN_DOMAIN}/{object_key}"

    logger.info(f"Uploaded to CDN: {cdn_url}")
    return cdn_url
```

#### 性能優化考量

| 方面 | 數據庫儲存 | CDN 儲存 |
|------|-----------|---------|
| **訪問速度** | 快（同一查詢） | 需額外 HTTP 請求（~50-200ms） |
| **DB 負載** | 增加（大 JSON 影響查詢效能） | 減少（僅存 URL） |
| **網路流量** | 無 | CDN 帶寬（可忽略成本） |
| **快取效果** | DB 查詢快取 | CDN 全球邊緣快取 |
| **並發處理** | 受 DB 連接池限制 | CDN 無限並發 |
| **適用場景** | 簡單模板（< 10KB） | 複雜輪播圖卡（≥ 10KB） |

**設計決策理由**：

1. ✅ **10KB 閾值**：基於實際測試，平衡 DB 性能與網路延遲
2. ✅ **小型 JSON 存 DB**：減少網路往返，提升響應速度
3. ✅ **大型 JSON 存 CDN**：避免 DB 性能問題，利用 CDN 全球加速
4. ✅ **自動判斷策略**：無需手動配置，系統自動優化

**預期效果**：

- 📈 DB 查詢速度提升 40-60%（大型模板場景）
- 📉 DB 儲存空間節省 30-50%（大型模板場景）
- 🚀 CDN 緩存命中率 > 95%（1年緩存策略）
- ⚡ 全球訪問延遲 < 200ms（CloudFront 邊緣節點）

#### 遷移策略

**現有數據遷移**：

```python
async def migrate_existing_templates():
    """
    將現有模板遷移到混合儲存策略
    """
    templates = await db.query(MessageTemplate).all()

    for template in templates:
        if template.flex_message_json and not template.storage_type:
            # 重新應用儲存策略
            flex_json = json.loads(template.flex_message_json)
            await save_flex_message(template, flex_json)
            await db.commit()

            logger.info(f"Migrated template {template.id}")
```

---

## 5. API 接口設計

### 5.1 API 設計原則

1. **RESTful 規範**: 使用標準 HTTP 方法 (GET, POST, PUT, PATCH, DELETE)
2. **統一響應格式**: 成功/失敗響應結構一致
3. **版本管理**: `/api/v1/` 前綴，支持多版本並存
4. **分頁支持**: 所有列表接口支持分頁
5. **過濾排序**: 支持靈活的篩選和排序參數
6. **錯誤處理**: 清晰的錯誤碼和錯誤信息

### 5.2 統一響應格式

#### 成功響應
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        // 返回數據
    },
    "timestamp": "2025-11-12T10:30:00Z"
}
```

#### 分頁響應
```json
{
    "code": 200,
    "message": "查詢成功",
    "data": {
        "items": [...],
        "total": 100,
        "page": 1,
        "limit": 20,
        "pages": 5
    },
    "timestamp": "2025-11-12T10:30:00Z"
}
```

#### 錯誤響應
```json
{
    "code": 400,
    "message": "請求參數錯誤",
    "errors": [
        {
            "field": "email",
            "message": "郵箱格式不正確"
        }
    ],
    "timestamp": "2025-11-12T10:30:00Z"
}
```

### 5.3 API 端點列表

#### 5.3.1 認證授權 API

| 方法 | 端點 | 說明 | 權限 |
|------|------|------|------|
| POST | `/api/v1/auth/login` | 用戶登錄 | 公開 |
| POST | `/api/v1/auth/logout` | 用戶登出 | 需認證 |
| POST | `/api/v1/auth/refresh` | 刷新令牌 | 需認證 |
| GET | `/api/v1/auth/me` | 獲取當前用戶信息 | 需認證 |

**登錄接口示例**:
```
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
    "username": "admin",
    "password": "password123"
}

Response:
{
    "code": 200,
    "message": "登錄成功",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer",
        "expires_in": 3600,
        "user": {
            "id": 1,
            "username": "admin",
            "role": "ADMIN"
        }
    }
}
```

#### 5.3.2 會員管理 API

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| GET | `/api/v1/members` | 獲取會員列表 | search, tags, source, sort_by, order, page, limit |
| GET | `/api/v1/members/count` | 會員統計 | source, tags |
| GET | `/api/v1/members/{id}` | 獲取會員詳情 | - |
| POST | `/api/v1/members` | 創建會員 | 會員信息 |
| PUT | `/api/v1/members/{id}` | 更新會員 | 會員信息 |
| DELETE | `/api/v1/members/{id}` | 刪除會員 | - |
| POST | `/api/v1/members/{id}/tags` | 添加標籤 | tag_ids[] |
| DELETE | `/api/v1/members/{id}/tags/{tag_id}` | 移除標籤 | - |
| PUT | `/api/v1/members/{id}/notes` | 更新備註 | internal_note |

**會員列表接口示例**:
```
GET /api/v1/members?search=張三&tags=VIP,常客&page=1&limit=20&sort_by=last_interaction_at&order=desc

Response:
{
    "code": 200,
    "data": {
        "items": [
            {
                "id": 1,
                "line_uid": "U1234567890abcdef",
                "line_name": "張三",
                "line_avatar": "https://...",
                "name": "張三",
                "email": "zhang@example.com",
                "phone": "0912345678",
                "tags": [
                    {"id": 1, "name": "VIP", "type": "member"},
                    {"id": 2, "name": "常客", "type": "member"},
                    {"id": 3, "name": "雙十優惠", "type": "interaction"}
                ],
                "created_at": "2025-01-01T10:00:00Z",
                "last_interaction_at": "2025-11-10T15:30:00Z"
            }
        ],
        "total": 150,
        "page": 1,
        "limit": 20,
        "pages": 8
    }
}
```

**創建會員接口示例**:
```
POST /api/v1/members
Content-Type: application/json

Request:
{
    "name": "王小明",
    "gender": "1",
    "birthday": "1990-05-15",
    "email": "wang@example.com",
    "phone": "0987654321",
    "id_number": "A123456789",
    "residence": "台北市",
    "receive_notification": true
}

Response:
{
    "code": 200,
    "message": "會員創建成功",
    "data": {
        "id": 101,
        "name": "王小明",
        "created_at": "2025-11-12T10:30:00Z"
    }
}
```

#### 5.3.3 群發訊息 API (Messages)

**基礎路徑**: `/api/v1/messages`

| 方法 | 端點 | 說明 | 權限 | v0.2 新增 |
|------|------|------|------|----------|
| GET | `/api/v1/messages` | 獲取訊息列表 | messages:read | - |
| GET | `/api/v1/messages/{id}` | 獲取訊息詳情 | messages:read | - |
| POST | `/api/v1/messages` | 創建群發訊息 | messages:create | - |
| PUT | `/api/v1/messages/{id}` | 更新訊息 | messages:update | - |
| DELETE | `/api/v1/messages/{id}` | 刪除訊息 | messages:delete | - |
| POST | `/api/v1/messages/{id}/send` | 立即發送 | messages:send | - |
| POST | `/api/v1/messages/{id}/schedule` | 排程發送 | messages:send | - |
| GET | `/api/v1/messages/{id}/deliveries` | **發送明細列表** | messages:read | **✅** |
| GET | `/api/v1/messages/{id}/stats` | **統計數據** | messages:read | **✅** |

**創建群發訊息接口示例（v0.2 更新）**:
```json
POST /api/v1/messages
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
    "template_id": 5,
    "message_content": "雙十優惠活動開跑！",
    "notification_text": "力麗飯店雙十優惠來了！",  // v0.2 新增
    "preview_text": "立即查看專屬優惠",           // v0.2 新增
    "campaign_id": 12,                          // v0.2 新增：可選關聯活動
    "target_type": "篩選目標對象",
    "target_filter": {
        "condition": "include",
        "tags": ["VIP", "常客"],
        "exclude_tags": ["黑名單"]
    },
    "scheduled_datetime_utc": "2025-11-20T02:00:00Z",  // UTC 時間
    "interaction_tags": ["雙十優惠"]
}

Response:
{
    "code": 200,
    "message": "訊息創建成功",
    "data": {
        "id": 50,
        "send_status": "排程發送",
        "estimated_send_count": 350,
        "available_quota": 1000,
        "scheduled_datetime_utc": "2025-11-20T02:00:00Z",
        "campaign": {                           // v0.2 新增
            "id": 12,
            "campaign_name": "雙十促銷活動"
        }
    }
}
```

**獲取發送明細接口（v0.2 新增）**:
```json
GET /api/v1/messages/{id}/deliveries?page=1&limit=20&status=sent
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "message": "查詢成功",
    "data": {
        "items": [
            {
                "delivery_id": "abc123...",
                "member_id": 1001,
                "member_name": "王小明",
                "delivery_status": "opened",
                "sent_at": "2025-11-20T02:05:00Z",
                "opened_at": "2025-11-20T02:15:00Z",
                "clicked_at": null
            }
        ],
        "total": 350,
        "page": 1,
        "limit": 20,
        "pages": 18
    }
}
```

**獲取統計數據接口（v0.2 新增）**:
```json
GET /api/v1/messages/{id}/stats
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "data": {
        "message_id": 50,
        "send_count": 350,
        "open_count": 280,
        "click_count": 150,
        "open_rate": 80.0,
        "click_rate": 42.86,
        "failed_count": 5,
        "status_breakdown": {
            "sent": 345,
            "failed": 5,
            "opened": 280,
            "clicked": 150
        }
    }
}
```

#### 5.3.4 活動管理 API (Campaigns)

**基礎路徑**: `/api/v1/campaigns`

**職責**: 活動容器管理與統計聚合

| 方法 | 端點 | 說明 | 權限 |
|------|------|------|------|
| GET | `/api/v1/campaigns` | 獲取活動列表 | campaigns:read |
| GET | `/api/v1/campaigns/{id}` | 獲取活動詳情 | campaigns:read |
| POST | `/api/v1/campaigns` | 創建活動 | campaigns:create |
| PUT | `/api/v1/campaigns/{id}` | 更新活動 | campaigns:update |
| DELETE | `/api/v1/campaigns/{id}` | 刪除活動 | campaigns:delete |
| GET | `/api/v1/campaigns/{id}/messages` | 活動下的訊息列表 | campaigns:read |
| GET | `/api/v1/campaigns/{id}/stats` | 活動聚合統計 | campaigns:read |

**創建活動接口示例**:
```json
POST /api/v1/campaigns
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
    "campaign_name": "2024母親節促銷活動",
    "campaign_tag": "母親節",
    "campaign_date": "2024-05-12",
    "description": "母親節特惠活動，包含預告、正式開跑、最後召集三波推播"
}

Response:
{
    "code": 200,
    "message": "活動創建成功",
    "data": {
        "id": 45,
        "campaign_name": "2024母親節促銷活動",
        "campaign_tag": "母親節",
        "campaign_date": "2024-05-12",
        "status": "active",
        "created_at": "2024-11-15T10:00:00Z"
    }
}
```

**獲取活動聚合統計**:
```json
GET /api/v1/campaigns/{id}/stats
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "data": {
        "campaign_id": 45,
        "campaign_name": "2024母親節促銷活動",
        "total_messages": 3,
        "total_sent": 15000,
        "total_opened": 12000,
        "total_clicked": 8000,
        "open_rate": 80.0,
        "click_rate": 53.33,
        "messages": [
            {
                "message_id": 201,
                "message_content": "母親節預告",
                "send_count": 5000,
                "open_count": 4100,
                "open_rate": 82.0,
                "sent_at": "2024-05-10T02:00:00Z"
            },
            {
                "message_id": 202,
                "message_content": "母親節正式開跑",
                "send_count": 5000,
                "open_count": 4000,
                "open_rate": 80.0,
                "sent_at": "2024-05-12T02:00:00Z"
            },
            {
                "message_id": 203,
                "message_content": "最後召集",
                "send_count": 5000,
                "open_count": 3900,
                "open_rate": 78.0,
                "sent_at": "2024-05-14T02:00:00Z"
            }
        ]
    }
}
```

#### 5.3.5 標籤管理 API

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| GET | `/api/v1/tags` | 獲取標籤列表 | type, source, page, limit |
| GET | `/api/v1/tags/stats` | 標籤統計 | - |
| GET | `/api/v1/tags/{id}` | 獲取標籤詳情 | - |
| GET | `/api/v1/tags/{id}/members` | 獲取標籤會員列表 | page, limit |
| POST | `/api/v1/tags` | 創建標籤 | 標籤配置 |
| PUT | `/api/v1/tags/{id}` | 更新標籤 | 標籤配置 |
| DELETE | `/api/v1/tags/{id}` | 刪除標籤 | - |

#### 5.3.6 訊息模板 API

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| GET | `/api/v1/templates` | 獲取模板列表 | type, page, limit |
| GET | `/api/v1/templates/{id}` | 獲取模板詳情 | - |
| POST | `/api/v1/templates` | 創建模板 | 模板配置 |
| PUT | `/api/v1/templates/{id}` | 更新模板 | 模板配置 |
| DELETE | `/api/v1/templates/{id}` | 刪除模板 | - |

**創建圖卡按鈕型模板示例**:
```
POST /api/v1/templates
Content-Type: application/json

Request:
{
    "template_type": "image_card",
    "title": "雙十優惠住宿專案",
    "description": "入住兩晚享8折優惠",
    "amount": 5999,
    "image_url": "https://example.com/room.jpg",
    "button_count": 2,
    "buttons": [
        {
            "text": "立即預訂",
            "action_type": "開啟網址",
            "action_url": "https://example.com/book"
        },
        {
            "text": "查看詳情",
            "action_type": "觸發文字",
            "action_text": "查看雙十優惠詳情"
        }
    ],
    "interaction_tag_id": 10,
    "notification_message": "限時優惠通知",
    "preview_message": "雙十優惠住宿專案",
    "carousel_count": 3
}

Response:
{
    "code": 200,
    "message": "模板創建成功",
    "data": {
        "id": 15,
        "template_type": "image_card",
        "title": "雙十優惠住宿專案",
        "created_at": "2025-11-12T10:30:00Z"
    }
}
```

#### 5.3.7 自動回應 API

**基本操作**:

| 方法 | 端點 | 說明 | 權限 | v0.2 |
|------|------|------|------|------|
| GET | `/api/v1/auto_responses` | 獲取自動回應列表 | auto_responses:read | ✅ |
| GET | `/api/v1/auto_responses/{id}` | 獲取自動回應詳情 | auto_responses:read | ✅ |
| POST | `/api/v1/auto_responses` | 創建自動回應 | auto_responses:write | ✅ |
| PUT | `/api/v1/auto_responses/{id}` | 更新自動回應 | auto_responses:write | ✅ |
| PATCH | `/api/v1/auto_responses/{id}/toggle` | 切換啟用狀態 | auto_responses:write | ✅ |
| DELETE | `/api/v1/auto_responses/{id}` | 刪除自動回應 | auto_responses:delete | ✅ |

**關鍵字管理** (v0.2 新增):

| 方法 | 端點 | 說明 | 權限 | v0.2 |
|------|------|------|------|------|
| GET | `/api/v1/auto_responses/{id}/keywords` | 獲取關鍵字列表 | auto_responses:read | **✅** |
| POST | `/api/v1/auto_responses/{id}/keywords` | 新增關鍵字 | auto_responses:write | **✅** |
| DELETE | `/api/v1/auto_responses/{id}/keywords/{keyword_id}` | 刪除關鍵字 | auto_responses:delete | **✅** |

**訊息管理** (v0.2 新增):

| 方法 | 端點 | 說明 | 權限 | v0.2 |
|------|------|------|------|------|
| GET | `/api/v1/auto_responses/{id}/messages` | 獲取訊息序列 | auto_responses:read | **✅** |
| PUT | `/api/v1/auto_responses/{id}/messages` | 批量更新訊息序列（1-5 筆）| auto_responses:write | **✅** |

**創建關鍵字自動回應示例**:
```json
POST /api/v1/auto_responses
Content-Type: application/json

Request:
{
    "trigger_type": "keyword",
    "response_content": "感謝您的詢問！",
    "template_id": 8,
    "is_active": true
}

Response:
{
    "code": 200,
    "message": "自動回應創建成功",
    "data": {
        "id": 20,
        "trigger_type": "keyword",
        "is_active": true,
        "created_at": "2025-11-15T10:30:00Z"
    }
}
```

**新增關鍵字示例** (v0.2):
```json
POST /api/v1/auto_responses/20/keywords
Content-Type: application/json

Request:
{
    "keyword_text": "訂房",
    "match_type": "exact"
}

Response:
{
    "code": 200,
    "message": "關鍵字新增成功",
    "data": {
        "id": 150,
        "response_id": 20,
        "keyword_text": "訂房",
        "match_type": "exact",
        "trigger_count": 0,
        "created_at": "2025-11-15T10:35:00Z"
    }
}
```

**獲取關鍵字列表示例** (v0.2):
```json
GET /api/v1/auto_responses/20/keywords

Response:
{
    "code": 200,
    "data": {
        "response_id": 20,
        "keywords": [
            {
                "id": 150,
                "keyword_text": "訂房",
                "match_type": "exact",
                "trigger_count": 45
            },
            {
                "id": 151,
                "keyword_text": "預訂",
                "match_type": "exact",
                "trigger_count": 32
            },
            {
                "id": 152,
                "keyword_text": "住宿",
                "match_type": "partial",
                "trigger_count": 28
            }
        ],
        "total": 3
    }
}
```

**批量更新訊息序列示例** (v0.2):
```json
PUT /api/v1/auto_responses/20/messages
Content-Type: application/json

Request:
{
    "messages": [
        {
            "sequence_order": 1,
            "message_content": "感謝您的詢問！我們提供優質住宿服務"
        },
        {
            "sequence_order": 2,
            "message_content": "請點擊以下連結查看房型與價格"
        },
        {
            "sequence_order": 3,
            "message_content": "或直接撥打訂房專線：02-1234-5678"
        }
    ]
}

Response:
{
    "code": 200,
    "message": "訊息序列更新成功",
    "data": {
        "response_id": 20,
        "messages_count": 3,
        "updated_at": "2025-11-15T10:40:00Z"
    }
}
```

**刪除關鍵字示例** (v0.2):
```json
DELETE /api/v1/auto_responses/20/keywords/152

Response:
{
    "code": 200,
    "message": "關鍵字刪除成功"
}
```

#### 5.3.8 PMS 系統整合 API

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| GET | `/api/v1/pms_integrations` | 獲取 PMS 記錄列表 | match_status, page, limit |
| GET | `/api/v1/pms_integrations/{id}` | 獲取 PMS 記錄詳情 | - |
| POST | `/api/v1/pms_integrations` | 創建 PMS 記錄 | PMS 數據 |
| POST | `/api/v1/pms_integrations/match` | 執行會員匹配 | batch_size |
| PUT | `/api/v1/pms_integrations/{id}` | 更新 PMS 記錄 | PMS 數據 |
| DELETE | `/api/v1/pms_integrations/{id}` | 刪除 PMS 記錄 | - |

#### 5.3.9 消費記錄 API

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| GET | `/api/v1/consumption_records` | 獲取消費記錄列表 | member_id, start_date, end_date, page, limit |
| GET | `/api/v1/consumption_records/{id}` | 獲取消費記錄詳情 | - |
| GET | `/api/v1/consumption_records/stats` | 消費統計 | member_id, start_date, end_date |
| POST | `/api/v1/consumption_records` | 創建消費記錄 | 消費數據 |
| PUT | `/api/v1/consumption_records/{id}` | 更新消費記錄 | 消費數據 |
| DELETE | `/api/v1/consumption_records/{id}` | 刪除消費記錄 | - |

#### 5.3.10 追蹤統計 API

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| POST | `/api/v1/tracking/interactions` | 記錄互動 | 互動數據 |
| GET | `/api/v1/tracking/campaigns/{id}/statistics` | 獲取訊息統計 | - |
| GET | `/api/v1/tracking/campaigns/{id}/interactions` | 獲取互動記錄 | page, limit |

#### 5.3.11 文件上傳 API

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| POST | `/api/v1/upload/upload` | 上傳圖片 | file (multipart/form-data) |

**上傳接口示例**:
```
POST /api/v1/upload/upload
Content-Type: multipart/form-data

Request:
--boundary
Content-Disposition: form-data; name="file"; filename="hotel-room.jpg"
Content-Type: image/jpeg

[binary data]
--boundary--

Response:
{
    "code": 200,
    "message": "上傳成功",
    "data": {
        "url": "http://localhost:8700/uploads/hotel-room_20251112103000.jpg",
        "filename": "hotel-room_20251112103000.jpg",
        "size": 245760,
        "mime_type": "image/jpeg"
    }
}
```

### 5.4 API 錯誤碼

| 錯誤碼 | 說明 | HTTP 狀態碼 |
|--------|------|-------------|
| 200 | 成功 | 200 OK |
| 201 | 創建成功 | 201 Created |
| 400 | 請求參數錯誤 | 400 Bad Request |
| 401 | 未認證 | 401 Unauthorized |
| 403 | 無權限 | 403 Forbidden |
| 404 | 資源不存在 | 404 Not Found |
| 409 | 資源衝突 | 409 Conflict |
| 422 | 驗證錯誤 | 422 Unprocessable Entity |
| 429 | 請求過於頻繁 | 429 Too Many Requests |
| 500 | 服務器內部錯誤 | 500 Internal Server Error |
| 503 | 服務不可用 | 503 Service Unavailable |

---

## 6. 核心業務模塊

### 6.1 會員管理模塊

#### 職責
- 會員基本資料 CRUD
- LINE 用戶集成
- 會員標籤管理
- 互動記錄追蹤
- 搜索與篩選

#### 核心流程

**會員註冊流程**:
```
1. 用戶關注 LINE 官方帳號
   ↓
2. LINE Webhook 觸發 (follow event)
   ↓
3. 獲取 LINE 用戶資料 (uid, name, avatar)
   ↓
4. 創建會員記錄 (join_source = 'LINE')
   ↓
5. 觸發歡迎訊息 (auto_response: welcome)
   ↓
6. 記錄創建日誌
```

**PMS 會員匹配流程**:
```
1. 接收 PMS 系統數據
   ↓
2. 創建 pms_integrations 記錄
   ↓
3. 嘗試匹配會員:
   a. 使用 id_number 匹配
   b. 若失敗，使用 phone 匹配
   ↓
4. 匹配成功:
   - 更新 member_id
   - match_status = 'matched'
   - 計算 match_rate
   - 同步住宿記錄到 consumption_records
   ↓
5. 匹配失敗:
   - 自動創建新會員
   - join_source = 'PMS'
   - match_status = 'failed'
```

#### 業務規則

1. **唯一性約束**:
   - `line_uid` 必須唯一
   - `id_number` 必須唯一
   - 同一用戶不可重複註冊

2. **最後互動時間更新規則**:
   - 僅會員主動發送訊息時更新
   - 被動接收推播訊息不更新
   - 用於判斷會員活躍度

3. **標籤管理規則**:
   - 會員可擁有多個標籤
   - 標籤分類：會員標籤、互動標籤
   - 標籤來源：CRM/PMS/問券/後台自訂/訊息模板

### 6.2 群發訊息模塊

#### 職責
- 訊息創建與編輯
- 目標受眾選擇
- 排程管理
- 訊息發送
- 統計追蹤

#### 核心流程

**群發訊息創建流程**:
```
1. 用戶創建訊息
   ↓
2. 選擇訊息模板 (template_id)
   ↓
3. 配置目標受眾:
   - 所有好友
   - 篩選目標對象 (標籤、條件)
   ↓
4. 計算預計發送人數 (estimated_send_count)
   ↓
5. 檢查訊息配額 (available_quota)
   - 若不足，阻擋發送
   ↓
6. 選擇發送方式:
   - 立即發送 → send_status = '已發送'
   - 排程發送 → send_status = '排程發送'
   - 儲存草稿 → send_status = '草稿'
   ↓
7. 創建訊息記錄 (messages 表)
```

**排程發送流程**:
```
1. APScheduler 定時檢查
   ↓
2. 查詢 send_status = '排程發送' 且到達發送時間的訊息
   ↓
3. 獲取目標受眾列表
   ↓
4. 批次發送 (每批 500 人):
   a. 調用 LINE Messaging API
   b. 創建 message_recipients 記錄
   c. 更新 send_count
   ↓
5. 發送完成:
   - send_status = '已發送'
   - send_time = 實際發送時間
   ↓
6. 發送失敗:
   - send_status = '發送失敗'
   - 記錄 failure_reason
```

#### 業務規則

1. **配額檢查**:
   - 發送前必須檢查 `available_quota >= estimated_send_count`
   - 若配額不足，系統阻擋發送並提示用戶

2. **狀態轉換規則**:
   - 草稿 ⇄ 排程發送 (可雙向轉換)
   - 排程發送 → 已發送 (不可逆)
   - 排程發送 → 發送失敗 (不可逆)

3. **目標受眾篩選邏輯**:
   ```python
   if target_type == '所有好友':
       recipients = all_members
   else:
       # 包含標籤
       if target_filter.tags:
           members = members.filter(tags__in=target_filter.tags)

       # 排除標籤
       if target_filter.exclude_tags:
           members = members.exclude(tags__in=target_filter.exclude_tags)

       recipients = members
   ```

4. **批次發送策略**:
   - 每批 500 人
   - 使用 LINE multicast API
   - 發送間隔 1 秒 (避免速率限制)

### 6.3 標籤管理模塊

#### 職責
- 標籤定義與管理
- 標籤觸發追蹤
- 標籤統計分析
- 會員標籤關聯

#### 標籤分類

**1. 會員標籤 (Member Tags)**:
- **來源**:
  - CRM: 消費金額達門檻、房型分類、訪問頻率
  - PMS: 住宿記錄、房型偏好
  - 問券: 性別、年齡區間、地區、生日月份
  - 後台自訂: VIP、黑名單

**2. 互動標籤 (Interaction Tags)**:
- **來源**:
  - 訊息模板: 檔期優惠、雙十、早鳥
  - 問券模板: 會員資料、滿意度調查

#### 核心流程

**標籤觸發流程**:
```
1. 用戶點擊訊息按鈕/連結
   ↓
2. 觸發 Webhook 或追蹤 API
   ↓
3. 記錄互動:
   - 創建 member_interaction_records
   - 更新 member_tags (若為會員標籤)
   ↓
4. 去重判斷:
   - 檢查 (member_id, tag_name, message_id) 是否已存在
   - 若存在，跳過
   - 若不存在，繼續
   ↓
5. 更新統計:
   - trigger_count += 1
   - trigger_member_count += 1 (不重複)
   - last_triggered_at = now()
   ↓
6. 更新 interaction_tags 統計
```

#### 業務規則

1. **去重邏輯**:
   - 唯一鍵: `(member_id, tag_name, message_id)`
   - 同一會員對相同標籤在同一訊息中重複觸發僅計算一次
   - 不同訊息來源可累計觸發次數

2. **標籤命名規則**:
   - 長度限制: 20 個字元
   - 中英文皆計算
   - 不允許特殊字符: `<>{}[]|\/`

3. **標籤刪除規則**:
   - 軟刪除: 保留歷史數據
   - 硬刪除: 同時刪除關聯的 member_tags 記錄

### 6.4 自動回應模塊

#### 職責
- 自動回應規則配置
- 關鍵字匹配
- 時間觸發
- 歡迎訊息

#### 觸發類型

**1. 新好友歡迎訊息 (welcome)**:
- 觸發時機: 用戶關注 LINE 官方帳號
- 發送時機: 立即發送
- 數量限制: 可設定 1-5 筆回應訊息

**2. 關鍵字觸發 (keyword)**:
- 觸發時機: 用戶發送訊息包含關鍵字
- 匹配邏輯:
  - 完全符合: 訊息文字 == 關鍵字
  - 包含關鍵字: 訊息文字 contains 關鍵字
- 關鍵字數量: 最多 20 組

**3. 指定時間觸發 (time)**:
- 觸發時機: 用戶發送訊息在指定時間範圍內
- 時間配置:
  - 時間區間: `trigger_time_start` ~ `trigger_time_end`
  - 日期區間: `date_range_start` ~ `date_range_end`
- 應用場景: 非營業時間自動回應

#### 核心流程

**關鍵字自動回應流程**:
```
1. 用戶發送訊息
   ↓
2. LINE Webhook 觸發 (message event)
   ↓
3. 獲取訊息文字
   ↓
4. 查詢啟用的關鍵字自動回應 (is_active = true)
   ↓
5. 匹配關鍵字:
   - 遍歷所有關鍵字
   - 完全符合或包含匹配
   ↓
6. 匹配成功:
   - 獲取回應內容 (response_content 或 template_id)
   - 發送回應訊息
   - trigger_count += 1
   - 記錄觸發日誌
   ↓
7. 匹配失敗:
   - 不回應
```

#### 業務規則

1. **優先級規則**:
   - 關鍵字匹配優先於時間觸發
   - 完全符合優先於包含匹配
   - 若多個關鍵字匹配，僅回應第一個

2. **回應數量限制**:
   - 每個自動回應可設定 1-5 筆訊息
   - 按順序依次發送

3. **關鍵字去重**:
   - 同一自動回應不可重複關鍵字
   - 不同自動回應可重複關鍵字

4. **啟用狀態控制**:
   - `is_active = false` 時，不觸發
   - 支持快速停用/啟用

### 6.5 PMS 系統整合模塊

#### 職責
- PMS 數據接收
- 會員匹配
- 住宿記錄同步
- 消費記錄管理

#### 會員匹配邏輯

**匹配規則**:
```python
def match_member(pms_data):
    # 優先使用身分證號匹配
    if pms_data.id_number:
        member = Member.query.filter_by(id_number=pms_data.id_number).first()
        if member:
            return member, 100  # 匹配率 100%

    # 若失敗，使用手機號碼匹配
    if pms_data.phone:
        member = Member.query.filter_by(phone=pms_data.phone).first()
        if member:
            return member, 95  # 匹配率 95%

    # 若都失敗，創建新會員
    new_member = Member.create(
        name=pms_data.name,
        id_number=pms_data.id_number,
        phone=pms_data.phone,
        join_source='PMS'
    )
    return new_member, 0  # 匹配率 0%（新建）
```

#### 數據同步流程

**PMS 數據導入流程**:
```
1. 接收 PMS 系統數據 (CSV/API)
   ↓
2. 數據驗證:
   - 必填字段檢查
   - 格式驗證
   ↓
3. 批次處理:
   for each record in pms_data:
       a. 創建 pms_integrations 記錄
       b. 執行會員匹配
       c. 若匹配成功:
          - 更新 member_id
          - 同步住宿記錄
          - 創建 consumption_records
       d. 若匹配失敗:
          - 創建新會員
          - 標記 match_status = 'failed'
   ↓
4. 生成匹配報告:
   - 總記錄數
   - 匹配成功數
   - 匹配失敗數
   - 匹配成功率
```

#### 業務規則

1. **匹配成功率目標**: ≥ 95%

2. **數據更新策略**:
   - 定期同步: 每日凌晨 3:00
   - 增量更新: 僅處理新增或變更的記錄

3. **住宿記錄同步規則**:
   - 每筆住宿記錄創建一條 consumption_records
   - 金額、房型、住宿日期同步

### 6.6 消息發送追蹤模塊 (v0.2 新增)

#### 職責
- 個別會員發送追蹤
- 發送狀態管理
- 互動行為追蹤（開啟、點擊）
- 發送失敗處理
- 統計數據聚合

#### 核心功能

**1. 個別發送追蹤**:
- 每筆群發訊息針對每位會員創建獨立的 `message_deliveries` 記錄
- 追蹤完整生命週期：pending → sending → sent → opened → clicked
- 記錄發送失敗原因，支持重試機制

**2. 狀態轉換流程**:
```
pending (待發送)
   ↓
sending (發送中)
   ↓ (成功)        ↓ (失敗)
sent (已發送)    failed (發送失敗)
   ↓
opened (已開啟)
   ↓
clicked (已點擊)
```

#### 核心流程

**消息發送追蹤流程**:
```
1. 創建群發訊息 (POST /api/v1/messages)
   ↓
2. 計算目標受眾 (根據 target_filter)
   ↓
3. 批量創建 message_deliveries 記錄:
   - delivery_status = 'pending'
   - 為每位會員創建一筆記錄
   ↓
4. APScheduler 觸發發送任務:
   ↓
5. 批次處理 (每批 500 筆):
   for each batch in deliveries:
       a. 更新狀態: delivery_status = 'sending'
       b. 調用 LINE Messaging API (multicast)
       c. API 回應成功:
          - delivery_status = 'sent'
          - sent_at = now()
       d. API 回應失敗:
          - delivery_status = 'failed'
          - failure_reason = error_message
   ↓
6. 統計聚合:
   - 更新 messages.actual_send_count
   - 計算發送成功率
```

**互動追蹤流程**:
```
1. 會員開啟推播通知
   ↓
2. LINE 發送 Webhook 事件
   ↓
3. 查詢對應的 message_deliveries 記錄
   ↓
4. 更新狀態:
   - delivery_status = 'opened'
   - opened_at = now()
   ↓
5. 會員點擊訊息中的按鈕/連結
   ↓
6. 追蹤 API 記錄點擊事件
   ↓
7. 更新狀態:
   - delivery_status = 'clicked'
   - clicked_at = now()
   ↓
8. 聚合統計更新:
   - 更新 messages 表的開啟率、點擊率
   - 更新 campaigns 表的整體統計
```

**發送失敗重試流程**:
```
1. APScheduler 定時檢查失敗記錄
   ↓
2. 查詢 delivery_status = 'failed' 且重試次數 < 3
   ↓
3. 分析失敗原因:
   - 網路錯誤 → 重試
   - 會員封鎖 → 標記不重試
   - API 配額不足 → 暫緩重試
   ↓
4. 執行重試:
   - retry_count += 1
   - delivery_status = 'sending'
   ↓
5. 重試成功:
   - delivery_status = 'sent'
   - sent_at = now()
   ↓
6. 重試失敗 (3 次後):
   - 標記為永久失敗
   - 通知管理員
```

#### 業務規則

1. **狀態轉換規則**:
   - `pending` → `sending` → `sent|failed`（單向）
   - `sent` → `opened` → `clicked`（單向累進）
   - `failed` 狀態可重試最多 3 次

2. **批次發送策略**:
   - 每批 500 筆記錄
   - 使用 LINE multicast API
   - 發送間隔 1 秒（避免速率限制）
   - 記錄每批次的發送時間

3. **互動追蹤規則**:
   - 開啟追蹤：基於 LINE Webhook 的 beacon event
   - 點擊追蹤：透過追蹤 API 記錄（參數 delivery_id + action）
   - 同一會員僅記錄首次開啟和首次點擊

4. **統計聚合規則**:
   ```python
   # Messages 表聚合
   total_sent = count(delivery_status IN ['sent', 'opened', 'clicked'])
   total_opened = count(delivery_status IN ['opened', 'clicked'])
   total_clicked = count(delivery_status = 'clicked')
   open_rate = (total_opened / total_sent) * 100
   click_rate = (total_clicked / total_sent) * 100

   # Campaigns 表聚合（跨多筆 Messages）
   campaign.total_sent = sum(messages.total_sent)
   campaign.total_opened = sum(messages.total_opened)
   campaign.total_clicked = sum(messages.total_clicked)
   campaign.open_rate = (campaign.total_opened / campaign.total_sent) * 100
   campaign.click_rate = (campaign.total_clicked / campaign.total_sent) * 100
   ```

5. **失敗處理策略**:
   - 網路錯誤 (5xx)：自動重試，間隔 5 分鐘
   - 會員封鎖 (403)：標記為失敗，不重試
   - 配額不足 (429)：暫緩發送，等待配額恢復
   - 無效 UID (404)：標記會員為無效，不重試

6. **性能優化**:
   - 使用索引加速查詢：`idx_delivery_status_sent_at`
   - 分區表設計：按月分區（`delivery_partitions`）
   - 批量更新：使用 bulk update 減少數據庫操作
   - 異步處理：發送和統計聚合使用後台任務

#### 集成點

**與 Messages API 集成**:
- `GET /api/v1/messages/{id}/deliveries`：查詢發送明細
- `GET /api/v1/messages/{id}/stats`：獲取統計數據

**與 Campaigns API 集成**:
- `GET /api/v1/campaigns/{id}/stats`：聚合所有訊息的統計

**與追蹤 API 集成**:
- `POST /api/v1/tracking/interactions`：記錄互動行為

---

## 7. 安全設計

### 7.1 認證機制

#### JWT 認證
- **算法**: HS256
- **Token 有效期**: 60 分鐘 (可配置)
- **Payload**:
  ```json
  {
      "sub": "user_id",
      "exp": 1699876543,
      "role": "ADMIN"
  }
  ```

#### 認證流程
```
1. 用戶登錄
   ↓
2. 驗證用戶名/密碼
   ↓
3. 生成 JWT Token
   ↓
4. 返回 access_token
   ↓
5. 客戶端攜帶 Token 請求
   Authorization: Bearer <access_token>
   ↓
6. 服務端驗證 Token
   - 解碼 Token
   - 驗證簽名
   - 檢查過期時間
   ↓
7. 提取用戶信息
   ↓
8. 執行業務邏輯
```

### 7.2 密碼安全

#### 密碼加密
- **算法**: Bcrypt
- **Salt Rounds**: 12
- **密碼強度要求**:
  - 最小長度: 8 位
  - 必須包含: 大小寫字母、數字、特殊字符

#### 密碼處理流程
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 密碼加密
hashed = pwd_context.hash("plain_password")

# 密碼驗證
is_valid = pwd_context.verify("plain_password", hashed)
```

### 7.3 權限控制

#### 角色權限矩陣

| 資源 | ADMIN | MARKETING | CUSTOMER_SERVICE |
|------|-------|-----------|------------------|
| 會員管理 | CRUD | R | RU |
| 群發訊息 | CRUD | CRUD | R |
| 標籤管理 | CRUD | RU | RU |
| 自動回應 | CRUD | CRUD | R |
| 系統配置 | CRUD | - | - |
| 用戶管理 | CRUD | - | - |

**權限說明**:
- C: Create (創建)
- R: Read (讀取)
- U: Update (更新)
- D: Delete (刪除)

#### 權限檢查
```python
from app.core.security import check_permission

@router.post("/members")
async def create_member(
    member_data: MemberCreate,
    current_user: User = Depends(get_current_user)
):
    # 檢查權限
    check_permission(current_user, "members", "create")

    # 執行業務邏輯
    ...
```

### 7.4 數據安全

#### 敏感數據加密
- **身分證號**: AES-256 加密存儲
- **手機號碼**: 部分遮罩顯示 (0912***678)
- **Email**: 部分遮罩顯示 (user***@example.com)

#### SQL 注入防護
- 使用 ORM (SQLAlchemy) 參數化查詢
- 禁止拼接 SQL 語句
- 輸入驗證與清理

#### XSS 防護
- 前端輸出轉義
- Content-Security-Policy 頭部
- 禁止 HTML 標籤輸入

#### CSRF 防護
- 使用 CSRF Token
- SameSite Cookie 屬性

### 7.5 API 安全

#### 速率限制
- **全局限制**: 100 req/min
- **登錄限制**: 5 req/min
- **上傳限制**: 10 req/min

#### CORS 配置
```python
# 開發環境
allow_origins = ["*"]

# 生產環境
allow_origins = [
    "https://example.com",
    "https://admin.example.com"
]
```

#### 請求驗證
- Content-Type 檢查
- Payload 大小限制: 10MB
- 文件類型白名單

---

## 8. 性能優化策略

### 8.1 數據庫優化

#### 索引策略
- 高頻查詢字段添加索引
- 複合索引優化多條件查詢
- 覆蓋索引減少回表查詢

#### 查詢優化
- 使用 `select_related` 和 `joinedload` 減少查詢次數
- 避免 N+1 查詢問題
- 分頁查詢避免全表掃描

#### 連接池配置
```python
DATABASE_POOL_SIZE = 20
DATABASE_MAX_OVERFLOW = 10
```

### 8.2 緩存策略

#### Redis 緩存
- **會員信息**: TTL 10 分鐘
- **標籤列表**: TTL 30 分鐘
- **統計數據**: TTL 5 分鐘

#### 緩存模式
- Cache-Aside: 先查緩存，再查數據庫
- Write-Through: 寫入時同時更新緩存
- Cache Invalidation: 數據變更時清除緩存

### 8.3 異步處理

#### 異步 I/O
- 全面使用 async/await 模式
- 異步數據庫操作 (aiomysql)
- 異步 HTTP 請求 (httpx)

#### 後台任務
- 使用 APScheduler 處理定時任務
- 訊息推送異步執行
- 統計數據異步計算

### 8.4 批次操作

#### LINE 訊息批次發送
```python
# 每批 500 人
batch_size = 500
for i in range(0, len(recipients), batch_size):
    batch = recipients[i:i+batch_size]
    await line_bot_api.multicast(batch, messages)
    await asyncio.sleep(1)  # 避免速率限制
```

#### 數據批次導入
```python
# 每批 1000 條記錄
batch_size = 1000
for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    await db.bulk_insert_mappings(Member, batch)
    await db.commit()
```

---

## 9. 部署架構

### 9.1 部署環境

#### 開發環境
- **服務器**: 本地開發機
- **數據庫**: MySQL 8.0 (localhost)
- **端口**: 8000 (FastAPI), 3306 (MySQL)

#### 生產環境
- **服務器**: 雲服務器 (AWS/GCP/Azure)
- **數據庫**: MySQL 8.0 (RDS)
- **反向代理**: Nginx
- **進程管理**: Supervisor/Systemd
- **HTTPS**: Let's Encrypt SSL 證書

### 9.2 部署配置

#### Nginx 配置
```nginx
server {
    listen 80;
    server_name api.example.com;

    # 靜態資源
    location /uploads/ {
        alias /data2/lili_hotel/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Supervisor 配置
```ini
[program:lili_hotel_api]
command=/usr/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
directory=/data2/lili_hotel/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/lili_hotel/api.log
```

### 9.3 啟動命令

#### 開發模式
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 生產模式
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 數據庫遷移
```bash
# 生成遷移文件
alembic revision --autogenerate -m "description"

# 執行遷移
alembic upgrade head

# 回滾遷移
alembic downgrade -1
```

### 9.4 監控與日誌

#### 日誌配置
```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("backend.log"),
        logging.StreamHandler()
    ]
)
```

#### 監控指標
- API 響應時間
- 數據庫查詢時間
- 緩存命中率
- 錯誤率
- 請求量 (QPS)

---

## 10. 附錄

### 10.1 環境變量配置

```bash
# 應用配置
DEBUG=True
ENVIRONMENT=development

# 數據庫配置
DATABASE_URL=mysql+aiomysql://user:password@localhost:3306/lili_hotel
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# JWT 配置
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# LINE API 配置
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret

# OpenAI 配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_BASE_URL=https://api.openai.com/v1

# CORS 配置
ALLOWED_ORIGINS=*

# 文件上傳配置
UPLOAD_DIR=/data2/lili_hotel/backend/public/uploads
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp

# 公共 URL
PUBLIC_BASE=http://localhost:8700
```

### 10.2 常用命令

#### 啟動服務
```bash
cd /data2/lili_hotel/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 數據庫操作
```bash
# 創建數據庫
mysql -u root -p -e "CREATE DATABASE lili_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 執行遷移
alembic upgrade head

# 查看遷移歷史
alembic history

# 回滾遷移
alembic downgrade -1
```

#### 依賴管理
```bash
# 安裝依賴
pip install -r requirements.txt

# 更新依賴
pip freeze > requirements.txt
```

### 10.3 API 測試示例

#### 使用 cURL 測試

**登錄**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

**獲取會員列表**:
```bash
curl -X GET "http://localhost:8000/api/v1/members?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**創建會員**:
```bash
curl -X POST http://localhost:8000/api/v1/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "張三",
    "email": "zhang@example.com",
    "phone": "0912345678"
  }'
```

### 10.4 故障排查

#### 常見問題

**1. 數據庫連接失敗**:
- 檢查 DATABASE_URL 配置
- 確認 MySQL 服務啟動
- 檢查網絡連接

**2. LINE API 調用失敗**:
- 檢查 CHANNEL_ACCESS_TOKEN 是否正確
- 確認 LINE 官方帳號狀態
- 查看 LINE API 錯誤日誌

**3. 文件上傳失敗**:
- 檢查 UPLOAD_DIR 權限
- 確認文件大小未超過限制
- 檢查文件類型是否允許

### 10.5 版本更新記錄

#### v0.2 (2025-11-15)
- 數據庫架構重構
- Messages（群發訊息）與 Campaigns（活動管理）職責清晰分離
- 新增 MessageDelivery 表（個別會員發送追蹤）
- 標籤系統優化（雙表設計：AutoResponseKeyword、AutoResponseMessage）
- 實施混合儲存策略（DB + CDN）
- 新增 12 組效能索引
- 所有 string 欄位定義長度約束

#### v0.1 (2025-01-01)
- 初始版本發布
- 會員管理功能
- 群發訊息功能
- 標籤管理功能
- LINE API 集成

### 10.6 數據庫優化摘要 (v0.2)

#### 優化範圍
- **優化日期**: 2025-11-14
- **優化級別**: Critical、High、Medium
- **修改表格**: 8 個
- **新增表格**: 1 個（MessageDelivery）
- **新增/修改欄位**: 45+ 個
- **新增索引**: 12 組

#### Critical 級別優化（已完成）

1. **Campaign 與 Message 關係重新定義**
   - Campaign 作為行銷活動容器，支援多波次訊息管理
   - Message 新增 `campaign_id` 外鍵（可選）
   - 建立 Campaign 1:N Message 關係
   - 支援活動層級的數據統計

2. **所有 String 欄位定義長度約束**
   - 為 30+ 個關鍵欄位定義明確長度約束
   - 修改表格：Member、MemberTag、TagRule、Message、MessageTemplate、AutoResponse、Campaign
   - 前端表單驗證規則明確，防止資料異常

3. **修正 Member.gender 邏輯**
   - 改為可選欄位（允許 NULL）
   - 移除預設值 0
   - 值域調整為 `1=男 / 2=女`

#### High 級別優化（已完成）

4. **新增關鍵效能索引**
   - Member 表索引（5 組）：email, phone, id_number, last_interaction, join_source
   - Message 表索引（4 組）：send_status, scheduled_time, sent_time, campaign
   - 預期效能提升：會員搜尋速度提升 70%+，排程任務查詢 < 100ms

5. **MessageTemplate 支援 CDN 儲存策略**
   - 新增欄位：`flex_message_url`, `flex_message_size`, `storage_type`
   - 儲存邏輯：< 10KB 存 DB，≥ 10KB 存 CDN
   - 解決圖片上傳導致 JSON 過大問題
   - 預期效能提升 30-50%

6. **新增 MessageDelivery 明細表**
   - 追蹤個別會員的發送狀態（pending → sending → sent → failed → opened → clicked）
   - 支援失敗重試機制
   - 精準統計開啟率、點擊率
   - 索引設計：message_member, member_status, sent_time_index

#### Medium 級別優化（已完成）

7. **擴展 TagRule 支援更多來源**
   - 擴展 `tag_source` 值域：CRM / PMS / 問券 / 後台自訂 / LINE互動
   - 提升系統擴展性

8. **增強 AutoResponse 排程能力**
   - 新增 `weekdays` 欄位
   - 支援週期性規則：如「每週一至週五 18:00-09:00」
   - 減少重複規則配置

#### 預期效能提升

| 優化項目 | 預期效果 |
|---------|---------|
| 會員搜尋速度 | **提升 70%+** |
| 排程任務查詢 | **< 100ms** |
| MessageTemplate 讀取 | **提升 30-50%** |
| 會話驗證時間 | **< 50ms** |

#### 風險評估與緩解措施

**高風險項目**:
1. MessageDelivery 表資料量增長
   - 緩解措施：設定 90 天保留期限、建立資料清理排程任務

2. Campaign 關係調整
   - 緩解措施：實施前掃描既有資料、制定資料遷移計畫

**中風險項目**:
1. String 長度約束
   - 緩解措施：實施前掃描既有資料、必要時調整限制值

2. 索引新增
   - 緩解措施：監控寫入效能指標

#### 實施順序建議

**Phase 1: 基礎優化（Week 1-2）**
- 定義 string 長度標準文檔
- 修改 erm.dbml
- 生成資料庫遷移腳本

**Phase 2: 效能優化（Week 3-4）**
- 新增效能索引
- 驗證查詢效能提升
- 修改 MessageTemplate（新增 CDN 儲存欄位）

**Phase 3: 功能增強（Week 5-6）**
- 新增 MessageDelivery 表
- 實施資料清理機制
- 擴展 TagRule 與 AutoResponse 功能

**Phase 4: 部署與驗證（Week 7-8）**
- 準備生產環境遷移計畫
- 分階段部署
- 監控效能指標

#### 完整文檔參考

詳細的優化分析、修改明細、業務價值評估請參考：
- **文檔路徑**: `01/spec/DATABASE_OPTIMIZATION_SUMMARY.md`
- **文檔版本**: 1.0
- **生成日期**: 2025-11-14

---

## 11. 多語言與國際化

### 11.1 i18n 錯誤處理規範

#### 設計理念

為確保系統的國際化能力和錯誤訊息的一致性，系統採用 i18n（國際化）多語言錯誤訊息鍵值機制。

#### 錯誤訊息格式定義

**鍵值命名規範**: `error.{module}.{field}.{type}`

| 組成部分 | 說明 | 範例 |
|---------|------|------|
| error | 固定前綴 | error |
| module | 模組名稱 | tag, member, message, campaign |
| field | 欄位名稱 | name, email, quota, status |
| type | 錯誤類型 | required, invalid, too_long, insufficient |

#### 錯誤訊息鍵值範例

**常見錯誤類型**:
```
error.tag.name.required          - 標籤名稱為必填
error.tag.name.too_long          - 標籤名稱超過長度限制
error.member.email.invalid       - 電子信箱格式不正確
error.member.phone.invalid       - 手機號碼格式不正確
error.message.quota.insufficient - 訊息配額不足
error.campaign.status.invalid    - 活動狀態不正確
error.template.json.too_large    - 模板 JSON 過大
error.delivery.failed.network    - 發送失敗（網路錯誤）
```

#### 後端 API 回應格式

**標準錯誤回應結構**:
```json
{
  "success": false,
  "error": {
    "code": "error.tag.name.too_long",
    "params": {
      "maxLength": 20,
      "currentLength": 25
    },
    "message": "標籤名稱不得超過 20 個字元"
  },
  "data": null
}
```

**欄位說明**:
- `code`: 錯誤訊息鍵值（用於 i18n 轉換）
- `params`: 動態參數（用於訊息模板替換）
- `message`: 預設訊息（繁體中文）

#### 前端處理流程

1. **接收後端錯誤回應**
   ```javascript
   const response = await api.createTag({ name: "這是一個超過二十個字元的標籤名稱" });
   // response.error.code = "error.tag.name.too_long"
   // response.error.params = { maxLength: 20, currentLength: 25 }
   ```

2. **透過 i18n 系統轉換**
   ```javascript
   const errorMessage = i18n.t(response.error.code, response.error.params);
   // 繁體中文: "標籤名稱不得超過 20 個字元（目前：25 個字元）"
   // 英文: "Tag name must not exceed 20 characters (current: 25 characters)"
   ```

3. **顯示錯誤訊息**
   ```javascript
   toast.error(errorMessage);
   ```

#### i18n 資源檔範例

**繁體中文 (zh-TW.json)**:
```json
{
  "error": {
    "tag": {
      "name": {
        "required": "標籤名稱為必填",
        "too_long": "標籤名稱不得超過 {{maxLength}} 個字元（目前：{{currentLength}} 個字元）",
        "invalid_chars": "標籤名稱不得包含特殊字元：{{chars}}"
      }
    },
    "member": {
      "email": {
        "invalid": "電子信箱格式不正確",
        "duplicate": "此電子信箱已被使用"
      },
      "phone": {
        "invalid": "手機號碼格式不正確（格式：09xxxxxxxx）"
      }
    },
    "message": {
      "quota": {
        "insufficient": "訊息配額不足（可用：{{available}}，需要：{{required}}）"
      }
    }
  }
}
```

**英文 (en-US.json)**:
```json
{
  "error": {
    "tag": {
      "name": {
        "required": "Tag name is required",
        "too_long": "Tag name must not exceed {{maxLength}} characters (current: {{currentLength}} characters)",
        "invalid_chars": "Tag name must not contain special characters: {{chars}}"
      }
    },
    "member": {
      "email": {
        "invalid": "Invalid email format",
        "duplicate": "This email is already in use"
      },
      "phone": {
        "invalid": "Invalid phone number format (format: 09xxxxxxxx)"
      }
    },
    "message": {
      "quota": {
        "insufficient": "Insufficient message quota (available: {{available}}, required: {{required}})"
      }
    }
  }
}
```

#### 後端實作範例

**Python (FastAPI)**:
```python
from pydantic import BaseModel
from typing import Optional, Dict, Any

class ErrorResponse(BaseModel):
    code: str
    params: Optional[Dict[str, Any]] = None
    message: str

class APIResponse(BaseModel):
    success: bool
    error: Optional[ErrorResponse] = None
    data: Optional[Any] = None

# 使用範例
@app.post("/api/v1/tags")
async def create_tag(tag: TagCreate):
    if len(tag.name) > 20:
        return APIResponse(
            success=False,
            error=ErrorResponse(
                code="error.tag.name.too_long",
                params={
                    "maxLength": 20,
                    "currentLength": len(tag.name)
                },
                message="標籤名稱不得超過 20 個字元"
            )
        )
    # ...
```

#### 系統優勢

1. **多語言支援**
   - 輕鬆擴展至其他語言（英文、日文、簡體中文等）
   - 語言切換無需修改後端代碼

2. **訊息集中管理**
   - 所有錯誤訊息在 i18n 資源檔中統一維護
   - 修改訊息文案無需重新編譯

3. **參數化訊息**
   - 支援動態參數，提供更精確的錯誤資訊
   - 避免硬編碼數值和限制

4. **一致性**
   - 確保全系統錯誤訊息格式一致
   - 前後端使用相同的錯誤鍵值

5. **可測試性**
   - 測試案例可以驗證錯誤訊息鍵值
   - 不受訊息文案變更影響

#### 影響範圍

**前端**:
- 整合 i18n 系統（如 vue-i18n, react-i18next）
- 建立錯誤訊息資源檔（zh-TW.json, en-US.json）
- 統一錯誤處理元件

**後端**:
- API 錯誤回應包含錯誤訊息鍵值與參數
- 定義標準錯誤回應格式
- 建立錯誤訊息鍵值常量

**測試**:
- 測試案例驗證錯誤訊息鍵值
- 驗證參數正確性
- 多語言資源檔完整性測試

#### 完整文檔參考

詳細的錯誤處理規範、鍵值命名規則、範例請參考：
- **文檔路徑**: `01/spec/error_handling_convention.md`
- **適用範圍**: 全系統 API 錯誤回應
- **更新日期**: 2025-11-15

---

**文檔結束**

如有問題或建議，請聯繫技術團隊。
