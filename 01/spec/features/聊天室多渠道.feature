Feature: 聊天室跨渠道紀錄整併與身份識別
  作為客服人員，
  我希望客戶在 Webchat 與 LINE 和 Facebook 的訊息整合，
  以便我可以在同一個系統介面中看到該會員三個渠道的完整聊天紀錄。

  Background:
    說明:
      - Webchat 聊天紀錄獨立存在，不會覆蓋 LINE 或 Facebook 的訊息。
      - 當用戶在 Webchat 上登入 LINE 或 Facebook OAuth 時，系統會取得該渠道會員資訊（line_uid / fb_uid、email），並與 members 表進行關聯。
      - LINE / Facebook 的好友資料仍然存在各自表中（line_friends / fb_friends）。
      - 聊天紀錄統一存放於 conversation_threads（對話線程）和 conversation_messages（對話訊息）表。
      - 客服在系統介面看到的訊息流，是依 member_id 整合的三個渠道訊息，好友資料保留在各自 friends 表。

    Given Webchat 為互動入口，使用者在 Webchat 互動時，需要透過 LINE 或 Facebook OAuth 登入
    And 三個渠道各自有自己的好友追蹤表：
      | 表名               | 主要欄位                                                   |
      | line_friends       | line_uid, member_id, line_display_name, line_picture_url, email, is_following, last_interaction_at |
      | fb_friends         | fb_uid, member_id, fb_display_name, fb_picture_url, email, is_following, last_interaction_at |
      | webchat_friends    | webchat_uid, member_id, webchat_display_name, webchat_picture_url, email, is_following, last_interaction_at |
    And members 表用來存放整合後的會員資料，主要欄位包括：
      | 欄位               | 說明                                                |
      | member_id          | 會員唯一識別碼                                      |
      | line_uid           | LINE User ID（可透過 line_friends 表關聯）          |
      | email              | 會員 email（用於跨渠道比對）                        |
      | join_source        | 加入來源 (LINE / Facebook / Webchat / CRM / PMS)    |
      | last_interaction_at| 最後互動時間                                        |
    And 跨渠道關聯透過各 friends 表的 member_id 欄位建立
    And 上次互動渠道依據 member_id 下所有渠道 friends 表的 last_interaction_at 最晚者
    And 聊天紀錄表結構如下：
      | 表名                  | 主要欄位                                                                         |
      | conversation_threads  | id (thread_id), member_id, platform, platform_uid, last_message_at              |
      | conversation_messages | id, thread_id, platform, direction, question, response, message_source, created_at |
    And conversation_threads 的 id (thread_id) 格式為 platform_uid（如 "U66da9a54ad9341376212e673d7fd7228"）
    And 渠道識別透過 platform 欄位區分（"LINE" / "Facebook" / "Webchat"）
    And 查詢訊息時使用 thread_id + platform 兩個條件

  # =============================================================================
  # Webchat 使用 LINE OAuth 登入
  # =============================================================================

  Rule: 當會員在 Webchat 登入 LINE OAuth，系統應整合 LINE 聊天紀錄到客服聊天室，但保留原 Webchat 紀錄

    Example: Webchat 使用 LINE OAuth 登入，已有 LINE 紀錄
      Given members 表中已存在該會員 email "user@example.com"
      And line_friends 表有 line_uid "U123" 的好友紀錄
      When 使用者在 Webchat 登入 LINE OAuth，line_uid 為 "U123"，email 為 "user@example.com"
      Then 系統將 LINE 訊息整合到該會員的客服聊天室
      And Webchat 聊天紀錄仍獨立保存
      And 加入來源顯示「LINE / Webchat」
      And 客服可以切換回覆渠道

  # =============================================================================
  # Webchat 使用 Facebook OAuth 登入
  # =============================================================================

  Rule: 當會員在 Webchat 登入 Facebook OAuth，系統應整合 FB 訊息到客服聊天室，但保留原 Webchat 紀錄

    Example: Webchat 使用 Facebook OAuth 登入，已有 FB 紀錄
      Given members 表中已存在該會員 email "user@example.com"
      And fb_friends 表有 fb_uid "F321" 的好友紀錄
      When 使用者在 Webchat 登入 Facebook OAuth，fb_uid 為 "F321"，email 為 "user@example.com"
      Then 系統將 FB 訊息整合到該會員的客服聊天室視圖
      And Webchat 聊天紀錄仍獨立保存
      And 加入來源顯示「Facebook / Webchat」
      And 客服可以切換回覆渠道

  # =============================================================================
  # Webchat 使用 LINE 或 FB OAuth 登入，但無原聊天紀錄
  # =============================================================================

  Rule: 當會員第一次在 Webchat 使用 LINE 或 FB OAuth 登入，但該渠道無歷史聊天紀錄，僅建立會員身份

    Example: 新 LINE 使用者
      Given members 表中無該 line_uid 的紀錄
      When 使用者 Webchat 登入 LINE OAuth，line_uid 為 "U999"，email 為 "newuser@example.com"
      Then 系統建立新的 member_id，並在 line_friends 及 webchat_friends 表建立對應紀錄
      And 客服聊天室僅顯示 Webchat 訊息
      And 加入來源顯示「Webchat」
      And 登入方式顯示 LINE ICON + channel_name + line_uid
      And 客服聊天室顯示渠道切換下拉選單，始終列出 LINE / Facebook / Webchat
      And 未綁定的渠道以灰色禁用樣式顯示並提示「尚未綁定」

  # =============================================================================
  # OAuth 登入失敗處理
  # =============================================================================

  Rule: 當 Webchat OAuth 登入失敗時，系統應提示錯誤並要求重新登入或選擇其他登入方式

    Example: LINE OAuth 登入失敗
      Given 使用者在 Webchat 嘗試 LINE OAuth 登入
      When OAuth 授權失敗（用戶取消授權、網路逾時、或服務異常）
      Then 系統顯示錯誤訊息，區分「您已取消授權」或「登入失敗，請稍後再試」
      And 提供「重試」和「選擇其他登入方式」按鈕
      And 不允許匿名聊天，用戶必須完成登入才能開始對話
      And 後端記錄錯誤日誌（含錯誤類型、時間戳、用戶 IP）

    Example: Facebook OAuth 登入失敗
      Given 使用者在 Webchat 嘗試 Facebook OAuth 登入
      When OAuth 授權失敗
      Then 系統顯示錯誤訊息並提供重試或切換登入方式選項
      And 不允許匿名聊天

    Example: Google OAuth 登入失敗
      Given 使用者在 Webchat 嘗試 Google OAuth 登入
      When OAuth 授權失敗
      Then 系統顯示錯誤訊息並提供重試或切換登入方式選項
      And 不允許匿名聊天

  # =============================================================================
  # Webchat 使用 Google OAuth 登入
  # =============================================================================

  Rule: 當會員在 Webchat 使用 Google OAuth 登入時，僅建立登入身份，除非 email 與既有會員匹配才整合

    Example: Google OAuth 新使用者
      Given members 表中無該 email 的紀錄
      When 使用者 Webchat 使用 Google OAuth 登入，email 為 "guser@example.com"
      Then 系統建立新的 member_id，並在 webchat_friends 表建立對應紀錄
      And 客服聊天室僅顯示 Webchat 訊息
      And 加入來源顯示「Webchat」
      And 登入方式顯示 Google ICON + Email
      And 客服聊天室顯示渠道切換下拉選單，始終列出 LINE / Facebook / Webchat
      And 未綁定的渠道以灰色禁用樣式顯示並提示「尚未綁定」

    Example: Google OAuth 已有 email 的會員
      Given members 表中已有 email "guser@example.com" 的會員，並關聯 line_friends 表中 line_uid "U123"
      And 該會員在 Webchat 有聊天紀錄
      When 使用者 Webchat 使用 Google OAuth 登入，email 為 "guser@example.com"
      Then 系統整合 Webchat 聊天紀錄到該會員客服聊天室視圖
      And 客服聊天室顯示已綁定的 LINE + Webchat 訊息
      And 加入來源顯示「LINE / Webchat」
      And 登入方式顯示 Google ICON + Email 及已綁定渠道資訊

  # =============================================================================
  # 客服聊天室顯示規則
  # =============================================================================

  Rule: 客服聊天室應顯示所有整合後訊息，並標示來源

    說明:
      渠道來源標示採用「渠道圖示 + 文字標籤」組合，以下拉選單呈現：
        | 渠道     | 圖示         | 文字標籤   | 顯示範例                    |
        | LINE     | LINE 綠色圖示 | LINE      | [LINE 圖示] LINE ▼          |
        | Facebook | FB 藍色圖示   | Facebook  | [FB 圖示] Facebook ▼        |
        | Webchat  | Webchat 灰色圖示 | Webchat | [Webchat 圖示] Webchat ▼   |

    Example: 整合多渠道訊息顯示
      Given 某會員已關聯 line_friends、fb_friends 及 webchat_friends 三個渠道
      Then 客服聊天室依時間排序顯示所有訊息
      And 每則訊息旁標示渠道圖示與文字標籤（如 [LINE 圖示] LINE）
      And 加入來源欄位顯示所有已綁定渠道
      And 若多渠道存在，客服可透過下拉選單切換回覆渠道

  Rule: 開啟聊天室時預設回覆渠道 = 最近互動渠道

    Example: 預設回覆渠道為最近互動渠道
      Given 會員 member_id "M001" 已關聯 line_friends、fb_friends、webchat_friends 三個渠道
      And 最近一次互動發生在 Webchat
      When 客服開啟該會員的客服聊天室準備回覆
      Then 系統預設回覆渠道為 Webchat（依 last_interaction_at 最晚者）
      And 下拉選單仍可切換到 LINE 或 Facebook
      And 下拉選單中標示各渠道目前狀態（可用/不可用）
      And 不可用的渠道以灰色禁用樣式顯示，但仍可查看該渠道歷史訊息

  Rule: 當回覆渠道無法發送訊息時，系統應提示錯誤並要求手動切換渠道

    Example: LINE 回覆窗口已過期
      Given 客服正在回覆會員 member_id "M001"
      And 該會員的 LINE 最後互動時間超過 24 小時（Reply Token 已過期）
      When 客服嘗試透過 LINE 渠道發送訊息
      Then 系統顯示錯誤訊息「LINE 回覆窗口已過期，請切換至其他渠道或等待會員主動互動」
      And 不自動切換渠道，由客服手動選擇
      And 後端記錄發送失敗日誌

    Example: Facebook 24 小時對話窗口已關閉
      Given 客服正在回覆會員 member_id "M001"
      And 該會員的 Facebook 最後互動時間超過 24 小時
      When 客服嘗試透過 Facebook 渠道發送訊息
      Then 系統顯示錯誤訊息「Facebook 對話窗口已關閉，請切換至其他渠道」
      And 不自動切換渠道，由客服手動選擇

    Example: Webchat 用戶已離線
      Given 客服正在回覆會員 member_id "M001"
      And 該會員的 Webchat 連線已中斷（WebSocket 斷線或會話逾時）
      When 客服嘗試透過 Webchat 渠道發送訊息
      Then 系統顯示錯誤訊息「Webchat 用戶已離線，訊息將於用戶重新上線時送達」
      And 訊息標記為待發送狀態
      And 不自動切換渠道，由客服手動選擇

  # =============================================================================
  # 多渠道會員合併
  # =============================================================================

  Rule: OAuth 登入成功後依混合策略合併會員（優先順序：email → 渠道 UID → 建立新會員）

    Example: 有 email 時用 email 合併（LINE → 既有會員）
      Given members 表中已有 email "user@example.com" 的會員 member_id "M001"
      And 該會員原本僅關聯 fb_friends（fb_uid "F321"）
      When 使用者在 Webchat 登入 LINE OAuth，取得 email "user@example.com"，line_uid "U123"
      Then 系統依合併優先順序：
        | 順序 | 條件 | 動作 |
        | 1 | email 相同 | 合併為同一 member_id |
        | 2 | 同渠道 UID 已存在 | 使用既有 member_id |
        | 3 | 以上都不符合 | 建立新 member_id |
      And 系統查詢到 email "user@example.com" 已存在
      And 系統將 line_friends 記錄的 member_id 設為 "M001"
      And 系統更新 webchat_friends 記錄的 member_id 為 "M001"
      And 客服聊天室立即顯示整合後的跨渠道訊息

    Example: 無 email 但渠道 UID 已存在（同一用戶重複登入）
      Given line_friends 表中已有 line_uid "U123" 的記錄，關聯 member_id "M001"
      When 使用者在 Webchat 登入 LINE OAuth，取得 line_uid "U123"，但用戶未授權 email
      Then 系統查詢 line_friends 表發現 line_uid "U123" 已存在
      And 系統使用既有 member_id "M001"
      And 系統更新 webchat_friends 記錄的 member_id 為 "M001"

    Example: 無 email 且渠道 UID 不存在（全新用戶）
      Given members 表和 line_friends 表都沒有相關記錄
      When 使用者在 Webchat 登入 LINE OAuth，取得 line_uid "U888"，但用戶未授權 email
      Then 系統建立新的 member_id "M003"
      And 系統建立 line_friends 記錄（line_uid "U888", member_id "M003"）
      And 系統更新 webchat_friends 記錄的 member_id 為 "M003"
      And 日後若取得 email 且與既有會員相同，再觸發合併

    Example: 日後取得 email 觸發延遲合併
      Given 會員 member_id "M003" 原本無 email（LINE OAuth 未授權）
      And members 表中已有 email "user@example.com" 的會員 member_id "M001"
      When 用戶更新個人資料填入 email "user@example.com"
      Then 系統偵測到 email 與 member_id "M001" 相同
      And 系統觸發會員合併，將 "M003" 的資料合併至 "M001"
      And 原 "M003" 的 friends 記錄更新 member_id 為 "M001"

    Example: 多渠道會員合併至同一 member_id
      Given members 表中已有 email "user@example.com" 的會員
      When 使用者在 Webchat 登入 LINE OAuth，email 為 "user@example.com"，line_uid "U123"
      And 使用者在 Webchat 登入 Facebook OAuth，email "user@example.com"，fb_uid "F321"
      And 使用者在 Webchat 互動，webchat_uid "W555"
      Then 系統透過各 friends 表的 member_id 將三個渠道關聯至同一會員
      And 會員列表顯示統一 member_id "M001"
      And 加入來源顯示「LINE / Facebook / Webchat」

  Rule: 會員合併時資料衝突的處理策略（新資料優先，空白不覆蓋）

    Example: 會員資料合併衝突處理
      Given 系統已有會員資料
        | field    | value      | updated_at          |
        | name     | 王小明     | 2025-01-10 10:00:00 |
        | gender   | 男         | 2025-01-10 10:00:00 |
        | birthday | 1990-05-20 | 2025-01-10 10:00:00 |
        | tags     | [VIP]      | 2025-01-10 10:00:00 |
      And Webchat 新事件攜帶會員資料
        | field    | value      | event_time          |
        | name     | 王小明先生 | 2025-01-12 09:00:00 |
        | gender   | （空白）   | 2025-01-12 09:00:00 |
        | birthday | （空白）   | 2025-01-12 09:00:00 |
        | tags     | [高消費客戶] | 2025-01-12 09:00:00 |
      When 系統合併同 email 的會員資料
      Then 系統依 updated_at / event_time 以新資料優先覆蓋非空欄位
        | field    | merged value |
        | name     | 王小明先生   |
        | gender   | 男           |
        | birthday | 1990-05-20   |
      And 標籤合併時去重合併集合（VIP, 高消費客戶）
      And 合併規則只會覆蓋有值的欄位，空白不會覆蓋舊資料

  # =============================================================================
  # 客服聊天室下拉切換
  # =============================================================================

  Rule: 客服可透過下拉選單切換同一 member_id 的不同渠道聊天紀錄

    Example: 客服切換渠道查看訊息
      Given 某會員 member_id "M001" 同時關聯 line_friends (line_uid "U123")、fb_friends (fb_uid "F321") 及 webchat_friends
      When 客服打開該會員的客服聊天室
      Then 系統顯示下拉選單，列出可切換的渠道：
        | 渠道     |
        | Webchat  |
        | LINE     |
        | Facebook |
      And 聊天室訊息依選擇渠道顯示對應紀錄（從 conversation_messages 表依 thread_id + platform 篩選）
      And 好友資料保留在各自 friends 表中

    Example: 僅綁定單一渠道時隱藏下拉選單
      Given 某會員 member_id "M002" 僅關聯 line_friends (line_uid "U999")
      When 客服打開該會員的客服聊天室
      Then 系統不顯示渠道切換下拉選單
      And 僅顯示當前渠道圖示（LINE 圖示）
      And 無法進行渠道切換操作

  Rule: 客服切換渠道時若有未發送的草稿，系統應彈出確認對話框詢問是否捨棄

    說明:
      - 草稿不跨渠道保留（不同渠道可能有不同的訊息格式限制）
      - 使用者必須明確選擇捨棄草稿才能切換渠道

    Example: 切換渠道時有未發送草稿 - 確認捨棄
      Given 客服正在 LINE 渠道輸入訊息草稿「請問需要什麼協助？」
      When 客服點擊下拉選單切換至 Facebook 渠道
      Then 系統彈出確認對話框「您有未發送的訊息，切換渠道將捨棄草稿，是否繼續？」
      And 對話框提供選項：
        | 選項     | 行為                           |
        | 確認捨棄 | 清空草稿，切換至新渠道         |
        | 取消     | 關閉對話框，維持當前渠道並保留草稿 |

    Example: 切換渠道時有未發送草稿 - 取消切換
      Given 客服正在 LINE 渠道輸入訊息草稿「請問需要什麼協助？」
      When 客服點擊下拉選單切換至 Facebook 渠道
      And 系統彈出確認對話框
      And 客服點擊「取消」
      Then 對話框關閉
      And 客服維持在 LINE 渠道
      And 輸入框保留原草稿內容「請問需要什麼協助？」

    Example: 切換渠道時無草稿
      Given 客服在 LINE 渠道，輸入框為空
      When 客服點擊下拉選單切換至 Facebook 渠道
      Then 系統直接切換渠道，不彈出確認對話框
      And 聊天室顯示 Facebook 渠道訊息

  # =============================================================================
  # 聊天訊息資料查詢規格
  # =============================================================================

  Rule: 聊天訊息查詢使用 thread_id（platform_uid）+ platform 欄位組合作為查詢條件

    Example: 查詢 LINE 渠道訊息
      Given 會員 member_id "M001" 的 LINE UID 為 "U66da9a54ad9341376212e673d7fd7228"
      When 客服選擇 LINE 渠道查看聊天紀錄
      Then 系統查詢 conversation_messages 表：
        | 條件欄位   | 值                                     |
        | thread_id  | U66da9a54ad9341376212e673d7fd7228      |
        | platform   | LINE                                    |
      And 結果依 created_at 排序顯示

    Example: 查詢 Facebook 渠道訊息
      Given 會員 member_id "M001" 的 FB UID 為 "F123456789"
      When 客服選擇 Facebook 渠道查看聊天紀錄
      Then 系統查詢 conversation_messages 表：
        | 條件欄位   | 值                                     |
        | thread_id  | F123456789                              |
        | platform   | Facebook                                |
      And 結果依 created_at 排序顯示

    Example: 查詢 Webchat 渠道訊息
      Given 會員 member_id "M001" 的 Webchat UID 為 "550e8400-e29b-41d4-a716-446655440000"
      When 客服選擇 Webchat 渠道查看聊天紀錄
      Then 系統查詢 conversation_messages 表：
        | 條件欄位   | 值                                          |
        | thread_id  | 550e8400-e29b-41d4-a716-446655440000        |
        | platform   | Webchat                                      |
      And 結果依 created_at 排序顯示

  Rule: conversation_threads 表用於追蹤對話線程狀態，id 直接使用 platform_uid

    Example: 開啟聊天會話時建立或更新 thread
      Given 會員 member_id "M001" 的 LINE UID 為 "U123"
      When 客服開啟該會員的 LINE 聊天室
      Then 系統查詢或建立 conversation_threads 記錄：
        | 欄位         | 值      |
        | id           | U123    |
        | member_id    | M001    |
        | platform     | LINE    |
        | platform_uid | U123    |
      And 系統更新 last_message_at 為最後訊息時間

    Example: 同會員多渠道各自獨立 thread
      Given 會員 member_id "M001" 綁定 LINE (U123) 和 Facebook (F456)
      Then conversation_threads 表存在兩筆記錄：
        | id    | member_id | platform | platform_uid |
        | U123  | M001      | LINE     | U123         |
        | F456  | M001      | Facebook | F456         |
      And 每個渠道的訊息透過各自的 thread_id + platform 查詢

  # =============================================================================
  # Webchat 訪客會話狀態管理
  # =============================================================================

  Rule: Webchat 訪客會話結束判定依據 WebSocket 連線狀態，斷線時自動設為已離線

    Example: 訪客關閉瀏覽器時會話自動結束
      Given 訪客 webchat_uid "W123" 正在 Webchat 對話中（is_following = true）
      And WebSocket 連線維持心跳（每 30 秒 ping/pong）
      When 訪客關閉瀏覽器，WebSocket 連線中斷
      And 系統等待 60 秒重連寬限期，訪客未重新連線
      Then 系統自動更新 webchat_friends.is_following = false
      And 系統記錄 unfollowed_at = 當前時間
      And 客服聊天室標示「Webchat 用戶已離線」

    Example: 訪客網路中斷後重新連線
      Given 訪客 webchat_uid "W123" 的 WebSocket 連線因網路問題斷開
      When 訪客在 60 秒內重新連線
      Then 系統視為同一會話，不更新 is_following 狀態
      And 聊天可正常繼續

    Example: 訪客重新訪問網站
      Given 訪客 webchat_uid "W123" 曾結束會話（is_following = false）
      When 訪客重新訪問 Webchat 並建立連線
      Then 系統更新 webchat_friends.is_following = true
      And 系統更新 followed_at = 當前時間
      And 系統清除 unfollowed_at = NULL
      And 客服可繼續與該訪客對話

  # =============================================================================
  # webchat_uid 生成與識別
  # =============================================================================

  Rule: webchat_uid 使用 UUID v4 格式，由後端生成並儲存於前端 localStorage 供跨 session 識別

    Example: 新訪客首次連線時生成 webchat_uid
      Given 訪客首次訪問 Webchat，localStorage 無 webchat_uid
      When 訪客建立 WebSocket 連線
      Then 後端生成 UUID v4 格式的 webchat_uid（如 "550e8400-e29b-41d4-a716-446655440000"）
      And 後端建立 webchat_friends 記錄
      And 前端將 webchat_uid 儲存於 localStorage

    Example: 訪客重新訪問時使用既有 webchat_uid
      Given 訪客曾訪問過 Webchat，localStorage 有 webchat_uid "550e8400-e29b-41d4-a716-446655440000"
      When 訪客重新訪問並建立 WebSocket 連線
      Then 前端傳送既有 webchat_uid 給後端
      And 後端識別為同一訪客，更新 webchat_friends 狀態
      And 聊天紀錄延續顯示

    Example: localStorage 被清除視為新訪客
      Given 訪客曾訪問過 Webchat 但 localStorage 已被清除
      When 訪客建立 WebSocket 連線
      Then 後端生成新的 UUID v4 webchat_uid
      And 後端建立新的 webchat_friends 記錄
      And 視為新訪客，無法自動關聯舊聊天紀錄

  # =============================================================================
  # 新 Webchat 會員建立
  # =============================================================================

  Rule: 當 Webchat OAuth 登入 email 不存在於 members 表時，建立新的 member_id

    Example: 新 Webchat 會員建立
      Given members 表中無 email "newuser@example.com"
      When 使用者 Webchat 登入 LINE OAuth，email "newuser@example.com"，line_uid "U999"
      And 使用者 Webchat 互動，webchat_uid "550e8400-e29b-41d4-a716-446655440000"
      Then 系統建立新的 member_id "M002"，並在 line_friends 及 webchat_friends 表建立對應紀錄
      And 聊天室僅顯示 Webchat 訊息
      And 加入來源顯示「Webchat」
      And 登入方式顯示 LINE ICON + channel_name + line_uid

  # =============================================================================
  # 客服聊天室顯示整合訊息
  # =============================================================================

  Rule: 客服聊天室應顯示整合後訊息，並標示來源及可切換渠道

    Example: 客服聊天室顯示整合訊息
      Given 會員 member_id "M001" 已關聯 line_friends (line_uid "U123")、fb_friends (fb_uid "F321") 及 webchat_friends (webchat_uid "W555")
      Then 客服聊天室依時間排序顯示訊息
      And 每則訊息標示來源 (LINE / FB / Webchat)
      And 下拉選單可切換查看不同渠道訊息

  # =============================================================================
  # 會員列表顯示上次互動渠道
  # =============================================================================

  Rule: 從會員列表點擊聊天按鈕進入客服聊天室時，初始顯示訊息流依各 friends 表 last_interaction_at 最晚者

    Example: 上次互動為 Webchat
      Given 會員 member_id "M001" 的 webchat_friends.last_interaction_at 為最晚
      When 客服從會員列表點擊該會員聊天按鈕
      Then 客服聊天室初始顯示 Webchat 訊息流
      And 下拉選單仍可切換到 LINE 或 FB

    Example: 上次互動為 Facebook
      Given 會員 member_id "M001" 的 fb_friends.last_interaction_at 為最晚
      When 客服從會員列表點擊該會員聊天按鈕
      Then 客服聊天室初始顯示 Facebook 訊息流
      And 下拉選單仍可切換到 LINE 或 Webchat 訊息

    Example: 上次互動為 LINE
      Given 會員 member_id "M002" 的 line_friends.last_interaction_at 為最晚
      When 客服點擊聊天按鈕
      Then 客服聊天室初始顯示 LINE 訊息流
      And 下拉選單可切換至 FB 或 Webchat 訊息

  # =============================================================================
  # 多渠道會員合併後會員列表最近互動顯示
  # =============================================================================

  Rule: 多渠道會員合併後，會員列表「最近互動」欄位應顯示 last_interaction_at 最晚的渠道，並使用該 friends 表的頭像與姓名

    Example: 最近互動為 Facebook
      Given 會員 member_id "M001" 同時關聯 fb_friends (fb_uid "F123") 與 line_friends (line_uid "L456")
      And fb_friends.last_interaction_at 為 2025-12-01 10:00（最晚）
      When 客服查看會員列表
      Then 最近互動欄位顯示 Facebook ICON + fb_friends.fb_picture_url + fb_friends.fb_display_name

    Example: 最近互動為 LINE
      Given 會員 member_id "M001" 同時關聯 fb_friends (fb_uid "F123") 與 line_friends (line_uid "L456")
      And line_friends.last_interaction_at 為 2025-12-01 12:00（最晚）
      When 客服查看會員列表
      Then 最近互動欄位顯示 LINE ICON + line_friends.line_picture_url + line_friends.line_display_name
      And 切換至 FB 渠道時顯示 fb_friends.fb_picture_url + fb_friends.fb_display_name

    Example: 最近互動為 Webchat
      Given 會員 member_id "M002" 關聯 webchat_friends (webchat_uid "W789")
      And webchat_friends.last_interaction_at 為最晚
      When 客服查看會員列表
      Then 最近互動欄位顯示 Webchat ICON + webchat_friends.webchat_picture_url + webchat_friends.webchat_display_name

  # =============================================================================
  # 會員列表加入來源欄位顯示格式
  # =============================================================================

  Rule: 會員列表「加入來源」欄位應顯示所有已綁定渠道，格式為「渠道圖示 + 帳號名稱 + UID」，依加入時間由舊到新排序

    說明:
      - 每個渠道顯示格式：[渠道圖示] + 帳號名稱 + UID
      - 複數渠道時全部顯示，不折疊
      - 排序依據各 friends 表的 followed_at（加入時間），由舊到新
      - 首次加入的渠道優先顯示（最上方/最左方）

    Example: 單一渠道會員
      Given 會員 member_id "M001" 僅關聯 line_friends
        | 欄位              | 值                    |
        | line_uid          | U123456789            |
        | line_display_name | 王小明                |
        | followed_at       | 2025-01-01 10:00:00   |
      When 客服查看會員列表的「加入來源」欄位
      Then 顯示為：[LINE 圖示] 王小明 (U123456789)

    Example: 多渠道會員依加入時間排序
      Given 會員 member_id "M002" 關聯三個渠道
        | 渠道     | UID        | 帳號名稱   | followed_at         |
        | LINE     | U123       | 王小明     | 2025-01-01 10:00:00 |
        | Facebook | F456       | Ming Wang  | 2025-02-15 14:30:00 |
        | Webchat  | W789       | 訪客_W789  | 2025-03-20 09:00:00 |
      When 客服查看會員列表的「加入來源」欄位
      Then 顯示順序依 followed_at 由舊到新排列：
        | 順序 | 顯示內容                          |
        | 1    | [LINE 圖示] 王小明 (U123)         |
        | 2    | [FB 圖示] Ming Wang (F456)        |
        | 3    | [Webchat 圖示] 訪客_W789 (W789)   |

    Example: 會員詳情頁加入來源顯示
      Given 會員 member_id "M002" 關聯 LINE 與 Facebook 兩個渠道
      When 客服開啟該會員的詳情頁面
      Then 加入來源區塊顯示所有渠道資訊，格式同會員列表
      And 每個渠道可點擊展開查看完整 UID
