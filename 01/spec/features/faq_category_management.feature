Feature: FAQ 大分類管理
  作為一位系統使用者
  我希望能夠管理 FAQ 知識庫的大分類，控制 AI 聊天機器人引用的知識範圍
  以便維護 AI 回答的準確性與即時性

  Background:
    說明:
      FAQ 知識庫分產業設定，每個產業有系統預設的大分類。
      大分類是 AI 回答時引用知識的組織方式，所有已啟用的規則作為 prompt context 提供給 AI。
      初期僅支援旅宿業，預設 2 個大分類：訂房、設施。

  # ============================================================================
  # 第一部分：FAQ 模組授權
  # ============================================================================

  Rule: FAQ 模組需系統商獨立授權才可使用

    @not-implemented
    Example: 未開通授權時無法使用 FAQ 模組
      Given 客戶帳號「hotel001」尚未開通 FAQ 模組授權
      When 使用者登入系統後嘗試進入 FAQ 管理頁面
      Then 系統顯示 FAQ 模組入口不可用
      And 顯示提示訊息「請聯繫系統商開通」

    @not-implemented
    Example: 系統商為客戶開通 FAQ 模組
      Given 系統商管理員已登入管理後台
      And 客戶帳號「hotel001」尚未開通 FAQ 模組
      When 系統商管理員為客戶「hotel001」開通 FAQ 模組授權
      Then 客戶「hotel001」的 FAQ 模組授權狀態為「已開通」
      And 客戶使用者登入後可進入 FAQ 管理頁面

    @not-implemented
    Example: 授權開通與 Token 額度獨立管理
      Given 客戶帳號「hotel001」已開通 FAQ 模組授權
      And 客戶「hotel001」的 AI Token 額度為 0
      When 使用者登入系統後進入 FAQ 管理頁面
      Then 系統允許進入 FAQ 管理頁面
      And 顯示 Token 用量為 0 / 0
      And AI 聊天機器人處於停用狀態

  # ============================================================================
  # 第二部分：產業管理（系統商後台）
  # ============================================================================

  Rule: 系統商可管理產業及其大分類與欄位定義

    @not-implemented
    Example: 系統初始化時建立旅宿業預設資料
      Given 系統首次啟動或資料庫為空
      When 系統執行初始化程序
      Then 系統自動建立產業「旅宿業」
      And 系統自動建立以下大分類
        | category_name | industry | is_system_default | sort_order |
        | 訂房          | 旅宿業   | true              | 1          |
        | 設施          | 旅宿業   | true              | 2          |
      And 系統自動建立「訂房」大分類的欄位定義
        | field_name | field_type | is_required | sort_order |
        | 房型名稱   | text       | true        | 1          |
        | 房型特色   | text       | true        | 2          |
        | 房價       | text       | true        | 3          |
        | 人數       | text       | true        | 4          |
        | 間數       | text       | false       | 5          |
        | url        | text       | false       | 6          |
        | 標籤       | tag        | false       | 7          |
      And 系統自動建立「設施」大分類的欄位定義
        | field_name | field_type | is_required | sort_order |
        | 設施名稱   | text       | true        | 1          |
        | 位置       | text       | false       | 2          |
        | 費用       | text       | false       | 3          |
        | 開放時間   | text       | false       | 4          |
        | 說明       | text       | false       | 5          |
        | url        | text       | false       | 6          |
        | 標籤       | tag        | false       | 7          |

    @not-implemented
    Example: 系統商新增產業並定義大分類
      Given 系統商管理員已登入管理後台
      When 系統商管理員新增產業「餐飲業」
      And 定義該產業的大分類與欄位
      Then 系統建立產業「餐飲業」及其大分類與欄位定義

    @not-implemented
    Example: 客戶後台只顯示被分配的產業
      Given 客戶「hotel001」被分配產業「旅宿業」
      When 使用者登入客戶後台進入 FAQ 管理頁面
      Then 僅顯示「旅宿業」的大分類（訂房、設施）
      And 不顯示其他產業的大分類

  # ============================================================================
  # 第三部分：大分類列表頁面
  # ============================================================================

  Rule: 大分類列表顯示分類資訊與狀態

    @not-implemented
    Example: 顯示大分類列表
      Given 使用者已登入系統且擁有「faq.view」權限
      And 客戶已開通 FAQ 模組授權
      And 旅宿業有以下大分類
        | category_name | is_active | published_rule_count |
        | 訂房          | true      | 5                    |
        | 設施          | true      | 3                    |
      When 使用者進入 FAQ 大分類列表頁面
      Then 顯示大分類列表，包含以下資訊
        | 大分類名稱 | 啟用狀態 | 已發布規則數 |
        | 訂房       | 啟用     | 5            |
        | 設施       | 啟用     | 3            |
      And 顯示全域最後更新時間，格式為 yyyy-mm-dd hh:mm

  Rule: 大分類為系統預設，使用者無法新增、編輯或刪除

    @not-implemented
    Example: 使用者無法新增大分類
      Given 使用者已登入系統且擁有「faq.manage」權限
      When 使用者在大分類列表頁面
      Then 頁面不顯示「新增大分類」按鈕
      And 大分類名稱不可編輯

  # ============================================================================
  # 第四部分：大分類啟停控制
  # ============================================================================

  Rule: 支援大分類個別啟用與關閉

    @not-implemented
    Example: 關閉大分類後前台無法引用
      Given 使用者已登入系統且擁有「faq.manage」權限
      And 大分類「訂房」目前為啟用狀態
      And 大分類「訂房」下有 5 筆已啟用的規則
      When 使用者將大分類「訂房」設為關閉
      Then 大分類「訂房」狀態變更為關閉
      And 前台聊天機器人不再引用「訂房」大分類的任何規則

    @not-implemented
    Example: 重新啟用大分類後前台立即引用
      Given 大分類「訂房」目前為關閉狀態
      And 大分類「訂房」下有 5 筆已啟用的規則
      When 使用者將大分類「訂房」設為啟用
      Then 大分類「訂房」狀態變更為啟用
      And 前台聊天機器人立即可引用「訂房」大分類下已啟用的規則

  # ============================================================================
  # 第五部分：Token 用量管理
  # ============================================================================

  Rule: 顯示 AI Token 用量資訊

    @not-implemented
    Example: FAQ 模組顯示 Token 用量
      Given 使用者已登入系統且擁有「faq.view」權限
      And 客戶「hotel001」的 Token 設定為
        | total_quota | used_amount |
        | 100000      | 35000       |
      When 使用者進入 FAQ 管理頁面
      Then 顯示 AI Token 可用數量：65000
      And 顯示 AI Token 已消耗數量：35000
      And 顯示 AI Token 總額度：100000

  Rule: Token 額度由系統商設定，客戶僅能查看

    @not-implemented
    Example: 系統商設定客戶 Token 額度
      Given 系統商管理員已登入管理後台
      When 系統商管理員為客戶「hotel001」設定 Token 額度為 200000
      Then 客戶「hotel001」的 Token 總額度更新為 200000

    @not-implemented
    Example: 客戶無法自行修改 Token 額度
      Given 使用者已登入客戶後台
      When 使用者在 FAQ 管理頁面查看 Token 用量
      Then Token 額度欄位為唯讀，不可修改

  Rule: Token 耗盡時自動停用 AI 並降級至自動回應

    @not-implemented
    Example: Token 耗盡後降級至自動回應
      Given 客戶「hotel001」的 Token 設定為
        | total_quota | used_amount |
        | 100000      | 100000      |
      When 使用者進入 FAQ 管理頁面
      Then 顯示 AI 回覆鎖定提示：「當前客服已啟用 自動回應 模組，須加值請聯繫系統商」
      And AI 聊天機器人處於停用狀態
      And 前台聊天機器人改由現有自動回應系統（auto_response）的關鍵字回覆

    @not-implemented
    Example: Token 消耗至零時即時切換
      Given 客戶「hotel001」的 Token 剩餘額度為 50
      And 前台聊天機器人目前使用 AI 回覆
      When 一次 AI 回覆消耗了 50 個 Token
      And Token 剩餘額度變為 0
      Then 系統立即停用 AI 聊天機器人
      And 後續訊息改由自動回應系統處理

  # ============================================================================
  # 第六部分：語氣設定
  # ============================================================================

  Rule: 支援系統全域的 AI 語氣調整

    @not-implemented
    Example: 切換語氣設定
      Given 使用者已登入系統且擁有「faq.manage」權限
      And 系統提供以下語氣選項
        | tone_type | tone_name |
        | professional | 專業   |
        | casual       | 真人   |
      And 目前語氣設定為「專業」
      When 使用者將語氣設定切換為「真人」
      Then 語氣設定更新為「真人」
      And 前台聊天機器人即時套用「真人」語氣風格

    @not-implemented
    Example: 語氣設定影響 AI prompt
      Given 語氣設定為「專業」
      When AI 組裝 prompt context 時
      Then 系統將「專業」語氣的提示詞加入 system prompt
      And AI 回覆風格符合「專業」語氣
