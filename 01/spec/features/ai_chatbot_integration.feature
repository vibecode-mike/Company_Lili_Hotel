Feature: AI 聊天機器人整合
  作為一位終端使用者
  我希望透過聊天機器人提問時能獲得基於知識庫的準確回答
  以便快速獲取所需資訊而無需等待人工客服

  Background:
    說明:
      AI 聊天機器人將所有已啟用的 FAQ 規則（結構化知識資料）作為 prompt context
      直接提供給 LLM，由 AI 根據上下文生成自然語言回答。
      不使用 RAG 向量檢索，規則內容直接作為上下文。
      支援 Web/LINE/FB 多渠道。

  # ============================================================================
  # 第一部分：AI 回答流程
  # ============================================================================

  Rule: AI 收集已啟用規則作為 prompt context 生成回答

    @not-implemented
    Example: AI 根據訂房規則回答房型問題
      Given 系統已啟用以下大分類與規則
        | category | rule_name  | status | 房型名稱   | 房型特色             | 房價 | 人數 | 間數 |
        | 訂房     | 豪華雙人房 | 已啟用 | 豪華雙人房 | 海景、獨立陽台       | 3500 | 2    | 15   |
        | 訂房     | 標準單人房 | 已啟用 | 標準單人房 | 市景、基本配備       | 2000 | 1    | 20   |
      And 語氣設定為「專業」
      When 會員透過 LINE 提問「請問有什麼房型可以選擇？」
      Then AI 將已啟用的規則內容組裝為 prompt context
      And AI 根據上下文生成包含「豪華雙人房」和「標準單人房」資訊的回答
      And 回答風格符合「專業」語氣設定

    @not-implemented
    Example: AI 根據設施規則回答設施問題
      Given 系統已啟用以下大分類與規則
        | category | rule_name | status | 設施名稱 | 位置 | 費用 | 開放時間 |
        | 設施     | 停車場    | 已啟用 | 停車場   | B1   | 免費 | 24小時   |
        | 設施     | 游泳池    | 已啟用 | 游泳池   | 3F   | 免費 | 06:00-22:00 |
      When 會員提問「有停車場嗎？」
      Then AI 意圖分析判斷關聯至大分類「設施」
      And AI 根據「停車場」規則內容生成回答

    @not-implemented
    Example: 已停用的規則不被 AI 引用
      Given 大分類「訂房」下有以下規則
        | rule_name  | status       |
        | 豪華雙人房 | 已啟用       |
        | 經濟雙人房 | 已停用       |
        | 標準單人房 | 測試(未發佈) |
      When 會員提問「有什麼房型？」
      Then AI 僅引用「豪華雙人房」的規則內容
      And 不引用「經濟雙人房」和「標準單人房」

    @not-implemented
    Example: 已關閉的大分類下規則不被 AI 引用
      Given 大分類「訂房」狀態為關閉
      And 大分類「訂房」下有 5 筆已啟用的規則
      When 會員提問「有什麼房型？」
      Then AI 不引用「訂房」大分類下的任何規則

  # ============================================================================
  # 第二部分：多渠道支援
  # ============================================================================

  Rule: AI 聊天機器人支援 Web/LINE/FB 渠道

    @not-implemented
    Example: LINE 渠道使用者獲得 AI 回答
      Given AI 聊天機器人處於啟用狀態
      And Token 額度充足
      When 會員透過 LINE 發送訊息「房間多少錢？」
      Then 系統透過 AI 生成回答並透過 LINE 渠道回覆

    @not-implemented
    Example: Facebook 渠道使用者獲得 AI 回答
      Given AI 聊天機器人處於啟用狀態
      And Token 額度充足
      When 會員透過 Facebook Messenger 發送訊息「有停車場嗎？」
      Then 系統透過 AI 生成回答並透過 Facebook 渠道回覆

    @not-implemented
    Example: Webchat 渠道使用者獲得 AI 回答
      Given AI 聊天機器人處於啟用狀態
      And Token 額度充足
      When 訪客透過 Webchat 發送訊息「請問早餐幾點？」
      Then 系統透過 AI 生成回答並透過 Webchat 渠道回覆

  # ============================================================================
  # 第三部分：自動貼標
  # ============================================================================

  Rule: AI 引用規則回答時自動將規則標籤貼至提問者

    @not-implemented
    Example: AI 引用帶標籤的規則時自動貼標
      Given 已啟用規則「豪華雙人房」設有標籤「豪華房型」
      And 會員「M001」目前無標籤「豪華房型」
      When 會員「M001」提問「海景房多少錢？」
      And AI 引用「豪華雙人房」規則生成回答
      Then 系統自動為會員「M001」新增標籤「豪華房型」
      And 該標籤在 CRM 後台的會員標籤列表中可見
      And 標籤來源標記為「AI 自動貼標」

    @not-implemented
    Example: AI 一次引用多條帶標籤的規則
      Given 已啟用規則「豪華雙人房」設有標籤「豪華房型」
      And 已啟用規則「標準單人房」設有標籤「標準房型」
      And 會員「M002」目前無上述標籤
      When 會員「M002」提問「有哪些房型可以選？」
      And AI 同時引用「豪華雙人房」和「標準單人房」規則生成回答
      Then 系統自動為會員「M002」新增標籤「豪華房型」和「標準房型」

    @not-implemented
    Example: 會員已有相同標籤時不重複貼標
      Given 已啟用規則「豪華雙人房」設有標籤「豪華房型」
      And 會員「M001」已有標籤「豪華房型」
      When 會員「M001」再次提問關於豪華雙人房的問題
      And AI 引用「豪華雙人房」規則生成回答
      Then 系統不重複為會員「M001」新增標籤「豪華房型」

  # ============================================================================
  # 第四部分：反問引導
  # ============================================================================

  Rule: AI 透過 prompt 指引判斷是否需要反問收集資訊

    @not-implemented
    Example: AI 判斷資訊不足時主動反問
      Given AI 聊天機器人處於啟用狀態
      And system prompt 包含反問引導指引
      When 會員提問「我想訂房」
      And AI 判斷缺少入住日期、人數等必要資訊
      Then AI 回覆並主動反問：「請問您預計的入住日期和入住人數？」

    @not-implemented
    Example: AI 資訊充足時直接回答
      Given AI 聊天機器人處於啟用狀態
      When 會員提問「豪華雙人房多少錢？」
      And AI 可直接從規則中找到答案
      Then AI 直接回覆房價資訊，不進行反問

  # ============================================================================
  # 第五部分：轉人工機制
  # ============================================================================

  Rule: AI 無法回答時轉人工處理

    @not-implemented
    Example: AI 無法回答時標記為人工處理
      Given AI 聊天機器人處於啟用狀態
      And 系統已啟用的規則不包含會員詢問的內容
      When 會員提問「我上次入住遺失了一件外套，可以幫我找嗎？」
      And AI 判斷無法從現有規則中回答此問題
      Then 系統將此問題歸類為「人工處理」
      And 在 CRM 聊天室該會員的對話打上「新訊息」標記
      And 等待人工客服回覆

    @not-implemented
    Example: AI 回覆後仍可轉人工
      Given AI 已回覆會員的問題
      When 會員表示「我想直接跟客服人員說話」
      And AI 判斷需要轉接人工
      Then 系統將該會員對話標記為「待人工回覆」
      And 在 CRM 聊天室打上「新訊息」標記

  # ============================================================================
  # 第六部分：Token 耗盡降級
  # ============================================================================

  Rule: Token 耗盡時自動降級至自動回應

    @not-implemented
    Example: Token 耗盡後前台改用自動回應
      Given 客戶的 AI Token 已耗盡（used_amount >= total_quota）
      When 會員透過 LINE 發送訊息「有停車場嗎？」
      Then 系統不呼叫 AI 回覆
      And 系統改由現有自動回應系統（auto_response）處理
      And 若訊息匹配關鍵字規則，則回覆對應的自動回應內容

    @not-implemented
    Example: Token 補充後恢復 AI 回覆
      Given 客戶的 AI Token 已耗盡
      And 系統商為客戶補充 Token 額度至 50000
      When 會員透過 LINE 發送訊息
      Then 系統恢復使用 AI 聊天機器人回覆
      And FAQ 管理頁面的 AI 回覆鎖定提示消失

  # ============================================================================
  # 第七部分：渠道 Webhook 統一透過 Backend API 處理 AI 回答
  # ============================================================================

  Rule: 渠道 Webhook 不直接呼叫 OpenAI，統一透過 Backend AI API 處理

    說明:
      所有 AI 回答邏輯（規則收集、prompt 組裝、OpenAI 呼叫、Token 扣減、自動貼標、轉人工判斷）
      集中於 Backend（FastAPI）的 POST /api/v1/ai/chat 端點。
      各渠道 Webhook（LINE App、FB Webhook、Webchat）僅負責：
        1. 接收使用者訊息
        2. 呼叫 Backend AI API
        3. 將 Backend 回傳的回答發送回渠道
      不再於渠道端直接實例化 OpenAI client 或維護本地知識庫。

    @not-implemented
    Example: LINE App 收到訊息後呼叫 Backend AI API 取得回答
      Given LINE App（Flask）收到使用者文字訊息
      And 該使用者已對應會員「M001」
      When LINE App 向 Backend 發送 POST /api/v1/ai/chat
        | parameter       | value              |
        | member_id       | M001 的會員 ID     |
        | message         | 使用者的提問內容   |
        | channel         | line               |
        | conversation_id | 當前對話 ID        |
      Then Backend 收集已啟用 FAQ 規則、組裝 prompt、呼叫 OpenAI
      And Backend 回傳 AI 回答、自動貼標結果、Token 消耗量
      And LINE App 將回答透過 LINE Messaging API 發送給使用者

    @not-implemented
    Example: Backend AI API 回傳降級信號時渠道改走自動回應
      Given 客戶的 AI Token 已耗盡
      When LINE App 向 Backend 發送 POST /api/v1/ai/chat
      Then Backend 回傳 HTTP 400 與降級信號
        | field           | value                    |
        | error_code      | TOKEN_EXHAUSTED          |
        | fallback        | auto_response            |
      And LINE App 改由本地自動回應邏輯（keyword → always）處理該訊息

    @not-implemented
    Example: 渠道端移除本地 OpenAI 呼叫與硬編碼知識庫
      Given LINE App 原先在本地維護硬編碼的 FAQ 知識（房型、價格等）
      And LINE App 原先在本地直接呼叫 OpenAI API（_ask_gpt）
      When 系統升級至新的 AI 聊天機器人架構
      Then LINE App 移除本地 OpenAI client 初始化與 _ask_gpt 函數
      And LINE App 移除硬編碼的 FAQ dict 與 PRICE_TABLE
      And LINE App 移除本地 SYSTEM_PROMPT 與 user_memory 對話記憶
      And 所有 AI 回答改由 Backend AI API 統一處理

    @not-implemented
    Example: 渠道端保留自動回應作為 AI 不可用時的回退
      Given LINE App 收到使用者文字訊息
      And Backend AI API 不可用（網路異常或回傳錯誤）
      When LINE App 無法取得 AI 回答
      Then LINE App 回退至本地自動回應處理（keyword → always）
      And 系統記錄 AI API 呼叫失敗的錯誤日誌

  Rule: 回應優先順序由 Backend 統一控制

    說明:
      新的回應優先順序為：
        1. 人工客服回覆（手動模式開啟時，跳過所有自動回應）
        2. AI 回答（Backend 收集規則 → OpenAI → 回傳結果）
        3. 關鍵字自動回應（keyword trigger）
        4. 一律回應（always response）
      其中步驟 2 由 Backend AI API 處理，步驟 3-4 保留在渠道端作為回退。

    @not-implemented
    Example: 手動模式下跳過 AI 與自動回應
      Given 會員「M001」的 gpt_enabled 設為 false（手動模式）
      When 會員「M001」透過 LINE 發送訊息
      Then 系統不呼叫 Backend AI API
      And 系統不執行自動回應
      And 訊息標記為「待人工回覆」等待客服處理

    @not-implemented
    Example: AI 回答成功時不再執行自動回應
      Given 會員「M001」的 gpt_enabled 設為 true
      And Token 額度充足
      When 會員「M001」透過 LINE 發送訊息「有停車場嗎？」
      And LINE App 呼叫 Backend AI API 取得回答
      And Backend 回傳成功的 AI 回答
      Then LINE App 直接回覆 AI 回答
      And 不再檢查關鍵字觸發與一律回應
