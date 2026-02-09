# language: zh-TW
Feature: Facebook 頻道管理
  作為一位管理員
  我希望能設定與管理 Facebook 粉絲專頁頻道
  以便透過 Facebook Messenger 與會員互動

  Background:
    Given 管理員已登入系統

  # ============================================================================
  # 第一部分：頻道列表與狀態
  # ============================================================================

  Rule: 可列出所有啟用中的 Facebook 頻道

    Example: 查詢啟用中的頻道列表
      Given 系統中存在以下 Facebook 頻道
        | page_id | channel_name | is_active |
        | P001    | 力麗飯店粉專 | true      |
        | P002    | 測試粉專     | true      |
        | P003    | 已停用粉專   | false     |
      When 透過 GET /fb-channels 查詢頻道列表
      Then 系統回傳 2 筆啟用中的頻道
      And 結果按 ID 降序排列

  Rule: 可查詢 Facebook 頻道設定狀態

    Example: 查詢已設定完成的頻道狀態
      Given 系統中存在一個啟用中的 Facebook 頻道
      And 該頻道已填寫 page_id 且 connection_status 為「connected」
      When 透過 GET /fb-channels/status 查詢
      Then 系統回傳 has_active_channel 為 true
      And is_configured 為 true
      And missing_fields 為空陣列

    Example: 查詢未設定完成的頻道狀態
      Given 系統中存在一個啟用中的 Facebook 頻道
      And 該頻道缺少 page_id 設定
      When 透過 GET /fb-channels/status 查詢
      Then 系統回傳 has_active_channel 為 true
      And is_configured 為 false
      And missing_fields 包含「page_id」

    Example: 查詢無任何頻道的狀態
      Given 系統中不存在任何啟用中的 Facebook 頻道
      When 透過 GET /fb-channels/status 查詢
      Then 系統回傳 has_active_channel 為 false
      And connection_status 為「disconnected」

  # ============================================================================
  # 第二部分：SDK 設定與訊息列表
  # ============================================================================

  Rule: 可取得前端 Facebook SDK 初始化設定

    Example: 成功取得 SDK 設定
      Given 系統環境變數已設定 VITE_FACEBOOK_APP_ID
      When 透過 GET /fb-channels/sdk_config 查詢
      Then 系統回傳 app_id 與 api_version
      And api_version 格式為「v{版本號}」

    Example: 缺少 Facebook App ID 時回傳錯誤
      Given 系統環境變數未設定 VITE_FACEBOOK_APP_ID
      When 透過 GET /fb-channels/sdk_config 查詢
      Then 系統回傳 HTTP 500 錯誤
      And 錯誤訊息為「缺少 VITE_FACEBOOK_APP_ID」

  Rule: 可取得 FB 訊息列表

    Example: 成功取得 FB 訊息列表
      Given 管理員持有有效的 Meta JWT Token
      When 透過 GET /fb-channels/message-list?jwt_token={token} 查詢
      Then 系統透過外部 API 回傳 FB 會員訊息摘要
      And 回傳資料包含 customer_id、customer_name、last_message_time 等欄位

    Example: 外部 API 呼叫失敗時回傳錯誤
      Given 管理員持有的 Meta JWT Token 已過期
      When 透過 GET /fb-channels/message-list?jwt_token={token} 查詢
      Then 系統回傳 HTTP 500 錯誤
      And 錯誤訊息包含「取得 FB 訊息列表失敗」

  # ============================================================================
  # 第三部分：頻道建立與更新
  # ============================================================================

  Rule: 可建立或更新 Facebook 頻道設定

    Example: 建立新的 Facebook 頻道
      Given 系統中不存在 page_id 為「P001」的頻道
      When 透過 POST /fb-channels 建立頻道
        | 欄位         | 值           |
        | page_id      | P001         |
        | channel_name | 力麗飯店粉專 |
      Then 系統回傳 HTTP 201
      And 頻道建立成功且 is_active 為 true

    Example: page_id 已存在時更新頻道設定
      Given 系統中已存在 page_id 為「P001」的頻道
      When 透過 POST /fb-channels 提交 page_id 為「P001」的設定
      Then 系統更新該頻道的設定
      And 更新 last_verified_at 為當前時間

    Example: 缺少 page_id 時回傳驗證錯誤
      When 透過 POST /fb-channels 提交空白的 page_id
      Then 系統回傳 HTTP 422 錯誤
      And 錯誤訊息為「page_id 為必填」

  Rule: 可部分更新 Facebook 頻道設定

    Example: 更新頻道名稱
      Given 系統中存在 ID 為 1 的 Facebook 頻道
      When 透過 PATCH /fb-channels/1 更新
        | 欄位         | 值             |
        | channel_name | 新飯店粉專名稱 |
      Then 系統回傳更新後的頻道設定
      And channel_name 為「新飯店粉專名稱」

    Example: 更新不存在的頻道回傳 404
      Given 系統中不存在 ID 為 9999 的 Facebook 頻道
      When 透過 PATCH /fb-channels/9999 更新
      Then 系統回傳 HTTP 404 錯誤
      And 錯誤訊息為「頻道設定不存在」

  # ============================================================================
  # 第四部分：頻道停用與同步
  # ============================================================================

  Rule: 可停用 Facebook 頻道（解除連結）

    Example: 成功停用頻道
      Given 系統中存在 ID 為 1 的啟用中 Facebook 頻道
      When 透過 DELETE /fb-channels/1 停用頻道
      Then 系統將該頻道 is_active 設為 false
      And connection_status 設為「disconnected」

    Example: 停用不存在的頻道回傳 404
      Given 系統中不存在 ID 為 9999 的 Facebook 頻道
      When 透過 DELETE /fb-channels/9999 停用頻道
      Then 系統回傳 HTTP 404 錯誤

  Rule: 可同步外部 API 的頻道列表至本地資料庫

    Example: 同步頻道列表並停用不在列表中的頻道
      Given 系統中存在以下本地 Facebook 頻道
        | page_id | channel_name | is_active |
        | P001    | 粉專 A       | true      |
        | P002    | 粉專 B       | true      |
        | P003    | 粉專 C       | true      |
      When 透過 POST /fb-channels/sync 同步頻道列表
        | page_id | channel_name |
        | P001    | 粉專 A       |
        | P004    | 粉專 D       |
      Then P001 維持啟用狀態
      And P002、P003 被設為 is_active=false
      And P004 新建並設為啟用狀態

    Example: 同步空列表時停用所有頻道
      Given 系統中存在 3 個啟用中的 Facebook 頻道
      When 透過 POST /fb-channels/sync 同步空的頻道列表
      Then 所有頻道的 is_active 被設為 false

  # ============================================================================
  # 第五部分：頻道驗證
  # ============================================================================

  Rule: 可驗證本地頻道與外部 API 狀態是否一致

    Example: 驗證頻道狀態一致
      Given 系統中存在 2 個啟用中的 Facebook 頻道
      And 外部 API 確認這 2 個頻道狀態正常
      When 透過 POST /fb-channels/verify 驗證頻道
      Then 系統回傳 verified_count 為 2
      And mismatch_count 為 0

    Example: 驗證發現外部已移除的頻道（自動刪除）
      Given 系統中存在啟用中的 Facebook 頻道 page_id 為「P001」
      And 外部 API 中不存在 page_id 為「P001」的頻道
      When 透過 POST /fb-channels/verify 驗證頻道
      Then 系統自動刪除該本地頻道記錄
      And 回傳 deleted_count 為 1
      And 結果中該頻道的 action_taken 為「deleted」

    Example: 驗證發現已過期的頻道（自動停用）
      Given 系統中存在啟用中的 Facebook 頻道 page_id 為「P002」
      And 外部 API 回傳該頻道 expired_time 已過期
      When 透過 POST /fb-channels/verify 驗證頻道
      Then 系統將該頻道設為 is_active=false 且 connection_status=「expired」
      And 回傳 deactivated_count 為 1

  # ============================================================================
  # 第六部分：會員同步
  # ============================================================================

  Rule: 可同步 Facebook 會員列表至系統

    Example: 成功同步 FB 會員（新建與更新）
      Given 外部 API 回傳 3 筆 FB 會員資料
      And 其中 1 筆會員的 email 已存在於系統中
      When 透過 POST /fb-channels/sync-members 同步會員
      Then 系統先清除所有會員的 fb_customer 欄位
      And 刪除三渠道皆為空的孤兒會員
      And 根據 email 將 1 筆會員綁定至既有會員
      And 新建 2 筆 FB 會員記錄

    Example: 同步時需提供 JWT Token
      When 透過 POST /fb-channels/sync-members 同步會員但未提供 jwt_token
      Then 系統回傳 HTTP 400 錯誤
      And 錯誤訊息為「缺少 jwt_token」

    Example: 外部 API 無 FB 會員時僅清除與刪除孤兒
      Given 外部 API 回傳 0 筆 FB 會員資料
      When 透過 POST /fb-channels/sync-members 同步會員
      Then 系統清除所有 fb_customer 欄位
      And 刪除三渠道皆為空的孤兒會員
      And 回傳 synced 為 0
