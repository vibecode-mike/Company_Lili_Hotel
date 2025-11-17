# language: zh-TW
功能: 設定 Login API
  作為一位 Admin
  我希望能設定 LINE Login 以整併會員資料

  Rule: Channel ID 欄位必須填寫且格式正確

    Example: Channel ID 格式錯誤時顯示錯誤訊息
      Given 管理員進入 Login API 設定頁面
      When 管理員輸入 Channel ID「」
      And 管理員輸入 Channel Secret「valid_secret」
      And 管理員點擊「儲存設定」
      Then 操作失敗
      And Channel ID 欄位顯示錯誤訊息「格式錯誤，請重新確認」

  Rule: Channel Secret 欄位必須填寫且格式正確

    Example: Channel Secret 格式錯誤時顯示錯誤訊息
      Given 管理員進入 Login API 設定頁面
      When 管理員輸入 Channel ID「1651234567」
      And 管理員輸入 Channel Secret「」
      And 管理員點擊「儲存設定」
      Then 操作失敗
      And Channel Secret 欄位顯示錯誤訊息「格式錯誤，請重新確認」

  Rule: 兩項憑證欄位支援英文、數字、特殊符號

    Example: Channel ID 與 Secret 接受特殊符號
      Given 管理員進入 Login API 設定頁面
      When 管理員輸入 Channel ID「1651234567」
      And 管理員輸入 Channel Secret「AbCdEf1234567890GhIjKlMnOpQrStUv」
      Then 前端確認 Channel ID 為 165 開頭的 10 位數字
      And 前端確認 Channel Secret 為 32 位大小寫英數字組成
      And 系統允許提交表單以進行驗證

  Rule: 系統向 LINE 驗證成功後儲存設定

    Example: 驗證成功並儲存設定
      Given 管理員輸入所有正確的憑證資訊
      When 管理員點擊「儲存設定」
      And 系統向 LINE 驗證憑證
      And LINE 驗證成功
      Then 系統儲存 Login API 設定
      And 系統顯示文字提示「設定成功」
