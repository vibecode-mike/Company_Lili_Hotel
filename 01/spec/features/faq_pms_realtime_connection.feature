Feature: FAQ 後台串接 PMS 即時房況
  作為一位後台管理員
  我希望在 FAQ 大分類「訂房」頁面設定 PMS 串接參數
  以便 AI 聊天機器人能即時引用 PMS 的真實房況與房價

  Background:
    說明:
      本功能僅開放在 FAQ 大分類「訂房」頁面中。
      此 FAQPMSConnection 用途為「即時房況查詢」，
      與既有 PMSIntegration（會員住宿資料同步）為不同功能。
      API Key 以 AES-256 加密儲存。

  Rule: 管理員可設定並測試 PMS 串接參數

    Example: 管理員點擊「串接 PMS」按鈕
      Given 管理員在 FAQ 大分類「訂房」頁面
      When 管理員點擊「串接 PMS」按鈕
      Then 系統顯示 PMS 串接設定表單
        | 欄位       | 說明                        |
        | api_endpoint | PMS API 端點 URL          |
        | api_key    | API Key（明文輸入，儲存時加密）|
        | auth_type  | 認證方式（api_key / bearer_token）|

    Example: 連線測試成功時儲存設定
      Given 管理員填寫 api_endpoint 與 api_key
      When 管理員點擊「儲存」
      Then 系統先執行即時連線測試
      And 連線測試成功 → 系統加密儲存 api_key（AES-256）
      And FAQPMSConnection.status 更新為 enabled
      And FAQPMSConnection.last_synced_at 更新為當前時間（yyyy-mm-dd hh:mm）
      And 頁面顯示「最後更新時間 yyyy-mm-dd hh:mm」

    Example: 連線測試失敗時禁止儲存並顯示錯誤
      Given 管理員填寫不正確的 api_key
      When 管理員點擊「儲存」
      And 連線測試回應 401 Unauthorized
      Then 系統禁止儲存設定
      And Toast 顯示「連線失敗：API Key 無效（401 Unauthorized）」

    Example: IP 未白名單時顯示具體錯誤
      Given PMS 端有 IP 白名單限制
      When 管理員點擊「儲存」但系統 IP 未在白名單
      Then Toast 顯示「連線失敗：IP 未在白名單，請聯繫 PMS 廠商開通」

  Rule: 後台介面顯示最後更新時間

    Example: 手動保存成功更新時間
      Given FAQPMSConnection.status = enabled
      When 管理員手動保存成功
      Then last_synced_at 更新為本次保存時間
      And 後台顯示「最後更新時間 yyyy-mm-dd hh:mm」

  Rule: 串接 PMS 後「訂房」分類的特定欄位由 API 自動帶入

    Example: 即時房價等欄位鎖定為唯讀
      Given FAQPMSConnection.status = enabled
      When 管理員查看「訂房」大分類的規則編輯頁面
      Then 以下欄位顯示為唯讀，並標注「引用來源：PMS」
        | 欄位         |
        | 即時房價     |
        | 剩餘間數     |
        | 可入住人數   |
        | 跳轉頁面 url |
      And 管理員無法手動修改上述欄位

    Example: 管理員修改房型特色後系統檢核 PMS 房型代碼
      Given FAQPMSConnection.status = enabled
      And 豪華雙人房規則包含房型特色文字
      When 管理員修改房型特色並點擊保存
      Then 系統檢核對應的 PMS 房型代碼是否仍有效
      And 房型代碼無效 → 彈出提示「此房型代碼在 PMS 中已不存在，請確認後再儲存」

  Rule: 「訂房」大分類內頁的「會員標籤」欄對應 FAQRule.標籤欄位

    Example: 管理員查看房型規則的會員標籤欄
      Given FAQPMSConnection.status = enabled
      When 管理員查看「訂房」大分類的規則列表
      Then 每一筆房型規則顯示「會員標籤」欄
        | 說明                                                               |
        | 顯示該 FAQRule 所設定的標籤（對應 FAQRule.標籤 欄位）               |
        | AI 聊天機器人引用此規則時，系統自動將此標籤貼至互動會員            |
        | 貼標效果等同原系統管理員手動貼標（tag_source = AI_chatbot）         |

  Rule: 首次串接 PMS 時自動快照至自訂 FAQ 欄位（PMS 快照機制）

    @not-implemented
    Example: 首次串接 PMS 時系統自動帶入對應值至自訂 FAQ
      Given 大分類「訂房」從未串接過 PMS
      And FAQPMSConnection 不存在或 snapshot_completed = false
      When 管理員首次成功串接該飯店 PMS
      Then 系統自動將 PMS 回傳的房型資料帶入自訂 FAQ 的對應欄位
      And FAQPMSConnection.snapshot_completed 設為 true

    @not-implemented
    Example: 重新串接 PMS 時不再觸發快照
      Given 大分類「訂房」已成功串接過 PMS（snapshot_completed = true）
      And 管理員先前已停用串接
      When 管理員重新串接該飯店 PMS
      Then 系統不再自動帶入 PMS 資料至自訂 FAQ 欄位
      And 自訂 FAQ 欄位保持現有內容不變

  Rule: 停用串接時恢復 FAQ 靜態資料

    Example: 管理員停用 PMS 串接
      Given FAQPMSConnection.status = enabled
      When 管理員點擊「停用串接」
      Then FAQPMSConnection.status 更新為 disabled
      And AI 聊天機器人改用 FAQ 大分類「訂房」靜態規則回覆
      And 前台不再顯示即時房價與剩餘間數
