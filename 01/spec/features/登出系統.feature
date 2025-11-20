# language: zh-TW
功能: 登出系統
  作為一位後台管理員
  我希望能登出系統以便結束當前會話

  Rule: 管理員必須處於已登入狀態

    Example: 已登入管理員可登出
      Given 管理員已透過 email/password、Google 或 LINE 登入
      And Session 狀態為有效（is_active = true）
      When 管理員請求登出
      Then 系統允許登出操作


  Rule: 登出後清除會話並導向登入頁面

    Example: 管理員成功登出並清除所有會話資料
      Given 管理員已登入系統
      And 前端儲存了登入憑證於 Cookie 與 LocalStorage
      And 伺服器維護了該管理員的 Session 記錄
      When 管理員點擊登出按鈕
      Then 前端立即清除所有 Cookie、LocalStorage、SessionStorage
      And 前端呼叫登出 API 通知後端
      And 後端將該 Session 的 is_active 設為 false
      And 前端導向登入頁面

    Example: 登出 API 呼叫失敗但本地資料已清除
      Given 管理員已登入系統
      And 前端儲存了登入憑證
      When 管理員點擊登出按鈕
      And 前端成功清除本地資料
      But 登出 API 呼叫失敗（如網路中斷）
      Then 前端仍導向登入頁面
      And 管理員無法使用本地憑證重新進入系統
      And 系統記錄 API 失敗日誌供後續處理
