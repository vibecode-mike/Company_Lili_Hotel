# 釐清問題

Member.region（居住地區）欄位的值域範圍為何？是否採用標準行政區劃代碼？

# 定位

ERM：spec/erm.dbml Member 表格 region 欄位（約第15行）
Feature：spec/features/create_broadcast.feature Rule 關於地區篩選（約第79-84行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 使用台灣 22 縣市標準名稱（如「台北市」「新北市」），儲存為 varchar |
| B | 使用行政區劃代碼（如「10001」代表台北市），儲存為 varchar 或 integer |
| C | 允許自由輸入，不限制值域（支援國外地區） |
| D | 分為兩欄位：country 與 region，支援國際化 |
| Short | 其他設計（<=5字）|

# 影響範圍

影響問券蒐集的選項設計、會員標籤自動生成、地區篩選功能、資料驗證規則，以及地區統計分析報表。

# 優先級

Medium

---
# 解決記錄

- **回答**：A - 使用台灣 22 縣市標準名稱（如「台北市」「新北市」），儲存為 string，限制值域
- **更新的規格檔**：spec/erm.dbml, spec/features/member_tag_management.feature, spec/features/create_broadcast.feature
- **變更內容**：
  - erm.dbml：明確 residence 欄位值域限制為台灣 22 縣市標準名稱（完整列表），允許 NULL
  - member_tag_management.feature：更新地區比對規則，新增 4 個 Example：(1) 問券蒐集地區標籤、(2) 地區值域驗證、(3) 地區值域完整列表、(4) 非標準地區名稱處理
  - create_broadcast.feature：更新居住地區篩選規則，新增地區篩選值域限制的 Example
