# 釐清問題

LineFriend 表的 LINE Profile 更新策略僅寫「距離上次更新超過 N 天才重新呼叫 API」，未指定 N 的值與實際機制。

# 定位

ERM：`spec/erm.dbml` → Table `LineFriend` → Note「後續互動：距離上次更新超過 N 天才重新呼叫 API（避免頻繁呼叫）」  
需明確資料欄位（profile_updated_at）與更新間隔

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | N = 7 天 |
| B | N = 30 天 |
| C | N = 90 天 |
| D | N 可設定 |
| Short | 其他 |

# 影響範圍

1. LineFriend 表需新增 profile_updated_at  
2. Webhook/Profile API 呼叫邏輯需根據間隔條件判斷  
3. 設定檔與監控需考慮 API 呼叫頻率與資料新鮮度

# 優先級

Medium

理由：
- 控制 LINE API 呼叫成本  
- 確保好友資料不過時  
- 需與後端同步欄位與排程邏輯

---

# 解決記錄

- **回答**：選擇 C。LineFriend Profile 更新間隔固定 90 天（約每季檢查一次），超過才重新呼叫 LINE Profile API。
- **更新的規格檔**：`spec/erm.dbml`
- **變更內容**：
  1. LineFriend 表新增 `profile_updated_at` 欄位，用於記錄最後一次取得 LINE Profile 的時間。
  2. Profile 同步策略改為：FollowEvent 立即抓取並更新 `profile_updated_at`，後續互動時若距離最後更新超過 90 天才重新呼叫 API。
- **業務影響**：
  - 固定 90 天的節奏兼顧資料新鮮與 API 成本。
  - 後端可依 `profile_updated_at` 判斷是否需要再次呼叫，避免頻繁 API 造成費用或流量壓力。
