# 力麗飯店 LINE OA CRM 系統 - v0.2 架構說明

**版本**: v0.2
**更新日期**: 2025-11-15
**文檔狀態**: 正式版
**適用範圍**: 全系統架構設計

---

## 📋 文檔摘要

本文檔描述力麗飯店 LINE OA CRM 系統 v0.2 架構設計，重點說明統一新架構的核心設計理念、實體關係、技術選型和實施策略。

## 🎯 v0.2 核心設計理念

### 1. 統一新架構（No Backward Compatibility）

**設計原則**: v0.2 是全新系統架構，不存在舊格式向後兼容問題。

**架構特點**:
- ✅ Messages（群發訊息）與 Campaigns（活動管理）職責清晰分離
- ✅ MessageDelivery 表提供個別會員發送追蹤
- ✅ 混合儲存策略（< 10KB 存 DB，≥ 10KB 存 CDN）
- ✅ 完整的錯誤處理與 i18n 支援

### 2. 領域驅動設計（Domain-Driven Design）

系統按業務領域劃分為以下核心模塊：

| 領域模塊 | 核心實體 | 職責 |
|---------|---------|------|
| **會員管理** | Member | 會員基本資料、LINE 集成、互動記錄 |
| **標籤系統** | Tag, TagRule, MemberTag | 會員標籤管理、自動化規則 |
| **訊息管理** | Message, MessageTemplate, MessageDelivery | 群發訊息、模板管理、發送追蹤 |
| **活動管理** | Campaign | 行銷活動容器、多波次訊息管理 |
| **自動回應** | AutoResponse, AutoResponseKeyword, AutoResponseMessage | 關鍵字觸發、時間觸發、歡迎訊息 |
| **PMS 整合** | PMS_Integration, StayRecord, ConsumptionRecord | PMS 數據同步、會員匹配 |

### 3. 單一職責原則（Single Responsibility Principle）

**Messages 表**:
- 職責：管理單筆群發訊息
- 包含：發送狀態、目標受眾、統計數據
- 可選關聯：campaign_id（歸屬於某活動）

**Campaigns 表**:
- 職責：管理行銷活動（作為多個訊息的容器）
- 包含：活動基本資訊、狀態管理
- 關係：1:N → Messages（一個活動包含多個訊息）

**MessageDelivery 表**:
- 職責：追蹤每位會員的訊息發送狀態
- 包含：發送狀態、開啟追蹤、點擊追蹤、失敗原因
- 關係：N:1 → Message, N:1 → Member

---

## 🏗️ 系統架構分層

### 架構層次圖

```
┌─────────────────────────────────────────────────┐
│              前端層 (Frontend)                   │
│    React + TypeScript + TailwindCSS             │
└─────────────────────────────────────────────────┘
                      ↓ HTTP/REST API
┌─────────────────────────────────────────────────┐
│              API 層 (FastAPI)                    │
│    路由 → 驗證 → 控制器 → 服務層                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            業務邏輯層 (Business Logic)           │
│  會員服務 | 訊息服務 | 活動服務 | 標籤服務      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            數據訪問層 (Data Access)              │
│  SQLAlchemy ORM → PostgreSQL/MySQL              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              外部集成層 (Integration)            │
│  LINE API | PMS 系統 | CDN 服務                 │
└─────────────────────────────────────────────────┘
```

### 技術棧選型

| 層次 | 技術 | 版本 | 說明 |
|-----|------|------|------|
| 前端框架 | React | 18+ | 組件化開發、TypeScript 支援 |
| 狀態管理 | Zustand/Redux | Latest | 全局狀態管理 |
| UI 框架 | TailwindCSS | 3+ | 工具優先的 CSS 框架 |
| 後端框架 | FastAPI | 0.100+ | Python 高性能異步框架 |
| ORM | SQLAlchemy | 2.0+ | Python ORM，支援異步 |
| 數據庫 | PostgreSQL/MySQL | 14+/8+ | 關聯式數據庫 |
| 任務調度 | APScheduler | 3.10+ | Python 任務調度庫 |
| 消息隊列 | Redis (可選) | 7+ | 緩存與消息隊列 |

---

## 📊 核心實體關係設計

### 0. 最新架構變更（2025-11-18）

**點擊追蹤架構統一化**：
- ✅ 移除 `messages.click_count` 欄位，統一使用 `ComponentInteractionLog` 表動態計算點擊數據
- ✅ 點擊數據計算邏輯：`COUNT(DISTINCT line_id WHERE message_id = ? AND interaction_type = 'button_url')`
- ✅ 統計來源：`/__track` 路由記錄的 `component_interaction_logs` 資料
- ✅ 支援多維度統計：可按 `template_id`、`campaign_id`、`interaction_tag_id` 等維度聚合
- ✅ Migration: `dcbae3a2bbce_remove_click_count_from_messages.py` 已執行

**優勢**：
- 消除數據重複儲存，確保單一數據來源
- 支援更靈活的多維度點擊分析
- 簡化資料庫結構，提升系統可維護性

### 1. Messages（群發訊息）與 Campaigns（活動管理）

**關係設計**: Campaign 1:N Message

```
Campaign (活動)
├── campaign_id (PK)
├── campaign_name
├── status (draft/active/completed/cancelled)
└── Messages (1:N)
    ├── message_id (PK)
    ├── campaign_id (FK, nullable)
    ├── template_id (FK)
    ├── send_status
    ├── target_filter
    └── MessageDeliveries (1:N)
        ├── delivery_id (PK)
        ├── message_id (FK)
        ├── member_id (FK)
        ├── delivery_status
        ├── sent_at
        ├── opened_at
        └── clicked_at
```

**業務場景**:
- 大型促銷活動（如：春節優惠、週年慶）需要發送多波次訊息
- 活動前預告 → 活動期間提醒 → 活動結束感謝，統一歸類管理
- 支援活動層級的數據統計與效果分析

**使用方式**:
1. 建立 Campaign 定義活動基本資訊
2. 創建多個 Message 關聯至該 Campaign
3. 系統自動聚合 Campaign 層級的統計數據（總發送數、總開啟數、總點擊數）

### 2. MessageDelivery 發送追蹤

**設計目標**: 追蹤每位會員的訊息發送狀態，支援精準統計與失敗重試

**狀態流轉**:
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

**業務價值**:
- ✅ 追蹤個別會員的發送成功/失敗狀態
- ✅ 支援失敗重試機制（最多 3 次）
- ✅ 精準統計開啟率、點擊率
- ✅ 支援「需回覆會員」功能（24 小時內未回覆）

**性能優化**:
- 索引：`(message_id, member_id)`, `(member_id, delivery_status)`, `(sent_at)`
- 分區表設計：按月分區（`delivery_partitions`）
- 數據保留策略：保留最近 90 天，超過則歸檔

### 3. 混合儲存策略

**設計理念**: 根據 Flex Message JSON 大小選擇最優儲存方案

**儲存決策邏輯**:
```python
if json_size < 10 * 1024:  # 10KB
    template.storage_type = 'database'
    template.flex_message_json = json_string
    template.flex_message_url = None
else:
    template.storage_type = 'cdn'
    cdn_url = upload_to_cdn(content, filename)
    template.flex_message_url = cdn_url
    template.flex_message_json = None
```

**欄位設計**:
- `flex_message_json` (MEDIUMTEXT): 儲存 < 10KB 的 JSON
- `flex_message_url` (VARCHAR 500): 儲存 CDN URL
- `flex_message_size` (INT): 記錄 JSON 大小（bytes）
- `storage_type` (VARCHAR 10): database / cdn

**業務優勢**:
- ✅ 解決圖片上傳導致 JSON 過大問題
- ✅ 減少數據庫負載，提升讀取效能 30-50%
- ✅ 靈活應對不同規模的模板需求

### 4. AutoResponse 關聯表設計

**設計目標**: 支援 1-20 組關鍵字與 1-5 筆訊息序列

**表結構**:
```
AutoResponse (自動回應主表)
├── response_id (PK)
├── trigger_type (keyword/time/welcome)
├── is_active
└── AutoResponseKeywords (1:N)
│   ├── id (PK)
│   ├── response_id (FK)
│   ├── keyword_text (1-20 組)
│   ├── match_type (exact/partial)
│   └── trigger_count
└── AutoResponseMessages (1:N)
    ├── id (PK)
    ├── response_id (FK)
    ├── message_content
    └── sequence_order (1-5)
```

**業務規則**:
- 每個自動回應最多 20 組關鍵字
- 每個自動回應最多 5 筆訊息（按 sequence_order 順序發送）
- 同一自動回應內關鍵字不可重複（UNIQUE 約束）

---

## 🔐 安全與權限設計

### 1. JWT 認證機制

**認證流程**:
```
用戶登錄 → 驗證帳密 → 生成 JWT Token → 返回 access_token
  ↓
客戶端請求攜帶 Token (Authorization: Bearer <token>)
  ↓
服務端驗證 Token → 提取用戶信息 → 執行業務邏輯
```

**Token 配置**:
- 算法：HS256
- 有效期：60 分鐘（可配置）
- Payload：`{"sub": "user_id", "exp": timestamp, "role": "ADMIN"}`

### 2. 角色權限矩陣

| 資源 | ADMIN | MARKETING | CUSTOMER_SERVICE |
|------|-------|-----------|------------------|
| 會員管理 | CRUD | R | RU |
| 群發訊息 | CRUD | CRUD | R |
| 活動管理 | CRUD | CRUD | R |
| 標籤管理 | CRUD | RU | RU |
| 自動回應 | CRUD | CRUD | R |
| 系統配置 | CRUD | - | - |
| 用戶管理 | CRUD | - | - |

### 3. 數據安全

**敏感資料保護**:
- 身份證號碼：明文儲存，前端顯示遮罩（A12****789）
- 密碼：Bcrypt 加密（Salt Rounds: 12）
- LINE UID：不可編輯，僅供查詢

**API 安全**:
- HTTPS 強制加密
- CORS 配置（限制來源域名）
- Rate Limiting（防止 API 濫用）

---

## 📈 性能優化策略

### 1. 數據庫索引優化

**已新增索引（12 組）**:

**Member 表（5 組）**:
- `email_index`: 會員搜尋與登入查詢
- `phone_index`: 會員搜尋與 PMS 比對
- `id_number_index`: PMS 比對關鍵欄位
- `last_interaction_index`: 最近回覆日期排序
- `join_source_index`: 來源篩選統計

**Message 表（4 組）**:
- `send_status_index`: 發送狀態篩選
- `scheduled_time_index`: 排程任務觸發查詢
- `sent_time_index`: 歷史訊息時間排序
- `campaign_index`: 活動訊息聚合查詢

**MessageDelivery 表（3 組）**:
- `message_member (message_id, member_id)`: 優化訊息-會員組合查詢
- `member_status (member_id, delivery_status)`: 優化會員發送狀態查詢
- `sent_time_index (sent_at)`: 優化發送時間排序

**預期效能提升**:
- 會員搜尋速度：提升 70%+
- 排程任務查詢：< 100ms
- MessageTemplate 讀取：提升 30-50%

### 2. 批次處理策略

**訊息發送批次處理**:
- 每批 500 筆記錄
- 使用 LINE multicast API
- 發送間隔 1 秒（避免速率限制）
- 異步任務處理（APScheduler）

**數據庫批量操作**:
- 使用 bulk insert/update 減少數據庫操作
- 批量更新 MessageDelivery 狀態

### 3. 緩存策略（可選）

**Redis 緩存應用場景**:
- 會員基本資料緩存（TTL: 5 分鐘）
- 訊息模板緩存（TTL: 10 分鐘）
- API 響應緩存（GET 請求，TTL: 1 分鐘）

---

## 🌐 多語言與國際化

### 1. i18n 錯誤處理規範

**鍵值命名規範**: `error.{module}.{field}.{type}`

**範例**:
- `error.tag.name.required` - 標籤名稱為必填
- `error.member.email.invalid` - 電子信箱格式不正確
- `error.message.quota.insufficient` - 訊息配額不足

**API 回應格式**:
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
  }
}
```

**前端處理**:
```javascript
const errorMessage = i18n.t(response.error.code, response.error.params);
// 繁體中文: "標籤名稱不得超過 20 個字元（目前：25 個字元）"
// 英文: "Tag name must not exceed 20 characters (current: 25 characters)"
```

### 2. 支援語言

- ✅ 繁體中文（zh-TW）- 預設語言
- 🔄 英文（en-US）- 計劃支援
- 🔄 日文（ja-JP）- 計劃支援

---

## 📋 實施策略

### Phase 1: 基礎優化（Week 1-2）
1. 定義 string 長度標準文檔
2. 修改 erm.dbml
3. 生成資料庫遷移腳本
4. 在開發環境測試

### Phase 2: 效能優化（Week 3-4）
5. 新增效能索引
6. 驗證查詢效能提升
7. 修改 MessageTemplate（新增 CDN 儲存欄位）
8. 實施混合儲存策略

### Phase 3: 功能增強（Week 5-6）
9. 新增 MessageDelivery 表
10. 實施資料清理機制
11. 擴展 TagRule 與 AutoResponse 功能
12. 整合測試

### Phase 4: 部署與驗證（Week 7-8）
13. 準備生產環境遷移計畫
14. 分階段部署
15. 監控效能指標
16. 收集使用者反饋

---

## 📚 相關文檔

| 文檔名稱 | 路徑 | 說明 |
|---------|------|------|
| 後端技術文檔 | `/archite/backend-documentation.md` | 完整的後端 API、業務模塊文檔 |
| 數據庫模型 | `/01/spec/erm.dbml` | DBML 格式的實體關係模型 |
| 數據庫優化摘要 | `/01/spec/DATABASE_OPTIMIZATION_SUMMARY.md` | v0.2 數據庫優化詳細報告 |
| 錯誤處理規範 | `/01/spec/error_handling_convention.md` | i18n 錯誤訊息規範 |

---

## ✅ v0.2 核心優勢總結

1. **職責清晰**: Messages 與 Campaigns 分離，單一職責原則
2. **追蹤完整**: MessageDelivery 表提供個別會員發送追蹤
3. **性能優化**: 12 組索引，混合儲存策略，預期效能提升 70%+
4. **擴展性強**: 支援多語言、CDN 儲存、複雜篩選邏輯
5. **開發友好**: 完整的文檔、清晰的架構、標準的 API 設計

---

**文檔版本**: 1.0
**創建日期**: 2025-11-15
**負責人**: AI Assistant
**審核狀態**: 待審核
