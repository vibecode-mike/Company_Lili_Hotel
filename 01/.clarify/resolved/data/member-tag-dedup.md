# 釐清問題
MemberTag 的備註說明去重規則為 (member_id, tag_id, message_id) 組合，但表格欄位並沒有 message_id；需要哪種資料結構才能存放去重所需的 message_id？

# 定位
ERM：spec/erm.dbml MemberTag 表格與 Note 敘述（約第30-37行）。

# 多選題
| 選項 | 描述 |
|------|------|
| A | 在 MemberTag 表中新增 message_id 欄位，並以 (member_id, tag_id, message_id) 作為複合鍵/唯一值，直接記錄每次觸發。 |
| B | 維持 MemberTag 僅存聚合資料，另建一張明細表（請指明名稱/欄位）紀錄 (member_id, tag_id, message_id) 以供去重。 |
| C | 去重由應用層根據 MessageRecord 或其他來源推算，資料庫無須新增欄位；請說明流程。 |
| Short | 其他作法（<=5字）。 |

# 影響範圍
決定資料庫 schema、去重邏輯實作及標籤統計的正確性，會影響 MemberTag 的 CRUD、訊息推播和標籤統計功能。

# 優先級
High

# 回覆
選項 A：在 `MemberTag` 表新增 `message_id`，並對 (member_id, tag_id, message_id) 設唯一限制。
