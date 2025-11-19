# 釐清問題
當會員標籤規則（TagRule）設定完成後，系統應該何時執行標籤自動貼標？是即時執行、定期批次執行、還是手動觸發？

# 定位
Feature：`member_tag_integration.feature` 和 `tag_rule_management.feature` 未定義標籤規則的執行時機與頻率

依據 `member_tag_integration.feature:54-68`，系統支援自訂標籤規則並自動貼標（如「累積消費 >= 50000 元」→「高消費客戶」），但未說明規則建立後何時執行、以及後續更新的頻率。

相關規則：
- `member_tag_integration.feature:54-61` - 管理員設定消費金額門檻後自動貼標
- `member_tag_integration.feature:62-68` - 管理員設定房型分類條件後自動貼標
- `tag_rule_management.feature:8-19` - 建立標籤規則
- `tag_rule_management.feature:40-51` - 啟用標籤規則後自動執行貼標

潛在情境：
1. 管理員建立規則「累積消費 >= 50000」→「VIP」
2. 系統何時檢查所有會員並貼上「VIP」標籤？
3. 之後會員消費金額變動時，系統何時更新標籤？

# 多選題
| 選項 | 描述 |
|--------|-------------|
| A | 即時執行：規則建立/啟用時立即對所有會員執行，之後每次會員資料異動時即時檢查 |
| B | 定期批次執行：規則建立/啟用時立即執行一次，之後每日凌晨批次執行（類似 cron job） |
| C | 混合模式：規則建立時立即執行，之後依規則類型決定（消費類每日批次、PMS 同步即時） |
| D | 手動觸發：規則建立後不自動執行，管理員需手動點擊「執行規則」按鈕 |
| E | 事件驅動：僅在特定事件發生時執行（如 PMS 同步完成、會員消費記錄新增時） |
| F | 其他方案（請說明） |

# 影響範圍
- **實體影響**：
  - TagRule 可能需新增 execution_mode 欄位（immediate/scheduled/manual/event-driven）
  - TagRule 可能需新增 schedule_config 欄位（執行頻率配置，如 cron 表達式）
  - TagRule 可能需新增 last_executed_at 欄位（記錄最後執行時間）
- **功能影響**：
  - 標籤規則執行引擎設計
  - 背景任務排程系統（若選擇 B, C）
  - 會員資料異動觸發器（若選擇 A, C, E）
  - 規則執行歷史與日誌記錄
- **API 影響**：
  - POST /tag-rules 需支援 execution_mode 配置
  - 可能需新增 POST /tag-rules/:id/execute 手動執行端點（若選擇 D）
  - 可能需新增 GET /tag-rules/:id/execution-logs 查詢執行歷史
- **效能影響**：
  - 即時執行可能影響交易效能（若選擇 A）
  - 批次執行需考慮大量會員的處理時間（若選擇 B, C）
- **測試影響**：需新增標籤規則執行時機與頻率的測試案例

# 優先級
Medium

# 理由
此問題影響標籤系統的核心運作邏輯與系統效能，應在實作前明確定義。但由於標籤更新的即時性要求通常不高（會員標籤多用於行銷分析，非即時交易場景），優先級為 Medium。

---
# 解決記錄

- **回答**：D - 採用手動觸發策略
- **更新的規格檔**：
  1. spec/features/tag_rule_management.feature - 新增規則「標籤規則採用手動執行策略，不自動執行」
  2. spec/erm.dbml - TagRule 實體新增 last_executed_at 欄位
- **變更內容**：
  - **tag_rule_management.feature** 新增 5 個範例：
    1. 建立標籤規則後不自動執行（規則建立完成後不自動對所有會員執行）
    2. 管理員手動執行標籤規則（點擊「執行規則」按鈕才會執行並更新 last_executed_at）
    3. 會員資料異動不觸發規則執行（消費記錄新增不會自動執行標籤規則）
    4. 手動執行規則可查看執行歷史（顯示執行時間與執行結果）
    5. 啟用規則不觸發自動執行（設定 is_enabled = true 不會自動執行）
  - **erm.dbml TagRule 實體**：
    - 新增 last_executed_at 欄位（timestamp，允許 NULL）
    - 更新 Note 說明執行策略和執行記錄
- **實作影響**：
  - 需實作「執行規則」按鈕與對應 API（POST /tag-rules/:id/execute）
  - 需實作執行歷史查詢功能（GET /tag-rules/:id/execution-logs）
  - 不需實作背景任務排程系統（cron job）
  - 不需實作事件觸發器監聽資料變動
  - 管理員完全掌控執行時機，避免自動執行對系統效能的影響
