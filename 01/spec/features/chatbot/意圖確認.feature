@ignore @command
Feature: AI 意圖確認
  作為一位瀏覽飯店官網的民眾
  我傳送訊息至聊天機器人
  系統判斷是否有訂房意圖並決定後續流程

  Background:
    Given 系統已啟動聊天機器人服務
    And 民眾持有有效的 browser_key

  Rule: 訊息含明確訂房信號時，標記 intent_state = confirmed

    Example: 民眾直接詢問幾間幾人房
      Given 民眾目前 intent_state 為 "detecting"
      When 民眾傳送「我要1間雙人房」
      Then 系統將 intent_state 設為 "confirmed"
      And /chatbot/message 回傳 intent_state = "confirmed"

    Example: 民眾詢問特定日期是否有空房
      Given 民眾目前 intent_state 為 "detecting"
      When 民眾傳送「3/7 到 3/9 有空房嗎？」
      Then 系統將 intent_state 設為 "confirmed"

  Rule: 無明確訂房信號時，AI 依問題相關性決定是否附引導語（無次數上限）

    說明:
      AI 附加引導語的條件（擇一成立）：
        (A) 能高精確判斷此問題可能與訂房相關（e.g. 詢問設施、交通、餐廳、房型介紹）
        (B) 無法排除訂房意圖（問題模糊、首次互動、問題屬住宿周邊）
      不附引導語的條件：
        能明確判斷問題與訂房完全無關（e.g. 純投訴、問辦公時間、詢問聯絡電話）

    Example: 住宿周邊問題（可能與訂房相關）→ 附引導語
      Given 民眾目前 intent_state 為 "detecting"
      When 民眾傳送「你們飯店怎麼去？」
      Then 系統回答交通資訊
      And 回覆末附加引導語「請問是否需為您查詢入住期間的房況？」
      And intent_state 維持 "detecting"

    Example: 與訂房無關的問題（能明確排除）→ 不附引導語
      Given 民眾目前 intent_state 為 "detecting"
      When 民眾傳送「你們幾點上班？」
      Then 系統回答辦公時間
      And 回覆末不附加訂房引導語
      And intent_state 維持 "detecting"

    Example: 詢問房型介紹（高度相關）→ 附引導語並視為潛在訂房信號
      Given 民眾目前 intent_state 為 "detecting"
      When 民眾傳送「你們有哪些房型？」
      Then 系統介紹房型
      And 回覆末附加引導語「您有興趣預訂嗎？我可以幫您查詢指定日期的空房！」
      And intent_state 維持 "detecting"

  Rule: 5 輪對話後自動 rotate session
    ; ✓ 進入點觸發（選項 A）：turn_count >= 5 時，下一次 /chatbot/message 進入點先 rotate 再處理訊息

    Example: 達到 5 輪上限自動開新 session
      Given 民眾目前 session 已進行 5 輪對話
      When 民眾再次傳送訊息
      Then 系統建立新 session（新 session_id）
      And 舊的 booking_context 清除
      And 對話從頭開始
