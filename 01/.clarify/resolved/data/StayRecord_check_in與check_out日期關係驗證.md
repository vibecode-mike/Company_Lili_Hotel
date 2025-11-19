# 釐清問題

StayRecord 的 check_in 與 check_out 日期是否需要驗證前後關係？是否允許同一天入住退房？

# 定位

ERM：StayRecord 實體的 check_in 與 check_out 屬性的驗證規則

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 必須 check_out > check_in（不允許同一天） |
| B | 必須 check_out >= check_in（允許同一天入住退房） |
| C | 不驗證（信任 PMS 系統資料） |
| D | 僅警告但允許儲存（PMS 資料可能有特殊情況） |
| Short | 提供其他簡短答案（<=5 字） |

# 影響範圍

影響 PMS 同步的資料驗證規則、StayRecord 的資料完整性、以及住宿頻率計算邏輯

# 優先級

Medium - 影響資料完整性與業務邏輯正確性

---

# 解決記錄

- **回答**：B - 必須 check_out >= check_in（允許同一天入住退房）
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 StayRecord 實體的 check_out 屬性 Note 說明，新增「日期關係驗證：check_out >= check_in（退房日期必須大於等於入住日期），允許同一天入住退房（如當日住宿情境）。驗證邏輯：前端與後端 API 皆實施驗證，拒絕 check_out < check_in 的資料」
- **解決時間**：2025-11-14
