# 釐清問題

Member.gender 值域定義不一致：DBML 註解說「1=男 / 2=女」，但 member_tag_management.feature 說「0=不透漏 / 1=男 / 2=女」。gender 是否允許 0 值？預設值應為 0 還是 NULL？

# 定位

ERM：Member.gender 欄位值域定義
Feature：member_tag_management.feature 中性別標籤規則

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 值域：0=不透漏, 1=男, 2=女；預設值：0；不允許 NULL |
| B | 值域：1=男, 2=女；預設值：NULL；允許 NULL（代表不透漏） |
| C | 值域：0=不透漏, 1=男, 2=女；預設值：NULL；同時允許 0 和 NULL |
| D | 值域：1=男, 2=女, 9=其他；預設值：NULL；允許 NULL |

# 影響範圍

- Member 表 gender 欄位定義與約束
- 問卷蒐集流程（性別選項）
- 性別標籤自動生成邏輯（問卷蒐集後產生「男」「女」標籤）
- 會員篩選條件（按性別篩選）
- API 回應格式（gender 欄位呈現）

# 優先級

High
- 影響資料庫欄位定義與約束
- 影響標籤自動生成邏輯
- 影響前端表單驗證

---
# 解決記錄

- **回答**：A - 值域：0=不透漏, 1=男, 2=女；預設值：0；不允許 NULL
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 Member.gender 欄位定義（第 30 行），值域從「1=男 / 2=女，允許 NULL」修正為「0=不透漏 / 1=男 / 2=女，預設值 0，不允許 NULL」。新增 `[not null, default: '0']` 約束。member_tag_management.feature 已正確定義性別值域，無需修改
