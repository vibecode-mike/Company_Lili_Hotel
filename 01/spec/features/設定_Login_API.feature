# language: zh-TW
功能: 設定 Login API
  作為一位 Admin
  我希望能設定 LINE Login 以整併會員資料

  Rule: Channel ID 欄位必須填寫且符合基本長度限制

    Example: Channel ID 為空時顯示錯誤訊息
      Given 管理員進入 Login API 設定頁面
      When 管理員輸入 Channel ID「」
      And 管理員輸入 Channel Secret「valid_secret」
      And 管理員點擊「儲存設定」
      Then 操作失敗
      And Channel ID 欄位顯示錯誤訊息「此欄位為必填」

    Example: Channel ID 長度不足時顯示錯誤訊息
      Given 管理員進入 Login API 設定頁面
      When 管理員輸入 Channel ID「123」（長度過短）
      And 管理員點擊「儲存設定」
      Then 操作失敗
      And Channel ID 欄位顯示錯誤訊息「長度不符合要求」

  Rule: Channel Secret 欄位必須填寫且符合基本長度限制

    Example: Channel Secret 為空時顯示錯誤訊息
      Given 管理員進入 Login API 設定頁面
      When 管理員輸入 Channel ID「1651234567」
      And 管理員輸入 Channel Secret「」
      And 管理員點擊「儲存設定」
      Then 操作失敗
      And Channel Secret 欄位顯示錯誤訊息「此欄位為必填」

    Example: Channel Secret 長度不足時顯示錯誤訊息
      Given 管理員進入 Login API 設定頁面
      When 管理員輸入 Channel Secret「short」（長度過短）
      And 管理員點擊「儲存設定」
      Then 操作失敗
      And Channel Secret 欄位顯示錯誤訊息「長度不符合要求」

  Rule: 兩項憑證欄位支援英文、數字、特殊符號

    Example: Channel ID 與 Secret 接受特殊符號
      Given 管理員進入 Login API 設定頁面
      When 管理員輸入 Channel ID「1651234567」
      And 管理員輸入 Channel Secret「AbCdEf1234567890GhIjKlMnOpQrStUv」
      Then 前端僅驗證欄位非空與基本長度限制
      And 系統允許提交表單以進行驗證

  Rule: 憑證格式正確性由 LINE API 驗證，前端僅做基本驗證

    Example: 前端驗證通過後由 LINE API 進行實際驗證
      Given 管理員輸入 Channel ID「1234567890」（符合基本長度）
      And 管理員輸入 Channel Secret「AbCdEf1234567890GhIjKlMnOpQrStUv」（符合基本長度）
      When 管理員點擊「儲存設定」
      Then 前端驗證通過（非空、長度符合）
      And 系統向 LINE API 發送驗證請求
      And LINE API 回應憑證格式或內容錯誤
      Then 系統顯示錯誤訊息「憑證驗證失敗，請確認 Channel ID 與 Channel Secret 是否正確」

  Rule: 系統向 LINE 驗證成功後儲存設定

    Example: 驗證成功並儲存設定
      Given 管理員輸入所有正確的憑證資訊
      When 管理員點擊「儲存設定」
      And 系統向 LINE 驗證憑證
      And LINE 驗證成功
      Then 系統儲存 Login API 設定
      And 系統顯示文字提示「設定成功」
