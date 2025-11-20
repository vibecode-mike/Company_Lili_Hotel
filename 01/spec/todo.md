# Lili Hotel v2 版本待開發功能清單

根據 2025-11-20 開發狀況分析更新

**專案狀態**: v1 約 92% 完成，v2 規劃中
**最後更新**: 2025-11-20

---

## 📌 版本說明

### v1.0 - 基礎 CRM 系統 ✅ (已完成)

**核心功能**:
- ✅ 會員管理系統
- ✅ LINE 訊息發送
- ✅ 訊息模板管理
- ✅ 標籤管理
- ✅ 行銷活動
- ✅ 自動回應（被動模式：關鍵字、歡迎訊息）
- ✅ 問卷系統
- ✅ 消費記錄管理
- ✅ PMS 整合基礎（stay_records JSON 儲存）
- ✅ 訊息配額查詢（基礎功能）

**v1 實作決策**:
- Member 表處理 LINE 好友資料（不使用獨立 LineFriend 表）
- MessageTemplate.buttons JSON 儲存（不使用獨立 TemplateButton 表）
- 簡化 LINE API（無流量限制和重試機制）
- 無定期頭像更新排程

**完成度**: 約 92%

---

### v2.0 - 進階分析與優化 📋 (本文件規劃)

本文件列出的所有 P0/P1/P2 功能將在 **v2 版本實作**。

**預計發布**: 2026-Q1
**總預估工時**: 約 4 天

---

## P0 - 核心功能（v2 必須完成）

### 1. StayRecord 住房記錄表

**目標**: 建立飯店住房記錄追蹤系統，支援 PMS 整合和標籤規則

**後端任務**:
- [ ] 建立 `StayRecord` 模型（`backend/app/models/stay_record.py`）
  - 欄位：record_id, member_id, pms_integration_id, check_in, check_out, room_type, booking_id
  - 索引：(member_id, check_in), (room_type)
  - 驗證：check_out >= check_in
- [ ] 建立 Alembic 資料庫遷移
  - 生成遷移檔：`alembic revision --autogenerate -m "add_stay_record_table"`
- [ ] 建立 StayRecord CRUD API（`backend/app/api/v1/stay_records.py`）
  - `GET /api/v1/stay_records` - 列表查詢（支援會員篩選、日期範圍）
  - `GET /api/v1/stay_records/{record_id}` - 單筆查詢
  - `POST /api/v1/stay_records` - 新增
  - `PUT /api/v1/stay_records/{record_id}` - 更新
  - `DELETE /api/v1/stay_records/{record_id}` - 刪除

**PMS 整合任務**:
- [ ] 更新 PMSIntegration 同步邏輯（`backend/app/services/pms_integration.py`）
  - 從 PMS 系統同步住房記錄
  - 建立或更新 StayRecord
  - 關聯到 Member（透過 booking_id 或其他識別碼）

**標籤規則整合**:
- [ ] 更新 TagRule 執行器（`backend/app/services/tag_rule_executor.py`）
  - 支援 `visit_frequency` 規則（計算 StayRecord 數量）
  - 支援 `room_type` 規則（查詢偏好房型）
  - 自動標記符合條件的會員

**前端任務**:
- [ ] 在會員詳情頁顯示住房記錄（`frontend/src/pages/MemberDetail.tsx`）
  - 住房歷史列表（check_in, check_out, room_type）
  - 住房次數統計
  - 房型偏好分析

**測試任務**:
- [ ] StayRecord 模型單元測試
- [ ] PMS 同步整合測試
- [ ] 標籤規則執行測試
- [ ] API 端點測試

**預估工時**: 1 天

---

### 2. MessageDeliveryArchive 歸檔表

**目標**: 建立訊息發送記錄歸檔系統，優化資料庫效能和資料保留

**後端任務**:
- [ ] 建立 `MessageDeliveryArchive` 模型（`backend/app/models/message_delivery_archive.py`）
  - 複製 MessageDelivery 表結構
  - 新增 archived_at 欄位
  - 索引：(member_id, delivery_status), (sent_at)
- [ ] 建立 Alembic 資料庫遷移
  - 生成遷移檔：`alembic revision --autogenerate -m "add_message_delivery_archive_table"`
- [ ] 建立歸檔排程任務（`backend/app/tasks/archive_message_delivery.py`）
  - 每日 02:00 執行
  - 查詢 MessageDelivery 記錄（sent_at < now() - 90天）
  - 批次處理（5000筆/批次）
  - 複製到 MessageDeliveryArchive
  - 刪除原始記錄
- [ ] 建立歸檔資料查詢 API（`backend/app/api/v1/message_delivery_archive.py`）
  - `GET /api/v1/message_delivery_archive` - 歸檔記錄查詢
  - 支援日期範圍、會員篩選

**排程任務設定**:
- [ ] 配置 Celery 定時任務或 Cron Job
  - 設定執行時間：每日 02:00
  - 錯誤通知：失敗時發送告警

**前端任務**:
- [ ] 更新訊息發送記錄頁面（`frontend/src/pages/MessageDelivery.tsx`）
  - 新增「查看歷史記錄」按鈕
  - 連結到歸檔記錄查詢頁面

**測試任務**:
- [ ] 歸檔邏輯單元測試
- [ ] 批次處理效能測試
- [ ] 歸檔資料查詢測試
- [ ] 排程任務測試

**預估工時**: 0.5 天

---

## P1 - 進階功能（v2 重要功能）

### 1. 自動回應主動推播模式

**目標**: 支援定時主動推播訊息給所有追蹤中的好友

**後端任務**:
- [ ] 更新 `AutoResponse` 模型（`backend/app/models/auto_response.py`）
  - 新增欄位：weekdays (JSON array), scheduled_mode (enum: 'passive' | 'active')
  - 遷移：`alembic revision --autogenerate -m "add_auto_response_active_mode"`
- [ ] 建立主動推播排程器（`backend/app/tasks/auto_response_push.py`）
  - 查詢 AutoResponse（scheduled_mode='active', enabled=true）
  - 依照 time_range_start 和 weekdays 篩選
  - 查詢所有 LineFriend（is_following=true）
  - 24小時去重邏輯（last_pushed_at）
  - 批次發送訊息（500人/批次）
- [ ] 配額檢查整合
  - 發送前查詢 LINE API 可用配額
  - 配額不足時阻擋發送並記錄日誌

**前端任務**:
- [ ] 更新自動回應編輯頁面（`frontend/src/pages/AutoResponseEdit.tsx`）
  - 新增「推播模式」選擇器（被動/主動）
  - 主動模式顯示星期選擇器（多選：週一~週日）
  - 顯示預計發送人數和配額警告

**測試任務**:
- [ ] 主動推播排程測試
- [ ] 24小時去重測試
- [ ] 星期篩選測試
- [ ] 配額檢查測試

**預估工時**: 1 天

---

### 2. 訊息配額管理

**目標**: 即時監控 LINE 訊息配額，避免發送失敗

**後端任務**:
- [ ] 建立配額查詢服務（`backend/app/services/line_quota.py`）
  - 呼叫 LINE Messaging API 查詢配額
  - 快取配額資料（5分鐘有效期）
- [ ] estimated_send_count 計算邏輯
  - 根據篩選條件計算預計發送人數
  - Campaign/AutoResponse 建立時自動計算
- [ ] 發送前配額驗證
  - 檢查 available_quota >= estimated_send_count
  - 配額不足時阻擋發送，返回錯誤訊息
- [ ] 發送後配額更新
  - 發送成功後更新快取中的配額

**前端任務**:
- [ ] 建立配額監控儀表板（`frontend/src/pages/QuotaDashboard.tsx`）
  - 顯示當月可用配額
  - 顯示已使用配額
  - 配額使用趨勢圖表
- [ ] 訊息發送頁面配額警告
  - 顯示預計發送人數
  - 顯示剩餘配額
  - 配額不足時顯示警告並阻擋發送

**測試任務**:
- [ ] 配額查詢 API 測試
- [ ] estimated_send_count 計算測試
- [ ] 發送前驗證測試
- [ ] 前端配額顯示測試

**預估工時**: 0.5 天

---

### 3. MessageTemplate 進階欄位

**目標**: 支援多標籤觸發、CDN 儲存和錯誤追蹤

**後端任務**:
- [ ] 更新 `MessageTemplate` 模型
  - 新增欄位：tag_trigger_mode ('all' | 'primary'), flex_message_size (int), needs_cdn_retry (bool), upload_error_message (text)
  - 遷移：`alembic revision --autogenerate -m "add_message_template_advanced_fields"`
- [ ] 實作 CDN 重試機制（`backend/app/services/cdn_upload.py`）
  - Flex Message 大小 >= 10KB 時上傳到 CDN
  - 上傳失敗時設定 needs_cdn_retry=true
  - 記錄錯誤訊息到 upload_error_message
  - 定期重試（每日檢查 needs_cdn_retry=true 的模板）

**前端任務**:
- [ ] 更新訊息模板編輯頁面
  - 新增「標籤觸發模式」選擇器
  - 顯示 Flex Message 大小
  - 顯示 CDN 上傳狀態和錯誤訊息
  - 提供手動重試 CDN 上傳按鈕

**測試任務**:
- [ ] CDN 上傳測試
- [ ] 重試邏輯測試
- [ ] 多標籤觸發測試

**預估工時**: 0.5 天

---

## P2 - 優化功能（v2 可選功能）

### 1. LINE OA 重新設定功能

**目標**: 支援更換 LINE 官方帳號並保留現有資料

**後端任務**:
- [ ] 建立 LINE OA 解除綁定 API（`backend/app/api/v1/line_oa.py`）
  - `POST /api/v1/line_oa/unbind` - 解除目前 LINE OA 綁定
  - `POST /api/v1/line_oa/bind` - 綁定新的 LINE OA
  - 資料保留邏輯：保留所有 Member、LineFriend、MessageRecord 資料

**前端任務**:
- [ ] 建立 LINE OA 設定頁面（`frontend/src/pages/LineOASettings.tsx`）
  - 顯示目前綁定的 LINE OA 資訊
  - 提供「解除綁定」按鈕（二次確認）
  - 提供「重新綁定」流程

**測試任務**:
- [ ] 解除綁定測試
- [ ] 資料保留驗證
- [ ] 重新綁定測試

**預估工時**: 0.5 天

---

## v1 已決定不實作的功能

以下功能在 v1 版本決定不實作，詳見 [`implementation_decisions.md`](./implementation_decisions.md)

### ❌ LineFriend 獨立好友追蹤表（v1）
- **決策**: v1 使用 Member 表處理 LINE 好友資料
- **原因**: Member 表已有 line_uid, line_name, line_avatar 欄位，滿足基本需求
- **影響**: 降低系統複雜度，無需資料同步邏輯
- **v2 規劃**: 視業務需求評估是否建立獨立 LineFriend 表

### ❌ TemplateButton 獨立表（v1）
- **決策**: 使用 MessageTemplate.buttons JSON 欄位儲存
- **原因**: 按鈕數量少（最多4個），JSON 儲存更高效
- **影響**: 無需額外 JOIN 查詢，提升效能

### ❌ LINE API 流量限制（v1）
- **決策**: 不實作 Token Bucket 流量控制（15 req/sec）
- **原因**: 初期流量小，LINE API 自身有限制
- **影響**: 簡化程式碼
- **v3 規劃**: 若流量增長可考慮實作

### ❌ LINE API 重試機制（v1）
- **決策**: 不實作自動重試邏輯（指數退避）
- **原因**: 避免過度工程化
- **影響**: 錯誤直接返回，由上層處理
- **v3 規劃**: 若需要可考慮實作

### ❌ 30天頭像定期更新排程（v1）
- **決策**: 僅在 Follow/Message 事件時更新頭像
- **原因**: 頭像更新頻率低，節省 LINE API 呼叫成本
- **影響**: profile_updated_at 保留但不自動更新
- **v3 規劃**: 可新增手動更新功能

### ❌ TagRule 自動執行器（v1）
- **決策**: v1 不實作 TagRule 自動執行器
- **原因**: 避免過度工程化，初期可手動管理標籤
- **影響**: TagRule 模型保留，但無自動執行邏輯、無 CRUD API、無排程任務
- **v2/v3 規劃**: 視業務需求評估是否實作自動化標籤系統

---

## v2 開發優先順序建議

### 第一階段（1.5 天）
- **P0-1**: StayRecord 住房記錄表（1天）
- **P0-2**: MessageDeliveryArchive 歸檔表（0.5天）

### 第二階段（2 天）
- **P1-1**: 自動回應主動推播模式（1天）
- **P1-2**: 訊息配額管理完善（0.5天）
- **P1-3**: MessageTemplate 進階欄位（0.5天）

### 第三階段（0.5 天，視需求）
- **P2-1**: LINE OA 重新設定功能（0.5天）

**v2 總預估工時**: 約 4 天（P0: 1.5天 + P1: 2天 + P2: 0.5天）

---

## 變更記錄

| 日期 | 版本 | 變更內容 | 負責人 |
|------|------|---------|--------|
| 2025-11-20 | v2.1 | 新增「TagRule 自動執行器」到不實作清單 | Claude |
|------|------|---------|--------|
| 2025-11-20 | v1.0 | 建立待辦清單，根據開發狀況分析 | Claude |
| 2025-11-20 | v2.0 | 更新為 v2 版本待辦清單，移除 LineFriend，加入版本說明 | Claude |

---

## 相關文件

- [專案版本路線圖](./roadmap.md)
- [實作決策記錄](./implementation_decisions.md)
- [資料庫設計規格](./erm.dbml)
- [LINE 訊息 API 規格](./api_line_message_interface.md)
- [功能規格](./features/)
