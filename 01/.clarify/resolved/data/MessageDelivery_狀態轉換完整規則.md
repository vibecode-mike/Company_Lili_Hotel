# 釐清問題

MessageDelivery 表的 delivery_status 欄位有 5 種狀態（pending/sent/failed/opened/clicked），但未完整定義所有可能的狀態轉換路徑與規則

# 定位

ERM: MessageDelivery 表 → delivery_status string(20) [note: '發送狀態：pending（待發送）/ sent（已發送）/ failed（發送失敗）/ opened（已開啟）/ clicked（已點擊）']

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 狀態轉換規則：pending → sent → opened → clicked（線性流程，不可跳過或回退） |
| B | 允許 opened 直接跳到 clicked（會員可能不觸發 opened 事件直接點擊） |
| C | failed 狀態可重試轉換為 pending，重新發送（支援失敗重試機制） |
| D | sent 狀態可能永遠不轉換為 opened（會員未開啟訊息），系統需處理此終態 |
| E | clicked 為最終狀態，不再轉換（無法取消點擊） |
| Short | 提供其他簡短答案(<=5 字) |

# 影響範圍

影響範圍：
1. MessageDelivery 表的狀態轉換邏輯文件
2. 訊息發送與追蹤 API 的狀態更新邏輯
3. 訊息統計報表的開啟率、點擊率計算
4. LINE Webhook 處理邏輯的狀態轉換驗證

# 優先級

High

理由：
- 業務邏輯核心：狀態轉換規則直接影響訊息追蹤準確性
- 資料一致性：未定義清楚可能導致狀態混亂
- 統計準確性：開啟率、點擊率計算依賴正確的狀態轉換

---

# 解決記錄

- **回答**：選項 A。狀態只能依序 pending → sent → opened → clicked。pending → failed 只能透過人工觸發重新回到 pending，再走 sent → opened → clicked 的流程。
- **更新的規格檔**：`spec/erm.dbml`
- **變更內容**：
  1. 更新 `MessageDelivery` 表格 Note，明確寫出線性狀態機（不可跳轉或回退），並補充 sent/failed/clicked 的終止條件。
  2. 說明 `pending → failed` 之後必須由使用者手動重新排程，才能再次進入 pending → sent → opened → clicked 流程。
- **最終狀態機描述**：
  ```
  pending → sent → opened → clicked（clicked 為終止狀態）
      ↓
    failed （人工重送時可回到 pending）
  sent：如會員未開啟，允許停留在 sent 終止
  ```
- **業務影響**：
  - 確保統計指標（開啟率、點擊率）只在預期的狀態下計算，避免跳轉造成的重複統計。
  - 控制失敗重送流程，避免系統自動無限重試，需人工確認後再重新排程。
