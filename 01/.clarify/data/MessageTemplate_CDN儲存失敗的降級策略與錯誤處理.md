# 釐清問題

MessageTemplate 採用混合儲存策略：小型模板（< 10KB）儲存於 flex_message_json 欄位，大型模板（>= 10KB）上傳至 CDN 並儲存 URL 於 flex_message_url。當 CDN 上傳失敗時（如網路異常、CDN 服務異常），系統應如何處理？是否需要降級策略將大型 JSON 儲存於資料庫？

# 定位

ERM：MessageTemplate 實體
屬性：flex_message_json, flex_message_url, flex_message_size, storage_type
檢查項：A6. 生命週期與狀態（儲存策略的錯誤狀態處理）

相關說明（erm.dbml line 482-486）：
```
混合儲存策略（解決大型 JSON 導致的效能問題 #b3da7ae）：
  - 小型模板（< 10KB）：儲存於 flex_message_json 欄位，storage_type = 'database'
  - 大型模板（>= 10KB）：上傳至 CDN，URL 儲存於 flex_message_url，flex_message_json = NULL，storage_type = 'cdn'
  - 發送邏輯：優先使用 flex_message_url（若不為 NULL），否則使用 flex_message_json
  - 大小判斷：透過 flex_message_size 欄位記錄 JSON 大小（單位：bytes），用於儲存策略判斷
```

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 強制 CDN：大型 JSON 必須上傳至 CDN，失敗時阻擋模板儲存，返回錯誤訊息「CDN 上傳失敗，請稍後再試」，不允許降級至資料庫 |
| B | 降級至資料庫：CDN 上傳失敗時自動降級，將大型 JSON 儲存於 flex_message_json 欄位，storage_type = 'database_fallback'，記錄警告日誌 |
| C | 重試機制：CDN 上傳失敗時自動重試 3 次（指數退避），全部失敗後才阻擋儲存，返回錯誤訊息 |
| D | 混合策略：CDN 上傳失敗時先重試 3 次，仍失敗則降級至資料庫儲存（storage_type = 'database_fallback'），並標記為待修復狀態供後台管理員手動重新上傳 |
| Short | 提供其他簡短答案（<=5 字） |

註：降級策略將影響系統可用性、資料庫效能與 CDN 依賴度。

# 影響範圍

- **MessageTemplate 表**：
  - storage_type 欄位值域擴充（可能需新增 'database_fallback' 狀態）
  - 錯誤狀態追蹤（可能需新增 upload_error_message 欄位）
  - 待修復標記（可能需新增 needs_cdn_retry 布林欄位）
- **模板儲存邏輯**：
  - CDN 上傳失敗的錯誤處理流程
  - 降級至資料庫的觸發條件與執行邏輯
  - 重試機制的實作（重試次數、延遲策略）
- **模板發送邏輯**：
  - 從資料庫或 CDN 取得 Flex Message JSON 的優先順序
  - storage_type = 'database_fallback' 時的特殊處理
- **系統監控**：
  - CDN 上傳失敗率的監控與告警
  - 降級至資料庫的模板數量統計
- **資料庫效能**：
  - 大型 JSON 儲存於資料庫對查詢效能的影響
  - 是否需要定期清理或重新上傳至 CDN

影響功能：
- 訊息模板建立：大型輪播圖或複雜 Flex Message 的儲存流程
- 群發訊息發送：從資料庫或 CDN 取得模板 JSON 的邏輯
- 模板庫管理：降級模板的顯示與管理（可能需標記「待重新上傳」）

# 優先級

**High**（影響系統可用性與資料儲存策略）

理由：
1. 系統可用性風險：缺少降級策略可能導致 CDN 異常時無法建立大型模板，影響業務連續性
2. 用戶體驗：CDN 失敗時若無明確錯誤處理，用戶可能遇到「模板儲存失敗」且無法重試
3. 資料庫效能：若採用降級至資料庫策略，需評估大型 JSON 對資料庫查詢效能的影響
4. 運維複雜度：需設計監控機制追蹤 CDN 上傳失敗率與降級模板數量，確保系統健康
5. 錯誤恢復：需明確定義降級後的恢復策略（如自動重新上傳至 CDN 或手動觸發）

建議行動：採用「混合策略」（選項 D），先重試 3 次，失敗則降級至資料庫並標記待修復狀態，確保系統可用性同時保留後續優化空間。補充 storage_type 值域與錯誤處理邏輯至 ERM 註記。
