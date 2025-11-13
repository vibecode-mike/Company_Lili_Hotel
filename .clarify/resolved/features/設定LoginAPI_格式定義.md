# 釐清問題
「設定 Login API」功能的規格僅描述 Channel ID / Channel Secret 需「格式正確」，並舉例空值時的錯誤，但未定義實際的格式規則（長度、允許字元、是否必須為純數字或特定前綴）。請提供 LINE Login 官方欄位的驗證標準，以利前後端一致實作。

# 定位
Feature：設定 Login API → Rule〈Channel ID 欄位必須填寫且格式正確〉、Rule〈Channel Secret 欄位必須填寫且格式正確〉  
ERM：LoginConfig.channel_id、LoginConfig.channel_secret 欄位說明

# 多選題
| 選項 | 描述 |
|--------|-------------|
| A | Channel ID 必須為 10 位數字（同 Messaging API），Channel Secret 為 32 位英數字 |
| B | Channel ID 必須符合 LINE Login 格式（以 165 開頭的 10 位數字），Channel Secret 為 32 位英數字大小寫混合 |
| C | Channel ID 允許英文、數字、特殊符號，但需 5-50 字元；Channel Secret 需 8-50 字元並至少含 1 個特殊符號 |
| D | 僅檢查非空，格式驗證完全依賴 LINE 驗證 API，前端不做長度/正則限制 |
| Short | 其他：Short answer (<=5 words) |

# 影響範圍
影響前端即時驗證、後端表單驗證、資料庫約束以及自動化測試用例。

# 優先級
High

# 決議
- 選項 B
- Login Channel ID 必須為 165 開頭的 10 位數字；Channel Secret 為 32 位大小寫英數字。

# 規格更新
- `spec/erm.dbml`：更新 LoginConfig 欄位 note，明確記錄 LINE Login 官方格式。
- `spec/features/設定_Login_API.feature`：調整範例，驗證 165 開頭 10 位數的 Channel ID 與 32 位英數字的 Channel Secret。

# 狀態
Resolved on 2025-02-14
