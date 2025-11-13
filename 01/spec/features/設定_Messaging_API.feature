# language: zh-TW
功能: 設定 Messaging API
  作為一位 Admin
  我希望能綁定 LINE OA 完成串接
  以便使用訊息與會員功能

  Rule: Channel ID 欄位必須填寫且格式正確

    Example: Channel ID 格式錯誤時顯示錯誤訊息
      Given 管理員進入 Messaging API 設定頁面
      When 管理員輸入 Channel ID「」
      And 管理員輸入 Channel Secret「valid_secret」
      And 管理員輸入 Channel Access Token「valid_token」
      And 管理員點擊「建立攔截」
      Then 操作失敗
      And Channel ID 欄位顯示錯誤訊息「格式錯誤，請重新確認」

  Rule: Channel Secret 欄位必須填寫且格式正確

    Example: Channel Secret 格式錯誤時顯示錯誤訊息
      Given 管理員進入 Messaging API 設定頁面
      When 管理員輸入 Channel ID「valid_channel_id」
      And 管理員輸入 Channel Secret「」
      And 管理員輸入 Channel Access Token「valid_token」
      And 管理員點擊「建立攔截」
      Then 操作失敗
      And Channel Secret 欄位顯示錯誤訊息「格式錯誤，請重新確認」

  Rule: Channel Access Token 欄位必須填寫且格式正確

    Example: Channel Access Token 格式錯誤時顯示錯誤訊息
      Given 管理員進入 Messaging API 設定頁面
      When 管理員輸入 Channel ID「valid_channel_id」
      And 管理員輸入 Channel Secret「valid_secret」
      And 管理員輸入 Channel Access Token「」
      And 管理員點擊「建立攔截」
      Then 操作失敗
      And Channel Access Token 欄位顯示錯誤訊息「格式錯誤，請重新確認」

  Rule: 三項憑證欄位須符合格式要求

    Example: Channel ID 格式錯誤（非 10 位數字）
      Given 管理員進入 Messaging API 設定頁面
      When 管理員輸入 Channel ID「12345」（少於 10 位）
      Then 前端即時顯示錯誤訊息「Channel ID 須為 10 位數字」

    Example: Channel Secret 格式錯誤（非 32 字元）
      Given 管理員進入 Messaging API 設定頁面
      When 管理員輸入 Channel Secret「short_secret」（少於 32 字元）
      Then 前端即時顯示錯誤訊息「Channel Secret 須為 32 字元英數字」

    Example: Channel Access Token 格式錯誤（少於 50 字元）
      Given 管理員進入 Messaging API 設定頁面
      When 管理員輸入 Channel Access Token「short_token」
      Then 前端即時顯示錯誤訊息「Channel Access Token 格式錯誤」

    Example: 所有憑證格式正確
      Given 管理員進入 Messaging API 設定頁面
      When 管理員輸入 Channel ID「1234567890」（10 位數字）
      And 管理員輸入 Channel Secret「abcdef1234567890abcdef1234567890」（32 字元）
      And 管理員輸入 Channel Access Token（有效格式，50+ 字元）
      Then 前端允許提交表單

  Rule: 須勾選「我已完成」確認完成 LINE 原生後台設定

    Example: 未勾選「我已完成」時阻擋提交
      Given 管理員輸入所有正確的憑證
      But 管理員未勾選「我已完成」
      When 管理員點擊「建立攔截」
      Then 操作失敗
      And 系統顯示錯誤訊息「請確認已完成 LINE 原生後台設定」

    Example: 勾選「我已完成」後允許提交
      Given 管理員輸入所有正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立攔截」
      Then 系統允許提交
      And 系統進行憑證驗證

  Rule: 須確認 LINE 原生後台與 Developer 已開啟 webhook 服務

    Example: Webhook 未開啟時顯示錯誤訊息
      Given 管理員輸入所有正確的憑證資訊
      And 管理員勾選「我已完成」
      But LINE 原生後台的 webhook 未開啟
      When 管理員點擊「建立攔截」
      Then 操作失敗
      And 系統顯示錯誤訊息「請確認 LINE Official Account 設定已開啟」

  Rule: 系統向 LINE 驗證成功後儲存設定

    Example: 驗證成功並儲存設定
      Given 管理員輸入所有正確的憑證資訊
      And 管理員勾選「我已完成」
      And LINE 原生後台的 webhook 已開啟
      When 管理員點擊「建立攔截」
      And 系統向 LINE 驗證憑證
      And LINE 驗證成功
      Then 系統儲存 Messaging API 設定
      And 系統顯示文字提示「連結成功」

  Rule: 綁定成功後顯示 LINE 官方帳號 ID

    Example: 顯示綁定的 LINE 帳號 ID
      Given 管理員已完成 Messaging API 設定
      And LINE 官方帳號 ID 為「@262qaash」
      When 管理員查看 Messaging API 設定頁面
      Then 系統顯示 LINE 帳號 ID「@262qaash」

  Rule: 系統調用 LINE API 驗證憑證有效性

    Example: Channel Access Token 無效
      Given 管理員輸入所有格式正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立攔截」
      And 系統調用 LINE Get Bot Info API
      And LINE API 返回 401 Unauthorized
      Then 操作失敗
      And 系統顯示錯誤訊息「Channel Access Token 無效」

    Example: 權限不足
      Given 管理員輸入所有格式正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立攔截」
      And 系統調用 LINE Get Bot Info API
      And LINE API 返回 403 Forbidden
      Then 操作失敗
      And 系統顯示錯誤訊息「權限不足，請檢查 Channel 設定」

    Example: 驗證成功並取得 Bot 資訊
      Given 管理員輸入所有正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立攔截」
      And 系統調用 LINE Get Bot Info API
      And LINE API 返回 200 OK
      And 返回 Bot 資訊（userId: @262qaash, displayName: 飯店官方帳號）
      Then 系統儲存 line_account_id 為「@262qaash」
      And 系統記錄 is_verified 為 true
      And 系統顯示文字提示「連結成功」

  Rule: 前端顯示 Webhook URL 供管理員複製設定

    Example: 顯示系統的 Webhook URL
      Given 管理員進入 Messaging API 設定頁面
      When 管理員查看 Webhook 設定說明
      Then 系統顯示 Webhook URL「https://yourdomain.com/api/v1/line/webhook」
      And 系統顯示提示文字「請將此 URL 複製到 LINE Developer Console 的 Webhook URL 設定」
      And 系統提供「複製」按鈕

  Rule: 後端驗證 Webhook 簽章確保事件真實性

    Example: Webhook 簽章驗證成功
      Given 系統已完成 Messaging API 設定
      And channel_secret 為「abcdef1234567890abcdef1234567890」
      When LINE 發送 webhook 事件到「/api/v1/line/webhook」
      And 請求包含 X-Line-Signature header
      And 簽章驗證成功（HMAC-SHA256 一致）
      Then 系統接受事件
      And 系統處理 webhook 事件

    Example: Webhook 簽章驗證失敗
      Given 系統已完成 Messaging API 設定
      When LINE 發送 webhook 事件到「/api/v1/line/webhook」
      And 請求包含 X-Line-Signature header
      But 簽章驗證失敗（HMAC-SHA256 不一致）
      Then 系統拒絕事件
      And 系統記錄日誌「Invalid webhook signature」
      And 系統返回 403 Forbidden

    Example: Webhook 請求缺少簽章 header
      Given 系統已完成 Messaging API 設定
      When 收到 webhook 請求但缺少 X-Line-Signature header
      Then 系統拒絕事件
      And 系統記錄日誌「Missing X-Line-Signature header」
      And 系統返回 403 Forbidden
