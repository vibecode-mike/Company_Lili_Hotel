@ignore @command
Feature: 訂單確認儲存
  作為一位填妥資訊的民眾
  點擊「立即預訂」後系統儲存訂單並取得 PMS 結帳 URL
  以完成訂房閉環

  Background:
    Given session 中 selected_rooms、checkin_date、checkout_date、booking_adults 皆已填寫
    And session 中 member_name、member_phone、member_email 皆已填寫

  Rule: 前置（狀態）- 必要欄位缺失時拒絕儲存

    Example: booking_context 不完整
      Given session 缺少 checkin_date
      When POST /chatbot/booking-save
      Then HTTP 422，error_code = "INCOMPLETE_BOOKING_CONTEXT"
      And message 列出缺少的欄位名稱

    Example: 電話格式錯誤
      Given 傳入 phone = "091234567"（9 位）
      When POST /chatbot/booking-save
      Then HTTP 422，error_code = "INVALID_PHONE"

    Example: checkout 早於或等於 checkin
      Given checkin_date = "2026-03-09", checkout_date = "2026-03-07"
      When POST /chatbot/booking-save
      Then HTTP 422，error_code = "INVALID_DATE_RANGE"

  Rule: 後置（狀態 - 正式發布模式 ENABLE_DB=true）- 寫入 CRM 並取得 reservation_id

    Example: DB 可用時成功儲存
      Given ENABLE_DB = true
      And DB 連線正常
      When POST /chatbot/booking-save 執行
      Then _db_upsert_member 建立或更新會員記錄，回傳 crm_member_id
      And _db_upsert_chatbot_session 寫入 session 記錄（含對話歷史）
      And _db_insert_booking_record 建立訂房記錄（reservation_id）
      And response = { ok: true, reservation_id: "<uuid>", saved: { ... } }
      And saved.crm_member_id 為有效整數

    Example: 同手機 + email 的會員重複訂房
      Given CRM 中已有 phone="0912345678", email="test@example.com" 的會員
      When POST /chatbot/booking-save 執行
      Then _db_upsert_member 更新現有會員（upsert），不建立重複記錄
      And 回傳相同 crm_member_id

  Rule: 後置（狀態 - 測試模式 ENABLE_DB=false）- JSON 降級儲存

    Example: ENABLE_DB = false 時 JSON 降級儲存
      Given ENABLE_DB = false
      When POST /chatbot/booking-save 執行
      Then 訂房記錄寫入 BOOKING_RESERVATION_MAP（記憶體）與本地 JSON 檔案
      And response.saved.db_saved = false
      And response.saved.crm_member_id = null

  Rule: 訂單資料包含完整的 selected_rooms 多房型記錄

    Example: 多房型混搭訂單
      Given session.selected_rooms = [{ room_type_code:"DLX", room_count:1 }, { room_type_code:"FAM", room_count:1 }]
      When POST /chatbot/booking-save
      Then saved.selected_rooms 保留完整 2 筆記錄
      And saved.room_type_code = selected_rooms[0].room_type_code（向下相容）

  Rule: booking-save 同時建立 PMS 購物車並回傳 cart_url
    ; ✓ 擴充 booking-save（選項 A）：呼叫 PMS 建立購物車 API，response 新增 cart_url
    ; booking-url endpoint 廢棄

    Example: DB 可用時 booking-save 回傳 cart_url
      Given ENABLE_DB = true
      And PMS 購物車 API 正常
      When POST /chatbot/booking-save 執行
      Then response = { ok: true, reservation_id: "<uuid>", cart_url: "<pms_cart_url>", saved: { ... } }
      And 前台以 cart_url 跳轉至 PMS 購物車頁面

    Example: 民眾點擊「立即預訂」後跳轉
      Given booking-save 執行成功且 response 含 cart_url
      When 前台取得 response
      Then 前台跳轉至 response.cart_url（PMS 購物車頁面）
      And 跳轉按鈕下方顯示「房價與房況以跳轉後之訂房系統顯示為準」
