# 釐清問題

外部系統（PMS/CRM）會員比對時，多個欄位命中的優先順序為何？

# 定位

Feature：member_tag_integration.feature - 「自動比對」（第 79 行）
Feature：pms_integration.feature - 會員比對邏輯

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 身分證優先 - 身分證 > 手機 > email > 姓名 |
| B | 手機優先 - 手機 > 身分證 > email > 姓名 |
| C | 精確度優先 - 唯一性欄位（身分證/email）> 可重複欄位（手機/姓名） |
| D | 組合比對 - 需同時滿足多個欄位（如姓名+手機）才算命中 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- PMS/CRM 整合的會員匹配準確性
- 會員資料重複風險
- 標籤自動貼標正確性

# 優先級

High
- High：影響外部系統整合的核心會員比對邏輯

---
# 解決記錄

- **回答**：B - 最新更新：依來源事件時間/收到時間覆蓋，空白不覆蓋
- **更新的規格檔**：01/spec/features/pms_integration.feature
- **變更內容**：新增跨系統同步欄位衝突處理規則，使用最新 source_time/received_at 的非空值覆蓋既有欄位，空白不覆蓋，並更新 updated_at；範例涵蓋 PMS 與 CRM 同時回傳會員資料
