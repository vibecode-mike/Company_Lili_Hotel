# 釐清問題

ComponentInteractionLog 表的 total_clicks 欄位未明確定義數值範圍與上限

# 定位

ERM: ComponentInteractionLog 表 → total_clicks int [not null, default: 0, note: '總點擊次數']

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | total_clicks 使用 int (4 bytes, 最大值 2,147,483,647)，適用於大多數場景 |
| B | total_clicks 使用 bigint (8 bytes, 最大值 9,223,372,036,854,775,807)，支援超高點擊量場景 |
| C | total_clicks 設定合理上限（如：每個組件每日最多 10,000 次點擊），超過上限時觸發異常警告 |
| D | total_clicks 不設上限，但當數值接近 int 上限（如：>2,000,000,000）時記錄警告 log |
| Short | 提供其他簡短答案(<=5 字) |

# 影響範圍

影響範圍：
1. ComponentInteractionLog 表結構定義
2. 點擊統計 API 的數值驗證邏輯
3. 資料庫欄位型別選擇（int vs bigint）
4. 異常監控與警告機制

# 優先級

Low

理由：
- 業務影響較小：點擊次數統計通常不會達到 int 上限
- 資料庫效能：使用 bigint 會增加儲存空間與查詢負擔
- 建議使用 int 並實作監控警告即可
