# 釐清問題

PMS_Integration 表的 sync_status 欄位有 3 種狀態（active/failed/disabled），但未詳細定義狀態轉換規則、失敗重試策略與錯誤處理機制

# 定位

ERM: PMS_Integration 表 → sync_status string [note: '同步狀態，值域：active（正常同步）/ failed（同步失敗）/ disabled（已停用）。預設值：active']

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | failed 狀態自動重試 3 次後轉為 disabled，需手動重新啟用 |
| B | failed 狀態記錄失敗原因與時間，管理員手動修正後轉回 active |
| C | disabled 狀態僅能由管理員手動操作，系統不會自動轉換 |
| D | 同步失敗時發送警告通知給管理員（Email 或系統通知） |
| Short | 提供其他簡短答案(<=5 字) |

# 影響範圍

影響範圍：
1. PMS_Integration 表需新增 failure_reason、failed_at、retry_count 等欄位
2. PMS 同步排程任務需實作重試邏輯與狀態更新
3. 管理後台需顯示同步狀態與失敗原因
4. 警告通知機制設計

# 優先級

High

理由：
- 整合穩定性：PMS 同步失敗會影響會員資料完整性
- 可維護性：需明確錯誤處理流程以降低人工介入成本
- 業務影響：同步失敗可能導致標籤與消費記錄不準確

---

# 解決記錄

- **回答**：選擇 A。同步任務若連續 3 次失敗，系統自動將 sync_status 設為 disabled，停止後續自動同步並提示管理員。修復問題後須人工改回 active；成功同步會清空失敗計數。
- **更新的規格檔**：`spec/erm.dbml`
- **變更內容**：
  1. 為 `PMS_Integration` 新增 `consecutive_failed_count`、`last_failed_at` 欄位，用來追蹤連續失敗與最近失敗時間。
  2. 在 Note 中描述 active/failed/disabled 的轉換、三次失敗自動停用、成功同步重置計數與通知流程。
- **業務影響**：
  - 自動偵測長時間失敗並停用整合，避免不穩定連線持續耗費資源。
  - 管理員可依紀錄快速排除錯誤並手動恢復，減少全程人工監控負擔。
