# language: zh-TW
功能: 登入系統
  作為一位後台管理員
  我希望能登入後台系統以便開始使用

  Rule: 登入使用信箱作為帳號識別

    Example: 登入請求以信箱為帳號欄位
      Given 系統中存在管理員，信箱為「admin@example.com」，密碼為「Pass123!」
      When 管理員在登入頁面輸入信箱「admin@example.com」與密碼「Pass123!」
      And 管理員提交登入表單
      Then 系統送出登入 API 請求，payload 包含 email 欄位值「admin@example.com」
      And 系統使用 email 欄位查詢帳號
      And 登入成功

  Rule: 密碼須符合複雜度要求（8-64字元 + 至少3種類型）

    Example: 密碼長度不足 8 字元
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼「Pass12!」（7字元）
      Then 系統顯示錯誤訊息「密碼長度須為 8-64 字元」
      And 系統阻擋註冊或修改操作

    Example: 密碼長度超過 64 字元
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼長度為 65 字元
      Then 系統顯示錯誤訊息「密碼長度須為 8-64 字元」
      And 系統阻擋註冊或修改操作

    Example: 密碼僅包含 2 種類型（不符合要求）
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼「abcd1234」（僅小寫字母 + 數字）
      Then 系統顯示錯誤訊息「密碼須包含至少 3 種類型：大寫字母、小寫字母、數字、特殊符號」
      And 系統阻擋註冊或修改操作

    Example: 密碼包含 3 種類型（符合要求）
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼「Pass1234」（大寫字母 + 小寫字母 + 數字）
      Then 系統驗證密碼符合複雜度要求
      And 系統允許註冊或修改操作

    Example: 密碼包含 4 種類型（強密碼）
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼「Pass123!」（大寫字母 + 小寫字母 + 數字 + 特殊符號）
      Then 系統驗證密碼符合複雜度要求
      And 系統顯示密碼強度為「強」
      And 系統允許註冊或修改操作

  Rule: 密碼不可包含連續字元或過多重複字元

    Example: 密碼包含連續數字
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼「Pass123456」（包含連續數字 123456）
      Then 系統顯示錯誤訊息「密碼不可包含連續字元（如 123456、abcdef）」
      And 系統阻擋註冊或修改操作

    Example: 密碼包含連續字母
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼「Passabcdef1」（包含連續字母 abcdef）
      Then 系統顯示錯誤訊息「密碼不可包含連續字元（如 123456、abcdef）」
      And 系統阻擋註冊或修改操作

    Example: 密碼包含超過 3 次重複字元
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼「Passaaaa1」（包含 4 個連續 a）
      Then 系統顯示錯誤訊息「密碼不可包含超過 3 次重複字元」
      And 系統阻擋註冊或修改操作

  Rule: 密碼不可為常見弱密碼或與信箱相同

    Example: 密碼為常見弱密碼
      Given 管理員正在註冊或修改密碼
      When 管理員輸入密碼「password」（常見弱密碼）
      Then 系統顯示錯誤訊息「密碼強度過弱，請使用更複雜的密碼」
      And 系統阻擋註冊或修改操作

    Example: 密碼與信箱相同
      Given 管理員正在註冊，信箱為「admin@example.com」
      When 管理員輸入密碼「admin123」（包含信箱帳號 admin）
      Then 系統顯示錯誤訊息「密碼不可與信箱相同」
      And 系統阻擋註冊或修改操作

    Example: 密碼符合所有要求
      Given 管理員正在註冊，信箱為「admin@example.com」
      When 管理員輸入密碼「Pass123!」
      Then 系統驗證密碼符合所有複雜度要求
      And 系統允許註冊操作

  Rule: 前端即時顯示密碼強度指示器

    Example: 輸入密碼時即時顯示強度
      Given 管理員正在註冊或修改密碼頁面
      When 管理員輸入密碼「Pass1234」（8字元 + 3種類型）
      Then 前端即時顯示密碼強度為「中」（橙色）
      And 前端顯示強度指示條（2/3 填滿）

    Example: 強密碼顯示綠色指示器
      Given 管理員正在註冊或修改密碼頁面
      When 管理員輸入密碼「StrongPass123!」（12字元以上 + 4種類型）
      Then 前端即時顯示密碼強度為「強」（綠色）
      And 前端顯示強度指示條（3/3 填滿）

  Rule: 快速登入需驗證信箱已獲得系統授權

    Example: 快速登入時驗證授權成功
      Given 系統中存在管理員，信箱為「admin@example.com」
      And 該管理員已獲得系統授權
      When 管理員使用 Google 快速登入信箱「admin@example.com」
      Then 登入成功

    Example: 快速登入時驗證授權失敗
      Given 信箱「noauth@example.com」尚未註冊或未獲得授權
      When 管理員使用 Google 快速登入信箱「noauth@example.com」
      Then 操作失敗
      And 系統顯示錯誤訊息「此信箱尚未註冊」

  Rule: 一般登入需驗證帳號密碼正確性

    Example: 帳號密碼錯誤時登入失敗
      Given 系統中存在管理員，信箱為「admin@example.com」，密碼為「Pass123!」
      When 管理員輸入信箱「admin@example.com」和密碼「WrongPass」
      And 管理員提交登入
      Then 操作失敗
      And 系統停留於登入畫面
      And 系統顯示錯誤訊息「帳號或密碼錯誤，請重新確認」

  Rule: 登入成功後檢查 LINE OA 設定狀態，若已設定則導向首頁

    Example: 登入成功且已設定 LINE OA 導向首頁
      Given 系統中存在管理員，信箱為「admin@example.com」，密碼為「Pass123!」
      And 該管理員已完成 LINE OA 基本設定
      When 管理員輸入正確的信箱與密碼並提交登入
      Then 登入成功
      And 系統導向首頁
      And 系統顯示文字提示「登入成功」

  Rule: 登入成功後檢查 LINE OA 設定狀態，若未設定則導向基本設定頁面

    Example: 登入成功但未設定 LINE OA 導向設定頁
      Given 系統中存在管理員，信箱為「admin@example.com」，密碼為「Pass123!」
      And 該管理員尚未完成 LINE OA 基本設定
      When 管理員輸入正確的信箱與密碼並提交登入
      Then 登入成功
      And 系統導向基本設定頁面

  Rule: 登入成功後建立會話，24HR 內保持自動登入

    Example: 登入成功後產生 JWT Token
      Given 管理員「李經理」輸入正確的信箱與密碼
      When 登入成功
      Then 系統產生 JWT Token，包含以下資訊
        | 欄位         | 說明                     |
        | admin_id     | 管理員 ID                |
        | email        | 管理員信箱               |
        | iat          | Token 發行時間           |
        | exp          | Token 過期時間（取登入時間 + 24 小時與下一個 00:00（UTC+8）之較早者）|
      And 系統將 JWT Token 回傳給前端
      And 前端將 JWT Token 儲存於 LocalStorage

    Example: 前端 API 請求自動帶入 JWT Token
      Given 管理員已登入，LocalStorage 中存在有效的 JWT Token
      When 前端發送 API 請求
      Then 請求的 Authorization Header 包含「Bearer {JWT_TOKEN}」
      And 伺服器驗證 JWT Token 的簽章與有效期
      And Token 有效時，請求成功執行
      And Token 無效或過期時，回傳 401 Unauthorized

    Example: 登入當日 23:59 前仍有效
      Given 管理員於「2025/11/12 10:00」登入成功並取得 JWT Token
      When 管理員於「2025/11/12 23:59」發送 API 請求
      Then 系統驗證 Token 仍在有效期內（尚未到達當日 00:00）
      And 請求成功執行

    Example: 跨過午夜後 Token 失效
      Given 管理員於「2025/11/12 10:00」登入成功並取得 JWT Token
      When 管理員於「2025/11/13 00:01」發送 API 請求
      Then 系統驗證 Token 已過期（已跨越下一個 00:00）
      And 回傳 401 Unauthorized
      And 前端導向登入頁面，提示「登入已過期，請重新登入」

  Rule: 登入會話於當日零時 00:00 自動登出

    Example: 逾越當日零時自動登出
      Given 管理員於「2025/06/01 21:00」登入系統
      And 系統建立的 Session 標記有效期至「2025/06/02 00:00」
      When 系統時間來到「2025/06/02 00:00」
      Then 系統將該 Session 標記為失效
      And 前端導向登入頁面要求管理員重新登入

  Rule: 授權到期前 7 日內每次登入彈窗提示（v0.3）

    Example: 授權即將到期時顯示提醒
      Given 系統中存在管理員，信箱為「admin@example.com」
      And 該管理員授權到期日為「2025/12/31」
      And 當前日期為「2025/12/25」
      When 管理員登入系統
      Then 登入成功
      And 系統彈窗顯示「授權即將到期」
      And 系統顯示到期日期「期限使用至 2025/12/31 須展延授權才能繼續使用」
      And 彈窗包含按鈕「聯絡我們」
