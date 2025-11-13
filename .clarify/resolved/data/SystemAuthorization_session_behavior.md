# 釐清問題
當 `SystemAuthorization.is_active = false` 或超過 `expire_date` 時，已登入的管理員是否必須立即被強制登出？抑或僅在下一次操作或重新登入時才阻擋？請確認授權失效對既有有效會話的處理策略。

# 定位
ERM：SystemAuthorization 實體（is_active、expire_date）  
Feature：卡控流程 → Rule〈未獲得系統授權時無法使用功能〉、登入系統 → Rule〈登入成功後建立會話，24HR 內保持自動登入〉

# 多選題
| 選項 | 描述 |
|--------|-------------|
| A | 授權失效時立即使所有 `LoginSession` 失效並強制登出使用者 |
| B | 授權失效後保留現有會話，但任何 API 操作都返回授權錯誤並提示展延（使用者仍停留在頁面） |
| C | 直到管理員手動登出或 Token 逾時才阻擋；授權失效只影響下一次登入 |
| Short | 其他：Short answer (<=5 words) |

# 影響範圍
影響授權卡控排程、登入會話管理、前端錯誤處理流程，以及測試案例編寫。

# 優先級
High

# 決議
- 選項 A
- 授權失效時即刻標記所有登入會話為失效並強制登出。

# 規格更新
- `spec/erm.dbml`：SystemAuthorization Note 補註授權失效需立即終止所有登入會話。
- `spec/features/卡控流程.feature`：新增授權過期時強制登出的 Example。

# 狀態
Resolved on 2025-02-14
