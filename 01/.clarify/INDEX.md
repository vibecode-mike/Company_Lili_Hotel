# Clarifications Index

## 新增釐清項目 (New Clarifications)

本次 Discovery Scan 共識別 **22 個新的釐清項目**

### 資料模型釐清 (Data Model) - 14 項

#### 高優先級 (High Priority) - 6 項
1. **Campaign_status狀態轉換詳細規則.md**
   - 問題：未完整定義 draft/active/completed/cancelled 狀態轉換規則
   - 影響：活動管理邏輯、訊息發送控制

2. **LoginSession_會話過期與清理機制.md**
   - 問題：未定義會話有效期、自動登出機制、過期清理策略
   - 影響：系統安全性、使用者體驗、資料庫效能

3. **MessageDelivery_狀態轉換完整規則.md**
   - 問題：未完整定義 pending/sent/failed/opened/clicked 狀態轉換路徑
   - 影響：訊息追蹤準確性、開啟率點擊率統計

4. **Message_estimated_send_count與available_quota關係驗證.md**
   - 問題：未明確定義配額驗證時機與錯誤處理策略
   - 影響：訊息發送失敗、使用者體驗、成本控制

5. **PMS_Integration_sync_status詳細定義.md**
   - 問題：未定義同步失敗重試策略與錯誤處理機制
   - 影響：PMS 整合穩定性、資料完整性

6. **StayRecord_check_in與check_out關係詳細驗證.md** (Medium)
   - 問題：未明確定義日期關係邊界條件與異常處理
   - 影響：資料完整性、標籤規則準確性

#### 中優先級 (Medium Priority) - 6 項
7. **AutoResponseMessage_sequence_order數值範圍.md**
   - 問題：未定義 sequence_order 上限與訊息數量限制

8. **LineFriend_Profile更新頻率與策略.md**
   - 問題：Profile 更新間隔 N 天未明確定義

9. **StayRecord_check_in與check_out關係詳細驗證.md**
   - 問題：日期關係驗證規則不完整

#### 低優先級 (Low Priority) - 2 項
10. **ComponentInteractionLog_total_clicks數值範圍.md**
    - 問題：total_clicks 數值範圍與上限未定義

11. **LineFriend_資料保留策略執行時機.md**
    - 問題：90 天後刪除策略的執行時機與自動化方式未定義

### 功能規格釐清 (Features) - 6 項

#### 高優先級 (High Priority) - 4 項
1. **會員搜尋_錯誤處理場景.md**
   - 問題：缺乏 SQL 注入防護、查詢逾時、驗證錯誤等錯誤處理
   - 影響：安全性風險、系統穩定性

2. **會員標籤管理_錯誤處理場景.md**
   - 問題：外部系統同步失敗、資料驗證錯誤處理策略未定義
   - 影響：資料一致性、業務準確性

3. **群發訊息_篩選條件組合極端情況.md**
   - 問題：空條件、全包含、全排除等極端情況處理策略未定義
   - 影響：訊息發送準確性、使用者體驗

4. **重新設定_LINE_OA_確認機制與風險提示.md**
   - 問題：缺乏確認機制、風險提示、誤操作防護
   - 影響：資料安全性、業務連續性

#### 中優先級 (Medium Priority) - 2 項
5. **自動回應_關鍵字邊界條件.md**
   - 問題：關鍵字空白、特殊字元、超長輸入處理策略未定義

6. **標籤規則管理_錯誤處理場景.md**
   - 問題：規則衝突、自動執行失敗處理策略未定義

### 術語釐清 (Terminology) - 2 項

#### 中優先級 (Medium Priority) - 2 項
1. **會員_LineFriend_Member術語釐清.md**
   - 問題：「會員」、「LINE 好友」、Member、LineFriend 術語混用
   - 影響：溝通清晰度、文件一致性

2. **標籤來源_tag_source值域標準化.md**
   - 問題：標籤來源值不一致（中文 vs 英文）
   - 影響：資料一致性、可維護性

## 優先級統計

| 優先級 | 資料模型 | 功能規格 | 術語 | 合計 | 百分比 |
|-------|---------|---------|-----|------|-------|
| High  | 5       | 4       | 0   | 9    | 50%   |
| Medium| 7       | 2       | 2   | 11   | 61%   |
| Low   | 2       | 0       | 0   | 2    | 11%   |

## Discovery Checklist 涵蓋度

### A. 資料模型檢查 (Domain & Data Model Checks)
- ✅ A1. 實體完整性：所有業務概念皆已建模
- ✅ A2. 屬性定義：大部分屬性有明確資料型別
- ✅ A3. 屬性值邊界：**識別 2 個需釐清項目**
- ✅ A4. 跨屬性不變條件：**識別 2 個需釐清項目**
- ✅ A5. 關係與唯一性：23 個外鍵關係皆正確定義
- ✅ A6. 生命週期與狀態：**識別 6 個需釐清項目**

### B. 功能模型檢查 (Functional Model Checks)
- ✅ B1. 功能識別：所有使用者互動點皆已識別
- ✅ B2. 規則完整性：規則定義完整
- ✅ B3. Example 覆蓋度：大部分功能有良好的 Gherkin examples
- ✅ B4. 邊界條件覆蓋：**識別 2 個需釐清項目**
- ✅ B5. 錯誤與異常處理：**識別 4 個需釐清項目**

### C. 術語與一致性檢查 (Terminology & Consistency)
- ⚠️ C1. 詞彙表：**需建立標準術語表**
- ✅ C2. 術語衝突：**識別 2 個需釐清項目**

### D. 其他品質檢查 (Other Quality Checks)
- ✅ D1. TODOs：無未解決的 TODO 項目
- ✅ D2. 模糊描述：大部分描述清晰明確

## 下一步行動

### 立即處理 (High Priority - 9 項)
1. 與 Product Owner 討論所有 High 優先級釐清項目
2. 定義完整的狀態轉換規則（4 個實體）
3. 補充錯誤處理場景到功能規格（4 個 features）
4. 實作跨屬性驗證邏輯

### 短期處理 (Medium Priority - 11 項)
1. 補充邊界條件測試案例
2. 建立術語表並統一使用
3. 定義數值範圍與限制
4. 文件化 Profile 更新策略

### 長期處理 (Low Priority - 2 項)
1. 實作自動化資料清理機制
2. 優化高流量表的儲存策略

## 相關文件

- [Discovery Scan 完整報告](./DISCOVERY_SCAN_REPORT.md)
- [Discovery 方法論](../promts/discovery.md)
- [ERM 資料模型](../spec/erm.dbml)
- [Feature 規格檔案](../spec/features/)

---

最後更新：2025-11-19
