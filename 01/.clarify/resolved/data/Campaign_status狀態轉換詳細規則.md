# 釐清問題

Campaign 表的 status 欄位有 4 種狀態（draft/active/completed/cancelled），但未詳細定義狀態轉換規則與限制條件

# 定位

ERM: Campaign 表 → status string(20) [note: '活動狀態：draft（草稿）/ active（進行中）/ completed（已完成）/ cancelled（已取消）。預設值：draft']

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 狀態轉換：draft → active → completed（線性流程，completed 不可逆） |
| B | 允許 draft ⇄ active 雙向轉換（活動可暫停並重新啟動） |
| C | 任何狀態皆可轉換為 cancelled（緊急停止機制） |
| D | completed 狀態自動轉換（活動結束時間到達時系統自動更新） |
| E | cancelled 狀態不可轉換為其他狀態（取消為最終狀態） |
| Short | 提供其他簡短答案(<=5 字) |

# 影響範圍

影響範圍：
1. Campaign 表的狀態轉換邏輯文件
2. 活動管理 API 的狀態更新驗證
3. 排程任務自動更新 completed 狀態邏輯
4. 前端活動管理介面的操作權限控制

# 優先級

High

理由：
- 業務邏輯核心：活動狀態管理直接影響訊息發送與統計
- 資料一致性：需明確定義狀態轉換避免邏輯混亂
- 操作安全性：需防止誤操作導致活動狀態異常

---

# 解決記錄

- **回答**：草稿不屬於 Campaign.status 的值域，僅是訊息模板階段。正式活動只有 active / completed / cancelled 三種狀態；active 可轉為 completed（自動或手動結案）、或轉為 cancelled（緊急終止）。completed、cancelled 為終止狀態不可回復。
- **更新的規格檔**：`spec/erm.dbml`
- **變更內容**：
  1. 將 Campaign.status note 改為 active/completed/cancelled，預設 active，並說明草稿由 Message.send_status 控制。
  2. 擴寫 Campaign Note：新增狀態管理與轉換規則、草稿處理說明，並強調 completed/cancelled 為終止狀態。
- **業務影響**：
  - 草稿編輯流程留在訊息模板與 MessageDelivery 狀態，不再混淆 Campaign.status。
  - 活動管理僅追蹤正式活動生命週期，便於計算活動成效與停用流程。
