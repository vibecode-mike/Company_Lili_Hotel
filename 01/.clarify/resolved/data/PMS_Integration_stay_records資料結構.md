# 釐清問題
PMS_Integration 表目前以三個 `string` 欄位（`stay_records`, `room_type`, `stay_date`）承載住宿紀錄，但規格未說明資料結構與維護方式。同步 PMS 資料時，應如何儲存多筆住宿紀錄與欄位格式？

# 定位
ERM：spec/erm.dbml:331-341（PMS_Integration.stay_records / room_type / stay_date 欄位）

# 多選題
| 選項 | 描述 |
|--------|-------------|
| A | 維持單表設計：`stay_records` 存原始 JSON 陣列（含 check_in、check_out、room_type 等），`room_type` / `stay_date` 只保存最近一次住宿資訊，歷史紀錄保留在 JSON。 |
| B | 正規化結構：新增 `StayRecord` 明細表（欄位：member_id、pms_integration_id、check_in、check_out、room_type、booking_id…），移除 `stay_records` 字串欄位。 |
| C | 僅保留最新一次住宿：同步時覆寫 `room_type`、`stay_date`，`stay_records` 為人工可讀文字摘要，不需要保留完整歷史。 |
| Short | 其他儲存策略（<=5字） |

# 影響範圍
- **資料庫 Schema**：決定是否需要新增住宿明細表、調整欄位型別與索引。
- **同步流程**：影響 PMS 匯入時的寫入策略、是否需要處理多筆住宿資料與歷史保留。
- **後續分析**：左右會員行為分析（常住房型、住宿頻率）、報表統計與 API 查詢設計。

# 優先級
High — 若未釐清資料結構，無法實作 PMS 同步與後續報表查詢，影響資料一致性與分析能力。

---
# 解決記錄

- **回答**：B - 正規化結構：新增 StayRecord 明細表
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：
  1. 從 PMS_Integration 表移除 stay_records、room_type、stay_date 三個欄位
  2. 新增 StayRecord 明細表，包含欄位：record_id（主鍵）、member_id（外鍵）、pms_integration_id（外鍵）、check_in（入住日期）、check_out（退房日期）、room_type（房型）、booking_id（PMS 訂單編號）、created_at（建立時間）
  3. 新增索引：(member_id, check_in) 優化頻率統計查詢、(room_type) 優化房型分類查詢
  4. 更新 PMS_Integration 的 Note，說明採用正規化結構儲存住宿紀錄
  5. 建立關係：StayRecord N:1 Member, StayRecord N:1 PMS_Integration
  6. 支援 TagRule 的 visit_frequency（訪問頻率）與 room_type（房型分類）規則計算
