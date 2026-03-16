Feature: 官網 AI 聊天機器人訂房流程
  作為一位飯店訪客
  我希望透過官網 AI 聊天機器人查詢房況並完成訂房
  以便快速找到合適房型並跳轉至 PMS 付款頁面

  Background:
    說明:
      官網 AI 聊天機器人以瀏覽器為單位（browser_key）追蹤 Session。
      每個 Session 記憶對話輪數（上限 5 輪），超過則重置。
      測試階段 Session 存於記憶體，無活動 20 分鐘後自動清除。
      正式發布後，Webchat 訂房 Session 與相關資料需持久化到主專案 DB。
      關閉分頁或重新整理清除暫存的訂房資訊與會員資訊。
      訂房資訊必填欄位：room_plan（幾間幾人房）、checkin_date、checkout_date。
      AI 詢問人數時，固定以「幾間幾人房」為單位引導，例：「我要 1 間 2 人房」。

  # ============================================================================
  # 3.1 意圖確定
  # ============================================================================

  Rule: AI 識別訂房意圖並主動引導

    Example: 訪客提問房型時 AI 識別訂房意圖
      Given 訪客開啟官網聊天機器人
      When 訪客發送訊息「請問有哪些海景房？」
      Then AI 識別意圖為訂房（intent_state = confirmed）
      And AI 回覆房型資訊後主動詢問「請問您需要幾間幾人房？（例如：我要 1 間 2 人房）」

    Example: 訪客提問非訂房問題時 AI 主動引導
      Given 訪客開啟官網聊天機器人
      When 訪客發送訊息「你們飯店要怎麼去？」
      Then AI 回覆交通資訊（引用 FAQ 設施/交通規則）
      And AI 在回覆後主動詢問「請問是否需要為您查詢入住期間的房況？」
      And intent_state 保持為 detecting

    Example: 系統有串接 PMS 時優先以 PMS 資料回覆
      Given FAQPMSConnection.status 為 enabled
      And PMS API 可連通
      When 訪客詢問「有空的豪華雙人房嗎？」
      Then AI 優先呼叫 PMS API 取得即時房況
      And 以 PMS 資料（即時房價、剩餘間數）作為主要回覆來源
      And 以 FAQ「訂房」大分類規則（房型特色）作為輔助資訊

    Example: 系統無串接 PMS 時使用 FAQ 靜態資料回覆
      Given FAQPMSConnection 不存在或 status 為 disabled
      When 訪客詢問「有空的豪華雙人房嗎？」
      Then AI 自動啟用 FAQ 大分類「訂房」的靜態規則作為回覆來源
      And 顯示「一般參考房價」，不顯示剩餘間數

  # ============================================================================
  # 3.2 訂房資訊搜集
  # ============================================================================

  Rule: AI 漸進式搜集訂房資訊

    Example: AI 引導訪客回答間數與人數
      Given intent_state 為 confirmed
      When AI 詢問「請問您需要幾間幾人房？（例如：我要 1 間 2 人房）」
      And 訪客回答「我要 1 間 2 人房」
      Then AI 解析並記錄 booking_rooms = 1，booking_adults = 2
      And AI 僅詢問下一個缺失參數「請問您的入住日期？」

    Example: 訪客僅回答人數時 AI 補問間數
      Given intent_state 為 confirmed
      When 訪客回答「2 位大人」
      Then AI 記錄 booking_adults = 2
      And AI 追問「請問您需要幾間房？」
      And AI 等待訪客補充 booking_rooms 後再繼續

    Example: Session 輪數超過 5 輪時重置
      Given 訪客已在同一 Session 對話 5 輪
      When 訪客發送第 6 則訊息
      Then 系統重置 Session（清除所有暫存訂房資訊）
      And 以新 Session 繼續對話

    Example: 訪客重新整理頁面後清除訂房資訊
      Given 訪客已填寫 booking_adults = 2，checkin_date = 2026-03-07
      When 訪客重新整理瀏覽器
      Then 系統清除該 Session 的訂房資訊（booking_adults、checkin_date 等）
      And 下次對話從頭開始

  # ============================================================================
  # 3.3 調用 API 查詢即時房況
  # ============================================================================

  Rule: 訂房資訊完整後查詢 PMS 即時房況

    Example: 條件完整時呼叫 PMS API 查詢房型
      Given booking_rooms = 1，booking_adults = 2，checkin_date = 2026-03-07，checkout_date = 2026-03-09
      And FAQPMSConnection.status = enabled
      When 系統呼叫 PMS API
      Then 系統取得符合條件的房型清單
        | room_type_code   | room_type_name | available_count | price  |
        | superior_double  | 豪華雙人房     | 4               | 8000   |
        | deluxe_lake      | 景觀大床房     | 2               | 12000  |
      And 進行房型推薦流程

    Example: PMS 無符合條件房型時 AI 詢問替代方案
      Given 條件：1 間 1 人房，2026-03-07 ～ 2026-03-09
      And PMS 查無可入住 1 人的房型
      When 系統呼叫 PMS API
      Then AI 回覆「目前根據您輸入的人數與日期，暫時沒有對應的選項」
      And AI 詢問「是否要調整入住日期，或需要我幫您查詢可以組合的房型？」

    Example: PMS API 異常時自動降級至 FAQ 靜態資料
      Given FAQPMSConnection.status = enabled
      But PMS API 回應異常（網路逾時或 HTTP 500）
      When 系統呼叫 PMS API 失敗
      Then 系統自動降級，改用 FAQ 大分類「訂房」靜態規則
      And AI 顯示參考房價（不顯示即時房價與剩餘間數）

  # ============================================================================
  # 3.4 房型推薦卡片
  # ============================================================================

  Rule: 聊天視窗輸出房型推薦卡片供訪客選取

    Example: 有串接 PMS 時顯示完整房型卡片
      Given FAQPMSConnection.status = enabled
      And PMS 回傳 2 筆符合條件的房型
      When 系統輸出房型推薦卡片
      Then 每張卡片顯示：房型名稱*、剩餘間數*、即時房價*、房型圖片 url
      And 排序依可入住人數與訪客人數的匹配度由高至低

    Example: 無串接 PMS 時顯示參考房型卡片
      Given FAQPMSConnection 不存在
      When 系統輸出房型推薦卡片（使用 FAQ 靜態資料）
      Then 每張卡片顯示：房型名稱*、一般參考房價*、房型圖片 url、參考可售數量
      And 前端應清楚標示該數量為靜態參考值，非 PMS 即時庫存

    Example: 訪客在前端以多房型方式選取間數（純前端狀態，不走 AI 對話）
      Given 系統已顯示多張房型卡片
      When 訪客在卡片上將豪華雙人房設為「1 間」，景觀大床房設為「2 間」
      Then 前端記錄選取狀態為 rooms[]
        | room_type_code  | room_count |
        | superior_double | 1          |
        | deluxe_lake     | 2          |
      And 顯示「確認選擇」按鈕
      And 不呼叫 /chatbot/message（不觸發 AI 對話）

    Example: 訪客點擊「確認選擇」後前端呼叫 confirm-room 跳至會員表單
      Given 前端已記錄 rooms[]
        | room_type_code  | room_count |
        | superior_double | 1          |
        | deluxe_lake     | 2          |
      When 訪客點擊「確認選擇」按鈕
      Then 前端呼叫 POST /chatbot/confirm-room（帶 browser_key、rooms[]）
      And 系統更新 ChatbotSession.selected_rooms
      And 為了相容舊欄位，系統同步更新第一筆的 selected_room_type 與 selected_room_count
      And 系統回傳 reply_type = member_form 與表單欄位定義
      And 前端渲染會員資料表單（跳過 AI 對話直接進入 3.5 步驟）

    Example: 間數選取上限由 PMS 或 FAQ 設定控制
      Given 豪華雙人房 PMS 回傳剩餘 3 間
      When 系統顯示間數選取器
      Then 前端間數上限為 3（不可超過剩餘間數，由 RoomCard.available_count 控制）

  # ============================================================================
  # 3.5 會員資料搜集
  # ============================================================================

  Rule: 系統引導訪客輸入姓名、電話、Email

    Example: 系統顯示會員資料表單
      Given selected_room_type 不為空
      When 系統進入會員資料搜集流程
      Then 系統顯示制式欄位：[姓名*]、[聯絡電話*]、[Email*]
      And 系統顯示文字「即將完成！接下來您只需要提供以下基本資料，我將為您建立您的預定資訊！」
      And 表單下方顯示小字「您的個資僅用於本次訂房聯繫與 CRM 會員服務，請安心填寫。」

    Example: 電話格式錯誤時顯示提示
      Given 系統已顯示會員資料表單
      When 訪客輸入電話「12345」（非 10 位數）
      Then 前端顯示提示「哎呀，電話格式似乎不太對，請確認是 10 位數號碼喔！」
      And 不進入下一步

    Example: Email 格式錯誤時顯示提示
      Given 系統已顯示會員資料表單
      When 訪客輸入 Email「abc_no_at」（不含 @）
      Then 前端顯示格式錯誤提示
      And 不進入下一步

    Example: 三欄位格式正確後進入訂單確認
      Given 訪客填寫：姓名=王小明、電話=0988863903、Email=wang@example.com
      When 訪客送出表單
      Then 系統記錄 member_name、member_phone、member_email 至 Session
      And 進入訂單確認流程

  # ============================================================================
  # 3.6 訂單確認與資料儲存
  # ============================================================================

  Rule: 系統確認並儲存訂房資料

    Example: 系統顯示訂單確認並提供儲存按鈕
      Given 所有訂房資訊與會員資訊已完整
      When 系統進入訂單確認流程
      Then 系統顯示已選擇的房型、間數、入住日期、退房日期、訪客姓名
      And 系統顯示文字「請確認資料後儲存訂房資訊」
      And 系統顯示「確認並儲存」按鈕

    Example: 訪客點擊「確認並儲存」後保存訂房資料
      Given 訂單資訊已存在於 ChatbotSession
      And 訪客填寫：姓名=王小明、電話=0988863903、Email=wang@example.com
      When 訪客點擊「確認並儲存」按鈕
      Then 前端呼叫 POST /chatbot/booking-save
      And 系統驗證 Session 中的入住日期、退房日期、入住人數與已選房型
      And 系統儲存 BookingRecord 快照（含完整 Session 對話紀錄）
      And 系統寫入或更新 CRM 會員資料
      And 前端顯示 reservation_id 與房型明細摘要

    Example: 訪客未點擊「確認並儲存」而關閉視窗
      Given 訪客已填寫會員資料但未點擊「確認並儲存」
      When 訪客關閉聊天視窗
      Then 系統不寫入 CRM
      And 不儲存 BookingRecord
