# 力麗飯店 LINE OA CRM 後端架構設計文檔

**版本**: v0.2
**日期**: 2025-11-12
**文檔狀態**: 正式版

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
5. **向後兼容**: v0.2 重構保持 API 向後兼容性
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
    message_content TEXT COMMENT '訊息內容',
    flex_message_json JSON COMMENT 'Flex Message JSON',
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
| 會員相關 | members, member_tags, member_interaction_records, message_records, consumption_records | 5張表 |
| 訊息推播 | messages, message_recipients, message_templates, template_carousel_items | 4張表 |
| 活動管理 | campaigns | 1張表 |
| 標籤系統 | member_tags, interaction_tags, tag_trigger_logs | 3張表 |
| 自動回應 | auto_responses, auto_response_keywords | 2張表 |
| PMS 整合 | pms_integrations, consumption_records | 2張表 |
| 問卷系統 | survey_templates, surveys, survey_questions, survey_responses | 4張表 |
| 系統管理 | users | 1張表 |
| **總計** | | **22張核心表** |

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

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| GET | `/api/v1/campaigns` | 獲取訊息列表 | status, search, page, limit |
| GET | `/api/v1/campaigns/{id}` | 獲取訊息詳情 | - |
| POST | `/api/v1/campaigns` | 創建群發訊息 | 訊息配置 |
| PUT | `/api/v1/campaigns/{id}` | 更新訊息 | 訊息配置 |
| DELETE | `/api/v1/campaigns/{id}` | 刪除訊息 | - |
| POST | `/api/v1/campaigns/{id}/send` | 立即發送 | - |
| POST | `/api/v1/campaigns/{id}/schedule` | 排程發送 | scheduled_date, scheduled_time |

**創建群發訊息接口示例**:
```
POST /api/v1/campaigns
Content-Type: application/json

Request:
{
    "template_id": 5,
    "message_content": "雙十優惠活動開跑！",
    "target_type": "篩選目標對象",
    "target_filter": {
        "tags": ["VIP", "常客"],
        "exclude_tags": ["黑名單"]
    },
    "scheduled_date": "2025-11-20",
    "scheduled_time": "10:00:00",
    "interaction_tags": ["雙十優惠"],
    "flex_message_json": {
        "type": "bubble",
        "hero": { ... }
    }
}

Response:
{
    "code": 200,
    "message": "訊息創建成功",
    "data": {
        "id": 50,
        "status": "排程發送",
        "estimated_send_count": 350,
        "available_quota": 1000,
        "scheduled_date": "2025-11-20",
        "scheduled_time": "10:00:00"
    }
}
```

#### 5.3.4 活動管理 API (Campaigns New)

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| GET | `/api/v1/campaigns_new` | 獲取活動列表 | status, page, limit |
| GET | `/api/v1/campaigns_new/{id}` | 獲取活動詳情 | - |
| POST | `/api/v1/campaigns_new` | 創建活動 | 活動配置 |
| PUT | `/api/v1/campaigns_new/{id}` | 更新活動 | 活動配置 |
| DELETE | `/api/v1/campaigns_new/{id}` | 刪除活動 | - |

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

| 方法 | 端點 | 說明 | 參數 |
|------|------|------|------|
| GET | `/api/v1/auto_responses` | 獲取自動回應列表 | trigger_type, is_active, page, limit |
| GET | `/api/v1/auto_responses/{id}` | 獲取自動回應詳情 | - |
| POST | `/api/v1/auto_responses` | 創建自動回應 | 自動回應配置 |
| PUT | `/api/v1/auto_responses/{id}` | 更新自動回應 | 自動回應配置 |
| PATCH | `/api/v1/auto_responses/{id}/toggle` | 切換啟用狀態 | - |
| DELETE | `/api/v1/auto_responses/{id}` | 刪除自動回應 | - |

**創建關鍵字自動回應示例**:
```
POST /api/v1/auto_responses
Content-Type: application/json

Request:
{
    "trigger_type": "keyword",
    "keywords": ["訂房", "預訂", "住宿"],
    "response_content": "感謝您的詢問！請點擊以下連結進行線上訂房",
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
        "keywords": ["訂房", "預訂", "住宿"],
        "is_active": true
    }
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

#### v0.2 (2025-11-12)
- 數據庫架構重構
- campaigns 表 → messages 表 (群發訊息)
- 新增 campaigns 表 (活動管理)
- 標籤系統優化（雙表設計）
- 向後兼容性維護

#### v0.1 (2025-01-01)
- 初始版本發布
- 會員管理功能
- 群發訊息功能
- 標籤管理功能
- LINE API 集成

---

**文檔結束**

如有問題或建議，請聯繫技術團隊。
