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


    Example: 所有憑證格式正確
      Given 管理員進入 Messaging API 設定頁面
      When 管理員輸入 Channel ID「1234567890」（10 位數字）
      And 管理員輸入 Channel Secret「abcdef1234567890abcdef1234567890」（32 字元）
      And 管理員輸入 Channel Access Token（有效格式，50+ 字元）
      Then 前端允許提交表單

  Rule: 須勾選「我已完成」確認完成 LINE 原生後台設定


    Example: 勾選「我已完成」後允許提交
      Given 管理員輸入所有正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立攔截」
      Then 系統允許提交
      And 系統進行憑證驗證

  Rule: 系統採用兩階段驗證：第一階段驗證 Access Token，第二階段驗證 webhook 連通性

    Example: 第一階段驗證 Access Token 失敗，中止流程
      Given 管理員輸入所有格式正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立連結」
      And 系統調用 LINE Get Bot Info API（第一階段驗證）
      And LINE API 返回 401 Unauthorized
      Then 操作失敗
      And 系統顯示錯誤訊息「Channel Access Token 無效」
      And 不進入第二階段驗證

    Example: 第一階段驗證成功，進入第二階段驗證 webhook
      Given 管理員輸入所有正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立連結」
      And 系統調用 LINE Get Bot Info API（第一階段驗證）
      And LINE API 返回 200 OK
      Then 系統進入第二階段驗證 webhook 連通性

    Example: 第二階段 webhook 驗證失敗
      Given 第一階段 Access Token 驗證成功
      But LINE 原生後台的 webhook 未開啟或無法連通
      When 系統執行第二階段 webhook 驗證
      Then 操作失敗
      And 系統顯示錯誤訊息「請確認 LINE Official Account webhook 已開啟」

    Example: 兩階段驗證皆成功，儲存設定
      Given 第一階段 Access Token 驗證成功
      And 第二階段 webhook 驗證成功
      When 系統完成兩階段驗證
      Then 系統儲存 Messaging API 設定
      And 系統儲存 line_account_id
      And 系統記錄 is_verified 為 true
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
      When 管理員點擊「建立連結」
      And 系統調用 LINE Get Bot Info API
      And LINE API 返回 401 Unauthorized
      Then 操作失敗
      And 系統顯示錯誤訊息「Channel Access Token 無效」

    Example: 權限不足
      Given 管理員輸入所有格式正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立連結」
      And 系統調用 LINE Get Bot Info API
      And LINE API 返回 403 Forbidden
      Then 操作失敗
      And 系統顯示錯誤訊息「權限不足，請檢查 Channel 設定」

    Example: 驗證成功並取得 Bot 資訊
      Given 管理員輸入所有正確的憑證
      And 管理員勾選「我已完成」
      When 管理員點擊「建立連結」
      And 系統調用 LINE Get Bot Info API
      And LINE API 返回 200 OK
      And 返回 Bot 資訊（userId: @262qaash, displayName: 飯店官方帳號）
      Then 系統儲存 line_account_id 為「@262qaash」
      And 系統記錄 is_verified 為 true
      And 系統顯示文字提示「連結成功」
