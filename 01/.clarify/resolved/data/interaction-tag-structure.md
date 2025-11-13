# 釐清問題
InteractionTag 表以 tag_id 為主鍵，但同時包含 member_id 與 message_id，無法支援同一互動標籤對多位會員或多次觸發的需求；此表究竟代表「標籤定義」還是「會員的互動標籤紀錄」？

# 定位
ERM：spec/erm.dbml InteractionTag 表格與 Note 敘述（約第48-57行）。

# 多選題
| 選項 | 描述 |
|------|------|
| A | InteractionTag 應代表每次會員互動貼標事件，需改用複合主鍵（如 surrogate id 或 member_id+tag_id+message_id）來允許多筆紀錄。 |
| B | InteractionTag 只負責定義「互動標籤」的靜態資訊，member_id/message_id 應移到另一張關聯表；請提供應有的資料模型。 |
| C | 每個 InteractionTag row 其實是一個「會員專屬標籤」，系統會為同名標籤生成不同 tag_id；請確認命名規則。 |
| Short | 其他說明（<=5字）。 |

# 影響範圍
直接影響互動標籤的儲存結構、去重邏輯、標籤統計以及訊息推播篩選，可牽涉多張表與 API 設計。

# 優先級
High

---
# 解決記錄

- **回答**：B - InteractionTag 只負責定義「互動標籤」的靜態資訊，member_id/message_id 應移到另一張關聯表
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：
  1. 將 InteractionTag 改為標籤定義表，移除 member_id 和 message_id 欄位
  2. 新增 MemberInteractionRecord 表，用於記錄會員互動紀錄
  3. MemberInteractionRecord 包含 record_id (pk), member_id, tag_id, message_id, triggered_at
  4. 建立 unique index (member_id, tag_id, message_id) 實現去重邏輯
  5. 更新 Member 實體的關係說明：Member 1:N MemberInteractionRecord
