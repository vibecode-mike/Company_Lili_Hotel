# 釐清問題
Campaign 實體是否需要 status 欄位來記錄群發訊息的狀態（草稿、已發送、已排程等）？

# 定位
ERM：Campaign 實體缺少狀態欄位定義

依據 `create_broadcast.feature` 規則，群發訊息支援「儲存為草稿」與「發送訊息」兩種操作，但 `erm.dbml` 的 Campaign 實體未定義 status 欄位來區分這些狀態。

相關 Feature：
- `create_broadcast.feature:182-191` - 儲存草稿時允許 action_type 已設定但對應欄位未填
- `create_broadcast.feature:193-207` - 發送訊息前嚴格驗證 action_type 與對應欄位

# 多選題
| 選項 | 描述 |
|--------|-------------|
| A | 新增 status 欄位，值域包含：draft（草稿）、scheduled（已排程）、sending（發送中）、sent（已發送）、failed（發送失敗） |
| B | 不需要 status 欄位，透過 scheduled_at 與 sent_at 的組合判斷狀態 |
| C | 新增 status 欄位，但僅區分 draft 與 sent 兩種狀態 |
| D | 其他方案（請說明） |

# 影響範圍
- **實體影響**：Campaign 實體需新增 status 欄位及其值域定義
- **功能影響**：
  - 群發訊息建立流程（create_broadcast.feature）
  - 草稿管理功能
  - 群發訊息列表篩選與排序
- **API 影響**：
  - POST /campaigns 需處理 status 初始值
  - GET /campaigns 需支援按 status 篩選
  - PATCH /campaigns/:id 需支援狀態轉換驗證
- **測試影響**：需新增狀態轉換測試案例

# 優先級
High

# 理由
此問題直接影響群發訊息的核心功能設計、資料庫結構定義、API 設計及使用者體驗。必須在實作前明確定義狀態管理機制。

---
# 解決記錄

- **回答**：A - 新增 status 欄位，值域包含：draft（草稿）、scheduled（已排程）、sending（發送中）、sent（已發送）、failed（發送失敗）
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 Message 實體的 send_status 欄位，將值域從「草稿 / 排程發送 / 已發送 / 發送失敗」擴充為「草稿 / 排程發送 / 發送中 / 已發送 / 發送失敗」，並更新狀態轉換規則，加入「發送中」過渡狀態的轉換邏輯
