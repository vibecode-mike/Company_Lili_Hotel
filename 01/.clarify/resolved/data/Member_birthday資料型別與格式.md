# 釐清問題

Member.birthday 欄位應儲存完整日期（date）還是僅儲存月份（integer）？如何處理生日月份標籤與完整生日的關係？

# 定位

ERM：spec/erm.dbml Member 表格 birthday 欄位（約第14行）
Feature：spec/features/member_tag_management.feature Rule 關於生日月份標籤（約第108-113行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 儲存完整日期（date），月份標籤由系統自動計算 |
| B | 同時儲存完整日期（birthday）與生日月份（birthday_month integer），冗餘但提升查詢效能 |
| C | 僅儲存生日月份（integer 1-12），不保留完整日期 |
| Short | 其他設計（<=5字）|

# 影響範圍

影響資料庫 schema、問券蒐集資料處理、會員標籤自動生成、生日行銷推播功能，以及篩選條件設計。

# 優先級

Medium

---
# 解決記錄

- **回答**：A - 儲存完整日期（date，格式 yyyy-mm-dd），月份標籤由系統自動從完整日期計算
- **更新的規格檔**：spec/erm.dbml, spec/features/member_tag_management.feature
- **變更內容**：
  - erm.dbml：明確 birthday 欄位儲存完整日期（yyyy-mm-dd），用途包含生日月份標籤自動生成、生日行銷推播、會員年齡計算，允許 NULL
  - member_tag_management.feature：更新生日月份比對規則，新增 3 個 Example：(1) 問券蒐集生日並自動提取月份標籤、(2) 生日月份標籤自動生成邏輯、(3) 未填寫生日則不產生月份標籤
