# 釐清問題

Message 實體透過 campaign_id 可選關聯至 Campaign（活動管理），但規格未明確定義哪些情境下必須關聯 Campaign、哪些情境下可以不關聯。獨立訊息（campaign_id = NULL）與活動訊息在功能上是否有差異？是否需要在 UI 層面強制要求特定類型的訊息必須關聯 Campaign？

# 定位

Feature：create_broadcast.feature
ERM：Message 實體（campaign_id 屬性）與 Campaign 實體的關聯關係
檢查項：B2. 規則完整性（Campaign 關聯的業務規則）

相關說明（erm.dbml line 326, 361-365）：
```
Message 表：
  campaign_id string [ref: > Campaign.campaign_id, note: '所屬活動ID（選填）。若此訊息屬於特定行銷活動，關聯至 Campaign；若為獨立訊息則為 NULL']

活動關聯：透過 campaign_id 可選關聯至 Campaign
  - 關聯活動：便於管理多波次訊息，支援活動層級統計
  - 獨立訊息：campaign_id 為 NULL，適用於日常通知、臨時公告
```

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 完全自由選擇：所有訊息都可自由選擇是否關聯 Campaign，無強制規則，由使用者決定 |
| B | 類型強制規則：特定類型的訊息必須關聯 Campaign（如「行銷活動」類型），其他類型（如「系統通知」「臨時公告」）可選 |
| C | 數量門檻規則：同一主題的訊息超過 N 筆（如 3 筆）時，強制要求建立 Campaign 進行管理，避免訊息散亂 |
| D | 完全獨立：取消 Campaign 關聯設計，所有訊息皆為獨立訊息，透過標籤（tag）或分類（category）進行分組管理 |
| Short | 提供其他簡短答案（<=5 字） |

註：Campaign 關聯規則將影響訊息管理介面設計、訊息列表呈現與數據統計方式。

補充問題：
- 功能差異：獨立訊息與活動訊息在發送邏輯、統計分析、權限控制上是否有差異？
- UI 引導：建立群發訊息時，UI 應如何引導使用者選擇是否關聯 Campaign？（如：預設勾選、強制選擇、根據訊息類型智能建議）
- Campaign 必填欄位：若關聯 Campaign，Campaign 的哪些欄位為必填？（如 campaign_name, campaign_tag, campaign_date）

# 影響範圍

- **Message 表**：
  - campaign_id 欄位的驗證規則（是否允許 NULL、何時強制必填）
  - 可能需新增 message_category 欄位（訊息分類，如「行銷活動」「系統通知」「臨時公告」），用於判斷是否需要關聯 Campaign
- **Campaign 表**：
  - 若採用選項 D（取消關聯設計），可能不再需要 Campaign 表
  - 若保留 Campaign，需明確定義 Campaign 的必填欄位與驗證規則
- **群發訊息建立流程**：
  - UI 引導邏輯（是否顯示 Campaign 選擇欄位、是否強制選擇）
  - 驗證規則（根據訊息類型判斷 campaign_id 是否必填）
- **訊息列表呈現**：
  - 獨立訊息與活動訊息的分組顯示方式
  - 活動訊息的聚合顯示（同一 Campaign 的訊息分組顯示）
- **數據統計**：
  - 活動層級統計（Campaign 的整體發送數、開啟率、點擊率）
  - 獨立訊息的統計方式（無 Campaign 聚合）

影響功能：
- 群發訊息建立：UI 需提供 Campaign 選擇欄位，並根據規則驗證是否必填
- 訊息列表：獨立訊息與活動訊息的分組顯示與篩選
- 訊息數據分析：活動層級統計與獨立訊息統計的呈現方式

# 優先級

**Medium**（影響訊息管理介面設計與用戶體驗）

理由：
1. 業務邏輯不明確：缺少 Campaign 關聯的必填規則定義，開發人員無法設計驗證邏輯
2. 用戶體驗：若無明確引導，使用者可能不清楚何時應建立 Campaign、何時使用獨立訊息
3. 資料管理：大量獨立訊息可能造成管理混亂，難以追蹤活動成效
4. 統計分析：活動層級統計的價值取決於訊息是否正確關聯 Campaign

建議行動：採用「完全自由選擇」（選項 A）+ UI 智能建議策略，在建立訊息時提供 Campaign 選擇欄位，並根據訊息內容（如包含「活動」「促銷」「優惠」等關鍵字）智能建議使用者建立或關聯 Campaign。補充業務規則至 create_broadcast.feature，明確說明 Campaign 關聯的使用場景與建議實務。
