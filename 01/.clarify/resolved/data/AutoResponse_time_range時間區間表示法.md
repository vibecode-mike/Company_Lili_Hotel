# 釐清問題

AutoResponse.time_range 欄位如何表示時間區間（如 18:00-09:00 跨日）？儲存格式與解析邏輯為何？

# 定位

ERM：spec/erm.dbml AutoResponse 表格 time_range 欄位（約第67行）
Feature：spec/features/auto_response.feature Example 非營業時間區間（約第65-68行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 儲存 JSON 物件 {"start": "18:00", "end": "09:00"}，支援跨日判斷 |
| B | 儲存字串 "18:00-09:00"，應用層解析並處理跨日邏輯 |
| C | 拆為兩欄位 time_start 與 time_end（time 型別），跨日邏輯由查詢處理 |
| Short | 其他設計（<=5字）|

# 影響範圍

影響指定時間觸發判斷邏輯、查詢效能、跨日情境處理準確性，以及自動回應觸發時機。

# 優先級

Medium

---
# 解決記錄

- **回答**：C - 拆為兩欄位 time_range_start 與 time_range_end（string 型別），跨日邏輯由應用層處理
- **更新的規格檔**：spec/erm.dbml, spec/features/auto_response.feature
- **變更內容**：
  - erm.dbml：
    - 明確 time_range_start 和 time_range_end 欄位格式：HH:mm（24小時制），如「18:00」
    - 新增驗證規則：正則表達式 ^([01]\\d|2[0-3]):[0-5]\\d$，確保格式正確
    - 新增跨日判斷邏輯：當 time_range_end < time_range_start 時表示跨日（如 18:00-09:00 表示晚上 18:00 到隔天 09:00）
    - 新增時間區間比對邏輯：非跨日（09:00-18:00）→ current_time >= start AND current_time <= end；跨日（18:00-09:00）→ current_time >= start OR current_time <= end
    - 允許 NULL（非指定時間觸發時為 NULL）
  - auto_response.feature：新增 2 個 Rule 與 12 個 Example：
    - (1) 時間區間採用兩欄位設計：格式為 HH:mm、時間格式驗證（正確格式、錯誤格式-超出範圍、錯誤格式-缺少冒號）
    - (2) 支援跨日時間區間：跨日判斷（18:00-09:00）、非跨日判斷（09:00-18:00）、跨日觸發判斷（會員在區間內/隔日區間內/區間外）、非跨日觸發判斷（會員在區間內/區間外）
