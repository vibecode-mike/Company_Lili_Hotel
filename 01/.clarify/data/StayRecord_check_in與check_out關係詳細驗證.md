# 釐清問題

StayRecord 表的 check_in 與 check_out 日期關係僅說明「check_out >= check_in」，但未明確定義邊界條件與異常情況處理

# 定位

ERM: StayRecord 表 → check_in date, check_out date
現有說明：「check_in 與 check_out 日期關係驗證」

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 允許 check_in = check_out（當日入住當日退房，計為 1 晚） |
| B | check_out 必須 > check_in（至少住宿 1 晚，當日入住當日退房視為無效） |
| C | check_out - check_in 最大間隔為 365 天（防止異常資料） |
| D | check_in 不可為未來日期（僅接受歷史或當日入住記錄） |
| E | check_out 可為 NULL（代表尚未退房，用於當前住宿中的會員） |
| Short | 提供其他簡短答案(<=5 字) |

# 影響範圍

影響範圍：
1. PMS 整合 API 需實作日期驗證邏輯
2. StayRecord 資料寫入前需驗證日期關係
3. 前端管理介面需顯示驗證錯誤提示
4. 住宿天數計算邏輯（check_out - check_in）

# 優先級

Medium

理由：
- 資料完整性：錯誤的日期關係會導致標籤規則判斷錯誤
- PMS 整合：需處理 PMS 系統可能傳來的異常資料
- 業務邏輯：住宿天數計算依賴正確的日期關係
