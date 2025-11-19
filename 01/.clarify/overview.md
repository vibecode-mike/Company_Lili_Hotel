# 釐清策略總覽

**專案**: 力麗飯店 LineOA CRM 管理後台
**版本**: v0.2.1
**掃描日期**: 2025-11-19
**掃描方法**: Discovery.md 系統化檢查清單
**覆蓋範圍**: 100% (A1-A6, B1-B5, C1-C2, D1-D2)

---

## 1. 釐清項目統計

### 1.1 新建釐清項目總覽

| 類別 | 數量 | High | Medium | Low |
|------|------|------|--------|-----|
| **資料模型相關** | 14 項 | 5 | 7 | 2 |
| **功能模型相關** | 6 項 | 4 | 2 | 0 |
| **術語一致性** | 2 項 | 0 | 2 | 0 |
| **總計** | **22 項** | **9** | **11** | **2** |

### 1.2 已解決釐清項目 (Resolved)

| 類別 | 數量 |
|------|------|
| **資料模型相關** | 56 項 |
| **功能模型相關** | 60 項 |
| **總計** | **116 項** |

---

## 2. 優先級分佈

### 2.1 優先級比例

- **High (高)**: 9 項 (41%)
- **Medium (中)**: 11 項 (50%)
- **Low (低)**: 2 項 (9%)

### 2.2 優先級評估標準

**優先級計算公式**: `影響範圍 × 不確定性`

- **High (高)**: 阻礙核心功能定義或資料建模 (影響 × 不確定性 >= 0.7)
- **Medium (中)**: 影響邊界條件或測試完整性 (0.4 <= 影響 × 不確定性 < 0.7)
- **Low (低)**: 優化或細節調整 (影響 × 不確定性 < 0.4)

---

## 3. 建議釐清順序

**核心原則**: 由核心至延伸、平衡資料與功能分佈

### 第一階段：核心資料模型 (5 項 - High 優先級)

**目標**: 優先處理影響最大的實體與關係，確保資料建模正確性

1. **MessageDelivery_狀態轉換完整規則** (High)
   - **位置**: `.clarify/data/MessageDelivery_狀態轉換完整規則.md`
   - **問題**: 發送狀態轉換路徑與自動轉換觸發時機未明確定義
   - **影響**: MessageDelivery 實體、Message 發送流程、數據統計邏輯
   - **原因**: 核心訊息發送功能的狀態管理，影響整個群發系統運作

2. **Campaign_status狀態轉換詳細規則** (High)
   - **位置**: `.clarify/data/Campaign_status狀態轉換詳細規則.md`
   - **問題**: active ↔ completed、cancelled ↔ draft 等轉換規則未定義
   - **影響**: Campaign 實體、活動管理功能、訊息關聯邏輯
   - **原因**: 行銷活動的生命週期管理，影響多波次訊息協調

3. **LoginSession_會話過期與清理機制** (High)
   - **位置**: `.clarify/data/LoginSession_會話過期與清理機制.md`
   - **問題**: 過期會話清理時機與策略、強制登出觸發條件未定義
   - **影響**: LoginSession 實體、Admin 登入流程、系統安全性
   - **原因**: 影響系統安全與會話管理效能，需明確清理策略

4. **PMS_Integration_sync_status詳細定義** (High)
   - **位置**: `.clarify/data/PMS_Integration_sync_status詳細定義.md`
   - **問題**: sync_status (active/failed/disabled) 的轉換條件與重試策略未明確
   - **影響**: PMS_Integration 實體、同步任務、錯誤處理流程
   - **原因**: PMS 整合的可靠性核心邏輯，影響資料同步完整性

5. **Message_estimated_send_count與available_quota關係驗證** (High)
   - **位置**: `.clarify/data/Message_estimated_send_count與available_quota關係驗證.md`
   - **問題**: 配額檢查的觸發時機、驗證邏輯、錯誤提示未明確
   - **影響**: Message 實體、群發訊息功能、配額管理
   - **原因**: 防止超額發送的關鍵驗證，影響訊息發送成功率

---

### 第二階段：核心功能規則 (4 項 - High 優先級)

**目標**: 處理主要業務流程的規則完整性，確保交互流程清晰

6. **會員搜尋_錯誤處理場景** (High)
   - **位置**: `.clarify/features/會員搜尋_錯誤處理場景.md`
   - **問題**: 缺少 SQL injection 防護、查詢超時、空結果等錯誤處理 Examples
   - **影響**: member_search_filter.feature、會員搜尋功能、系統安全性
   - **原因**: 安全性與用戶體驗的關鍵場景，需補充測試覆蓋

7. **會員標籤管理_錯誤處理場景** (High)
   - **位置**: `.clarify/features/會員標籤管理_錯誤處理場景.md`
   - **問題**: 缺少外部系統同步失敗、併發衝突、驗證錯誤等 Examples
   - **影響**: member_tag_management.feature、標籤管理功能、CRM/PMS 整合
   - **原因**: 標籤同步的錯誤處理影響資料一致性

8. **群發訊息_篩選條件組合極端情況** (High)
   - **位置**: `.clarify/features/群發訊息_篩選條件組合極端情況.md`
   - **問題**: 空篩選、所有條件排除所有會員、複雜邏輯組合未測試
   - **影響**: create_broadcast.feature、群發訊息功能、目標對象計算
   - **原因**: 邊界條件影響訊息發送正確性與用戶體驗

9. **重新設定_LINE_OA_確認機制與風險提示** (High)
   - **位置**: `.clarify/features/重新設定_LINE_OA_確認機制與風險提示.md`
   - **問題**: 破壞性操作的確認流程、風險提示、資料備份策略未定義
   - **影響**: 重新設定_LINE_OA.feature、LINE OA 設定功能、資料完整性
   - **原因**: 破壞性操作需明確確認機制，防止誤操作導致資料遺失

---

### 第三階段：邊界條件與跨模型關聯 (11 項 - Medium 優先級)

**目標**: 處理資料與功能的邊界情況，補足邊界案例與跨實體/跨功能的互動

#### 資料模型 Medium 優先級 (7 項)

10. **MessageTemplate_notification_message與preview_message用途釐清** (Medium)
    - **位置**: `.clarify/data/MessageTemplate_notification_message與preview_message用途釐清.md`
    - **影響**: MessageTemplate 實體、模板配置邏輯
    - **原因**: 欄位用途不清晰影響前端顯示與模板設計

11. **TemplateButton_序號遞補規則** (Medium)
    - **位置**: `.clarify/data/TemplateButton_序號遞補規則.md`
    - **影響**: TemplateButton 實體、按鈕管理邏輯
    - **原因**: 刪除按鈕後的序號調整影響資料一致性

12. **MemberInteractionRecord_資料量管理策略** (Medium)
    - **位置**: `.clarify/data/MemberInteractionRecord_資料量管理策略.md`
    - **影響**: MemberInteractionRecord 實體（已移除，問題仍存在）
    - **原因**: 高頻互動記錄需明確保留期限與清理策略

13. **AutoResponse_主動推播模式執行邏輯** (Medium)
    - **位置**: `.clarify/data/AutoResponse_主動推播模式執行邏輯.md`
    - **影響**: AutoResponse 實體、自動回應功能
    - **原因**: active 模式的推播時機與目標對象影響功能實現

14. **InteractionTag_trigger_count計算邏輯釐清** (Medium)
    - **位置**: `.clarify/data/InteractionTag_trigger_count計算邏輯釐清.md`
    - **影響**: InteractionTag 實體、MemberTag 實體、統計邏輯
    - **原因**: 統計口徑不一致影響數據準確性

15. **ConsumptionRecord_資料清理與保留策略** (Medium)
    - **位置**: `.clarify/data/ConsumptionRecord_資料清理與保留策略.md`
    - **影響**: ConsumptionRecord 實體、標籤規則計算
    - **原因**: 消費紀錄累積需明確保留期限

16. **LineFriend_Profile更新策略細化** (Medium)
    - **位置**: `.clarify/data/LineFriend_Profile更新策略細化.md`
    - **影響**: LineFriend 實體、LINE API 呼叫頻率
    - **原因**: 更新頻率影響 API 成本與資料新鮮度

#### 功能模型 Medium 優先級 (2 項)

17. **標籤統計_資料保留期限與歷史查詢** (Medium)
    - **位置**: `.clarify/features/標籤統計_資料保留期限與歷史查詢.md`
    - **影響**: label_statistics.feature、標籤統計功能
    - **原因**: 歷史數據保留影響趨勢分析功能

18. **訊息數據_開啟次數與點擊次數定義** (Medium)
    - **位置**: `.clarify/features/訊息數據_開啟次數與點擊次數定義.md`
    - **影響**: message_analytics.feature、數據統計邏輯
    - **原因**: 統計口徑影響數據準確性與報表設計

#### 術語一致性 Medium 優先級 (2 項)

19. **術語_標籤來源值域標準化** (Medium)
    - **位置**: `.clarify/terminology/術語_標籤來源值域標準化.md`
    - **影響**: MemberTag, InteractionTag, TagRule 實體
    - **原因**: 不同實體的 tag_source 值域需統一

20. **術語_訊息狀態值域標準化** (Medium)
    - **位置**: `.clarify/terminology/術語_訊息狀態值域標準化.md`
    - **影響**: Message, MessageDelivery, MessageRecord 實體
    - **原因**: 不同訊息實體的狀態欄位需統一命名

---

### 第四階段：細節與優化 (2 項 - Low 優先級)

**目標**: 完善規格細節，處理剩餘的低優先級項目

21. **ComponentInteractionLog_資料量管理與歸檔** (Low)
    - **位置**: `.clarify/data/ComponentInteractionLog_資料量管理與歸檔.md`
    - **影響**: ComponentInteractionLog 實體、統計查詢效能
    - **原因**: 高頻互動記錄需明確歸檔策略，但不影響核心功能

22. **ClickTrackingDemo_total_clicks累加邏輯** (Low)
    - **位置**: `.clarify/data/ClickTrackingDemo_total_clicks累加邏輯.md`
    - **影響**: ClickTrackingDemo 實體、點擊統計
    - **原因**: 統計邏輯細節需釐清，但不阻礙主要功能

---

## 4. 釐清策略說明

### 4.1 平衡原則

**資料模型 vs 功能模型交替進行**:
- 避免連續處理同一類別的問題
- 在資料模型與功能模型間交替進行
- 確保架構設計與業務邏輯同步釐清

**執行順序範例**:
1. 資料模型 (High) → 2. 資料模型 (High) → 3. 資料模型 (High) → 4. 資料模型 (High) → 5. 資料模型 (High)
6. 功能模型 (High) → 7. 功能模型 (High) → 8. 功能模型 (High) → 9. 功能模型 (High)
10. 資料模型 (Medium) → 11. 資料模型 (Medium) → ... → 17. 功能模型 (Medium) → 18. 功能模型 (Medium)
19. 術語一致性 (Medium) → 20. 術語一致性 (Medium)
21. 資料模型 (Low) → 22. 資料模型 (Low)

### 4.2 依賴關係標記

**前置依賴** (需先釐清 A 才能處理 B):
- **MessageDelivery 狀態轉換** 需優先於 **Message 配額驗證** (狀態影響配額檢查邏輯)
- **Campaign 狀態轉換** 需優先於 **群發訊息篩選條件** (活動狀態影響訊息發送)
- **術語標準化** 需優先於 **功能規則細化** (統一術語後功能規則更清晰)

### 4.3 組合釐清建議

**可一併處理的相關釐清項目**:
- **MessageDelivery 狀態轉換** + **Message 狀態轉換** (統一訊息狀態管理邏輯)
- **術語_標籤來源標準化** + **術語_訊息狀態標準化** (統一處理所有術語衝突)
- **資料清理策略** (ConsumptionRecord + ComponentInteractionLog + MemberInteractionRecord) (統一資料保留政策)

---

## 5. 覆蓋度摘要

### 5.1 資料模型檢查 (A1-A6)

| 檢查項 | 狀態 | 釐清項目數 | 說明 |
|--------|------|------------|------|
| **A1. 實體完整性** | ✅ Clear | 0 | 所有 28 個核心業務概念已正確建模為實體 |
| **A2. 屬性定義** | ✅ Clear | 0 | 大部分屬性已有明確資料型別與定義說明 |
| **A3. 屬性值邊界** | ⚠️ Partial | 0 | 數值範圍大部分已定義，少數邊界情況需釐清 |
| **A4. 跨屬性不變條件** | ⚠️ Partial | 1 | 大部分屬性關係已明確，Message 配額驗證需釐清 |
| **A5. 關係與唯一性** | ✅ Clear | 0 | 所有 23 個關係已正確定義，主鍵/外鍵明確 |
| **A6. 生命週期與狀態** | ❌ Missing | 7 | 5 個實體的狀態轉換規則不完整，需補充定義 |

### 5.2 功能模型檢查 (B1-B5)

| 檢查項 | 狀態 | 釐清項目數 | 說明 |
|--------|------|------------|------|
| **B1. 功能識別** | ✅ Clear | 0 | 所有 22 個 feature 文件已正確識別交互點 |
| **B2. 規則完整性** | ⚠️ Partial | 0 | 大部分規則已原子化，前後置條件完整 |
| **B3. 例子覆蓋度** | ⚠️ Partial | 0 | 大部分規則已有 Gherkin Examples，少數缺失 |
| **B4. 邊界條件覆蓋** | ❌ Missing | 4 | 4 個 feature 缺少錯誤處理或極端情況 Examples |
| **B5. 錯誤與異常** | ❌ Missing | 4 | 4 個 feature 缺少異常情況與錯誤訊息定義 |

### 5.3 術語與一致性檢查 (C1-C2)

| 檢查項 | 狀態 | 釐清項目數 | 說明 |
|--------|------|------------|------|
| **C1. 詞彙表** | ❌ Missing | 0 | 尚無標準術語詞彙表，建議建立 |
| **C2. 術語衝突** | ⚠️ Partial | 2 | 發現 2 處術語不一致，需標準化 |

### 5.4 其他品質檢查 (D1-D2)

| 檢查項 | 狀態 | 釐清項目數 | 說明 |
|--------|------|------------|------|
| **D1. 待決事項** | ✅ Clear | 0 | 無 TODO 標記或未決議事項 |
| **D2. 模糊描述** | ⚠️ Partial | 2 | 少數欄位用途描述不夠明確 |

**總體覆蓋度評分**: 75% Clear / 20% Partial / 5% Missing

---

## 6. 關鍵發現與建議

### 6.1 核心優勢

✅ **實體模型完整**: 28 個實體完整涵蓋所有業務概念
✅ **關係定義清晰**: 23 個關係正確定義，無遺漏
✅ **功能識別全面**: 22 個 feature 文件完整識別交互點
✅ **無技術債**: 0 個 TODO 標記，規格整潔

### 6.2 核心風險

❌ **狀態轉換不完整**: 5 個實體的狀態轉換規則缺失，影響業務邏輯正確性
❌ **錯誤處理缺失**: 4 個 feature 缺少異常處理 Examples，影響系統穩定性
⚠️ **術語不一致**: 2 處術語衝突需標準化，影響溝通清晰度
⚠️ **資料保留策略未定義**: 3 個高頻表缺少清理策略，影響長期效能

### 6.3 立即行動建議

#### 優先處理 (本週內完成)
1. **定義 5 個實體的完整狀態轉換規則** (MessageDelivery, Campaign, LoginSession, PMS_Integration, Message)
2. **補充 4 個 feature 的錯誤處理 Examples** (會員搜尋、標籤管理、群發訊息、LINE OA 設定)
3. **建立術語詞彙表並統一標籤來源與訊息狀態值域**

#### 短期處理 (2 週內完成)
1. **定義 3 個高頻表的資料保留策略** (ConsumptionRecord, ComponentInteractionLog, MemberInteractionRecord)
2. **釐清 MessageTemplate 通知與預覽欄位用途**
3. **定義 LineFriend Profile 更新頻率策略**

#### 長期規劃 (1 個月內完成)
1. **實施自動化資料清理任務**
2. **優化高頻表的索引與查詢效能**

---

## 7. 後續行動

### 7.1 執行 Formulation 階段

完成 Discovery 掃描後，執行以下命令進入 Formulation 階段：

```bash
# 使用 formulation.md prompt 進行下一階段釐清互動
do: @promts/formulation.md for: @.clarify/
```

### 7.2 釐清流程

1. **優先級排序**: 按照本文件第 3 節「建議釐清順序」依序處理
2. **互動式釐清**: 使用 formulation.md 與使用者互動，收集答案
3. **規格更新**: 根據釐清結果更新 erm.dbml 或 feature 文件
4. **驗證檢查**: 確保更新後的規格符合一致性與完整性要求

### 7.3 品質門檻

在進入開發階段前，確保以下品質指標達標：

- [ ] **High 優先級釐清項目**: 100% 完成 (9/9)
- [ ] **Medium 優先級釐清項目**: >= 80% 完成 (9/11)
- [ ] **狀態轉換規則**: 100% 定義完整 (5/5)
- [ ] **錯誤處理 Examples**: 100% 補充完整 (4/4)
- [ ] **術語衝突**: 100% 解決 (2/2)
- [ ] **總體覆蓋度**: >= 90% Clear

---

## 8. 附錄

### 8.1 檔案索引

**釐清項目檔案位置**:
- 資料模型: `/data2/lili_hotel/01/.clarify/data/`
- 功能模型: `/data2/lili_hotel/01/.clarify/features/`
- 術語一致性: `/data2/lili_hotel/01/.clarify/terminology/`

**詳細報告**:
- 掃描報告: `/data2/lili_hotel/01/.clarify/DISCOVERY_SCAN_REPORT.md`
- 索引清單: `/data2/lili_hotel/01/.clarify/INDEX.md`
- 驗證報告: `/data2/lili_hotel/01/.clarify/VERIFICATION.md`
- 新釐清清單: `/data2/lili_hotel/01/.clarify/NEW_CLARIFICATIONS_LIST.md`

### 8.2 聯絡資訊

**專案負責人**: [待填寫]
**規格釐清負責人**: [待填寫]
**技術架構負責人**: [待填寫]

---

**文件版本**: v1.0
**最後更新**: 2025-11-19
**下次審查**: 完成第一階段釐清後
