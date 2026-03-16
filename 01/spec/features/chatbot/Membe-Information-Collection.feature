@ignore @command
Feature: 會員資訊收集
  作為一位已選取房型的民眾
  系統引導我填寫姓名、電話、Email
  以建立訂房所需的會員資料

  Background:
    Given reply_type = "member_form" 已呈現給民眾
    And session.selected_rooms 非空

  Rule: 前置（狀態）- 三個欄位均必填且格式需驗證

    Example: 電話格式錯誤（非 10 位數字）
      Given 民眾填入電話 "0912345"（僅 7 位）
      When 前台格式驗證執行
      Then 欄位顯示錯誤「哎呀，電話格式似乎不太對，請確認是 10 位數號碼喔！」
      And 無法進入下一步

    Example: Email 格式錯誤（缺少 @）
      Given 民眾填入 email "testexample.com"
      When 前台格式驗證執行
      Then 欄位顯示格式錯誤提示
      And 無法進入下一步

    Example: 姓名為空
      Given 民眾未填入姓名
      When 送出表單
      Then 姓名欄位顯示必填提示

  Rule: 後置（狀態）- 三個欄位齊全且格式正確，session 更新 member profile

    Example: 民眾完整填寫三個欄位
      Given 民眾填入：name="王小明", phone="0912345678", email="test@example.com"
      When 送出後前端更新 session member profile（透過 /chatbot/message 或直接帶入 booking-save）
      Then session.member_name = "王小明"
      And session.member_phone = "0912345678"
      And session.member_email = "test@example.com"
      And reply_type 進入 "booking_confirm"

  Rule: 欄位下方顯示個資說明小字

    Example: 表單底部顯示隱私說明
      Given 民眾看到會員資訊表單
      Then 表單底部顯示「您的個資僅用於本次訂房聯繫與 CRM 會員服務，請安心填寫。」

  Rule: AI 可從對話文字中自動提取會員提示並直接預填
    ; ✓ 直接預填（選項 A）：_extract_member_hints 結果直接寫入 session，前台表單顯示預填值供民眾修改
    ; 依賴 STEP:7 訂單確認摘要作為最終人工核對點

    Example: 民眾在訊息中提到電話號碼
      Given 民眾傳送「我電話是0912345678」
      When _extract_member_hints 解析
      Then session.member_phone 預填為 "0912345678"
      And 前台表單電話欄位顯示預填值
