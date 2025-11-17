Feature: 會員管理
  作為一位行銷人員
  我希望系統能夠整合 LINE 官方帳號的會員，並抓取會員的基本資料、互動紀錄
  以便掌握會員資訊，能規劃不同推播訊息來提升會員的忠誠度

  Rule: LINE 會員頭像儲存機制：儲存 LINE CDN URL

    Example: 會員首次加入時取得並儲存頭像 URL
      Given 會員「張小明」透過 LINE 官方帳號加入
      And LINE API 回傳該會員的頭像 URL 為「https://profile.line-scdn.net/xxxxx」
      When 系統建立會員資料
      Then 系統儲存頭像 URL「https://profile.line-scdn.net/xxxxx」至 line_picture_url 欄位
      And 前端顯示時直接載入該 CDN URL

    Example: 會員已有頭像 URL 則不重複呼叫 LINE API
      Given 會員「張小明」的 line_picture_url 為「https://profile.line-scdn.net/xxxxx」
      When 系統檢查會員資料
      Then 系統不呼叫 LINE API
      And 直接使用資料庫中的頭像 URL

    Example: 會員頭像 URL 為空時補抓取
      Given 會員「張小明」的 line_picture_url 為空值
      When 系統檢查會員資料
      Then 系統呼叫 LINE Profile API 取得頭像 URL
      And 更新 line_picture_url 欄位

    Example: 前端顯示會員頭像時載入 LINE CDN URL
      Given 會員「張小明」的 line_picture_url 為「https://profile.line-scdn.net/xxxxx」
      When 前端顯示會員清單或會員詳細資料
      Then 前端使用 <img src="https://profile.line-scdn.net/xxxxx"> 載入頭像
      And 若 URL 失效則顯示預設頭像

  Rule: 以清單形式顯示會員清單，包含 LINE 會員頭像＋名稱

    Example: 查看會員清單顯示 LINE 會員頭像與名稱
      Given 系統中存在以下會員
        | member_id | line_avatar                              | line_name |
        | M001      | https://profile.line-scdn.net/xxxxx      | 張小明    |
        | M002      | https://profile.line-scdn.net/yyyyy      | 李小華    |
      When 行銷人員查看會員清單
      Then 系統顯示以下會員資料
        | member_id | line_avatar                              | line_name |
        | M001      | https://profile.line-scdn.net/xxxxx      | 張小明    |
        | M002      | https://profile.line-scdn.net/yyyyy      | 李小華    |

  Rule: 以清單形式顯示會員清單，包含姓名

    Example: 查看會員清單顯示姓名
      Given 系統中存在會員「張小明」，姓名為「張三」
      When 行銷人員查看會員清單
      Then 系統顯示該會員姓名「張三」

  Rule: 以清單形式顯示會員清單，包含電子信箱

    Example: 查看會員清單顯示電子信箱
      Given 系統中存在會員「張三」，電子信箱為「zhang@example.com」
      When 行銷人員查看會員清單
      Then 系統顯示該會員電子信箱「zhang@example.com」

  Rule: 以清單形式顯示會員清單，包含手機號碼

    Example: 查看會員清單顯示手機號碼
      Given 系統中存在會員「張三」，手機號碼為「0912345678」
      When 行銷人員查看會員清單
      Then 系統顯示該會員手機號碼「0912345678」

  Rule: 以清單形式顯示會員清單，包含標籤（會員＋互動）

    Example: 查看會員清單顯示標籤
      Given 系統中存在會員「張三」，擁有以下標籤
        | tag_name | tag_type |
        | VIP      | 會員標籤 |
        | 雙十優惠 | 互動標籤 |
      When 行銷人員查看會員清單
      Then 系統顯示該會員標籤
        | tag_name | tag_type |
        | VIP      | 會員標籤 |
        | 雙十優惠 | 互動標籤 |

  Rule: 以清單形式顯示會員清單，包含建立時間

    Example: 查看會員清單顯示建立時間
      Given 系統中存在會員「張三」，建立時間為「2025/01/01 10:00」
      When 行銷人員查看會員清單
      Then 系統顯示該會員建立時間「2025/01/01 10:00」

  Rule: 以清單形式顯示會員清單，包含最後回覆日期

    Example: 查看會員清單顯示最後回覆日期
      Given 系統中存在會員「張三」，最後回覆日期為「2025/01/20 15:30」
      When 行銷人員查看會員清單
      Then 系統顯示該會員最後回覆日期「2025/01/20 15:30」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含 LINE 會員頭像＋名稱

    Example: 查看會員詳細資料顯示 LINE 頭像與名稱
      Given 系統中存在會員「張三」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員「張三」的 LINE 會員頭像與名稱

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含姓名

    Example: 查看會員詳細資料顯示姓名
      Given 系統中存在會員「張三」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員姓名「張三」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含性別

    Example: 查看會員詳細資料顯示性別
      Given 系統中存在會員「張三」，性別為「男」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員性別「男」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含生日

    Example: 查看會員詳細資料顯示生日
      Given 系統中存在會員「張三」，生日為「1990/08/15」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員生日「1990/08/15」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含電子信箱

    Example: 查看會員詳細資料顯示電子信箱
      Given 系統中存在會員「張三」，電子信箱為「zhang@example.com」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員電子信箱「zhang@example.com」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含手機號碼

    Example: 查看會員詳細資料顯示手機號碼
      Given 系統中存在會員「張三」，手機號碼為「0912345678」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員手機號碼「0912345678」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含身分證/護照號碼（唯一值），前端預設顯示遮罩格式

    Example: 查看會員詳細資料預設顯示身分證號碼遮罩
      Given 系統中存在會員「張三」，身分證號碼為「A123456789」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員身分證號碼「A12****789」

  Rule: 身分證號碼遮罩可手動解除查看完整號碼

    Example: 手動解除遮罩顯示完整身分證號碼
      Given 系統中存在會員「張三」，身分證號碼為「A123456789」
      And 行銷人員點擊「查看」動作
      And 系統顯示會員身分證號碼「A12****789」
      When 行銷人員點擊「顯示完整號碼」按鈕
      Then 系統顯示會員身分證號碼「A123456789」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含居住地

    Example: 查看會員詳細資料顯示居住地
      Given 系統中存在會員「張三」，居住地為「台北市」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員居住地「台北市」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含加入來源

    Example: 查看會員詳細資料顯示加入來源
      Given 系統中存在會員「張三」，加入來源為「LINE」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員加入來源「LINE」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含建立時間

    Example: 查看會員詳細資料顯示建立時間
      Given 系統中存在會員「張三」，建立時間為「2025/01/01 10:00」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員建立時間「2025/01/01 10:00」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含最後回覆日期

    Example: 查看會員詳細資料顯示最後回覆日期
      Given 系統中存在會員「張三」，最後回覆日期為「2025/01/20 15:30」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員最後回覆日期「2025/01/20 15:30」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含 LINE UID

    Example: 查看會員詳細資料顯示 LINE UID
      Given 系統中存在會員「張三」，LINE UID 為「U1234567890abcdef」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員 LINE UID「U1234567890abcdef」

  Rule: 點擊「查看」動作，可查看會員詳細資料，包含標籤（會員＋互動）

    Example: 查看會員詳細資料顯示標籤
      Given 系統中存在會員「張三」，擁有以下標籤
        | tag_name | tag_type |
        | VIP      | 會員標籤 |
        | 雙十優惠 | 互動標籤 |
      When 行銷人員點擊「查看」動作
      Then 系統顯示該會員標籤
        | tag_name | tag_type |
        | VIP      | 會員標籤 |
        | 雙十優惠 | 互動標籤 |

  Rule: 會員詳細資料需註記會員 ID 為唯一值

    Example: 查看會員詳細資料顯示唯一會員 ID
      Given 系統中存在會員「張三」，會員 ID 為「M001」
      When 行銷人員點擊「查看」動作
      Then 系統顯示會員 ID「M001」

  Rule: 點擊「聊天」動作，可進入與該會員的一對一聊天訊息紀錄

    Example: 點擊聊天動作跳轉至聊天頁面
      Given 系統中存在會員「張三」，會員 ID 為「M001」
      When 行銷人員在會員清單中點擊會員「張三」的「聊天」按鈕
      Then 系統跳轉至該會員的一對一聊天訊息頁面
      And 當前頁面被取代為聊天訊息介面
      And 系統顯示與會員「張三」的所有歷史訊息紀錄

  Rule: 若串接 CRM，可查看該會員消費紀錄（v0.2），包含消費時間

    Example: 查看會員消費時間
      Given 系統已從 CRM 定期同步會員「張小明」的消費資料
      And 會員「張小明」有一筆消費時間為「2025/01/15 14:30」
      When 內部人員點擊「串接 CRM」查看會員「張小明」的消費紀錄
      Then 系統顯示該筆消費時間「2025/01/15 14:30」

  Rule: 若串接 CRM，可查看該會員消費紀錄（v0.2），包含金額

    Example: 查看會員消費金額
      Given 系統已從 CRM 定期同步會員「張小明」的消費資料
      And 會員「張小明」有一筆消費金額為「8500」
      When 內部人員點擊「串接 CRM」查看會員「張小明」的消費紀錄
      Then 系統顯示該筆消費金額「NT$ 8,500」

  Rule: 若串接 CRM，可查看該會員消費紀錄（v0.2），包含房型或套餐

    Example: 查看會員房型套餐
      Given 系統已從 CRM 定期同步會員「張小明」的消費資料
      And 會員「張小明」有一筆房型為「豪華雙人房」
      When 內部人員點擊「串接 CRM」查看會員「張小明」的消費紀錄
      Then 系統顯示該筆房型「豪華雙人房」

  Rule: 若串接 CRM，可分析消費頻率

    Example: 分析會員消費頻率
      Given 系統已從 CRM 定期同步會員「張小明」的消費資料
      And 會員「張小明」在最近一年內有 5 筆消費紀錄
      When 內部人員查看會員「張小明」的消費分析
      Then 系統顯示該會員消費頻率「每 2.4 個月消費一次」

  Rule: 消費紀錄資料透過定期同步機制從 CRM 系統批次匯入

    Example: 定期同步消費紀錄（每日凌晨 02:00 全量同步）
      Given CRM 系統中有會員的最新消費資料
      When 系統執行定期同步任務（每日凌晨 02:00）
      Then 系統批次匯入 CRM 消費資料至 ConsumptionRecord 資料表（全量覆蓋）
      And 系統記錄同步時間「2025/01/25 02:00」
      And 系統記錄同步筆數「1,250 筆」

    Example: 同步失敗記錄日誌並次日重試
      Given CRM 系統連線失敗
      When 系統執行定期同步任務（2025/01/25 02:00）
      Then 同步失敗
      And 系統記錄失敗日誌「CRM 系統連線逾時」
      And 系統次日自動重試（2025/01/26 02:00）

    Example: 連續失敗超過 3 日系統告警
      Given 系統連續 3 日同步失敗
      When 系統執行第 4 次同步任務（2025/01/28 02:00）
      And 同步再次失敗
      Then 系統發送告警通知「CRM 同步連續失敗超過 3 日，請檢查系統狀態」

  Rule: 顯示會員的建立時間

    Example: 顯示會員建立時間
      Given 系統中存在會員「李四」，建立時間為「2025/01/05 12:00」
      When 行銷人員查看會員資料
      Then 系統顯示該會員建立時間「2025/01/05 12:00」

  Rule: 顯示會員的最後回覆訊息日期

    Example: 顯示會員最後回覆訊息日期
      Given 系統中存在會員「李四」，最後回覆訊息日期為「2025/01/18 09:45」
      When 行銷人員查看會員資料
      Then 系統顯示該會員最後回覆訊息日期「2025/01/18 09:45」

  Rule: 內部人員可新增備註，註記該會員的消費習慣與喜好

    Example: 新增會員備註
      Given 系統中存在會員「王五」
      When 內部人員為會員「王五」新增備註「偏好商務房型，常於週末入住」
      Then 系統記錄該會員備註「偏好商務房型，常於週末入住」
