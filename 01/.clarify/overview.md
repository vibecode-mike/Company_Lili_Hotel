# 規格澄清總覽

> 產生時間: 2025-12-26
> 規格版本: ERM v0.4.5
> 待處理項目: 2 項
> 已解決項目: 45 項

---

## 統計摘要

| 分類 | 待處理 | 已解決 | High | Medium | Low |
|------|--------|--------|------|--------|-----|
| 資料模型 (data/) | 2 | 21 | 0 | 2 | 0 |
| 功能規格 (features/) | 0 | 24 | 0 | 0 | 0 |
| **總計** | **2** | **45** | **0** | **2** | **0** |

---

## 待處理項目

### Medium 優先級 (2 項)

| ID | 標題 | 類別 | 影響範圍 |
|----|------|------|----------|
| D003 | PMS 整合重試策略參數 | data | 外部系統整合穩定性 |
| D005 | ConsumptionRecord 聚合粒度 | data | 標籤自動貼標效能 |

- 備註：`D003` 使用者已暫時跳過（Deferred），仍保留為待處理項目
- 備註：`D005` 使用者已暫時跳過（Deferred），仍保留為待處理項目

### Low 優先級 (0 項)

（所有 Low 優先級項目已解決）

---

## 檢查清單對照

### A. 領域與資料模型 (ERM)

| 項目 | 狀態 | 相關澄清 |
|------|------|----------|
| A1. 實體完整性 | ✅ 完成 | 所有核心實體已定義 |
| A2. 屬性定義 | ✅ 已解決 | 自動回應僅支援被動觸發，無需 PushLog 表 (v0.4.5) |
| A3. 資料完整性約束 | ✅ 已解決 | D002 ✓, AutoResponseMessage序號 ✓ |
| A4. 索引與效能考量 | ⚠️ 待處理 | D005 |
| A5. 軟刪除與歸檔策略 | ✅ 已解決 | D004 ✓, LineFriend保留 ✓, MessageDelivery歸檔 ✓ |
| A6. 外部系統整合點 | ⚠️ 待處理 | D003 |
| A7. JSON Schema 定義 | ✅ 已解決 | D006 ✓, D007 ✓, D008 ✓ |

### B. 功能模型 (Features)

| 項目 | 狀態 | 相關澄清 |
|------|------|----------|
| B1. 業務流程完整性 | ✅ 完成 | TagRule執行策略 ✓, auto_response 18 部分完整（僅被動觸發） |
| B2. 邊緣情況處理 | ✅ 已解決 | F004 ✓, F013 ✓, TemplateButton遞補 ✓ |
| B3. 錯誤處理策略 | ✅ 完成 | AutoResponse衝突 ✓, BatchSend重試 ✓ |
| B4. 多渠道整合 | ✅ 已解決 | F003 ✓, F010 ✓, F012 ✓ |
| B5. 即時性需求 | ✅ 已解決 | F005 ✓, F014 ✓ |
| B6. Example 覆蓋度 | ✅ 完成 | auto_response.feature 涵蓋 18 個部分的完整 Example |

### C. 術語與一致性

| 項目 | 狀態 | 備註 |
|------|------|------|
| C1. 術語定義一致 | ✅ 一致 | - |
| C2. 跨規格參照正確 | ✅ 完成 | implementation_decisions.md 已整合至各 feature |

### D. 其他品質考量

| 項目 | 狀態 | 相關澄清 |
|------|------|----------|
| D1. 安全性考量 | ✅ 完成 | RBAC 權限系統完整, LINE OA重設防護 ✓ |
| D2. 效能需求 | ⚠️ 待處理 | D005 |
| D3. 權限架構 | ✅ 已解決 | User 取代 Admin (D009 ✓) |
| D4. API 節流策略 | ✅ 已解決 | BatchSend rate_limit ✓, Profile更新頻率 ✓ |

---

## 規格品質評估

### 優點
1. **完整的 RBAC 權限系統**：角色、權限、動態配置，快取失效策略已定義 (F008)
2. **詳細的 Gherkin 情境**：24 個 feature 檔案涵蓋完整業務流程
3. **清晰的 LINE 整合流程**：Messaging API、Login API、Webhook 設定明確
4. **完整的標籤體系**：三層架構 + 觸發規則 + 去重邏輯 (D002)
5. **多渠道支援架構**：LINE/Facebook/Webchat 整合，預設路由規則已定義 (F003)
6. **問卷系統架構**：完整流程 + JSON Schema 已定義 (D006)
7. **會員合併策略**：衝突處理規則已定義 (F010)
8. **GPT 自動回應控制**：會員級開關邏輯已明確 (F012)
9. **自動回應衝突處理**：優先順序規則已定義（關鍵字 > 指定時間 > 歡迎訊息）
10. **API 節流策略**：BatchSend 15 req/s + 指數回退重試策略
11. **資料同步策略**：LineFriend ↔ Member 雙向同步規則明確
12. **資料保留策略**：MessageDelivery 90天歸檔、LineFriend 永久保留
13. **自動回應系統完整規格**：auto_response.feature 涵蓋 18 個部分（僅被動觸發模式），約 1200 行詳細規格

### 待完成
1. **PMS 重試策略參數** (D003)：需決定初始間隔、最大重試次數、退避係數
2. **消費記錄聚合策略** (D005)：需決定即時計算 vs 預計算 vs 快取方案

---

## 建議釐清順序

### 第一階段：核心資料模型（Medium 優先級）

**優先處理影響資料庫設計的釐清項目：**

1. **`data/D003-pms-adapter-retry-policy.md`**
   - **原因**：外部系統整合穩定性
   - **影響**：PMS 適配器錯誤處理邏輯

2. **`data/D005-consumption-record-aggregation.md`**
   - **原因**：影響標籤自動貼標效能
   - **影響**：消費記錄聚合查詢策略

### 第二階段：UI/UX 細節（Low 優先級）

3-6. 可批次與前端團隊確認

---

## 檔案清單

### data/ (2 項待處理)
- `D003-pms-adapter-retry-policy.md` - Medium
- `D005-consumption-record-aggregation.md` - Medium

### features/ (0 項待處理)

（所有功能規格釐清項目已解決）

### resolved/data/ (21 項已解決)
- `AutoResponse_主動推播去重機制資料模型.md` ✓ (v0.4.4 新增，v0.4.14 作廢：自動回應不支援主動推播)
- `AutoResponse_trigger_collision策略.md` ✓
- `AutoResponseMessage_sequence_order數值範圍.md` ✓
- `BatchSend_rate_limit與重試策略.md` ✓
- `ComponentInteractionLog_total_clicks數值範圍.md` ✓
- `D001-member-linefriend-sync-strategy.md` ✓
- `D002-tag-deduplication-logic.md` ✓
- `D004-message-delivery-archive-policy.md` ✓
- `D006-survey-response-answers-schema.md` ✓
- `D007-conversation-message-role-values.md` ✓
- `D008-chatlog-content-json-schema.md` ✓
- `D009-user-admin-relationship.md` ✓
- `LineFriend_Profile更新頻率與策略.md` ✓
- `LineFriend_與Member資料同步策略與一致性保證.md` ✓
- `LineFriend_資料保留策略執行時機.md` ✓
- `Member_多渠道會員合併觸發時機.md` ✓
- `MessageDelivery_資料保留策略與清理機制.md` ✓
- `MessageTemplate_notification_message與preview_message用途釐清.md` ✓
- `TagRule_執行策略與自動化需求.md` ✓
- `TemplateButton_序號遞補規則.md` ✓
- `WebchatFriend_webchat_uid生成規則.md` ✓

### resolved/features/ (24 項已解決)
- `聊天室多渠道_加入來源欄位顯示格式.md` ✓ (v0.4.12 新增)
- `聊天室多渠道_訊息整合顯示渠道圖示規範.md` ✓ (v0.4.11 新增)
- `F001-broadcast-quota-exceeded-behavior.md` ✓
- `F002-auto-response-priority-conflict.md` ✓
- `F003-multichannel-reply-routing.md` ✓
- `F004-carousel-image-upload-failure.md` ✓
- `F005-websocket-reconnection-strategy.md` ✓
- `F006-session-expiry-grace-period.md` ✓
- `F007-tag-rule-evaluation-timing.md` ✓
- `F008-permission-cache-invalidation.md` ✓
- `F009-scheduled-message-timezone.md` ✓
- `F010-member-merge-conflict.md` ✓
- `F011-survey-member-data-update.md` ✓
- `F012-gpt-auto-response-toggle.md` ✓
- `F013-email-search-example-missing.md` ✓
- `F014-websocket-reconnect-limit.md` ✓
- `F015-tag-match-priority.md` ✓
- `F016-large-batch-sync-timeout.md` ✓
- `聊天室多渠道_OAuth授權失敗處理.md` ✓
- `聊天室多渠道_渠道離線回覆失敗處理.md` ✓
- `聊天室多渠道_僅有單一渠道時下拉選單顯示邏輯.md` ✓
- `聊天室多渠道_Webchat訪客會話逾時機制.md` ✓
- `重新設定_LINE_OA_確認機制與風險提示.md` ✓

---

## 下一步行動

1. **決策 D003**：與技術團隊討論 PMS 重試策略參數
2. **決策 D005**：評估系統負載後決定聚合方案
3. **版本狀態**：ERM 已更新至 v0.4.5（移除 AutoResponsePushLog，自動回應僅支援被動觸發）

---

## 變更紀錄

| 日期 | 版本 | 變更內容 |
|------|------|----------|
| 2025-12-26 | v0.4.16 | Discovery 掃描完成：ERM v0.4.5 (40+ 表) + 23 feature 檔案全面掃描，無新增釐清項目。待處理項目維持 D003、D005（皆為 Deferred）|
| 2025-12-26 | v0.4.15 | 修訂「僅有單一渠道時下拉選單顯示邏輯」：從選項 D（始終顯示三渠道選項）改為選項 A（隱藏下拉選單，僅顯示當前渠道圖示） |
| 2025-12-26 | v0.4.14 | 重大修訂：自動回應系統不支援主動推播，僅支援被動觸發。移除 AutoResponsePushLog 表（ERM v0.4.5），移除 auto_response.feature 第九部分「主動推播模式」，重新編號為 18 部分，新增 Background 說明各渠道觸發類型 |
| 2025-12-26 | v0.4.13 | 修訂「切換渠道草稿處理」規則：移除「保留」選項，僅提供「確認捨棄」與「取消」兩個選項 |
| 2025-12-26 | v0.4.12 | 解決「聊天室多渠道_加入來源欄位顯示格式」（渠道圖示＋帳號名稱＋UID，依加入時間排序），更新聊天室多渠道.feature |
| 2025-12-26 | v0.4.11 | 解決「聊天室多渠道_訊息整合顯示渠道圖示規範」（渠道圖示＋文字標籤下拉選單），更新聊天室多渠道.feature |
| 2025-12-25 | v0.4.10 | 解決「主動推播去重資料模型」（選 B - AutoResponsePushLog 獨立表），ERM 更新至 v0.4.4 |
| 2025-12-25 | v0.4.9 | 針對 auto_response.feature 19 部分進行完整掃描，新增主動推播去重資料模型釐清項目 |
| 2025-12-11 | v0.4.8 | 修訂 多渠道會員合併觸發時機（改選 D - 混合策略） |
| 2025-12-11 | v0.4.7 | 解決 多渠道會員合併觸發時機（選 A - OAuth 登入時即時合併） |
| 2025-12-11 | v0.4.6 | 解決 webchat_uid生成規則（選 A - UUID v4） |
| 2025-12-11 | v0.4.5 | 解決 Webchat訪客會話逾時機制（選 C - WebSocket 斷線偵測） |
| 2025-12-11 | v0.4.4 | 針對「聊天室多渠道.feature」進行 discovery 掃描 |
| 2025-12-10 | v0.4.3 | 統一澄清目錄至 01/.clarify/ |
| 2025-12-10 | v0.4.2 | 整合兩個 .clarify/ 目錄 |
| 2025-12-10 | v0.4.1 | 完整掃描 22 feature 檔案 |
| 2025-12-09 | v0.4.0 | 新增 10 項釐清項目 |
| 2025-12-09 | v0.3.0 | 初始建立 |
