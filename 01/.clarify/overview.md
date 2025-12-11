# 規格澄清總覽

> 產生時間: 2025-12-11
> 規格版本: ERM v0.4.3
> 待處理項目: 6 項
> 已解決項目: 40 項

---

## 統計摘要

| 分類 | 待處理 | 已解決 | High | Medium | Low |
|------|--------|--------|------|--------|-----|
| 資料模型 (data/) | 2 | 20 | 0 | 2 | 0 |
| 功能規格 (features/) | 4 | 20 | 0 | 0 | 4 |
| **總計** | **6** | **40** | **0** | **2** | **4** |

---

## 待處理項目

### Medium 優先級 (2 項)

| ID | 標題 | 類別 | 影響範圍 |
|----|------|------|----------|
| D003 | PMS 整合重試策略參數 | data | 外部系統整合穩定性 |
| D005 | ConsumptionRecord 聚合粒度 | data | 標籤自動貼標效能 |

### Low 優先級 (4 項) - UI/UX 細節

| ID | 標題 | 類別 | 影響範圍 |
|----|------|------|----------|
| 新增 | 聊天室多渠道_訊息整合顯示渠道圖示規範 | features | 前端 UI 設計 |
| 新增 | 聊天室多渠道_渠道切換時是否保留草稿 | features | 客服操作體驗 |
| 新增 | 聊天室多渠道_僅有單一渠道時下拉選單顯示邏輯 | features | 前端 UI 組件 |
| 新增 | 聊天室多渠道_加入來源欄位顯示格式 | features | 會員列表 UI |

---

## 檢查清單對照

### A. 領域與資料模型 (ERM)

| 項目 | 狀態 | 相關澄清 |
|------|------|----------|
| A1. 主要實體識別 | ✅ 完成 | - |
| A2. 關聯與基數 | ✅ 完成 | - |
| A3. 資料完整性約束 | ✅ 已解決 | D002 ✓, AutoResponseMessage序號 ✓ |
| A4. 索引與效能考量 | ⚠️ 待處理 | D005 |
| A5. 軟刪除與歸檔策略 | ✅ 已解決 | D004 ✓, LineFriend保留 ✓, MessageDelivery歸檔 ✓ |
| A6. 外部系統整合點 | ⚠️ 待處理 | D003 |
| A7. JSON Schema 定義 | ✅ 已解決 | D006 ✓, D007 ✓, D008 ✓ |

### B. 功能模型 (Features)

| 項目 | 狀態 | 相關澄清 |
|------|------|----------|
| B1. 業務流程完整性 | ✅ 完成 | TagRule執行策略 ✓ |
| B2. 邊緣情況處理 | ✅ 已解決 | F004 ✓, F013 ✓, TemplateButton遞補 ✓ |
| B3. 錯誤處理策略 | ✅ 完成 | AutoResponse衝突 ✓, BatchSend重試 ✓ |
| B4. 多渠道整合 | ✅ 已解決 | F003 ✓, F010 ✓, F012 ✓ |
| B5. 即時性需求 | ✅ 已解決 | F005 ✓, F014 ✓ |
| B6. Example 覆蓋度 | ✅ 已解決 | F013 ✓ |

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

## v0.4.0 實體完整性評估

| 實體 | 屬性定義 | 關係定義 | 狀態 |
|------|----------|----------|------|
| LineChannel | ✅ 完整 | ✅ 完整 | ✅ |
| FbChannel | ✅ 完整 | ✅ 完整 | ✅ |
| ConversationThread | ✅ 完整 | ✅ 完整 | ✅ |
| ConversationMessage | ✅ 完整 | ✅ 完整 | ✅ D007 已解決 |
| ChatLog | ✅ 完整 | ✅ 完整 | ✅ D008 已解決 |
| SurveyTemplate | ✅ 完整 | ✅ 完整 | ✅ |
| Survey | ✅ 完整 | ✅ 完整 | ✅ |
| SurveyQuestion | ✅ 完整 | ✅ 完整 | ✅ |
| SurveyResponse | ✅ 完整 | ✅ 完整 | ✅ D006 已解決 |
| User | ✅ 完整 | ✅ 完整 | ✅ D009 已解決 |
| TagTriggerLog | ✅ 完整 | ✅ 完整 | ✅ |
| LineFriend | ✅ 完整 | ✅ 完整 | ✅ 同步策略/保留策略/Profile更新 已解決 |
| MessageDelivery | ✅ 完整 | ✅ 完整 | ✅ 歸檔策略 已解決 |
| AutoResponseMessage | ✅ 完整 | ✅ 完整 | ✅ sequence_order範圍 已解決 |
| MessageTemplate | ✅ 完整 | ✅ 完整 | ✅ notification/preview欄位 已解決 |
| TemplateButton | ✅ 完整 | ✅ 完整 | ✅ 序號遞補規則 已解決 |

---

## 規格品質評估

### 優點
1. **完整的 RBAC 權限系統**：角色、權限、動態配置，快取失效策略已定義 (F008)
2. **詳細的 Gherkin 情境**：22 個 feature 檔案涵蓋完整業務流程
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

### 待完成
1. **PMS 重試策略參數** (D003)：需決定初始間隔、最大重試次數、退避係數
2. **消費記錄聚合策略** (D005)：需決定即時計算 vs 預計算 vs 快取方案

---

## 聊天室多渠道 釐清順序建議

### 第一階段：核心功能規則（High 優先級）

**優先處理影響核心流程的釐清項目：**

1. **`features/聊天室多渠道_OAuth授權失敗處理.md`**
   - **原因**：OAuth 登入是 Webchat 跨渠道整合的核心功能
   - **影響**：前端錯誤處理 UI、後端 OAuth 錯誤日誌

2. **`features/聊天室多渠道_渠道離線回覆失敗處理.md`**
   - **原因**：直接影響客服操作流程和訊息送達率
   - **影響**：Service 層錯誤處理、客服聊天室 UI

### 第二階段：資料模型與狀態管理（Medium 優先級）

3. ~~**`features/聊天室多渠道_Webchat訪客會話逾時機制.md`**~~ ✅ 已解決（選 C - WebSocket 斷線偵測）
4. ~~**`data/WebchatFriend_webchat_uid生成規則.md`**~~ ✅ 已解決（選 A - UUID v4）
5. ~~**`data/Member_多渠道會員合併觸發時機.md`**~~ ✅ 已解決（選 D - 混合策略：email → 渠道 UID → 新會員）

### 第三階段：UI/UX 細節（Low 優先級）

6-9. 可批次與前端團隊確認

### 依賴關係

```
OAuth 授權失敗處理
    └── 渠道離線回覆失敗處理（共用錯誤處理模式）

Webchat 會話逾時機制
    └── webchat_uid 生成規則（Session ID 選項影響會話追蹤）

多渠道會員合併觸發時機
    └── OAuth 授權成功後的合併邏輯
```

---

## 檔案清單

### data/ (2 項待處理)
- `D003-pms-adapter-retry-policy.md` - Medium
- `D005-consumption-record-aggregation.md` - Medium

### features/ (4 項待處理)
- `聊天室多渠道_訊息整合顯示渠道圖示規範.md` - Low (新增)
- `聊天室多渠道_渠道切換時是否保留草稿.md` - Low (新增)
- `聊天室多渠道_僅有單一渠道時下拉選單顯示邏輯.md` - Low (新增)
- `聊天室多渠道_加入來源欄位顯示格式.md` - Low (新增)

### resolved/data/ (20 項已解決)
- `WebchatFriend_webchat_uid生成規則.md` ✓ (新增)
- `Member_多渠道會員合併觸發時機.md` ✓ (新增)
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
- `MessageDelivery_資料保留策略與清理機制.md` ✓
- `MessageTemplate_notification_message與preview_message用途釐清.md` ✓
- `TagRule_執行策略與自動化需求.md` ✓
- `TemplateButton_序號遞補規則.md` ✓

### resolved/features/ (20 項已解決)
- `F001-broadcast-quota-exceeded-behavior.md` ✓
- `F002-auto-response-priority-conflict.md` ✓
- `F003-multichannel-reply-routing.md` ✓
- `聊天室多渠道_OAuth授權失敗處理.md` ✓ (新增)
- `聊天室多渠道_渠道離線回覆失敗處理.md` ✓ (新增)
- `聊天室多渠道_Webchat訪客會話逾時機制.md` ✓ (新增)
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
- `重新設定_LINE_OA_確認機制與風險提示.md` ✓

---

## 下一步行動

1. **決策 D003**：與技術團隊討論 PMS 重試策略參數（建議選項 D - 自訂策略）
2. **決策 D005**：評估系統負載後決定聚合方案（建議選項 B 或 D）
3. **版本更新**：澄清完成後更新 ERM 至 v0.4.1

---

## 變更紀錄

| 日期 | 版本 | 變更內容 |
|------|------|----------|
| 2025-12-11 | v0.4.8 | 修訂 多渠道會員合併觸發時機（改選 D - 混合策略），處理 OAuth 未取得 email 情況 |
| 2025-12-11 | v0.4.7 | 解決 多渠道會員合併觸發時機（選 A - OAuth 登入時即時合併），更新 ERM + Feature |
| 2025-12-11 | v0.4.6 | 解決 webchat_uid生成規則（選 A - UUID v4），更新 ERM + Feature |
| 2025-12-11 | v0.4.5 | 解決 Webchat訪客會話逾時機制（選 C - WebSocket 斷線偵測），更新 ERM + Feature |
| 2025-12-11 | v0.4.4 | 針對「聊天室多渠道.feature」進行 discovery 掃描，新增 9 項釐清項目（2 High, 3 Medium, 4 Low）|
| 2025-12-10 | v0.4.3 | 統一澄清目錄至 01/.clarify/，移除 spec/.clarify/ |
| 2025-12-10 | v0.4.2 | 整合兩個 .clarify/ 目錄，總計 35 項已解決 |
| 2025-12-10 | v0.4.1 | 完整掃描 22 feature 檔案，更新已解決狀態 |
| 2025-12-09 | v0.4.0 | 新增 10 項釐清項目（D006-D009, F011-F016） |
| 2025-12-09 | v0.3.0 | 初始建立，含 15 項釐清項目 |
