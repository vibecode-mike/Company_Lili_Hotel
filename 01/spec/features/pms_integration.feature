Feature: PMS 系統整合
  作為一位系統管理員
  我希望整合多種 PMS 系統的客戶資料
  以便自動同步會員資料與住宿紀錄，提升資料準確性

  Rule: 支援多種 PMS 系統透過 Adapter Pattern 整合

    @not-implemented
    Example: 配置德安 PMS 整合
      Given 系統管理員在 PMS 整合設定頁面
      When 管理員選擇 PMS 類型「德安 PMS」
      And 輸入 api_endpoint「https://dean-pms.example.com/api/v1」
      And 輸入 api_key「encrypted_key_value」
      Then 系統記錄 pms_type 為「dean_pms」
      And 系統使用 DeanPMSAdapter 處理資料同步
      And 系統加密 api_key 後儲存

    @not-implemented
    Example: 未來支援 Opera PMS
      Given 系統新增 OperaPMSAdapter 實作
      When 管理員選擇 PMS 類型「Opera PMS」
      And 輸入 api_endpoint「https://opera.example.com/api/v2」
      And 輸入 api_key「opera_key_value」
      Then 系統記錄 pms_type 為「opera_pms」
      And 系統使用 OperaPMSAdapter 處理資料同步
      And 無需修改資料庫結構

  Rule: API 連線配置獨立管理

    @not-implemented
    Example: 每家飯店使用獨立 API 端點
      Given 飯店 A 配置 api_endpoint「https://pms-a.example.com」
      And 飯店 B 配置 api_endpoint「https://pms-b.example.com」
      When 系統同步飯店 A 的資料
      Then 系統向「https://pms-a.example.com」發送 API 請求
      And 使用飯店 A 的 api_key 認證

    @not-implemented
    Example: API 認證金鑰加密儲存
      Given 管理員輸入 api_key「plain_text_key_123」
      When 系統儲存 PMS 整合配置
      Then 系統使用 AES-256 加密 api_key
      And 資料庫儲存加密後的值
      And 系統不記錄明文金鑰

  Rule: 欄位映射規則透過 config_json 動態配置

    @not-implemented
    Example: 德安 PMS 欄位映射
      Given 德安 PMS 使用欄位名稱「guestIdNo」表示身分證字號
      And 德安 PMS 使用欄位名稱「mobile」表示手機號碼
      When 系統建立德安 PMS 整合配置
      Then 系統在 config_json 記錄以下欄位映射
        """
        {
          "field_mapping": {
            "id_number": "guestIdNo",
            "phone": "mobile",
            "room_type": "roomCategory",
            "stay_date": "checkInDate"
          }
        }
        """
      And 同步時根據映射規則轉換欄位名稱

    @not-implemented
    Example: Opera PMS 使用不同欄位映射
      Given Opera PMS 使用欄位名稱「guestID」表示身分證字號
      And Opera PMS 使用欄位名稱「phoneNumber」表示手機號碼
      When 系統建立 Opera PMS 整合配置
      Then 系統在 config_json 記錄不同的欄位映射
        """
        {
          "field_mapping": {
            "id_number": "guestID",
            "phone": "phoneNumber",
            "room_type": "roomCode",
            "stay_date": "arrivalDate"
          }
        }
        """

  Rule: 同步頻率與認證類型可配置

    @not-implemented
    Example: 配置每日同步
      Given 管理員配置 PMS 整合
      When 管理員在 config_json 設定 sync_interval 為「daily」
      And 設定 auth_type 為「bearer_token」
      Then 系統每日執行一次資料同步
      And 使用 Bearer Token 認證方式

    @not-implemented
    Example: 配置即時同步
      Given 管理員配置 PMS 整合
      When 管理員在 config_json 設定 sync_interval 為「realtime」
      And 設定 auth_type 為「api_key」
      Then 系統監聽 PMS webhook 事件
      And 會員資料變更時立即同步
      And 使用 API Key 認證方式

  Rule: 同步狀態與錯誤監控

    Example: 同步成功更新狀態
      Given PMS 整合配置已啟用
      When 系統成功同步資料
      Then 系統更新 sync_status 為「active」
      And 系統更新 last_sync_at 為當前時間
      And 系統清除 error_message

    Example: 同步失敗記錄錯誤訊息
      Given PMS 整合配置已啟用
      When 系統嘗試同步資料但 API 回應 401 錯誤
      Then 系統更新 sync_status 為「failed」
      And 系統記錄 error_message「API 認證失敗：401 Unauthorized」
      And 系統保留 last_sync_at 為上次成功時間
      And 系統通知管理員同步失敗

    Example: 根據重試策略自動重試
      Given PMS 整合配置 config_json 包含 retry_policy
        """
        {
          "retry_policy": {
            "max_retries": 3,
            "retry_interval": "5m",
            "backoff_strategy": "exponential"
          }
        }
        """
      When 系統同步失敗（暫時性錯誤，如網路逾時）
      Then 系統在 5 分鐘後執行第一次重試
      And 系統在 10 分鐘後執行第二次重試（指數退避）
      And 系統在 20 分鐘後執行第三次重試
      And 若仍失敗則標記 sync_status 為「failed」

  Rule: PMS 數據格式錯誤處理機制（方案 A：跳過錯誤記錄 + 記錄 log + 繼續處理）

    處理邏輯：
      - 欄位缺失或型別錯誤時跳過該筆記錄
      - 記錄詳細錯誤 log（記錄編號、欄位名稱、錯誤原因）
      - 繼續處理其他記錄（不中斷整批同步）
      - 完成後統計成功/失敗數量，顯示「部分同步失敗」

    @not-implemented
    Example: 欄位缺失跳過該筆記錄
      Given PMS 同步回傳 3 筆會員資料
        | 記錄編號 | id_number  | phone      | room_type | stay_date  |
        | 1        | A123456789 | 0912345678 | 商務房    | 2024/03/15 |
        | 2        | (缺失)     | 0987654321 | 豪華房    | 2024/03/16 |
        | 3        | C111222333 | 0923456789 | 標準房    | 2024/03/17 |
      When 系統驗證記錄 2 缺少必填欄位「id_number」
      Then 系統跳過記錄 2 不處理
      And 系統記錄錯誤 log「Record #2: Missing required field 'id_number'」
      And 系統繼續處理記錄 1 和記錄 3
      And 系統成功同步 2 筆記錄（記錄 1、3）
      And 系統失敗 1 筆記錄（記錄 2）

    @not-implemented
    Example: 型別錯誤跳過該筆記錄
      Given PMS 同步回傳 3 筆會員資料
        | 記錄編號 | id_number  | phone        | room_type | stay_date    |
        | 1        | A123456789 | 0912345678   | 商務房    | 2024/03/15   |
        | 2        | B987654321 | invalid_text | 豪華房    | 2024/03/16   |
        | 3        | C111222333 | 0923456789   | 標準房    | 2024/03/17   |
      When 系統驗證記錄 2 的「phone」欄位格式錯誤
      Then 系統跳過記錄 2 不處理
      And 系統記錄錯誤 log「Record #2: Invalid type for field 'phone', expected phone number format, got 'invalid_text'」
      And 系統繼續處理記錄 1 和記錄 3
      And 系統成功同步 2 筆記錄
      And 系統失敗 1 筆記錄

    @not-implemented
    Example: 值域超範圍跳過該筆記錄
      Given PMS 同步回傳 3 筆會員資料
        | 記錄編號 | id_number  | phone      | room_type | stay_date  |
        | 1        | A123456789 | 0912345678 | 商務房    | 2024/03/15 |
        | 2        | B987654321 | 0987654321 | 豪華房    | 1800/01/01 |
        | 3        | C111222333 | 0923456789 | 標準房    | 2024/03/17 |
      When 系統驗證記錄 2 的「stay_date」超出合理範圍（1800 年）
      Then 系統跳過記錄 2 不處理
      And 系統記錄錯誤 log「Record #2: Invalid value for field 'stay_date', date '1800/01/01' out of valid range」
      And 系統繼續處理記錄 1 和記錄 3
      And 系統成功同步 2 筆記錄
      And 系統失敗 1 筆記錄

    @not-implemented
    Example: 完成後顯示同步結果統計
      Given PMS 同步處理 100 筆記錄
      And 其中 5 筆因格式錯誤被跳過
      When 同步完成
      Then 系統更新 sync_status 為「partial_success」
      And 系統更新 last_sync_at 為當前時間
      And 系統記錄 error_message「同步完成：成功 95 筆，失敗 5 筆（格式錯誤）」
      And 系統在管理介面顯示「部分同步失敗（95/100 成功）」
      And 系統提供「查看錯誤記錄」按鈕，可下載錯誤 log

    @not-implemented
    Example: 全部成功時不顯示錯誤提示
      Given PMS 同步處理 50 筆記錄
      And 所有記錄格式正確
      When 同步完成
      Then 系統更新 sync_status 為「active」
      And 系統更新 last_sync_at 為當前時間
      And 系統清除 error_message
      And 系統顯示「同步成功（50/50 成功）」

    @not-implemented
    Example: 全部失敗時標記為失敗
      Given PMS 同步處理 10 筆記錄
      And 所有記錄都有格式錯誤
      When 同步完成
      Then 系統更新 sync_status 為「failed」
      And 系統記錄 error_message「同步失敗：成功 0 筆，失敗 10 筆（格式錯誤）」
      And 系統通知管理員檢查 PMS 數據格式
      And 系統建議管理員檢查 PMS 端資料品質

  Rule: 會員比對與自動建立

    Example: 比對成功建立關聯
      Given PMS 同步回傳會員資料
        | id_number  | phone      | room_type | stay_date  |
        | A123456789 | 0912345678 | 商務房    | 2024/03/15 |
      When 系統比對到現有會員「張三」（id_number = A123456789）
      Then 系統建立 PMS_Integration 記錄
      And 系統設定 member_id 為「張三」的 member_id
      And 系統同步 stay_records、room_type、stay_date 欄位

    Example: 比對失敗自動建立新會員
      Given PMS 同步回傳會員資料
        | id_number  | phone      | room_type | stay_date  |
        | B987654321 | 0987654321 | 豪華房    | 2024/03/16 |
      When 系統無法比對到現有會員（id_number 與 phone 皆不符）
      Then 系統自動建立新會員
      And 系統設定新會員 join_source 為「PMS」
      And 系統設定新會員 id_number 為「B987654321」
      And 系統設定新會員 phone 為「0987654321」
      And 系統建立 PMS_Integration 記錄並關聯新會員

  Rule: 停用整合保留歷史資料

    @not-implemented
    Example: 停用 PMS 整合
      Given PMS 整合配置 sync_status 為「active」
      When 管理員停用 PMS 整合
      Then 系統更新 sync_status 為「disabled」
      And 系統停止執行定期同步
      And 系統保留既有的 PMS_Integration 記錄
      And 系統保留 stay_records、room_type、stay_date 等歷史資料

  Rule: 跨系統同步欄位衝突處理（依最新時間覆蓋，空白不覆蓋）

    @not-implemented
    Example: PMS 與 CRM 同時回傳會員資料，採用最新事件
      Given 現有會員「王小明」資料
        | 欄位      | 值              | updated_at           |
        | name      | 王小明          | 2025/01/10 10:00:00 |
        | phone     | 0911222333      | 2025/01/10 10:00:00 |
        | birthday  | 1990-01-01      | 2025/01/10 10:00:00 |
      And PMS 同步事件（較早）
        | 欄位      | 值              | source_time          |
        | name      | 王小明          | 2025/01/11 09:00:00 |
        | phone     | （空白）        | 2025/01/11 09:00:00 |
        | birthday  | 1990-01-01      | 2025/01/11 09:00:00 |
      And CRM 同步事件（較晚）
        | 欄位      | 值              | source_time          |
        | name      | 王小明先生      | 2025/01/12 08:00:00 |
        | phone     | 0922333444      | 2025/01/12 08:00:00 |
        | birthday  | （空白）        | 2025/01/12 08:00:00 |
      When 系統處理兩個事件
      Then 系統依 source_time/received_at 以最新資料覆蓋非空欄位
        | 欄位      | 更新後值        |
        | name      | 王小明先生      |  # 取 CRM（較晚）
        | phone     | 0922333444      |  # 取 CRM（較晚且有值）
        | birthday  | 1990-01-01      |  # PMS 與 CRM 為空白不覆蓋既有值
      And 空白欄位不覆蓋既有值
      And 每次覆蓋時更新對應欄位的 updated_at

  Rule: 安全性與敏感資訊保護

    @not-implemented
    Example: config_json 不儲存敏感資訊
      Given 管理員配置 PMS 整合
      When 系統儲存 config_json
      Then config_json 僅包含非敏感配置（field_mapping、sync_interval、retry_policy）
      And config_json 不包含 api_key 或密碼

    @not-implemented
    Example: API 請求使用加密連線
      Given PMS 整合配置 api_endpoint「https://pms.example.com」
      When 系統發送 API 請求
      Then 系統使用 HTTPS 加密連線
      And 系統驗證 SSL 憑證有效性
      And 系統拒絕不安全的 HTTP 連線

  Rule: 大批量同步拆批與超時處理

    @not-implemented
    Example: 超過 10K 筆自動拆批，並設定每批超時
      Given PMS 端回傳 12000 筆會員資料
      When 系統處理同步
      Then 系統自動拆分為批次，每批 2000 筆（共 6 批）
      And 每批處理設定超時 5 分鐘，超時則標記該批失敗並記錄 log
      And 失敗批次可重新排入佇列重試（手動或自動）
      And 批次間使用背景佇列執行，避免阻塞同步請求
      And 成功批次立即持久化，不因其他批次失敗而回滾
