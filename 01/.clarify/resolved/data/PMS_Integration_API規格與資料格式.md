# 釐清問題

PMS_Integration 的 api_endpoint、api_key 與 config_json 欄位的具體格式與用途為何？支援哪些 PMS 系統？

# 定位

ERM：spec/erm.dbml PMS_Integration 表格（約第258-289行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | api_endpoint 為完整 REST API URL；config_json 存放連線參數與欄位映射 |
| B | 僅支援特定 PMS 系統（請註明名稱），使用固定 API 規格 |
| C | 使用 Adapter Pattern 支援多種 PMS，config_json 儲存 adapter 設定 |
| Short | 請提供規格文件（<=5字）|

# 影響範圍

影響 PMS 串接開發工作量、資料映射邏輯、多 PMS 支援擴充性、API 錯誤處理，以及整合測試設計。

# 優先級

Medium

---
# 解決記錄

- **回答**：C - 使用 Adapter Pattern 支援多種 PMS，config_json 儲存 adapter 設定
- **更新的規格檔**：spec/erm.dbml, spec/features/pms_integration.feature（新增）
- **變更內容**：
  - erm.dbml：
    - 新增 pms_type 欄位（值域：dean_pms / opera_pms / fidelio_pms，可擴充）
    - 新增 api_endpoint 欄位（完整 REST API URL，必填）
    - 新增 api_key 欄位（加密儲存，必填）
    - 新增 config_json 欄位（包含 adapter_settings、field_mapping、auth_type、sync_interval、retry_policy）
    - 新增 sync_status 欄位（值域：active / failed / disabled）
    - 新增 last_sync_at 欄位（最後同步時間）
    - 新增 error_message 欄位（同步錯誤訊息）
    - 新增 created_at 欄位（建立時間）
    - 更新 Note：說明 Adapter Pattern 設計理念、初期支援德安 PMS、擴充策略、API 配置、欄位映射、會員比對、錯誤處理、安全性
  - pms_integration.feature（新增）：
    - Rule 1: 支援多種 PMS 系統透過 Adapter Pattern 整合（配置德安 PMS、未來支援 Opera PMS）
    - Rule 2: API 連線配置獨立管理（每家飯店使用獨立端點、API 金鑰加密儲存）
    - Rule 3: 欄位映射規則透過 config_json 動態配置（德安 PMS 欄位映射、Opera PMS 使用不同映射）
    - Rule 4: 同步頻率與認證類型可配置（每日同步、即時同步）
    - Rule 5: 同步狀態與錯誤監控（同步成功更新狀態、同步失敗記錄錯誤、自動重試）
    - Rule 6: 會員比對與自動建立（比對成功建立關聯、比對失敗自動建立新會員）
    - Rule 7: 停用整合保留歷史資料
    - Rule 8: 安全性與敏感資訊保護（config_json 不儲存敏感資訊、API 請求使用加密連線）
- **設計理念**：採用 Adapter Pattern 支援多種 PMS 系統整合。初期實作 DeanPMSAdapter，未來可擴展 OperaPMSAdapter、FidelioPMSAdapter 等。每種 PMS 使用獨立的 adapter 處理資料同步與欄位映射，新增 adapter 不需修改既有程式碼或資料庫結構。API 配置、欄位映射、同步頻率、認證類型皆可動態配置，支援不同 PMS 版本與部署環境。api_key 加密儲存，config_json 不包含敏感資訊，API 請求使用 HTTPS 加密連線，確保安全性。
- **技術優勢**：
  - 擴充性：支援多種 PMS 系統，擴大市場機會
  - 開放封閉原則：新增 PMS 不需修改既有程式碼
  - 獨立維護：每種 PMS 的邏輯獨立維護，測試與除錯更容易
  - 漸進式實作：初期實作德安 PMS，未來逐步新增其他 PMS
  - 彈性配置：每家飯店可配置獨立的 API 端點、金鑰、同步頻率
  - 安全性：加密儲存敏感資訊，使用 HTTPS 加密連線
