# 釐清問題

LineFriend 與 Member 採雙表設計，但尚未定義兩表之間的資料同步策略與一致性保障機制。

# 定位

ERM：`spec/erm.dbml` → Table `LineFriend`, Table `Member`

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | FollowEvent 時同步更新 Member，Member 調整時也回寫 LineFriend（雙向同步） |
| B | 僅 LineFriend → Member 單向同步 |
| C | 僅 Member → LineFriend 單向同步 |
| D | 兩表資料獨立，不做同步 |
| Short | 其他 |

# 影響範圍

1. `LineFriend` 與 `Member` 欄位的對應關係  
2. FollowEvent 處理流程（LineFriend upsert、Member upsert）  
3. 後台修改 Member 時是否需要觸發 LineFriend 更新  
4. referential integrity（LineFriend.member_id）維護

# 優先級

Medium

理由：
- 需確保 LINE 名稱/頭像在兩張表一致  
- upsert 流程影響會員建立與 join_source 判定  
- 未定義同步規則可能導致資料不一致

---

# 解決記錄

- **回答**：雙向同步。FollowEvent 寫入 LineFriend 時，同步 upsert Member；後台調整 Member 的 line_name / line_avatar 時亦需回寫 LineFriend。
- **更新的規格檔**：`spec/erm.dbml`
- **變更內容**：
  1. 在 `Member` Note 新增「LineFriend 同步策略」，列出共同欄位對應（line_uid、line_name、line_avatar）、FollowEvent 的 upsert 流程，以及後台更新時同步 LineFriend 的規則。
  2. 調整 `LineFriend` Note：重新描述與 Member 的關係與同步，說明 FollowEvent upsert 行為、`member_id` 回寫、Member 後台更新時的同步，以及非 LINE 來源可無對應 LineFriend 的情境。
- **業務影響**：
  - 保證 LINE 名稱/頭像在前台（LineFriend）與會員資料（Member）一致。
  - FollowEvent 立即建立 Member（若尚未存在），加速後續行銷與標籤流程。
  - 後台更新會員資料時不需重複手動維護 LineFriend，降低維運成本。
