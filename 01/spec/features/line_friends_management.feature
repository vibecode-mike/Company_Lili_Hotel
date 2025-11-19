Feature: LINE 好友管理
  作為一位系統管理員
  我希望系統能夠自動追蹤所有加入 LINE 官方帳號的用戶
  並且儲存他們的最新 Profile 資訊（displayName, pictureUrl）
  以便能夠精準管理 LINE 好友名單，並與會員系統整合

  Background:
    Given LINE Messaging API 已正確設定
    And Channel Access Token 有效
    And Webhook 已啟用

  # ============================================
  # 核心功能 1: LINE 好友加入流程
  # ============================================

  Rule: 用戶加入好友時自動建立 LINE 好友記錄

    Example: 用戶首次加入好友
      Given 用戶「王小明」的 LINE UID 為「U1234567890abcdef1234567890abcdef」
      And 該用戶尚未加入過好友
      When 用戶點擊「加入好友」
      And LINE 平台發送 FollowEvent 到系統 Webhook
      Then 系統接收到 FollowEvent
      And 系統從 event.source.user_id 取得 LINE UID「U1234567890abcdef1234567890abcdef」
      And 系統呼叫 LINE Profile API「GET https://api.line.me/v2/bot/profile/U1234567890abcdef1234567890abcdef」
      And LINE API 回傳以下 Profile 資訊
        """
        {
          "userId": "U1234567890abcdef1234567890abcdef",
          "displayName": "王小明",
          "pictureUrl": "https://profile.line-scdn.net/0h1a2b3c4d5e",
          "statusMessage": "你好"
        }
        """
      And 系統在 line_friends 表中建立新記錄
        | 欄位                  | 值                                           |
        | line_uid              | U1234567890abcdef1234567890abcdef           |
        | line_display_name     | 王小明                                       |
        | line_picture_url      | https://profile.line-scdn.net/0h1a2b3c4d5e   |
        | member_id             | NULL                                         |
        | is_following          | true                                         |
        | followed_at           | 2025-11-17 10:30:00 (UTC)                    |
        | unfollowed_at         | NULL                                         |
        | last_interaction_at   | 2025-11-17 10:30:00 (UTC)                    |
      And 系統發送歡迎訊息給用戶

    Example: 用戶重新加入好友（之前曾取消追蹤）
      Given line_friends 表中存在以下記錄
        | line_uid                              | is_following | unfollowed_at       |
        | U1234567890abcdef1234567890abcdef    | false        | 2025-10-15 08:00:00 |
      When 用戶再次點擊「加入好友」
      And LINE 平台發送 FollowEvent 到系統 Webhook
      Then 系統更新 line_friends 表中的記錄
        | 欄位            | 值                      |
        | is_following    | true                    |
        | followed_at     | 2025-11-17 10:30:00 (更新為最新時間) |
        | unfollowed_at   | NULL (清除取消追蹤記錄) |
      And 系統重新取得最新 Profile 資訊
      And 系統發送歡迎訊息給用戶

  # ============================================
  # 核心功能 2: Profile 自動同步機制
  # ============================================

  Rule: 加好友時立即同步 Profile 資訊

    Example: 加好友時成功取得 Profile
      Given 用戶「李小華」加入好友
      And LINE UID 為「U9876543210fedcba9876543210fedcba」
      When 系統接收到 FollowEvent
      Then 系統立即呼叫 LINE Profile API
      And 系統使用 Header「Authorization: Bearer {CHANNEL_ACCESS_TOKEN}」
      And API 請求超時時間設定為 5 秒
      And API 回傳成功（HTTP 200）
      And 系統儲存 displayName 和 pictureUrl 到 line_friends 表

    Example: 加好友時 Profile API 呼叫失敗
      Given 用戶「陳大明」加入好友
      And LINE UID 為「U1111222233334444555566667777888」
      When 系統接收到 FollowEvent
      And 系統呼叫 LINE Profile API
      But API 呼叫失敗（HTTP 401 Unauthorized 或 timeout）
      Then 系統記錄錯誤日誌「LINE Profile API failed for UID: U1111222233334444555566667777888, reason: Unauthorized」
      And 系統仍然建立 line_friends 記錄
        | line_uid                            | line_display_name | line_picture_url |
        | U1111222233334444555566667777888    | NULL              | NULL             |
      And 系統不中斷歡迎訊息發送流程
      And 系統在下次互動時會補抓取 Profile

  Rule: 智能更新 Profile 策略（避免頻繁呼叫 API）

    Example: Profile 資料為空時補抓取
      Given line_friends 表中存在以下記錄
        | line_uid                              | line_display_name | line_picture_url | last_interaction_at |
        | U1234567890abcdef1234567890abcdef    | NULL              | NULL             | 2025-11-10 10:00:00 |
      When 用戶發送文字訊息「你好」
      And 系統接收到 MessageEvent
      Then 系統檢查 line_display_name 為空
      And 系統立即呼叫 LINE Profile API 補抓取
      And 系統更新 line_display_name 和 line_picture_url
      And 系統更新 last_interaction_at 為當前時間

    Example: Profile 資料完整且最近更新過，不重複呼叫 API
      Given line_friends 表中存在以下記錄
        | line_uid                              | line_display_name | line_picture_url                           | last_interaction_at |
        | U1234567890abcdef1234567890abcdef    | 王小明            | https://profile.line-scdn.net/0h1a2b3c4d5e | 2025-11-16 10:00:00 |
      And 距離上次更新未超過 7 天
      When 用戶發送文字訊息「早安」
      And 系統接收到 MessageEvent
      Then 系統不呼叫 LINE Profile API
      And 系統只更新 last_interaction_at 為當前時間
      And 系統不更新 line_display_name 和 line_picture_url

    Example: Profile 資料超過 7 天未更新，智能同步
      Given line_friends 表中存在以下記錄
        | line_uid                              | line_display_name | line_picture_url                           | last_interaction_at |
        | U1234567890abcdef1234567890abcdef    | 王小明            | https://profile.line-scdn.net/0h1a2b3c4d5e | 2025-11-01 10:00:00 |
      And 距離上次互動超過 7 天
      When 用戶發送 Postback 事件
      And 系統接收到 PostbackEvent
      Then 系統呼叫 LINE Profile API 取得最新 Profile
      And 若 displayName 或 pictureUrl 有變更，則更新資料
      And 系統更新 last_interaction_at 為當前時間

  Rule: 所有互動事件都更新 last_interaction_at

    Example: 文字訊息互動更新時間
      Given line_friends 表中存在用戶「王小明」的記錄
      When 用戶發送文字訊息「查詢房價」
      Then 系統更新 last_interaction_at 為當前時間

    Example: Postback 互動更新時間
      Given line_friends 表中存在用戶「李小華」的記錄
      When 用戶點擊訊息模板中的按鈕觸發 Postback
      Then 系統更新 last_interaction_at 為當前時間

    Example: 圖片訊息互動更新時間
      Given line_friends 表中存在用戶「陳大明」的記錄
      When 用戶發送圖片訊息
      Then 系統更新 last_interaction_at 為當前時間

  # ============================================
  # 核心功能 3: 好友狀態管理
  # ============================================

  Rule: 用戶取消追蹤時更新好友狀態

    Example: 用戶封鎖或刪除好友
      Given line_friends 表中存在以下記錄
        | line_uid                              | is_following | followed_at         | unfollowed_at |
        | U1234567890abcdef1234567890abcdef    | true         | 2025-11-01 10:00:00 | NULL          |
      When 用戶封鎖或刪除官方帳號
      And LINE 平台發送 UnfollowEvent 到系統 Webhook
      Then 系統接收到 UnfollowEvent
      And 系統從 event.source.user_id 取得 LINE UID
      And 系統更新 line_friends 表中的記錄
        | 欄位            | 值                           |
        | is_following    | false                        |
        | unfollowed_at   | 2025-11-17 15:30:00 (當前時間) |
      And 系統不刪除 line_friends 記錄（保留歷史資料）

    Example: 已取消追蹤的用戶不出現在群發目標
      Given line_friends 表中存在以下記錄
        | line_uid                              | is_following |
        | U1111111111111111111111111111111111    | true         |
        | U2222222222222222222222222222222222    | false        |
        | U3333333333333333333333333333333333    | true         |
      When 行銷人員建立群發訊息並選擇「所有好友」
      Then 系統篩選 is_following = true 的記錄
      And 預計發送好友人數為 2 人
      And 發送對象不包含 LINE UID「U2222222222222222222222222222222222」

  Rule: 好友狀態影響系統行為

    Example: 已取消追蹤的用戶無法接收推播訊息
      Given line_friends 表中存在以下記錄
        | line_uid                              | is_following |
        | U1234567890abcdef1234567890abcdef    | false        |
      When 系統嘗試發送推播訊息給該用戶
      Then 系統檢查 is_following = false
      And 系統跳過該用戶不發送訊息
      And 系統記錄日誌「Skip sending to U1234567890abcdef1234567890abcdef: user not following」

    Example: 已取消追蹤的用戶仍可查看歷史資料
      Given line_friends 表中存在以下記錄
        | line_uid                              | is_following | line_display_name | member_id |
        | U1234567890abcdef1234567890abcdef    | false        | 王小明            | M001      |
      When 行銷人員查看會員「M001」的詳細資料
      Then 系統顯示該會員關聯的 LINE 好友資訊
      And 系統標註該好友狀態為「已取消追蹤」
      And 系統顯示取消追蹤時間

  # ============================================
  # 核心功能 4: 與會員系統整合
  # ============================================

  Rule: LINE 好友與會員系統分離設計

    Example: 僅加好友未填問卷的用戶
      Given 用戶「張三」加入 LINE 官方帳號好友
      And LINE UID 為「U9999888877776666555544443333222」
      But 用戶尚未填寫會員問卷
      Then line_friends 表中存在以下記錄
        | line_uid                            | member_id | is_following |
        | U9999888877776666555544443333222    | NULL      | true         |
      And members 表中不存在該用戶的記錄

    Example: 填寫問卷後建立會員關聯
      Given line_friends 表中存在以下記錄
        | line_uid                            | member_id | line_display_name |
        | U9999888877776666555544443333222    | NULL      | 張三              |
      When 用戶填寫會員問卷
      And 系統建立 members 表記錄
        | member_id | line_uid                            | name | email           |
        | M123      | U9999888877776666555544443333222    | 張三 | zhang@email.com |
      Then 系統更新 line_friends 表的 member_id
        | line_uid                            | member_id |
        | U9999888877776666555544443333222    | M123      |

    Example: 非 LINE 會員（CRM/PMS 來源）
      Given members 表中存在以下記錄
        | member_id | name | join_source | line_uid |
        | M456      | 李四 | CRM         | NULL     |
      Then line_friends 表中不存在該會員的記錄
      And 該會員無法接收 LINE 推播訊息

  Rule: 兩表資料獨立維護，不互相同步 Profile

    Example: LINE 好友改名，Member 表不自動同步
      Given line_friends 表中存在以下記錄
        | line_uid                              | member_id | line_display_name |
        | U1234567890abcdef1234567890abcdef    | M001      | 王小明            |
      And members 表中存在以下記錄
        | member_id | line_uid                              | line_name |
        | M001      | U1234567890abcdef1234567890abcdef    | 王小明    |
      When 用戶在 LINE 中將顯示名稱改為「小明王」
      And 用戶發送訊息觸發 Profile 同步
      Then 系統更新 line_friends 表
        | line_uid                              | line_display_name |
        | U1234567890abcdef1234567890abcdef    | 小明王            |
      But 系統不自動更新 members 表的 line_name
      And members 表的 line_name 仍為「王小明」

    Example: 會員在問卷中填寫的姓名不影響 LINE 好友 Profile
      Given line_friends 表中存在以下記錄
        | line_uid                              | line_display_name |
        | U1234567890abcdef1234567890abcdef    | 王小明            |
      When 用戶填寫會員問卷，姓名欄位填寫「王大明」
      And 系統建立 members 記錄
        | member_id | name   |
        | M001      | 王大明 |
      Then line_friends 表的 line_display_name 仍為「王小明」
      And members 表的 name 為「王大明」
      And 兩表獨立維護，不互相影響

  # ============================================
  # 核心功能 5: 查詢與統計
  # ============================================

  Rule: 支援多種查詢條件篩選 LINE 好友

    Example: 查詢當前追蹤中的好友
      Given line_friends 表中存在以下記錄
        | line_uid | is_following | line_display_name |
        | U111     | true         | 王小明            |
        | U222     | false        | 李小華            |
        | U333     | true         | 陳大明            |
      When 行銷人員查詢「當前好友」
      Then 系統篩選 is_following = true
      And 回傳 2 筆記錄
        | line_uid | line_display_name |
        | U111     | 王小明            |
        | U333     | 陳大明            |

    Example: 查詢 30 天未互動的沉默用戶
      Given 當前時間為 2025-11-17 10:00:00
      And line_friends 表中存在以下記錄
        | line_uid | is_following | last_interaction_at |
        | U111     | true         | 2025-11-15 10:00:00 |
        | U222     | true         | 2025-10-01 10:00:00 |
        | U333     | true         | 2025-09-15 10:00:00 |
      When 行銷人員查詢「30 天未互動的沉默用戶」
      Then 系統篩選 is_following = true AND last_interaction_at < 2025-10-18
      And 回傳 2 筆記錄（U222 和 U333）

    Example: 查詢有會員關聯的 LINE 好友
      Given line_friends 表中存在以下記錄
        | line_uid | member_id | line_display_name |
        | U111     | M001      | 王小明            |
        | U222     | NULL      | 李小華            |
        | U333     | M003      | 陳大明            |
      When 行銷人員查詢「已成為會員的 LINE 好友」
      Then 系統篩選 member_id IS NOT NULL
      And 回傳 2 筆記錄（U111 和 U333）

  Rule: 好友統計資料

    Example: 統計當前好友總數
      Given line_friends 表中存在以下記錄
        | line_uid | is_following |
        | U111     | true         |
        | U222     | false        |
        | U333     | true         |
        | U444     | true         |
      When 行銷人員查看「好友統計」
      Then 系統統計 is_following = true 的總數
      And 顯示「當前好友數：3」

    Example: 統計新增好友趨勢（本月 vs 上月）
      Given 當前時間為 2025-11-17
      And line_friends 表中存在以下記錄
        | line_uid | followed_at         |
        | U111     | 2025-11-05 10:00:00 |
        | U222     | 2025-11-10 14:30:00 |
        | U333     | 2025-10-15 09:20:00 |
        | U444     | 2025-10-20 16:45:00 |
      When 行銷人員查看「新增好友趨勢」
      Then 系統統計本月（2025-11）新增好友數：2 人
      And 系統統計上月（2025-10）新增好友數：2 人
      And 顯示「本月新增 2 人，與上月持平」

  # ============================================
  # 錯誤處理與邊界情況
  # ============================================

  Rule: LINE Profile API 錯誤處理

    Example: API 超時（timeout）
      Given 用戶加入好友
      When 系統呼叫 LINE Profile API
      But API 請求超過 5 秒無回應
      Then 系統終止 API 請求
      And 系統記錄錯誤日誌「LINE Profile API timeout」
      And 系統建立 line_friends 記錄（Profile 欄位為 NULL）
      And 系統正常發送歡迎訊息
      And 系統在下次互動時補抓取 Profile

    Example: API 回傳錯誤（401 Unauthorized）
      Given Channel Access Token 無效或過期
      When 系統呼叫 LINE Profile API
      And API 回傳 HTTP 401 Unauthorized
      Then 系統記錄錯誤日誌「LINE Profile API 401: Invalid Access Token」
      And 系統建立 line_friends 記錄（Profile 欄位為 NULL）
      And 系統發送系統告警通知管理員「LINE Channel Access Token 可能已失效」

    Example: API 回傳錯誤（429 Rate Limit）
      Given LINE API 呼叫頻率超過限制
      When 系統呼叫 LINE Profile API
      And API 回傳 HTTP 429 Too Many Requests
      Then 系統記錄錯誤日誌「LINE Profile API 429: Rate Limit Exceeded」
      And 系統建立 line_friends 記錄（Profile 欄位為 NULL）
      And 系統在下次互動時補抓取 Profile

  Rule: 資料完整性保護

    Example: LINE UID 重複處理
      Given line_friends 表中已存在 LINE UID「U1234567890abcdef1234567890abcdef」
      When 系統再次接收到相同 LINE UID 的 FollowEvent
      Then 系統使用 UNIQUE 約束防止重複插入
      And 系統執行 UPDATE 而非 INSERT
      And 系統更新 followed_at 和 is_following

    Example: Webhook 重複推送處理
      Given LINE 平台因網路問題重複推送同一個 FollowEvent
      When 系統在 1 秒內接收到 2 次相同的 FollowEvent
      Then 系統使用 idempotency 機制防止重複處理
      And 系統只處理第一次請求
      And 系統對第二次請求回傳 HTTP 200（視為成功處理）

  Rule: Webhook 簽名驗證失敗處理機制（方案 A：HTTP 403 + 記錄 + 閾值告警）

    安全驗證邏輯：
      - 所有 Webhook 請求必須驗證 X-Line-Signature header
      - 使用 Channel Secret 計算 HMAC-SHA256 簽名並比對
      - 驗證失敗回傳 HTTP 403 Forbidden（語義最準確）
      - 記錄可疑請求（IP、timestamp、請求內容）
      - 超過 10 次/小時發送告警（平衡誤報與真實攻擊）

    Example: Webhook 簽名驗證失敗 - 回傳 403
      Given 系統接收到 Webhook 請求
      And 請求 Header 包含「X-Line-Signature: invalid_signature_123」
      When 系統使用 Channel Secret 計算 HMAC-SHA256 簽名
      And 計算結果與 X-Line-Signature 不匹配
      Then 系統回傳 HTTP 403 Forbidden
      And 系統回傳錯誤訊息「{"error": "Invalid signature"}」
      And 系統不處理請求內容（不建立 line_friends 記錄）

    Example: 記錄可疑請求詳情
      Given Webhook 簽名驗證失敗
      When 系統回傳 HTTP 403
      Then 系統記錄以下資訊到日誌
        | 欄位           | 值                                  |
        | timestamp      | 2025-11-17 10:30:15 (UTC)           |
        | ip_address     | 203.0.113.45                        |
        | signature      | invalid_signature_123               |
        | request_body   | {"events": [...]}（前 200 字元）    |
        | error_type     | signature_verification_failed       |
      And 日誌等級為 WARNING

    Example: 超過告警閾值 - 發送告警
      Given 過去 1 小時內累積 10 次簽名驗證失敗
      And 來源 IP 為「203.0.113.45」
      When 第 11 次驗證失敗發生
      Then 系統發送告警郵件給管理員
      And 郵件標題為「⚠️ LINE Webhook 可疑請求告警」
      And 郵件內容包含
        """
        偵測到異常 Webhook 請求：
        - 來源 IP: 203.0.113.45
        - 失敗次數: 11 次（過去 1 小時）
        - 首次失敗: 2025-11-17 09:35:00 (UTC)
        - 最近失敗: 2025-11-17 10:30:15 (UTC)
        - 建議動作: 檢查 Channel Secret 設定，或考慮封鎖該 IP
        """
      And 系統記錄告警事件到監控系統

    Example: 未達閾值 - 僅記錄不告警
      Given 過去 1 小時內有 3 次簽名驗證失敗
      When 第 4 次驗證失敗發生
      Then 系統記錄日誌（WARNING 等級）
      And 系統不發送告警郵件
      And 系統繼續監控失敗次數

    Example: 正常 Webhook 請求處理
      Given 系統接收到 Webhook 請求
      And 請求 Header 包含正確的「X-Line-Signature」
      When 系統計算 HMAC-SHA256 簽名並驗證成功
      Then 系統回傳 HTTP 200 OK
      And 系統正常處理請求內容（建立或更新 line_friends 記錄）
      And 系統不記錄可疑請求日誌

    Example: 缺少簽名 Header - 視為驗證失敗
      Given 系統接收到 Webhook 請求
      But 請求 Header 不包含「X-Line-Signature」
      When 系統檢查簽名驗證
      Then 系統回傳 HTTP 403 Forbidden
      And 系統回傳錯誤訊息「{"error": "Missing X-Line-Signature header"}」
      And 系統記錄可疑請求日誌（error_type: missing_signature）

  # ============================================
  # 效能優化
  # ============================================

  Rule: 查詢效能優化

    Example: 使用索引加速 LINE UID 查詢
      Given line_friends 表有 10,000 筆記錄
      And line_uid 欄位建立 UNIQUE 索引
      When 系統根據 LINE UID 查詢好友記錄
      Then 查詢時間 < 10ms

    Example: 使用索引加速好友狀態篩選
      Given line_friends 表有 10,000 筆記錄
      And is_following 欄位建立索引
      When 系統篩選當前好友（is_following = true）
      Then 查詢時間 < 100ms

    Example: 使用索引加速活躍度分析
      Given line_friends 表有 10,000 筆記錄
      And last_interaction_at 欄位建立索引
      When 系統查詢「30 天未互動的沉默用戶」
      Then 查詢時間 < 200ms

  Rule: 資料保留策略

    Example: 已取消追蹤的好友保留 90 天
      Given line_friends 表中存在以下記錄
        | line_uid | is_following | unfollowed_at       | member_id |
        | U111     | false        | 2025-08-01 10:00:00 | NULL      |
        | U222     | false        | 2025-10-15 10:00:00 | NULL      |
      And 當前時間為 2025-11-17
      When 系統執行定期清理任務
      Then 系統刪除 unfollowed_at < 2025-08-19（90 天前）且 member_id IS NULL 的記錄
      And 系統保留 U222（取消追蹤未滿 90 天）

    Example: 有會員關聯的記錄永久保留
      Given line_friends 表中存在以下記錄
        | line_uid | is_following | unfollowed_at       | member_id |
        | U333     | false        | 2024-01-01 10:00:00 | M001      |
      And 當前時間為 2025-11-17
      When 系統執行定期清理任務
      Then 系統不刪除該記錄（因為 member_id 不為 NULL）
      And 系統保留該記錄以維持資料完整性

  Rule: 重新加好友採用覆蓋策略，不保留取消追蹤歷史

    設計決策：
      - v0 階段採用簡化設計，重新加好友時直接覆蓋 followed_at 並清除 unfollowed_at
      - 不保留取消追蹤歷史記錄，降低系統複雜度與資料儲存成本
      - 若未來有用戶行為分析需求（如分析頻繁取消追蹤用戶），可擴展為歷史表設計
      - 此策略適用於核心功能階段，後續可根據業務需求調整

    Example: 重新加好友時覆蓋歷史記錄
      Given line_friends 表中存在以下記錄
        | line_uid                              | is_following | followed_at         | unfollowed_at       |
        | U1234567890abcdef1234567890abcdef    | false        | 2025-10-01 10:00:00 | 2025-10-15 08:00:00 |
      When 用戶於 2025-11-17 10:30:00 再次加好友
      And LINE 平台發送 FollowEvent 到系統 Webhook
      Then 系統更新 line_friends 表中的記錄
        | 欄位            | 值                           |
        | is_following    | true                         |
        | followed_at     | 2025-11-17 10:30:00（覆蓋）  |
        | unfollowed_at   | NULL（清除）                 |
      And 系統不保留之前的 followed_at 與 unfollowed_at 歷史記錄
      And 用戶的取消追蹤歷史無法追溯

    Example: 多次取消追蹤再加好友，僅保留最新狀態
      Given 用戶歷史行為：2025-09-01 加好友 → 2025-09-15 取消追蹤 → 2025-10-01 加好友 → 2025-10-15 取消追蹤
      And line_friends 表中當前記錄
        | line_uid | is_following | followed_at         | unfollowed_at       |
        | U111     | false        | 2025-10-01 10:00:00 | 2025-10-15 08:00:00 |
      When 用戶於 2025-11-17 第三次加好友
      Then 系統更新為最新狀態
        | line_uid | is_following | followed_at         | unfollowed_at |
        | U111     | true         | 2025-11-17 10:30:00 | NULL          |
      And 系統無法統計該用戶取消追蹤的次數（2 次）
      And 系統無法分析該用戶為「頻繁取消追蹤」用戶
