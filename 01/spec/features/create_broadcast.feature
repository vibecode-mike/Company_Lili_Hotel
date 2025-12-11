Feature: 建立訊息推播
  作為一位行銷人員
  我希望建立訊息並支援排程推播,同時能夠精準鎖定目標受眾並提前預估發送配額
  以便高效部署和管理我的品牌行銷活動

  Rule: 支援兩種模板來源：從模板庫選擇或建立新模板

    Example: 選擇模板來源選項
      Given 行銷人員正在建立群發訊息
      When 行銷人員查看模板來源選項
      Then 系統顯示兩個選項
        | 選項         | 描述                   |
        | 從模板庫選擇 | 選擇既有模板快速起步   |
        | 建立新模板   | 從空白開始設計全新模板 |

    Example: 模板來源選擇後無法更改
      Given 行銷人員已選擇「從模板庫選擇」
      And 已選定模板「春節促銷」
      When 行銷人員嘗試切換至「建立新模板」
      Then 系統顯示警告訊息「模板來源選定後無法更改,請重新建立群發訊息」
      And 系統阻止切換操作

    Example: 從建立新模板切換到從模板庫選擇被阻止
      Given 行銷人員已選擇「建立新模板」
      And 已開始編輯模板內容
      When 行銷人員嘗試切換至「從模板庫選擇」
      Then 系統顯示警告訊息「模板來源選定後無法更改,請重新建立群發訊息」
      And 系統阻止切換操作
      And 保持當前編輯狀態

  Rule: 從模板庫選擇既有模板（複製機制）

    Example: 從模板庫選擇模板
      Given 行銷人員選擇「從模板庫選擇」
      And 模板庫中存在模板「春節促銷」（is_in_library = true）
      When 行銷人員選擇模板「春節促銷」
      Then 系統複製模板「春節促銷」建立新 MessageTemplate 記錄
      And 系統記錄 source_template_id 為原始模板ID
      And 系統將原始模板的 usage_count 累加 1
      And 新模板 is_in_library 預設為 false（僅限該群發使用）

    Example: 複製後可獨立編輯
      Given 行銷人員從模板庫選擇模板「春節促銷」並複製
      When 行銷人員編輯新模板的標題為「端午特惠」
      Then 系統更新新模板的標題為「端午特惠」
      And 原始模板「春節促銷」保持不變
      And 其他使用原始模板的群發不受影響

    Example: 複製模板時保留所有內容
      Given 行銷人員選擇「從模板庫選擇」
      And 模板庫中存在模板「夏日促銷」包含標題、圖片、按鈕
      When 行銷人員選擇模板「夏日促銷」
      Then 系統複製所有內容至新模板
      And 新模板的 template_type、image_url、title、button_count 與原模板相同

  Rule: 建立新模板（從空白開始）

    Example: 從空白建立新模板
      Given 行銷人員選擇「建立新模板」
      When 行銷人員在配置區填寫欄位
      Then 系統建立新 MessageTemplate 記錄
      And source_template_id 為 NULL（從空白建立）
      And is_in_library 預設為 false

    Example: 空白模板允許所有欄位為空
      Given 行銷人員選擇「建立新模板」
      When 行銷人員未填寫任何欄位
      Then 系統允許建立空白模板
      And 所有內容欄位為 NULL

    Example: 新建模板獨立於模板庫
      Given 行銷人員選擇「建立新模板」
      When 行銷人員填寫模板內容並完成設定
      Then 系統建立新 MessageTemplate 記錄
      And is_in_library 預設為 false
      And 該模板不會自動顯示在模板庫
      And 僅限該群發訊息使用

  Rule: 建立群發時可選擇是否將模板加入模板庫

    Example: 將新建模板加入模板庫
      Given 行銷人員完成群發訊息設定
      And 該模板為新建或從模板庫複製而來
      When 行銷人員勾選「將此模板加入模板庫」
      And 輸入模板名稱「端午特惠」
      Then 系統設定 is_in_library = true
      And 系統設定 template_name = 「端午特惠」
      And 該模板會顯示在模板庫供未來選擇

    Example: 不加入模板庫
      Given 行銷人員完成群發訊息設定
      When 行銷人員未勾選「將此模板加入模板庫」
      Then 系統設定 is_in_library = false
      And 該模板僅限該群發使用,不會顯示在模板庫

    Example: 加入模板庫需填寫模板名稱
      Given 行銷人員完成群發訊息設定
      When 行銷人員勾選「將此模板加入模板庫」
      But 未填寫模板名稱
      Then 系統顯示驗證錯誤「請輸入模板名稱」
      And 拒絕加入模板庫

  Rule: 模板庫顯示與篩選

    Example: 模板庫只顯示已加入的模板
      Given 系統中存在以下模板
        | template_name | is_in_library |
        | 春節促銷      | true          |
        | 端午特惠      | true          |
        | 臨時活動      | false         |
      When 行銷人員開啟模板庫
      Then 系統顯示以下模板
        | template_name |
        | 春節促銷      |
        | 端午特惠      |
      And 不顯示「臨時活動」（is_in_library = false）

    Example: 模板庫按使用次數排序（熱門優先）
      Given 模板庫中存在以下模板
        | template_name | usage_count |
        | 春節促銷      | 15          |
        | 新會員歡迎    | 8           |
        | VIP專屬       | 23          |
      When 行銷人員開啟模板庫並選擇「熱門優先」排序
      Then 系統依序顯示
        | 排序 | template_name | usage_count |
        | 1    | VIP專屬       | 23          |
        | 2    | 春節促銷      | 15          |
        | 3    | 新會員歡迎    | 8           |

    Example: 模板庫按建立時間排序（最新優先）
      Given 模板庫中存在以下模板
        | template_name | created_at      |
        | 春節促銷      | 2025/01/15 10:00|
        | 端午特惠      | 2025/05/20 14:30|
        | 雙十活動      | 2025/10/05 09:15|
      When 行銷人員開啟模板庫並選擇「最新優先」排序
      Then 系統依序顯示
        | 排序 | template_name | created_at      |
        | 1    | 雙十活動      | 2025/10/05 09:15|
        | 2    | 端午特惠      | 2025/05/20 14:30|
        | 3    | 春節促銷      | 2025/01/15 10:00|

    Example: 模板庫搜尋功能
      Given 模板庫中存在模板「春節促銷」、「春節限定」、「端午特惠」
      When 行銷人員在搜尋框輸入「春節」
      Then 系統顯示包含「春節」的模板
        | template_name |
        | 春節促銷      |
        | 春節限定      |
      And 不顯示「端午特惠」

    Example: 模板庫空狀態顯示
      Given 模板庫中不存在任何模板（is_in_library = true 的模板數量為 0）
      When 行銷人員開啟模板庫
      Then 系統顯示「尚無模板,立即建立第一個模板」提示
      And 顯示「建立新模板」按鈕

  Rule: 訊息發送之前,支援訊息效果的即時模擬與預覽功能

    Example: 前端模擬即時預覽訊息內容
      Given 行銷人員正在建立群發訊息
      And 該模板於配置區設定為圖卡按鈕型,預覽區即時顯示對應視覺效果
      When 行銷人員輸入標題「春節優惠」、內文「限時特惠中」、金額「3999」
      Then 系統使用 LINE Simulator 在網頁上即時渲染預覽
      And 預覽區顯示標題「春節優惠」、內文「限時特惠中」、金額「NT$ 3,999」

    Example: 前端模擬預覽輪播圖卡切換效果
      Given 行銷人員正在建立群發訊息
      And 已新增 3 張輪播圖卡
      When 行銷人員切換至第 2 張圖卡
      Then 系統使用 LINE Simulator 即時渲染第 2 張圖卡的內容
      And 預覽區可手動滾動查看所有圖卡

    Example: 預覽區自動更新內容
      Given 行銷人員正在編輯訊息模板
      And 預覽區顯示當前內容
      When 行銷人員修改標題為「雙十優惠」
      Then 預覽區即時更新顯示新標題「雙十優惠」
      And 無需手動重新整理

  Rule: 必須能夠選擇傳送對象：所有好友

    Example: 選擇傳送對象為所有好友
      Given 行銷人員正在建立群發訊息
      When 行銷人員選擇傳送對象「所有好友」
      Then 系統設定傳送對象為「所有好友」

    Example: 選擇所有好友時顯示好友總數
      Given 行銷人員正在建立群發訊息
      And 系統中有 1500 位 LINE 好友（is_following = true）
      When 行銷人員選擇傳送對象「所有好友」
      Then 系統顯示預計發送人數「1500」

    Example: 所有好友不包含已封鎖或退追的用戶
      Given 行銷人員正在建立群發訊息
      And 系統中有 2000 位會員記錄
      And 其中 1800 位 is_following = true（LINE 好友）
      And 其中 200 位 is_following = false（已封鎖或退追）
      When 行銷人員選擇傳送對象「所有好友」
      Then 系統顯示預計發送人數「1800」
      And 系統不會發送給 is_following = false 的會員

  Rule: 必須能夠選擇傳送對象：篩選目標對象

    Example: 選擇傳送對象為篩選目標對象
      Given 行銷人員正在建立群發訊息
      When 行銷人員選擇傳送對象「篩選目標對象」
      Then 系統設定傳送對象為「篩選目標對象」

    Example: 選擇篩選目標對象時顯示篩選設定區
      Given 行銷人員正在建立群發訊息
      When 行銷人員選擇傳送對象「篩選目標對象」
      Then 系統顯示「包含標籤」篩選條件設定區
      And 系統顯示「排除標籤」篩選條件設定區

    Example: 從所有好友切換至篩選目標對象
      Given 行銷人員已選擇傳送對象「所有好友」
      And 預計發送人數為 1500 人
      When 行銷人員切換至「篩選目標對象」
      Then 系統顯示篩選條件設定區
      And 預計發送人數更新為 0（尚未設定篩選條件）
      And 系統提示「請設定篩選條件」

  Rule: 篩選目標對象依據會員標籤進行篩選

    Example: 依會員標籤篩選目標對象
      Given 行銷人員正在建立群發訊息
      And 系統中存在會員標籤「VIP」
      When 行銷人員篩選會員標籤「VIP」
      Then 系統篩選擁有標籤「VIP」的會員作為目標對象

    Example: 篩選時即時顯示符合人數
      Given 行銷人員正在建立群發訊息
      And 系統中有 200 位會員擁有標籤「VIP」
      When 行銷人員篩選會員標籤「VIP」
      Then 系統即時顯示符合條件人數「200」

    Example: 篩選不存在的標籤顯示 0 人
      Given 行銷人員正在建立群發訊息
      When 行銷人員篩選會員標籤「測試標籤」
      And 系統中無會員擁有標籤「測試標籤」
      Then 系統即時顯示符合條件人數「0」
      And 系統提示「無符合條件的會員」

  Rule: 篩選條件組合邏輯：包含條件（AND）+ 排除條件（AND NOT）

    Example: 包含多個標籤的 AND 邏輯
      Given 行銷人員正在建立群發訊息
      When 行銷人員設定篩選條件「包含標籤：VIP, 台北市」
      Then 系統篩選同時擁有標籤「VIP」和「台北市」的會員（AND 邏輯）

    Example: 包含條件 + 排除條件的組合
      Given 行銷人員正在建立群發訊息
      When 行銷人員設定篩選條件「包含標籤：VIP, 台北市」「排除標籤：黑名單, 已發送」
      Then 系統篩選同時擁有「VIP」和「台北市」但不擁有「黑名單」和「已發送」的會員

    Example: 僅排除條件
      Given 行銷人員正在建立群發訊息
      When 行銷人員設定篩選條件「排除標籤：黑名單」
      Then 系統篩選不擁有標籤「黑名單」的所有會員

    Example: 多個包含條件的 AND 邏輯
      Given 行銷人員正在建立群發訊息
      When 行銷人員設定篩選條件「包含標籤：26-35歲, 女性, 台北市」
      Then 系統篩選同時擁有標籤「26-35歲」、「女性」、「台北市」的會員（三個條件全部 AND）

    Example: 複雜篩選條件組合
      Given 行銷人員正在建立群發訊息
      When 行銷人員設定篩選條件「包含標籤：VIP, 26-35歲」「排除標籤：黑名單, 已退房, 已發送春節優惠」
      Then 系統篩選同時擁有「VIP」和「26-35歲」但不擁有「黑名單」、「已退房」、「已發送春節優惠」的會員

  Rule: 會員標籤資料來源為問卷系統,包含生日月份

    Example: 依生日月份篩選會員
      Given 行銷人員正在建立群發訊息
      When 行銷人員篩選生日月份「8月」
      Then 系統篩選生日月份為「8月」的會員

    Example: 生日月份選項顯示 1-12 月
      Given 行銷人員正在選擇生日月份篩選條件
      When 行銷人員查看生日月份選項
      Then 系統顯示 12 個月份選項：1月、2月、3月、4月、5月、6月、7月、8月、9月、10月、11月、12月

    Example: 同時篩選多個生日月份（壽星活動）
      Given 行銷人員正在建立群發訊息
      And 系統中有 80 位會員生日月份為「8月」
      And 系統中有 65 位會員生日月份為「9月」
      When 行銷人員篩選生日月份「8月」和「9月」
      Then 系統篩選生日月份為「8月」或「9月」的會員（OR 邏輯）
      And 系統即時顯示符合條件人數「145」

  Rule: 會員標籤資料來源為問卷系統,包含年齡區間

    Example: 依年齡區間篩選會員
      Given 行銷人員正在建立群發訊息
      When 行銷人員篩選年齡區間「26-35 歲」
      Then 系統篩選年齡區間為「26-35 歲」的會員

    Example: 年齡區間選項顯示
      Given 行銷人員正在選擇年齡區間篩選條件
      When 行銷人員查看年齡區間選項
      Then 系統顯示年齡區間選項：18 歲以下、18-25 歲、26-35 歲、36-45 歲、46-55 歲、56 歲以上

    Example: 篩選多個年齡區間（青壯年族群）
      Given 行銷人員正在建立群發訊息
      And 系統中有 150 位會員年齡區間為「26-35 歲」
      And 系統中有 120 位會員年齡區間為「36-45 歲」
      When 行銷人員篩選年齡區間「26-35 歲」和「36-45 歲」
      Then 系統篩選年齡區間為「26-35 歲」或「36-45 歲」的會員（OR 邏輯）
      And 系統即時顯示符合條件人數「270」

  Rule: 會員標籤資料來源為問卷系統,包含居住地區（限制為台灣 22 縣市）

    Example: 依居住地區篩選會員
      Given 行銷人員正在建立群發訊息
      When 行銷人員篩選居住地區「台北市」
      Then 系統篩選居住地區為「台北市」的會員
      And 地區選項限制為台灣 22 縣市標準名稱

    Example: 地區篩選值域限制
      Given 行銷人員正在選擇居住地區篩選條件
      When 行銷人員查看可用的地區選項
      Then 系統顯示 22 個台灣縣市選項
      And 選項包含：台北市、新北市、桃園市、台中市、台南市、高雄市、基隆市、新竹市、嘉義市、新竹縣、苗栗縣、彰化縣、南投縣、雲林縣、嘉義縣、屏東縣、宜蘭縣、花蓮縣、台東縣、澎湖縣、金門縣、連江縣

    Example: 篩選多個地區（北部區域行銷）
      Given 行銷人員正在建立群發訊息
      And 系統中有 300 位會員居住地區為「台北市」
      And 系統中有 250 位會員居住地區為「新北市」
      And 系統中有 180 位會員居住地區為「桃園市」
      When 行銷人員篩選居住地區「台北市」、「新北市」、「桃園市」
      Then 系統篩選居住地區為「台北市」或「新北市」或「桃園市」的會員（OR 邏輯）
      And 系統即時顯示符合條件人數「730」

  Rule: 會員標籤資料來源為問卷系統,包含性別

    Example: 依性別篩選會員
      Given 行銷人員正在建立群發訊息
      When 行銷人員篩選性別「女」
      Then 系統篩選性別為「女」的會員

    Example: 性別選項顯示
      Given 行銷人員正在選擇性別篩選條件
      When 行銷人員查看性別選項
      Then 系統顯示性別選項：男、女

    Example: 性別與其他條件組合篩選（女性 VIP 會員）
      Given 行銷人員正在建立群發訊息
      And 系統中有 300 位女性會員
      And 其中 80 位同時擁有「VIP」標籤
      When 行銷人員設定篩選條件「包含標籤：女, VIP」
      Then 系統篩選同時為女性且擁有「VIP」標籤的會員（AND 邏輯）
      And 系統即時顯示符合條件人數「80」

  Rule: 會員標籤資料來源為後台建立自訂標籤

    Example: 依後台自訂標籤篩選會員
      Given 行銷人員正在建立群發訊息
      And 系統中存在後台自訂標籤「潛在客戶」
      When 行銷人員篩選標籤「潛在客戶」
      Then 系統篩選擁有標籤「潛在客戶」的會員

    Example: 自訂標籤與系統標籤混合篩選
      Given 行銷人員正在建立群發訊息
      And 系統中存在自訂標籤「潛在客戶」和系統標籤「26-35歲」
      When 行銷人員設定篩選條件「包含標籤：潛在客戶, 26-35歲」
      Then 系統篩選同時擁有自訂標籤「潛在客戶」和系統標籤「26-35歲」的會員

    Example: 自訂標籤刪除後篩選失效
      Given 行銷人員正在建立群發訊息
      And 系統中原有自訂標籤「測試標籤」
      And 該標籤已被刪除
      When 行銷人員嘗試篩選會員標籤「測試標籤」
      Then 系統顯示錯誤訊息「標籤『測試標籤』不存在」
      And 系統無法完成篩選
      And 符合條件人數顯示為 0

  Rule: 使用者能夠選擇立即傳送

    Example: 選擇立即傳送訊息
      Given 行銷人員已完成群發訊息設定
      When 行銷人員選擇「立即傳送」
      Then 系統立即發送訊息

    Example: 立即傳送時 scheduled_datetime_utc 為 NULL
      Given 行銷人員已完成群發訊息設定
      When 行銷人員選擇「立即傳送」
      Then 系統設定 scheduled_datetime_utc 為 NULL
      And 系統設定 send_status 為「sending」

    Example: 立即傳送配額充足時成功發送
      Given 行銷人員已完成群發訊息設定
      And 預計發送好友人數為 800 人
      And 可用訊息配額為 1000 則
      When 行銷人員選擇「立即傳送」
      Then 系統立即執行發送
      And 系統設定 send_status 為「sending」
      And 系統開始逐一發送訊息給 800 位會員

  Rule: 使用者能夠選擇於指定日期與時間進行排程傳送（以台灣時區 UTC+8 顯示,後端以 UTC 儲存,台灣無夏令時無需特別處理；不依管理員瀏覽器時區轉換）

    Example: 前端即時驗證排程時間不可為過去時間
      Given 行銷人員正在設定排程時間
      And 當前台灣時間為「2025/02/01 10:00」
      When 行銷人員嘗試選擇排程時間為「2025/02/01 09:59」（過去時間）
      Then 前端日期時間選擇器限制不可選擇過去時間
      And 系統阻止使用者選擇過去日期或時間

    Example: 選擇台灣時間排程,系統轉換為 UTC 儲存
      Given 行銷人員已完成群發訊息設定
      When 行銷人員選擇排程於台灣時間「2025/02/01 10:00」傳送
      Then 前端計算 UTC 時間為「2025-02-01T02:00:00Z」（台灣時間 -8 小時）
      And 系統儲存 scheduled_datetime_utc 為「2025-02-01T02:00:00Z」
      And 前端顯示給使用者的排程時間為「2025/02/01 10:00」（台灣時間）

    Example: 不依管理員瀏覽器時區轉換
      Given 行銷人員位於美國（瀏覽器時區 UTC-5）
      When 行銷人員設定排程時間為「2025/02/01 10:00」
      Then 前端仍以台灣時間 UTC+8 顯示「2025/02/01 10:00」
      And 系統轉換並儲存 UTC 時間為「2025-02-01T02:00:00Z」
      And 前端不依瀏覽器時區自動轉換顯示

    Example: 顯示既有排程時轉換回台灣時間
      Given 系統儲存的排程時間為「2025-02-01T02:00:00Z」（UTC）
      When 行銷人員查看該排程訊息
      Then 前端從 UTC 轉換為台灣時間（+8 小時）
      And 前端顯示排程時間為「2025/02/01 10:00」（台灣時間）

    Example: 排程時間跨日轉換正確性
      Given 行銷人員選擇排程於台灣時間「2025/02/01 02:00」傳送
      When 系統轉換為 UTC 時間
      Then 系統儲存 scheduled_datetime_utc 為「2025-01-31T18:00:00Z」（前一日 UTC 時間）

  Rule: 後端排程任務以 UTC 時間為基準觸發發送

    Example: 排程時間已到,觸發發送
      Given 系統儲存的排程時間為「2025-02-01T02:00:00Z」（UTC）
      And 當前 UTC 時間為「2025-02-01T02:00:00Z」
      When 排程任務檢查待發送訊息
      Then 系統觸發該訊息發送
      And 更新 send_status 為「已發送」

    Example: 排程時間未到,不觸發發送
      Given 系統儲存的排程時間為「2025-02-01T02:00:00Z」（UTC）
      And 當前 UTC 時間為「2025-02-01T01:59:59Z」
      When 排程任務檢查待發送訊息
      Then 系統不觸發該訊息發送
      And send_status 保持為「排程發送」

    Example: 排程時間已過,立即觸發
      Given 系統儲存的排程時間為「2025-02-01T02:00:00Z」（UTC）
      And 當前 UTC 時間為「2025-02-01T02:05:00Z」（已過排程時間 5 分鐘）
      When 排程任務檢查待發送訊息
      Then 系統立即觸發該訊息發送
      And 更新 send_status 為「已發送」

    Example: 排程檢查頻率為每分鐘一次
      Given 排程任務設定為每分鐘檢查一次
      When 當前時間為「2025-02-01T02:00:30Z」
      Then 系統在該分鐘內檢查所有待發送訊息
      And 觸發所有 scheduled_datetime_utc <= 當前時間的訊息

  Rule: 支援取消排程發送,無時間限制

    Example: 取消排程發送
      Given 訊息的 send_status 為「排程發送」
      And 排程發送時間為「2025/02/01 10:00」
      When 行銷人員點擊「取消排程」
      Then 系統將 send_status 從「排程發送」改為「草稿」
      And 保留所有訊息資料（message_content, scheduled_datetime_utc, target_filter, template_id 等）
      And 訊息狀態變為可編輯

    Example: 發送前任何時間都可取消
      Given 訊息的 send_status 為「排程發送」
      And 排程發送時間為「2025/02/01 10:00」
      And 當前時間為「2025/02/01 09:59」（發送前 1 分鐘）
      When 行銷人員點擊「取消排程」
      Then 系統允許取消
      And 系統將 send_status 改為「草稿」

    Example: 取消後可重新編輯並再次排程
      Given 訊息原為「排程發送」狀態,已取消改為「草稿」
      When 行銷人員編輯訊息內容並調整排程時間
      Then 系統允許重新設定排程
      And 可再次將 send_status 設為「排程發送」

    Example: 已發送的訊息無法取消
      Given 訊息的 send_status 為「已發送」
      When 行銷人員嘗試取消訊息
      Then 系統拒絕操作,顯示錯誤訊息「已發送的訊息無法取消」

  Rule: include / exclude 篩選模式支援同時使用

    Example: 同時使用 include 和 exclude 標籤
      Given 行銷人員在設定篩選條件
      When 使用者選擇「包含指定標籤（include）」：「VIP會員」
      And 使用者同時選擇「排除指定標籤（exclude）」：「黑名單」
      Then target_filter 同時包含 include 和 exclude 陣列
      And 系統發送對象為「符合 VIP會員 標籤」且「不符合 黑名單 標籤」的會員
      And 篩選邏輯為：(符合 include 標籤) AND NOT (符合 exclude 標籤)

    Example: 僅使用 include 標籤
      Given 行銷人員在設定篩選條件
      When 使用者僅選擇「包含指定標籤（include）」：「VIP會員」
      Then target_filter 僅包含 include 陣列
      And 系統發送對象為所有符合「VIP會員」標籤的會員

    Example: 僅使用 exclude 標籤
      Given 行銷人員在設定篩選條件
      When 使用者僅選擇「排除指定標籤（exclude）」：「黑名單」
      Then target_filter 僅包含 exclude 陣列
      And 系統發送對象為所有不符合「黑名單」標籤的會員

    Example: 至少需要選擇一種篩選條件
      Given 行銷人員尚未選擇任何標籤
      When 行銷人員嘗試儲存設定
      Then 前端要求使用者至少選擇 include 或 exclude 標籤

  Rule: 在確認發送前,系統必須顯示此次訊息的預計發送好友人數

    Example: 顯示預計發送好友人數
      Given 行銷人員已完成群發訊息設定
      And 符合篩選條件的會員共 500 人
      When 行銷人員準備確認發送
      Then 系統顯示預計發送好友人數「500」

    Example: 篩選條件變更時即時更新人數
      Given 行銷人員正在設定篩選條件
      And 當前篩選條件符合 500 人
      When 行銷人員新增篩選條件「排除標籤：黑名單」
      Then 系統即時更新顯示預計發送好友人數「450」

    Example: 預計發送人數在確認發送前顯眼提示
      Given 行銷人員已完成群發訊息設定
      And 預計發送好友人數為 1200 人
      When 行銷人員準備點擊「發送」按鈕
      Then 系統在發送按鈕旁顯示「預計發送 1200 人」
      And 使用醒目顏色或圖標標示
      And 提供最後確認機會

  Rule: 在確認發送前,系統必須顯示當前可用訊息的配額用量

    Example: 顯示可用訊息配額用量
      Given 行銷人員已完成群發訊息設定
      And 當前可用訊息配額為 1000 則
      When 行銷人員準備確認發送
      Then 系統顯示可用訊息配額「1000」

    Example: 配額顯示為動態即時資料
      Given 行銷人員正在建立群發訊息
      And 當前可用訊息配額為 1000 則
      When 其他管理員發送群發訊息消耗 200 則配額
      Then 系統即時更新顯示可用訊息配額「800」

    Example: 配額顯示包含使用百分比
      Given 行銷人員已完成群發訊息設定
      And LINE API 總配額為 5000 則
      And 已使用 3500 則
      And 可用訊息配額為 1500 則
      When 行銷人員準備確認發送
      Then 系統顯示可用訊息配額「1500」
      And 系統顯示配額使用率「已使用 70%（3500/5000）」
      And 提供配額管理建議

  Rule: 若可用訊息的配額用量小於預計發送的好友人數,前端禁用發送按鈕並阻擋發送行為

    Example: 配額不足時前端禁用發送按鈕
      Given 行銷人員已完成群發訊息設定
      And 預計發送好友人數為 1500 人
      And 可用訊息配額為 1000 則
      When 系統檢查配額
      Then 前端禁用「發送」按鈕（disabled）
      And 前端顯示提示「訊息配額不足（需要 1500 則,可用 1000 則）,無法發送」

    Example: 配額不足時後端阻擋發送
      Given 行銷人員已完成群發訊息設定
      And 預計發送好友人數為 1500 人
      And 可用訊息配額為 1000 則
      When 行銷人員嘗試繞過前端限制確認發送
      Then 後端驗證失敗
      And 操作失敗
      And 系統回傳錯誤「訊息配額不足,無法發送」

    Example: 配額不足時禁止建立訊息記錄
      Given 行銷人員點擊「立即發送」建立群發訊息
      And 預計發送好友人數為 1500 人
      And 可用訊息配額為 1000 則
      When 後端檢查配額
      Then 後端回傳錯誤「訊息配額不足,未建立訊息」
      And 系統不建立 Message 記錄
      And 系統不建立任何排程工作

    Example: 配額充足時發送按鈕正常啟用
      Given 行銷人員已完成群發訊息設定
      And 預計發送好友人數為 800 人
      And 可用訊息配額為 1000 則
      When 系統檢查配額
      Then 前端啟用「發送」按鈕
      And 行銷人員可正常點擊發送

    Example: 配額剛好等於發送人數時可發送
      Given 行銷人員已完成群發訊息設定
      And 預計發送好友人數為 1000 人
      And 可用訊息配額為 1000 則
      When 系統檢查配額
      Then 前端啟用「發送」按鈕
      And 行銷人員可正常點擊發送

  Rule: 若目標對象為 0 人,前端禁用發送按鈕並阻擋發送行為,但允許儲存草稿

    Example: 目標對象為 0 人時前端禁用發送按鈕
      Given 行銷人員已完成群發訊息設定
      And 傳送對象設定為「篩選受眾」
      And 篩選條件為「包含標籤：VIP 會員」AND「包含標籤：已退房」
      And 預計發送好友人數為 0 人（無人同時符合兩個標籤）
      When 系統檢查目標對象
      Then 前端禁用「發送」按鈕（disabled）
      And 前端顯示提示「目標對象為 0 人,無法發送。請調整篩選條件。」
      And 前端啟用「儲存草稿」按鈕（允許儲存草稿）

    Example: 目標對象為 0 人時後端阻擋發送
      Given 行銷人員已完成群發訊息設定
      And 預計發送好友人數為 0 人
      When 行銷人員嘗試繞過前端限制確認發送
      Then 後端驗證失敗
      And 操作失敗
      And 系統回傳錯誤「目標對象為 0 人,無法發送」

    Example: 目標對象為 0 人時允許儲存草稿
      Given 行銷人員已完成群發訊息設定
      And 傳送對象設定為「篩選受眾」
      And 篩選條件為「包含標籤：測試標籤」
      And 預計發送好友人數為 0 人
      When 行銷人員點擊「儲存草稿」
      Then 系統成功儲存草稿
      And Message.send_status 設為「draft」
      And Message.estimated_send_count 記錄為 0
      And 系統顯示提示「草稿已儲存,目標對象為 0 人,發送前請調整篩選條件」

    Example: 調整篩選條件後目標對象 > 0 人,發送按鈕啟用
      Given 行銷人員開啟草稿訊息
      And 原篩選條件的預計發送人數為 0 人
      When 行銷人員修改篩選條件為「包含標籤：所有會員」
      And 預計發送好友人數變更為 500 人
      And 可用訊息配額充足
      Then 前端啟用「發送」按鈕
      And 行銷人員可正常發送訊息

    Example: 傳送對象為「所有好友」時不可能為 0 人
      Given 行銷人員已完成群發訊息設定
      And 傳送對象設定為「所有好友」
      And 系統中至少有 1 位 LINE 好友（is_following = true）
      When 系統檢查目標對象
      Then 預計發送好友人數 >= 1
      And 前端啟用「發送」按鈕
      And 系統不顯示「目標對象為 0 人」提示

  Rule: 當編輯到一半,離開視窗則彈窗提示

    Example: 任何欄位變更後離開視窗觸發提示
      Given 行銷人員正在建立群發訊息
      And 行銷人員已修改任一欄位（如訊息模板、傳送對象、排程時間等）
      And 變更尚未儲存為草稿或發送
      When 行銷人員嘗試離開視窗（關閉分頁或跳轉至其他頁面）
      Then 系統顯示彈窗提示「您有未儲存的變更,確定要離開嗎？」
      And 使用者可選擇「留在此頁」或「離開」

    Example: 未修改任何欄位時離開視窗不觸發提示
      Given 行銷人員開啟建立群發訊息頁面
      And 尚未修改任何欄位
      When 行銷人員嘗試離開視窗
      Then 系統不顯示彈窗提示
      And 直接離開頁面

    Example: 儲存草稿後離開不觸發提示
      Given 行銷人員正在建立群發訊息
      And 已修改欄位並儲存為草稿
      When 行銷人員嘗試離開視窗
      Then 系統不顯示彈窗提示
      And 直接離開頁面

  Rule: 可以將未完成設定的群發訊息儲存為草稿（必須已選擇模板）

    Example: 儲存群發訊息為草稿（已選擇模板但內容未填）
      Given 行銷人員選擇「建立新模板」
      And MessageTemplate 記錄已建立（template_id 存在）
      But 尚未填寫任何內容欄位（text_content, image_url, title 等皆為空）
      When 行銷人員選擇「儲存為草稿」
      Then 系統將訊息儲存為草稿（send_status = 草稿）
      And 系統保留 Message 與 MessageTemplate 的 1:1 關聯
      And 草稿清單顯示「空白模板」

    Example: 儲存群發訊息為草稿（從模板庫選擇但未完成設定）
      Given 行銷人員從模板庫選擇模板「春節促銷」並複製
      And 已修改部分內容（如標題改為「端午優惠」）
      But 尚未設定發送對象與排程時間
      When 行銷人員選擇「儲存為草稿」
      Then 系統將訊息儲存為草稿
      And 已填寫的內容（標題、圖片等）保留在 MessageTemplate
      And 未填寫的欄位保持空值

    Example: 未選擇模板無法儲存草稿
      Given 行銷人員進入群發訊息建立頁面
      But 尚未選擇「從模板庫選擇」或「建立新模板」
      When 行銷人員選擇「儲存為草稿」
      Then 系統顯示錯誤訊息「請先選擇模板來源」
      And 不允許儲存草稿

  Rule: 儲存的草稿支援隨時可開啟編輯

    Example: 開啟草稿編輯
      Given 系統中存在訊息草稿「春節優惠」
      And 該草稿關聯的 MessageTemplate 包含部分內容
      When 行銷人員開啟草稿「春節優惠」進行編輯
      Then 系統載入草稿「春節優惠」的所有設定內容
      And 系統載入 MessageTemplate 的所有欄位（包含已填與空白欄位）
      And 行銷人員可繼續編輯並再次儲存

    Example: 開啟空白草稿編輯
      Given 系統中存在草稿,關聯的 MessageTemplate 內容完全空白
      When 行銷人員開啟該草稿進行編輯
      Then 系統載入空白模板
      And 行銷人員可從頭開始填寫內容

    Example: 草稿清單顯示草稿資訊
      Given 系統中存在以下草稿
        | 草稿名稱   | 建立時間         | 發送對象     |
        | 春節優惠   | 2025/01/15 10:00 | 篩選受眾     |
        | 端午特惠   | 2025/05/20 14:30 | 所有好友     |
      When 行銷人員查看草稿清單
      Then 系統顯示所有草稿及其資訊

  Rule: 多位管理員同時編輯同一草稿時採用後寫覆蓋策略（Last Write Wins）

    Example: 多位管理員同時編輯草稿,後儲存者覆蓋前者變更
      Given 系統中存在訊息草稿「春節優惠」,標題為「原始標題」
      And 管理員 A 於「10:00:00」開啟草稿進行編輯
      And 管理員 B 於「10:00:05」同時開啟同一草稿進行編輯
      When 管理員 A 於「10:02:00」將標題修改為「春節特惠」並儲存
      And 管理員 B 於「10:03:00」將標題修改為「新年優惠」並儲存
      Then 系統儲存的最終標題為「新年優惠」
      And 管理員 A 的變更「春節特惠」被覆蓋
      And 系統不顯示衝突警告或版本控制提示

    Example: 後寫覆蓋不影響其他草稿的編輯
      Given 系統中存在兩則草稿「春節優惠」與「端午促銷」
      And 管理員 A 正在編輯「春節優惠」
      And 管理員 B 正在編輯「端午促銷」
      When 管理員 A 儲存「春節優惠」
      And 管理員 B 儲存「端午促銷」
      Then 兩則草稿的變更皆正常儲存
      And 不發生任何覆蓋或衝突

    Example: 系統不提供編輯鎖定或衝突警告
      Given 系統採用後寫覆蓋策略（Last Write Wins）
      And 管理員 A 正在編輯草稿「春節優惠」
      When 管理員 B 同時開啟同一草稿進行編輯
      Then 系統允許兩位管理員同時編輯
      And 系統不顯示「其他管理員正在編輯」警告
      And 系統不鎖定草稿避免其他人編輯
      And 後儲存的管理員變更會覆蓋先儲存者

  Rule: 上傳圖片比例判斷與自動裁切機制

    Example: 僅上傳圖片,自動裁切（1:1）
      Given 行銷人員正在建立訊息模板
      And 僅勾選圖片欄位（未勾選任一欄位,如「標題」、「金額」、「按鈕」等）
      When 行銷人員上傳圖片「image.jpg」
      Then 系統判定顯示比例為正方形 1:1
      And 前端上傳圖片到後端
      And 後端計算裁切區域：取中心 900x900 正方形
      And 後端裁切圖片並儲存
      And 後端返回裁切後圖片 URL
      And 前端更新 image_url 為裁切後圖片 URL
      And 預覽區顯示裁切後圖片（正方形顯示）


    Example: 上傳圖片且勾選欄位,自動裁切（1.91:1）
      Given 行銷人員正在建立訊息模板
      And 勾選其一欄位（例如勾選「標題」、「金額」）
      When 行銷人員上傳圖片「image.jpg」
      Then 系統判定顯示比例為橫向長方形 1.91:1
      And 前端上傳圖片到後端
      And 後端計算裁切區域：取中心 1920x1005 橫向長方形
      And 後端裁切圖片並儲存
      And 後端返回裁切後圖片 URL
      And 前端更新 image_url 為裁切後圖片 URL
      And 預覽區顯示裁切後圖片（橫向長方形顯示）

    Example: 更換勾選欄位後自動重新裁切
      Given 行銷人員已上傳圖片並裁切為 1:1（僅圖片無其他欄位）
      When 行銷人員勾選「標題」欄位
      Then 系統自動觸發重新裁切流程
      And 後端將圖片重新裁切為 1.91:1
      And 預覽區更新顯示新裁切結果

  Rule: 圖片檔案大小限制為 1 MB

    Example: 上傳檔案大小超過 1 MB
      Given 行銷人員正在上傳圖片
      When 行銷人員選擇檔案大小為「1.5 MB」的圖片
      Then 前端顯示錯誤訊息「圖片檔案大小不可超過 1 MB」
      And 前端阻擋上傳操作

    Example: 上傳檔案大小符合限制
      Given 行銷人員正在上傳圖片
      When 行銷人員選擇檔案大小為「800 KB」的圖片
      Then 前端允許上傳
      And 後端接收並處理圖片

    Example: 檔案大小剛好 1 MB 可上傳
      Given 行銷人員正在上傳圖片
      When 行銷人員選擇檔案大小為「1 MB」的圖片
      Then 前端允許上傳
      And 後端接收並處理圖片


  Rule: 前端使用 CSS 模擬裁切預覽

    Example: 上傳前預覽模擬裁切效果
      Given 行銷人員選擇了橫向圖片「banner.jpg」
      When 前端顯示預覽
      Then 前端使用 CSS object-fit: cover 顯示圖片
      And 前端設定 object-position: center 取中心區域
      And 預覽區顯示正方形圖片（模擬裁切效果）
      And 預覽區顯示提示文字「預覽（實際發送時將裁切為正方形）」

    Example: 不同比例圖片的 CSS 模擬預覽
      Given 行銷人員選擇了直向圖片「portrait.jpg」（寬 1000px × 高 1500px）
      And 已勾選「標題」欄位（需要 1.91:1 比例）
      When 前端顯示預覽
      Then 前端使用 CSS object-fit: cover 取中心區域
      And 預覽區模擬顯示 1.91:1 橫向長方形裁切效果
      And 預覽區顯示提示「預覽（實際發送時將裁切為 1920x1005）」

    Example: 切換欄位後預覽即時更新
      Given 行銷人員已上傳圖片並顯示 1:1 預覽（僅圖片無其他欄位）
      When 行銷人員勾選「標題」欄位
      Then 預覽區即時切換為 1.91:1 比例模擬
      And CSS 自動更新裁切效果
      And 提示文字更新為「預覽（實際發送時將裁切為 1920x1005）」

  Rule: 前端上傳完成後重新載入實際裁切後圖片

    Example: 上傳完成後更新預覽為實際裁切圖
      Given 行銷人員已上傳圖片「banner.jpg」
      And 後端已完成裁切並返回 URL「https://cdn.com/cropped_banner.jpg」
      When 前端接收到後端返回的 URL
      Then 前端更新 image_url 為「https://cdn.com/cropped_banner.jpg」
      And 前端重新載入該 URL 的圖片顯示在預覽區
      And 預覽區顯示實際裁切後的圖片（100%準確）

    Example: 後端裁切失敗時前端顯示錯誤
      Given 行銷人員已上傳圖片「banner.jpg」
      When 後端裁切處理失敗（如圖片損壞、格式不支援）
      Then 後端返回錯誤訊息「圖片裁切失敗」
      And 前端顯示錯誤提示「圖片處理失敗,請重新上傳」
      And 清除預覽區的圖片
      And 允許重新上傳圖片

    Example: 上傳中顯示載入狀態
      Given 行銷人員已選擇圖片「banner.jpg」
      When 前端開始上傳並等待後端裁切
      Then 預覽區顯示載入動畫或進度指示
      And 提示「圖片上傳中...」
      When 後端完成裁切並返回 URL
      Then 載入動畫消失
      And 預覽區顯示實際裁切後的圖片

  Rule: 發送中狀態錯誤處理機制（方案 C + 自動建立失敗會員草稿）

    系統崩潰/中斷時的處理邏輯：
      - 原訊息標記為失敗（send_status = failed）
      - MessageDelivery 已成功的保留（delivery_status = delivered）
      - MessageDelivery 失敗的標記（delivery_status = failed）
      - 自動建立新草稿,包含失敗會員名單,方便手動重發

    Example: 發送中途系統崩潰 - 自動建立失敗會員草稿
      Given 系統正在發送訊息「春節優惠活動」給 1000 位會員
      And Message.send_status 為「sending」
      And MessageDelivery 已成功發送 500 筆（delivery_status = delivered）
      And MessageDelivery 剩餘 500 筆尚未發送
      When 系統突然崩潰（停電、伺服器當機、網路中斷）
      And 系統重啟後檢測到 Message.send_status = sending
      Then 系統執行錯誤恢復流程：
        1. 將原訊息「春節優惠活動」的 send_status 改為「failed」
        2. 將原訊息的 failure_reason 設為「發送中斷：系統崩潰」
        3. MessageDelivery 已成功的 500 筆保持「delivered」狀態
        4. MessageDelivery 尚未發送的 500 筆標記為「failed」
        5. 自動建立新 Message 記錄（草稿）：
           - send_status = draft
           - template_id = 原訊息的 template_id
           - message_content = 原訊息的 message_content（加上「[重發]」前綴）
           - target_type = filtered
           - target_filter = 失敗的 500 位會員 member_id 列表（JSON 格式）
           - created_at = 當前時間
      And 系統記錄新草稿的 message_id 至原訊息的備註
      And 前端顯示通知：「發送中斷：已成功 500 人,失敗 500 人。已自動建立草稿供重發」

    Example: 查看發送失敗的訊息詳情
      Given 訊息「春節優惠活動」的 send_status 為「failed」
      And failure_reason 為「發送中斷：系統崩潰」
      When 管理員查看訊息詳情
      Then 系統顯示以下資訊：
        | 項目           | 值                                    |
        | 發送狀態       | 失敗                                  |
        | 失敗原因       | 發送中斷：系統崩潰                    |
        | 已成功發送     | 500 人                                |
        | 發送失敗       | 500 人                                |
        | 自動建立草稿   | [重發] 春節優惠活動（500 人）         |
      And 系統提供「查看草稿」按鈕,點擊後跳轉至新建立的草稿

    Example: 編輯並重發失敗會員草稿
      Given 系統已自動建立草稿「[重發] 春節優惠活動」
      And 草稿的 target_filter 包含失敗的 500 位會員 member_id
      When 管理員開啟該草稿
      Then 系統顯示訊息編輯介面
      And 目標對象顯示「篩選目標對象（500 人）」
      And 管理員可編輯訊息內容（選填）
      When 管理員點擊「立即發送」或「排程發送」
      Then 系統僅發送給草稿中的 500 位失敗會員
      And 不會重複發送給原本已成功的 500 位會員

    Example: 網路錯誤導致部分發送失敗
      Given 系統正在發送訊息給 1000 位會員
      And 已成功發送 300 筆
      When 發生網路錯誤（LINE API 暫時無法連線）
      And 系統重試 3 次後仍無法恢復
      Then 系統標記原訊息為「failed」
      And failure_reason 設為「發送中斷：網路錯誤」
      And 已成功的 300 筆保持「delivered」
      And 失敗的 700 筆標記為「failed」
      And 自動建立草稿「[重發] 訊息名稱（700 人）」

    Example: 系統正常完成發送 - 不建立草稿
      Given 系統正在發送訊息給 1000 位會員
      When 系統順利完成所有 1000 筆發送
      Then Message.send_status 更新為「sent」
      And 所有 MessageDelivery 記錄為「delivered」
      And 系統不建立額外的草稿訊息

  Rule: LINE API 配額耗盡處理機制（方案 A：立即停止發送）

    系統處理邏輯：
      - 發送前已通過本地配額檢查（前端禁用按鈕 + 後端驗證）
      - 發送時 LINE API 回傳配額不足立即停止發送
      - 原訊息標記為 failed,已發送的保留,未發送的標記 failed
      - 不自動重試,避免重複發送風險

    Example: 發送時 LINE API 回傳配額不足 - 立即停止
      Given 系統正在發送訊息給 1000 位會員
      And 本地配額檢查已通過（預估配額充足）
      And 已成功發送 200 筆
      When LINE API 回傳錯誤「配額不足（quota exhausted）」
      Then 系統立即停止發送
      And 系統標記原訊息 send_status 為「failed」
      And 系統設定 failure_reason 為「LINE API 配額不足」
      And 已成功的 200 筆 MessageDelivery 保持「delivered」
      And 未發送的 800 筆 MessageDelivery 標記為「failed」
      And failure_reason 設為「配額不足」

    Example: 檢視配額不足的失敗訊息
      Given 訊息因 LINE API 配額不足而失敗
      When 行銷人員開啟訊息列表
      Then 系統顯示該訊息狀態為「發送失敗」
      And 顯示失敗原因「LINE API 配額不足」
      And 顯示已發送人數「200」與失敗人數「800」
      And 提供「檢視發送記錄」按鈕查看 MessageDelivery 詳情

    Example: 配額不足後需手動處理 - 不自動建立草稿
      Given 訊息因 LINE API 配額不足而失敗
      And 已發送 200 筆,失敗 800 筆
      When 行銷人員需要重新發送
      Then 行銷人員需手動建立新的群發訊息
      And 使用篩選條件排除已成功的 200 位會員
      And 系統不自動建立草稿（與系統崩潰情境不同）

    Example: LINE API 配額恢復後正常發送
      Given 前次訊息因配額不足失敗
      And LINE API 配額已恢復充足
      When 行銷人員建立新的群發訊息
      And 預計發送 500 人
      And 可用訊息配額為 1000 則
      Then 前端啟用「發送」按鈕
      And 系統正常發送訊息

  Rule: Campaign 關聯採用完全自由選擇策略，搭配 UI 智能建議

    設計決策：
      - v0 階段採用彈性設計，所有訊息都可自由選擇是否關聯 Campaign
      - 系統不強制任何類型的訊息必須關聯 Campaign
      - 透過 UI 智能建議引導使用者，但最終決定權在使用者
      - 獨立訊息與活動訊息在發送邏輯上無差異，僅在統計分析時有所區別

    Example: 建立訊息時可自由選擇是否關聯 Campaign
      Given 行銷人員正在建立群發訊息
      When 行銷人員開啟「訊息設定」頁面
      Then 系統顯示「Campaign（選填）」欄位
      And 提供下拉選單選擇既有 Campaign 或「建立新 Campaign」
      And 使用者可選擇關聯 Campaign 或留空（獨立訊息）
      And 無論選擇哪種方式，系統都允許繼續建立訊息

    Example: 獨立訊息（未關聯 Campaign）
      Given 行銷人員建立一則臨時公告訊息
      And 訊息內容為「系統將於今晚 22:00-23:00 進行維護」
      When 行銷人員選擇「不關聯 Campaign」
      And 點擊「發送」
      Then 系統建立 Message 記錄
        | campaign_id | NULL             |
        | message_content | 系統將於今晚... |
        | send_status | sent              |
      And 該訊息為獨立訊息，不納入任何活動統計

    Example: 活動訊息（關聯 Campaign）
      Given 行銷人員正在執行「2025 年終感恩季」活動
      And Campaign「2025 年終感恩季」已建立（campaign_id = "C001"）
      When 行銷人員建立第一波訊息「年終優惠通知」
      And 選擇關聯 Campaign「2025 年終感恩季」
      And 點擊「發送」
      Then 系統建立 Message 記錄
        | campaign_id | C001              |
        | message_content | 年終優惠通知... |
        | send_status | sent              |
      And 該訊息納入 Campaign「2025 年終感恩季」的統計分析

    Example: UI 智能建議：根據訊息內容建議關聯 Campaign
      Given 行銷人員輸入訊息內容包含關鍵字「活動」「促銷」「優惠」
      When 系統偵測到這些關鍵字
      Then 系統顯示智能建議提示「此訊息似乎屬於行銷活動，建議關聯 Campaign 以便追蹤成效」
      And 提供「建立新 Campaign」快捷按鈕
      But 使用者仍可選擇忽略建議，建立獨立訊息

    Example: 同一 Campaign 發送多波訊息，支援活動層級統計
      Given Campaign「2025 春節檔期」已建立
      And 已發送 3 則訊息關聯至該 Campaign
        | message_id | campaign_id | sent_count | opened_count |
        | M001       | C001        | 1000       | 600          |
        | M002       | C001        | 1200       | 700          |
        | M003       | C001        | 800        | 500          |
      When 行銷人員查看 Campaign「2025 春節檔期」的統計報表
      Then 系統聚合顯示活動層級統計
        | 總發送人次 | 3000（1000+1200+800） |
        | 總開啟人次 | 1800（600+700+500）   |
        | 平均開啟率 | 60%                   |
      And 同時顯示每則訊息的個別數據

    Example: 獨立訊息的統計方式
      Given 行銷人員建立 5 則獨立訊息（未關聯 Campaign）
      When 行銷人員查看「訊息列表」
      Then 系統顯示每則訊息的個別統計
      And 系統不提供活動層級的聚合統計
      And 行銷人員需逐則檢視訊息成效
