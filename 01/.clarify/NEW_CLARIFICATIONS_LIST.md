# 新增釐清項目清單 (New Clarifications List)

## 總覽

**建立日期**: 2025-11-19  
**總計**: 22 個新釐清項目  
**方法**: Discovery.md 完整檢查清單掃描

---

## 資料模型 (Data Model) - 14 項

### 高優先級 (High) - 5 項

| # | 檔案名稱 | 問題摘要 | 影響範圍 |
|---|---------|---------|---------|
| 1 | Campaign_status狀態轉換詳細規則.md | draft/active/completed/cancelled 狀態轉換規則未完整定義 | 活動管理邏輯、訊息發送控制 |
| 2 | LoginSession_會話過期與清理機制.md | 會話有效期、自動登出、過期清理策略未定義 | 系統安全性、使用者體驗、資料庫效能 |
| 3 | MessageDelivery_狀態轉換完整規則.md | pending/sent/failed/opened/clicked 狀態轉換路徑未完整定義 | 訊息追蹤準確性、開啟率點擊率統計 |
| 4 | Message_estimated_send_count與available_quota關係驗證.md | 配額驗證時機與錯誤處理策略未明確定義 | 訊息發送失敗、使用者體驗、成本控制 |
| 5 | PMS_Integration_sync_status詳細定義.md | 同步失敗重試策略與錯誤處理機制未定義 | PMS 整合穩定性、資料完整性 |

### 中優先級 (Medium) - 7 項

| # | 檔案名稱 | 問題摘要 | 影響範圍 |
|---|---------|---------|---------|
| 6 | AutoResponseMessage_sequence_order數值範圍.md | sequence_order 上限與訊息數量限制未定義 | UI 一致性、資料驗證、業務邏輯 |
| 7 | LineFriend_Profile更新頻率與策略.md | Profile 更新間隔 N 天未明確定義 | API 呼叫成本、資料新鮮度 |
| 8 | StayRecord_check_in與check_out關係詳細驗證.md | 日期關係邊界條件與異常處理未明確定義 | 資料完整性、標籤規則準確性 |

### 低優先級 (Low) - 2 項

| # | 檔案名稱 | 問題摘要 | 影響範圍 |
|---|---------|---------|---------|
| 9 | ComponentInteractionLog_total_clicks數值範圍.md | total_clicks 數值範圍與上限未定義 | 資料庫欄位型別選擇、異常監控 |
| 10 | LineFriend_資料保留策略執行時機.md | 90 天後刪除策略的執行時機與自動化方式未定義 | 資料庫空間管理、資料安全 |

---

## 功能規格 (Features) - 6 項

### 高優先級 (High) - 4 項

| # | 檔案名稱 | 問題摘要 | 影響範圍 |
|---|---------|---------|---------|
| 1 | 會員搜尋_錯誤處理場景.md | 缺乏 SQL 注入防護、查詢逾時、驗證錯誤等錯誤處理 | 安全性風險、系統穩定性、使用者體驗 |
| 2 | 會員標籤管理_錯誤處理場景.md | 外部系統同步失敗、資料驗證錯誤處理策略未定義 | 資料一致性、業務準確性、維護成本 |
| 3 | 群發訊息_篩選條件組合極端情況.md | 空條件、全包含、全排除等極端情況處理策略未定義 | 訊息發送準確性、使用者體驗、測試完整性 |
| 4 | 重新設定_LINE_OA_確認機制與風險提示.md | 缺乏確認機制、風險提示、誤操作防護 | 資料安全性、業務連續性、合規要求 |

### 中優先級 (Medium) - 2 項

| # | 檔案名稱 | 問題摘要 | 影響範圍 |
|---|---------|---------|---------|
| 5 | 自動回應_關鍵字邊界條件.md | 關鍵字空白、特殊字元、超長輸入處理策略未定義 | 使用者體驗、資料品質、測試完整性 |
| 6 | 標籤規則管理_錯誤處理場景.md | 規則衝突、自動執行失敗處理策略未定義 | 自動化風險、資料一致性、可維護性 |

---

## 術語釐清 (Terminology) - 2 項

### 中優先級 (Medium) - 2 項

| # | 檔案名稱 | 問題摘要 | 影響範圍 |
|---|---------|---------|---------|
| 1 | 會員_LineFriend_Member術語釐清.md | 「會員」、「LINE 好友」、Member、LineFriend 術語混用 | 溝通清晰度、文件一致性、使用者體驗 |
| 2 | 標籤來源_tag_source值域標準化.md | 標籤來源值不一致（中文 vs 英文） | 資料一致性、可維護性、國際化支援 |

---

## 檔案路徑清單

### 資料模型 (.clarify/data/)
```
AutoResponseMessage_sequence_order數值範圍.md
Campaign_status狀態轉換詳細規則.md
ComponentInteractionLog_total_clicks數值範圍.md
LineFriend_Profile更新頻率與策略.md
LineFriend_資料保留策略執行時機.md
LoginSession_會話過期與清理機制.md
MessageDelivery_狀態轉換完整規則.md
Message_estimated_send_count與available_quota關係驗證.md
PMS_Integration_sync_status詳細定義.md
StayRecord_check_in與check_out關係詳細驗證.md
```

### 功能規格 (.clarify/features/)
```
會員搜尋_錯誤處理場景.md
會員標籤管理_錯誤處理場景.md
標籤規則管理_錯誤處理場景.md
自動回應_關鍵字邊界條件.md
群發訊息_篩選條件組合極端情況.md
重新設定_LINE_OA_確認機制與風險提示.md
```

### 術語 (.clarify/terminology/)
```
會員_LineFriend_Member術語釐清.md
標籤來源_tag_source值域標準化.md
```

---

## Discovery Checklist 對應

### A. 資料模型檢查
- **A3. 屬性值邊界**: 2 項 (ComponentInteractionLog, AutoResponseMessage)
- **A4. 跨屬性不變條件**: 2 項 (Message, StayRecord)
- **A6. 生命週期與狀態**: 6 項 (MessageDelivery, Campaign, PMS_Integration, LoginSession, LineFriend x2)

### B. 功能模型檢查
- **B4. 邊界條件覆蓋**: 2 項 (自動回應, 群發訊息)
- **B5. 錯誤與異常處理**: 4 項 (會員搜尋, 會員標籤管理, 標籤規則管理, 重新設定 LINE OA)

### C. 術語與一致性檢查
- **C2. 術語衝突**: 2 項 (會員術語, 標籤來源)

---

## 下一步行動

### 立即處理 (High - 9 項)
1. 與 Product Owner 討論所有 High 優先級項目
2. 定義完整的狀態轉換規則
3. 補充錯誤處理場景到功能規格
4. 實作跨屬性驗證邏輯

### 短期處理 (Medium - 11 項)
1. 補充邊界條件測試案例
2. 建立術語表並統一使用
3. 定義數值範圍與限制
4. 文件化更新策略

### 長期處理 (Low - 2 項)
1. 實作自動化資料清理機制
2. 優化高流量表的儲存策略

---

**相關文件**:
- [Discovery Scan 完整報告](./DISCOVERY_SCAN_REPORT.md)
- [釐清項目索引](./INDEX.md)
- [品質驗證報告](./VERIFICATION.md)

