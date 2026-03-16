@command
Feature: 訂房資訊收集
  作為一位有訂房意圖的民眾
  AI 以漸進式提問引導我提供幾間幾人房與入住日期
  直到 booking_context 齊全

  Background:
    Given 民眾 intent_state 為 "confirmed"
    And 系統持有民眾的 browser_key 與對應 session

  Rule: 前置（狀態）- 至少一項訂房資訊缺漏才進入引導

    Example: 缺少幾間幾人房
      Given booking_context 中 room_plan_requests 為空
      And checkin_date 與 checkout_date 已知
      When /chatbot/message 計算 missing_fields
      Then missing_fields 包含 "room_plan"
      And AI 回覆「請問您需要幾間房？每間需要幾人入住呢？（例如：我要1間雙人房）」

    Example: 缺少入住日期
      Given booking_context 中 room_plan_requests 已設定
      And checkin_date 為 null
      When /chatbot/message 計算 missing_fields
      Then missing_fields 包含 "checkin_date"
      And AI 回覆引導提供入住日期

  Rule: 後置（狀態）- 所有欄位齊全後 missing_fields 為空

    Example: 民眾以「幾間幾人房」格式回答
      Given booking_context 目前 room_plan_requests 為空
      When 民眾傳送「我要2間四人房」
      Then 系統解析 room_plan_requests = [{ room_count:2, adults_per_room:4 }]
      And booking_context.adults = 8
      And missing_fields 不包含 "room_plan"

    Example: 民眾提供日期區間
      Given booking_context room_plan_requests 已設定
      When 民眾傳送「3月20號住到3月22號」
      Then 系統解析 checkin_date = "2026-03-20"
      And checkout_date = "2026-03-22"
      And missing_fields 不包含日期欄位

  Rule: 民眾提供過去日期時系統回覆警告並要求重新輸入

    Example: 民眾輸入已過去的日期
      Given 今天日期為 "2026-03-10"
      When 民眾傳送「2月28號到3月2號」
      Then 系統回覆「您輸入的日期已過，請重新提供入住與退房日期」
      And booking_context 中 checkin_date 與 checkout_date 維持 null
      And missing_fields 仍包含 "checkin_date"

  Rule: Session rotate 時 booking_context 全清

    Example: 達到 5 輪上限 rotate 後民眾需重新提供訂房資訊
      Given 民眾目前 session 已進行 5 輪對話
      When 民眾再次傳送訊息觸發 _new_chatbot_session()
      Then 新 session 的 booking_context 全部欄位重置為空
      And checkin_date = null
      And 民眾需從頭提供訂房資訊

  @ignore
  Rule: Session TTL 與持久化依模式不同

    @ignore
    Example: 測試模式 — 超過 20 分鐘 GC 清除（ENABLE_DB=false）
      Given ENABLE_DB = false
      And 民眾上次互動距今超過 20 分鐘
      When _gc_sessions() 執行
      Then 該 browser_key 的 session 從 CHATBOT_SESSION_MAP 移除
      And 對應的 CHAT_HISTORY_MAP 記錄一併清除
      And 資料不寫入 DB

    @ignore
    Example: 正式發布模式 — 訂單完成後持久化至 DB（ENABLE_DB=true）
      Given ENABLE_DB = true
      And 民眾完成訂房（booking-save 執行成功）
      Then 對話紀錄與會員資料寫入 DB
      And 記憶體 session 仍適用 20 分鐘 TTL GC
