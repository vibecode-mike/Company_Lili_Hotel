Feature: 官網訪客資料寫入 CRM 會員管理
  作為一個系統
  我希望當官網訪客點擊「確認並儲存」時，自動將其資料寫入 CRM
  以便客服人員能追蹤高意圖訂房訪客並進行後續服務

  Background:
    說明:
      觸發條件：三欄位（姓名、電話、Email）皆格式正確，且訪客點擊「確認並儲存」按鈕。
      未點擊按鈕或關閉視窗時，不進行任何資料存儲。
      新建會員 join_source = Webchat。

  Rule: 訪客點擊「確認並儲存」後寫入 CRM

    Example: 新訪客寫入 CRM 建立新會員
      Given 訪客填寫：姓名=王小明、電話=0988863903、Email=wang@example.com
      And CRM 中不存在相同 phone 或 email 的會員
      When 訪客點擊「確認並儲存」
      Then 系統建立新 CRM 會員
        | 欄位        | 值                           |
        | name        | 王小明                       |
        | phone       | 0988863903                   |
        | email       | wang@example.com             |
        | join_source | Webchat                      |
        | created_at  | 當前時間（yyyy-mm-dd hh:mm） |
      And 系統儲存完整 Session 對話紀錄至 BookingRecord.session_log
      And BookingRecord.crm_member_id 更新為新建會員 ID

    Example: 已存在的訪客更新 CRM 會員資料
      Given 訪客填寫電話 0988863903，CRM 中已存在相同電話的會員「王大明」
      When 訪客點擊「確認並儲存」
      Then 系統比對到現有會員「王大明」
      And 系統更新該會員的最新資料（依最新時間覆蓋，空值不覆蓋原有值）
      And 系統儲存完整 Session 對話紀錄至 BookingRecord.session_log

    Example: 訪客未點擊「確認並儲存」時不寫入 CRM
      Given 訪客已填寫完整會員資料
      When 訪客直接關閉聊天視窗（未點擊「確認並儲存」）
      Then 系統不寫入任何 CRM 資料
      And 不建立 BookingRecord

  Rule: 自動貼互動標籤（引用現有 CRM TagRule，效果等同手動貼標）

    Example: 訪客詢問訂房時引用 TagRule 貼標
      Given 系統中存在 TagRule「訂房意向」（已啟用）
      And 訪客本次 Session 詢問過「豪華雙人房」（AI 引用 FAQ 訂房分類回答）
      When 訪客點擊「確認並儲存」，系統寫入 CRM
      Then 系統查找對應的 TagRule「訂房意向」
      And 寫入一筆 MemberTag（member_id = 該會員, tag_rule_id = TagRule.id, tag_source = AI_chatbot）
      And 該標籤在 CRM 會員詳情頁的標籤區可見，顯示效果與管理員手動貼標相同

    Example: 訪客詢問設施時引用 TagRule 貼標
      Given 系統中存在 TagRule「詢問設施」（已啟用）
      And 訪客本次 Session 詢問過「有停車場嗎？」（AI 引用 FAQ 設施分類的「停車場」規則回答）
      When 訪客點擊「確認並儲存」
      Then 系統寫入 MemberTag（tag_source = AI_chatbot, tag_rule = 詢問設施）
      And 該標籤回傳至 CRM 後台，顯示在會員管理的標籤欄位中

    Example: 同一 Session × 同一 TagRule 只寫入一筆 MemberTag（Service 層去重）
      Given 訪客在同一 Session 三次詢問關於訂房的問題
      And 每次 AI 均引用「訂房意向」TagRule 作答
      When 訪客點擊「確認並儲存」，系統準備批次寫入 MemberTag
      Then Service 層查詢本 ChatbotSession 中已寫入的 tag_rule_id 清單
      And 「訂房意向」TagRule 已在清單中 → 跳過，不重複插入
      And CRM 後台該會員的「訂房意向」標籤數量不增加
      And MemberTag 表結構不變（無新增欄位或 DB unique constraint）

    Example: AI 引用多個不同 TagRule 時各自寫入一筆
      Given 訪客在同一 Session 詢問過訂房（TagRule=訂房意向）與設施（TagRule=詢問設施）
      When 訪客點擊「確認並儲存」
      Then 系統分別寫入兩筆不同的 MemberTag
      And CRM 會員詳情頁顯示「訂房意向」和「詢問設施」兩個標籤

  Rule: AI 無法回答時兩階段標記（Session 暫存 → 會員建立時補打）

    Example: 訪客尚未成為會員時，AI 無法回答先暫存 flag
      Given 訪客詢問「我上次入住遺失了外套，可以幫我找嗎？」
      And AI 判斷無法從現有 FAQ 規則中回答此問題
      And 訪客尚未點擊「確認並儲存」（CRM 中無此會員）
      When 系統處理此訊息
      Then 系統設定 ChatbotSession.needs_human_followup = true
      And 不立即打 CRM 標記（無 member 可標記）

    Example: 訪客後續完成訂房時補打「新訊息」標記
      Given ChatbotSession.needs_human_followup = true
      When 訪客填寫會員資料並點擊「確認並儲存」
      Then 系統寫入 CRM 會員後，檢查 needs_human_followup
      And 在 CRM「會員管理」列表為該會員打上「新訊息」標記
      And 該會員出現在後台「待處理」佇列，等待人工客服回覆
      And 標記效果等同聊天室中客服手動設定待回覆

    Example: 訪客離開但未完成訂房時不建立任何 CRM 紀錄
      Given ChatbotSession.needs_human_followup = true
      When 訪客關閉視窗（未點擊「確認並儲存」）
      Then Session 自然過期，不建立 CRM 會員
      And 不打任何標記（匿名訪客無後續跟進管道）

  Rule: 格式驗證

    Example: 電話欄位驗證 10 位數
      Given 訪客輸入電話「09123」（少於 10 位）
      When 訪客嘗試送出表單
      Then 前端提示「電話格式似乎不太對，請確認是 10 位數號碼喔！」
      And 不觸發 CRM 寫入

    Example: Email 欄位驗證含 @
      Given 訪客輸入 Email「noemail.com」（不含 @）
      When 訪客嘗試送出表單
      Then 前端提示 Email 格式錯誤
      And 不觸發 CRM 寫入
