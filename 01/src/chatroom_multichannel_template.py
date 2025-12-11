import pytest

# Feature-level Background
@pytest.fixture(scope="module", autouse=True)
def feature_background():
    """
    Feature-level Background
    """
    # Given Webchat 為互動入口，使用者在 Webchat 互動時，需要透過 LINE 或 Facebook OAuth 登入
    # [事件風暴部位: Command - enforce_oauth_login_for_webchat]
    # [生成參考 Prompt: Command-Handler.md]

    # And 三個渠道各自有自己的好友追蹤表：
    # [事件風暴部位: Aggregate - FriendsTables]
    # [生成參考 Prompt: Aggregate-Given-Handler.md]

    # And members 表用來存放整合後的會員資料，主要欄位包括：
    # [事件風暴部位: Aggregate - Member]
    # [生成參考 Prompt: Aggregate-Given-Handler.md]

    # And 跨渠道關聯透過各 friends 表的 member_id 欄位建立
    # [事件風暴部位: Aggregate - MemberChannelLinkage]
    # [生成參考 Prompt: Aggregate-Given-Handler.md]

    # And 上次互動渠道依據 member_id 下所有渠道 friends 表的 last_interaction_at 最晚者
    # [事件風暴部位: Read Model - LastInteractionResolver]
    # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestWebchat使用LINEOAuth整合紀錄:
    """
    Rule: 當會員在 Webchat 登入 LINE OAuth，整合 LINE 紀錄並保留 Webchat 紀錄
    """

    def test_Webchat_LINE_OAuth已有LINE紀錄(self):
        # Given members 表中已存在該會員 email "user@example.com"
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And line_friends 表有 line_uid "U123" 的好友紀錄
        # [事件風暴部位: Aggregate - LineFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者在 Webchat 登入 LINE OAuth，line_uid 為 "U123"，email 為 "user@example.com"
        # [事件風暴部位: Command - webchat_line_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統將 LINE 訊息整合到該會員的客服聊天室
        # [事件風暴部位: Command - merge_line_messages_into_thread]
        # [生成參考 Prompt: Command-Handler.md]

        # And Webchat 聊天紀錄仍獨立保存
        # [事件風暴部位: Read Model - ChatLogIntegrity]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 加入來源顯示「LINE / Webchat」
        # [事件風暴部位: Read Model - MemberJoinSource]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 客服可以切換回覆渠道
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestWebchat使用FacebookOAuth整合紀錄:
    """
    Rule: 當會員在 Webchat 登入 Facebook OAuth，整合 FB 紀錄並保留 Webchat 紀錄
    """

    def test_Webchat_Facebook_OAuth已有FB紀錄(self):
        # Given members 表中已存在該會員 email "user@example.com"
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And fb_friends 表有 fb_uid "F321" 的好友紀錄
        # [事件風暴部位: Aggregate - FbFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者在 Webchat 登入 Facebook OAuth，fb_uid 為 "F321"，email 為 "user@example.com"
        # [事件風暴部位: Command - webchat_facebook_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統將 FB 訊息整合到該會員的客服聊天室視圖
        # [事件風暴部位: Command - merge_facebook_messages_into_thread]
        # [生成參考 Prompt: Command-Handler.md]

        # And Webchat 聊天紀錄仍獨立保存
        # [事件風暴部位: Read Model - ChatLogIntegrity]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 加入來源顯示「Facebook / Webchat」
        # [事件風暴部位: Read Model - MemberJoinSource]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 客服可以切換回覆渠道
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestWebchat首次LINE或FBOAuth無歷史:
    """
    Rule: 當會員第一次在 Webchat 使用 LINE 或 FB OAuth 登入且無歷史紀錄，僅建立身份
    """

    def test_新LINE使用者建立會員與關聯(self):
        # Given members 表中無該 line_uid 的紀錄
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者 Webchat 登入 LINE OAuth，line_uid 為 "U999"，email 為 "newuser@example.com"
        # [事件風暴部位: Command - webchat_line_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統建立新的 member_id，並在 line_friends 及 webchat_friends 表建立對應紀錄
        # [事件風暴部位: Command - create_member_and_link_channels]
        # [生成參考 Prompt: Command-Handler.md]

        # And 客服聊天室僅顯示 Webchat 訊息
        # [事件風暴部位: Read Model - ChatLogView]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 加入來源顯示「Webchat」
        # [事件風暴部位: Read Model - MemberJoinSource]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 登入方式顯示 LINE ICON + channel_name + line_uid
        # [事件風暴部位: Read Model - LoginMethodDisplay]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 客服聊天室不提供渠道切換
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestOAuth登入失敗處理:
    """
    Rule: 當 Webchat OAuth 登入失敗時提示錯誤並要求重試或改用其他方式
    """

    def test_LINE_OAuth登入失敗(self):
        # Given 使用者在 Webchat 嘗試 LINE OAuth 登入
        # [事件風暴部位: Command - initiate_line_oauth]
        # [生成參考 Prompt: Command-Handler.md]

        # When OAuth 授權失敗（用戶取消授權、網路逾時、或服務異常）
        # [事件風暴部位: Event - line_oauth_failed]
        # [生成參考 Prompt: Event-Handler.md]

        # Then 系統顯示錯誤訊息，區分「您已取消授權」或「登入失敗，請稍後再試」
        # [事件風暴部位: Read Model - OAuthErrorUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 提供「重試」和「選擇其他登入方式」按鈕
        # [事件風暴部位: Read Model - OAuthErrorActions]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不允許匿名聊天，用戶必須完成登入才能開始對話
        # [事件風暴部位: Success-Failure - block_anonymous_chat]
        # [生成參考 Prompt: Success-Failure-Handler.md]

        # And 後端記錄錯誤日誌（含錯誤類型、時間戳、用戶 IP）
        # [事件風暴部位: Command - log_oauth_failure]
        # [生成參考 Prompt: Command-Handler.md]

    def test_Facebook_OAuth登入失敗(self):
        # Given 使用者在 Webchat 嘗試 Facebook OAuth 登入
        # [事件風暴部位: Command - initiate_facebook_oauth]
        # [生成參考 Prompt: Command-Handler.md]

        # When OAuth 授權失敗
        # [事件風暴部位: Event - facebook_oauth_failed]
        # [生成參考 Prompt: Event-Handler.md]

        # Then 系統顯示錯誤訊息並提供重試或切換登入方式選項
        # [事件風暴部位: Read Model - OAuthErrorUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不允許匿名聊天
        # [事件風暴部位: Success-Failure - block_anonymous_chat]
        # [生成參考 Prompt: Success-Failure-Handler.md]

    def test_Google_OAuth登入失敗(self):
        # Given 使用者在 Webchat 嘗試 Google OAuth 登入
        # [事件風暴部位: Command - initiate_google_oauth]
        # [生成參考 Prompt: Command-Handler.md]

        # When OAuth 授權失敗
        # [事件風暴部位: Event - google_oauth_failed]
        # [生成參考 Prompt: Event-Handler.md]

        # Then 系統顯示錯誤訊息並提供重試或切換登入方式選項
        # [事件風暴部位: Read Model - OAuthErrorUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不允許匿名聊天
        # [事件風暴部位: Success-Failure - block_anonymous_chat]
        # [生成參考 Prompt: Success-Failure-Handler.md]


class TestWebchat使用GoogleOAuth登入:
    """
    Rule: 當會員在 Webchat 使用 Google OAuth 登入時僅建立身份，除非 email 匹配才整合
    """

    def test_Google_OAuth新使用者(self):
        # Given members 表中無該 email 的紀錄
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者 Webchat 使用 Google OAuth 登入，email 為 "guser@example.com"
        # [事件風暴部位: Command - webchat_google_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統建立新的 member_id，並在 webchat_friends 表建立對應紀錄
        # [事件風暴部位: Command - create_webchat_member]
        # [生成參考 Prompt: Command-Handler.md]

        # And 客服聊天室僅顯示 Webchat 訊息
        # [事件風暴部位: Read Model - ChatLogView]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 加入來源顯示「Webchat」
        # [事件風暴部位: Read Model - MemberJoinSource]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 登入方式顯示 Google ICON + Email
        # [事件風暴部位: Read Model - LoginMethodDisplay]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 客服聊天室不提供渠道切換
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_Google_OAuth已有會員合併(self):
        # Given members 表中已有 email "guser@example.com" 的會員，並關聯 line_friends 表中 line_uid "U123"
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 該會員在 Webchat 有聊天紀錄
        # [事件風暴部位: Aggregate - WebchatFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者 Webchat 使用 Google OAuth 登入，email 為 "guser@example.com"
        # [事件風暴部位: Command - webchat_google_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統整合 Webchat 聊天紀錄到該會員客服聊天室視圖
        # [事件風暴部位: Command - merge_webchat_messages_into_thread]
        # [生成參考 Prompt: Command-Handler.md]

        # And 客服聊天室顯示已綁定的 LINE + Webchat 訊息
        # [事件風暴部位: Read Model - ChatThreadMerged]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 加入來源顯示「LINE / Webchat」
        # [事件風暴部位: Read Model - MemberJoinSource]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 登入方式顯示 Google ICON + Email 及已綁定渠道資訊
        # [事件風暴部位: Read Model - LoginMethodDisplay]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test客服聊天室顯示整合訊息與來源:
    """
    Rule: 客服聊天室應顯示所有整合後訊息，並標示來源
    """

    def test_整合多渠道訊息顯示(self):
        # Given 某會員已關聯 line_friends、fb_friends 及 webchat_friends 三個渠道
        # [事件風暴部位: Aggregate - MemberChannelLinkage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # Then 客服聊天室依時間排序顯示所有訊息
        # [事件風暴部位: Read Model - ChatThreadTimeline]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 每則訊息標示來源 (LINE / FB / Webchat)
        # [事件風暴部位: Read Model - MessageSourceLabel]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 加入來源欄位顯示所有已綁定渠道
        # [事件風暴部位: Read Model - MemberJoinSource]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 若多渠道存在，客服可切換回覆渠道
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test預設回覆渠道取最近互動:
    """
    Rule: 開啟聊天室時預設回覆渠道 = 最近互動渠道
    """

    def test_預設回覆渠道為最近互動渠道(self):
        # Given 會員 member_id "M001" 已關聯 line_friends、fb_friends、webchat_friends 三個渠道
        # [事件風暴部位: Aggregate - MemberChannelLinkage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 最近一次互動發生在 Webchat
        # [事件風暴部位: Aggregate - LastInteraction]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服開啟該會員的客服聊天室準備回覆
        # [事件風暴部位: Command - open_customer_thread]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統預設回覆渠道為 Webchat（依 last_interaction_at 最晚者）
        # [事件風暴部位: Read Model - ReplyChannelDefault]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 下拉選單仍可切換到 LINE 或 Facebook
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 下拉選單中標示各渠道目前狀態（可用/不可用）
        # [事件風暴部位: Read Model - ChannelStatusIndicator]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不可用的渠道以灰色禁用樣式顯示，但仍可查看該渠道歷史訊息
        # [事件風暴部位: Read Model - ChannelStatusIndicator]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test回覆渠道不可用時提示:
    """
    Rule: 當回覆渠道無法發送訊息時提示錯誤並要求手動切換
    """

    def test_LINE回覆窗口過期(self):
        # Given 客服正在回覆會員 member_id "M001"
        # [事件風暴部位: Aggregate - ConversationThread]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 該會員的 LINE 最後互動時間超過 24 小時（Reply Token 已過期）
        # [事件風暴部位: Aggregate - LineReplyWindow]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服嘗試透過 LINE 渠道發送訊息
        # [事件風暴部位: Command - send_line_message]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統顯示錯誤訊息「LINE 回覆窗口已過期，請切換至其他渠道或等待會員主動互動」
        # [事件風暴部位: Read Model - SendErrorUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不自動切換渠道，由客服手動選擇
        # [事件風暴部位: Success-Failure - manual_channel_switch_required]
        # [生成參考 Prompt: Success-Failure-Handler.md]

        # And 後端記錄發送失敗日誌
        # [事件風暴部位: Command - log_send_failure]
        # [生成參考 Prompt: Command-Handler.md]

    def test_Facebook對話窗口關閉(self):
        # Given 客服正在回覆會員 member_id "M001"
        # [事件風暴部位: Aggregate - ConversationThread]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 該會員的 Facebook 最後互動時間超過 24 小時
        # [事件風暴部位: Aggregate - FacebookReplyWindow]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服嘗試透過 Facebook 渠道發送訊息
        # [事件風暴部位: Command - send_facebook_message]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統顯示錯誤訊息「Facebook 對話窗口已關閉，請切換至其他渠道」
        # [事件風暴部位: Read Model - SendErrorUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不自動切換渠道，由客服手動選擇
        # [事件風暴部位: Success-Failure - manual_channel_switch_required]
        # [生成參考 Prompt: Success-Failure-Handler.md]

    def test_Webchat用戶已離線(self):
        # Given 客服正在回覆會員 member_id "M001"
        # [事件風暴部位: Aggregate - ConversationThread]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 該會員的 Webchat 連線已中斷（WebSocket 斷線或會話逾時）
        # [事件風暴部位: Aggregate - WebchatConnection]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服嘗試透過 Webchat 渠道發送訊息
        # [事件風暴部位: Command - send_webchat_message]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統顯示錯誤訊息「Webchat 用戶已離線，訊息將於用戶重新上線時送達」
        # [事件風暴部位: Read Model - SendErrorUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 訊息標記為待發送狀態
        # [事件風暴部位: Aggregate - PendingSendQueue]
        # [生成參考 Prompt: Aggregate-Then-Handler.md]

        # And 不自動切換渠道，由客服手動選擇
        # [事件風暴部位: Success-Failure - manual_channel_switch_required]
        # [生成參考 Prompt: Success-Failure-Handler.md]


class Test多渠道會員合併策略:
    """
    Rule: OAuth 登入成功後依混合策略合併會員（優先 email → 渠道 UID → 建立新會員）
    """

    def test_email相同合併_LINE到既有會員(self):
        # Given members 表中已有 email "user@example.com" 的會員 member_id "M001"
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 該會員原本僅關聯 fb_friends（fb_uid "F321"）
        # [事件風暴部位: Aggregate - FbFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者在 Webchat 登入 LINE OAuth，取得 email "user@example.com"，line_uid "U123"
        # [事件風暴部位: Command - webchat_line_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統依合併優先順序表執行
        # [事件風暴部位: Read Model - MergeDecision]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 系統將 line_friends 記錄的 member_id 設為 "M001"
        # [事件風暴部位: Command - link_line_friend_to_member]
        # [生成參考 Prompt: Command-Handler.md]

        # And 系統更新 webchat_friends 記錄的 member_id 為 "M001"
        # [事件風暴部位: Command - link_webchat_friend_to_member]
        # [生成參考 Prompt: Command-Handler.md]

        # And 客服聊天室立即顯示整合後的跨渠道訊息
        # [事件風暴部位: Read Model - ChatThreadMerged]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_無email但渠道UID已存在(self):
        # Given line_friends 表中已有 line_uid "U123" 的記錄，關聯 member_id "M001"
        # [事件風暴部位: Aggregate - LineFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者在 Webchat 登入 LINE OAuth，取得 line_uid "U123"，但用戶未授權 email
        # [事件風暴部位: Command - webchat_line_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統查詢 line_friends 表發現 line_uid "U123" 已存在
        # [事件風暴部位: Read Model - MergeDecision]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 系統使用既有 member_id "M001"
        # [事件風暴部位: Command - reuse_existing_member]
        # [生成參考 Prompt: Command-Handler.md]

        # And 系統更新 webchat_friends 記錄的 member_id 為 "M001"
        # [事件風暴部位: Command - link_webchat_friend_to_member]
        # [生成參考 Prompt: Command-Handler.md]

    def test_無email且渠道UID不存在建立新會員(self):
        # Given members 表和 line_friends 表都沒有相關記錄
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者在 Webchat 登入 LINE OAuth，取得 line_uid "U888"，但用戶未授權 email
        # [事件風暴部位: Command - webchat_line_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統建立新的 member_id "M003"
        # [事件風暴部位: Command - create_member_without_email]
        # [生成參考 Prompt: Command-Handler.md]

        # And 系統建立 line_friends 記錄（line_uid "U888", member_id "M003"）
        # [事件風暴部位: Command - create_line_friend]
        # [生成參考 Prompt: Command-Handler.md]

        # And 系統更新 webchat_friends 記錄的 member_id 為 "M003"
        # [事件風暴部位: Command - link_webchat_friend_to_member]
        # [生成參考 Prompt: Command-Handler.md]

        # And 日後若取得 email 且與既有會員相同，再觸發合併
        # [事件風暴部位: Success-Failure - deferred_merge_on_email]
        # [生成參考 Prompt: Success-Failure-Handler.md]

    def test_日後取得email觸發延遲合併(self):
        # Given 會員 member_id "M003" 原本無 email（LINE OAuth 未授權）
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And members 表中已有 email "user@example.com" 的會員 member_id "M001"
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 用戶更新個人資料填入 email "user@example.com"
        # [事件風暴部位: Command - update_member_email]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統偵測到 email 與 member_id "M001" 相同
        # [事件風暴部位: Read Model - MergeDecision]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 系統觸發會員合併，將 "M003" 的資料合併至 "M001"
        # [事件風暴部位: Command - merge_members]
        # [生成參考 Prompt: Command-Handler.md]

        # And 原 "M003" 的 friends 記錄更新 member_id 為 "M001"
        # [事件風暴部位: Command - relink_friends_to_master_member]
        # [生成參考 Prompt: Command-Handler.md]

    def test_多渠道會員合併至同一member(self):
        # Given members 表中已有 email "user@example.com" 的會員
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者在 Webchat 分別登入 LINE、Facebook OAuth 與互動
        # [事件風暴部位: Command - webchat_line_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]
        # [事件風暴部位: Command - webchat_facebook_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]
        # [事件風暴部位: Command - webchat_interaction]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統透過各 friends 表的 member_id 將三個渠道關聯至同一會員
        # [事件風暴部位: Command - unify_member_links]
        # [生成參考 Prompt: Command-Handler.md]

        # And 會員列表顯示統一 member_id "M001"
        # [事件風暴部位: Read Model - MemberList]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 加入來源顯示「LINE / Facebook / Webchat」
        # [事件風暴部位: Read Model - MemberJoinSource]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test會員合併資料衝突處理:
    """
    Rule: 會員合併時資料衝突處理（新資料優先，空白不覆蓋）
    """

    def test_會員資料合併衝突處理(self):
        # Given 系統已有會員資料表格 (updated_at)
        # [事件風暴部位: Aggregate - MemberProfile]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And Webchat 新事件攜帶會員資料表格 (event_time)
        # [事件風暴部位: Event - webchat_profile_payload]
        # [生成參考 Prompt: Event-Handler.md]

        # When 系統合併同 email 的會員資料
        # [事件風暴部位: Command - merge_member_profile]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統依 updated_at / event_time 以新資料優先覆蓋非空欄位表格
        # [事件風暴部位: Read Model - ProfileMergeResult]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 標籤合併時去重合併集合（VIP, 高消費客戶）
        # [事件風暴部位: Command - merge_member_tags]
        # [生成參考 Prompt: Command-Handler.md]

        # And 合併規則只會覆蓋有值的欄位，空白不會覆蓋舊資料
        # [事件風暴部位: Success-Failure - ignore_blank_overwrite]
        # [生成參考 Prompt: Success-Failure-Handler.md]


class Test客服聊天室下拉切換:
    """
    Rule: 客服可透過下拉選單切換同一 member_id 的不同渠道聊天紀錄
    """

    def test_客服切換渠道查看訊息(self):
        # Given 某會員 member_id "M001" 同時關聯 line_friends、fb_friends 及 webchat_friends
        # [事件風暴部位: Aggregate - MemberChannelLinkage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服打開該會員的客服聊天室
        # [事件風暴部位: Command - open_customer_thread]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統顯示下拉選單列出可切換的渠道表格
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 聊天室訊息依選擇渠道顯示對應紀錄（從 chat_logs 表依 platform 篩選）
        # [事件風暴部位: Read Model - ChatThreadByPlatform]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 好友資料保留在各自 friends 表中
        # [事件風暴部位: Aggregate - FriendsTables]
        # [生成參考 Prompt: Aggregate-Then-Handler.md]


class TestWebchat訪客會話狀態管理:
    """
    Rule: Webchat 訪客會話結束判定依據 WebSocket 狀態，斷線時自動設為已離線
    """

    def test_訪客關閉瀏覽器會話自動結束(self):
        # Given 訪客 webchat_uid "W123" 正在 Webchat 對話中（is_following = true）
        # [事件風暴部位: Aggregate - WebchatFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And WebSocket 連線維持心跳（每 30 秒 ping/pong）
        # [事件風暴部位: Aggregate - WebsocketSession]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 訪客關閉瀏覽器，WebSocket 連線中斷且 60 秒內未重連
        # [事件風暴部位: Event - websocket_disconnected_timeout]
        # [生成參考 Prompt: Event-Handler.md]

        # Then 系統自動更新 webchat_friends.is_following = false
        # [事件風暴部位: Command - mark_webchat_offline]
        # [生成參考 Prompt: Command-Handler.md]

        # And 系統記錄 unfollowed_at = 當前時間
        # [事件風暴部位: Command - set_unfollowed_at]
        # [生成參考 Prompt: Command-Handler.md]

        # And 客服聊天室標示「Webchat 用戶已離線」
        # [事件風暴部位: Read Model - ChatStatusBanner]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_訪客網路中斷後重新連線(self):
        # Given 訪客 webchat_uid "W123" 的 WebSocket 連線因網路問題斷開
        # [事件風暴部位: Event - websocket_disconnected]
        # [生成參考 Prompt: Event-Handler.md]

        # When 訪客在 60 秒內重新連線
        # [事件風暴部位: Event - websocket_reconnected]
        # [生成參考 Prompt: Event-Handler.md]

        # Then 系統視為同一會話，不更新 is_following 狀態
        # [事件風暴部位: Success-Failure - session_continues]
        # [生成參考 Prompt: Success-Failure-Handler.md]

        # And 聊天可正常繼續
        # [事件風暴部位: Read Model - ChatContinuation]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_訪客重新訪問網站(self):
        # Given 訪客 webchat_uid "W123" 曾結束會話（is_following = false）
        # [事件風暴部位: Aggregate - WebchatFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 訪客重新訪問 Webchat 並建立連線
        # [事件風暴部位: Command - establish_webchat_session]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統更新 webchat_friends.is_following = true
        # [事件風暴部位: Command - mark_webchat_online]
        # [生成參考 Prompt: Command-Handler.md]

        # And 系統更新 followed_at = 當前時間
        # [事件風暴部位: Command - set_followed_at]
        # [生成參考 Prompt: Command-Handler.md]

        # And 系統清除 unfollowed_at = NULL
        # [事件風暴部位: Command - clear_unfollowed_at]
        # [生成參考 Prompt: Command-Handler.md]

        # And 客服可繼續與該訪客對話
        # [事件風暴部位: Read Model - ChatContinuation]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestWebchatUID生成與識別:
    """
    Rule: webchat_uid 使用 UUID v4，由後端生成並儲存於 localStorage 跨 session 識別
    """

    def test_新訪客首次生成webchat_uid(self):
        # Given 訪客首次訪問 Webchat，localStorage 無 webchat_uid
        # [事件風暴部位: Aggregate - ClientStorage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 訪客建立 WebSocket 連線
        # [事件風暴部位: Command - establish_webchat_session]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 後端生成 UUID v4 格式的 webchat_uid
        # [事件風暴部位: Command - generate_webchat_uid]
        # [生成參考 Prompt: Command-Handler.md]

        # And 後端建立 webchat_friends 記錄
        # [事件風暴部位: Command - create_webchat_friend]
        # [生成參考 Prompt: Command-Handler.md]

        # And 前端將 webchat_uid 儲存於 localStorage
        # [事件風暴部位: Command - persist_uid_to_localstorage]
        # [生成參考 Prompt: Command-Handler.md]

    def test_訪客重新訪問使用既有uid(self):
        # Given 訪客曾訪問過 Webchat，localStorage 有 webchat_uid "550e8400-e29b-41d4-a716-446655440000"
        # [事件風暴部位: Aggregate - ClientStorage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 訪客重新訪問並建立 WebSocket 連線
        # [事件風暴部位: Command - establish_webchat_session]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 前端傳送既有 webchat_uid 給後端
        # [事件風暴部位: Command - send_uid_to_backend]
        # [生成參考 Prompt: Command-Handler.md]

        # And 後端識別為同一訪客，更新 webchat_friends 狀態
        # [事件風暴部位: Command - update_webchat_friend_state]
        # [生成參考 Prompt: Command-Handler.md]

        # And 聊天紀錄延續顯示
        # [事件風暴部位: Read Model - ChatContinuation]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_localstorage被清除視為新訪客(self):
        # Given 訪客曾訪問過 Webchat 但 localStorage 已被清除
        # [事件風暴部位: Aggregate - ClientStorage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 訪客建立 WebSocket 連線
        # [事件風暴部位: Command - establish_webchat_session]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 後端生成新的 UUID v4 webchat_uid
        # [事件風暴部位: Command - generate_webchat_uid]
        # [生成參考 Prompt: Command-Handler.md]

        # And 後端建立新的 webchat_friends 記錄
        # [事件風暴部位: Command - create_webchat_friend]
        # [生成參考 Prompt: Command-Handler.md]

        # And 視為新訪客，無法自動關聯舊聊天紀錄
        # [事件風暴部位: Read Model - ChatThreadIsolation]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test新Webchat會員建立:
    """
    Rule: 當 Webchat OAuth 登入 email 不存在於 members 表時，建立新的 member_id
    """

    def test_新Webchat會員建立(self):
        # Given members 表中無 email "newuser@example.com"
        # [事件風暴部位: Aggregate - Member]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者 Webchat 登入 LINE OAuth，email "newuser@example.com"，line_uid "U999"
        # [事件風暴部位: Command - webchat_line_oauth_login]
        # [生成參考 Prompt: Command-Handler.md]

        # And 使用者 Webchat 互動，webchat_uid "550e8400-e29b-41d4-a716-446655440000"
        # [事件風暴部位: Command - webchat_interaction]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統建立新的 member_id "M002"，並在 line_friends 及 webchat_friends 表建立對應紀錄
        # [事件風暴部位: Command - create_member_and_link_channels]
        # [生成參考 Prompt: Command-Handler.md]

        # And 聊天室僅顯示 Webchat 訊息
        # [事件風暴部位: Read Model - ChatLogView]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 加入來源顯示「Webchat」
        # [事件風暴部位: Read Model - MemberJoinSource]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 登入方式顯示 LINE ICON + channel_name + line_uid
        # [事件風暴部位: Read Model - LoginMethodDisplay]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test客服聊天室顯示整合訊息_可切換渠道:
    """
    Rule: 客服聊天室應顯示整合後訊息，並標示來源及可切換渠道
    """

    def test_客服聊天室顯示整合訊息(self):
        # Given 會員 member_id "M001" 已關聯 line_friends (line_uid "U123")、fb_friends (fb_uid "F321") 及 webchat_friends (webchat_uid "W555")
        # [事件風暴部位: Aggregate - MemberChannelLinkage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # Then 客服聊天室依時間排序顯示訊息
        # [事件風暴部位: Read Model - ChatThreadTimeline]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 每則訊息標示來源 (LINE / FB / Webchat)
        # [事件風暴部位: Read Model - MessageSourceLabel]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 下拉選單可切換查看不同渠道訊息
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test會員列表顯示上次互動渠道:
    """
    Rule: 從會員列表點擊聊天按鈕進入客服聊天室時，初始訊息流依 last_interaction_at 最晚者
    """

    def test_上次互動為Webchat(self):
        # Given 會員 member_id "M001" 的 webchat_friends.last_interaction_at 為最晚
        # [事件風暴部位: Aggregate - WebchatFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服從會員列表點擊該會員聊天按鈕
        # [事件風暴部位: Command - open_customer_thread]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 客服聊天室初始顯示 Webchat 訊息流
        # [事件風暴部位: Read Model - ChatThreadByPlatform]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 下拉選單仍可切換到 LINE 或 FB
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_上次互動為Facebook(self):
        # Given 會員 member_id "M001" 的 fb_friends.last_interaction_at 為最晚
        # [事件風暴部位: Aggregate - FbFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服從會員列表點擊該會員聊天按鈕
        # [事件風暴部位: Command - open_customer_thread]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 客服聊天室初始顯示 Facebook 訊息流
        # [事件風暴部位: Read Model - ChatThreadByPlatform]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 下拉選單仍可切換到 LINE 或 Webchat 訊息
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_上次互動為LINE(self):
        # Given 會員 member_id "M002" 的 line_friends.last_interaction_at 為最晚
        # [事件風暴部位: Aggregate - LineFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服點擊聊天按鈕
        # [事件風暴部位: Command - open_customer_thread]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 客服聊天室初始顯示 LINE 訊息流
        # [事件風暴部位: Read Model - ChatThreadByPlatform]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 下拉選單可切換至 FB 或 Webchat 訊息
        # [事件風暴部位: Read Model - ReplyChannelSwitcher]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test多渠道會員合併後最近互動顯示:
    """
    Rule: 合併後會員列表「最近互動」顯示最晚渠道並用該渠道頭像與姓名
    """

    def test_最近互動為Facebook(self):
        # Given 會員 member_id "M001" 同時關聯 fb_friends (fb_uid "F123") 與 line_friends (line_uid "L456")
        # [事件風暴部位: Aggregate - MemberChannelLinkage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And fb_friends.last_interaction_at 為 2025-12-01 10:00（最晚）
        # [事件風暴部位: Aggregate - FbFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服查看會員列表
        # [事件風暴部位: Query - list_members]
        # [生成參考 Prompt: Query-Handler.md]

        # Then 最近互動欄位顯示 Facebook ICON + fb_picture_url + fb_display_name
        # [事件風暴部位: Read Model - MemberList]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_最近互動為LINE(self):
        # Given 會員 member_id "M001" 同時關聯 fb_friends 與 line_friends
        # [事件風暴部位: Aggregate - MemberChannelLinkage]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And line_friends.last_interaction_at 為 2025-12-01 12:00（最晚）
        # [事件風暴部位: Aggregate - LineFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服查看會員列表
        # [事件風暴部位: Query - list_members]
        # [生成參考 Prompt: Query-Handler.md]

        # Then 最近互動欄位顯示 LINE ICON + line_picture_url + line_display_name
        # [事件風暴部位: Read Model - MemberList]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 切換至 FB 渠道時顯示 fb_picture_url + fb_display_name
        # [事件風暴部位: Read Model - MemberList]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_最近互動為Webchat(self):
        # Given 會員 member_id "M002" 關聯 webchat_friends (webchat_uid "W789")
        # [事件風暴部位: Aggregate - WebchatFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And webchat_friends.last_interaction_at 為最晚
        # [事件風暴部位: Aggregate - WebchatFriend]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 客服查看會員列表
        # [事件風暴部位: Query - list_members]
        # [生成參考 Prompt: Query-Handler.md]

        # Then 最近互動欄位顯示 Webchat ICON + webchat_picture_url + webchat_display_name
        # [事件風暴部位: Read Model - MemberList]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]
