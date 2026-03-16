@command
Feature: FAQ 後台串接 PMS 即時房況

  Background:
    Given 系統中有以下產業：
      | name   |
      | 旅宿業 |
    And 旅宿業有以下大分類：
      | name | data_source_type |
      | 訂房 | pms              |
    And 使用者已登入系統且擁有 "faq_manage" 權限

  Rule: 管理員可建立 PMS 串接設定

    Example: 成功建立 PMS 串接設定並連線測試通過
      Given 大分類「訂房」尚未有 PMS 串接設定
      When 管理員為大分類「訂房」建立 PMS 串接設定：
        | api_endpoint                        | api_key    | auth_type |
        | https://pms.example.com/api/rooms   | valid-key  | api_key   |
      Then 操作成功
      And 大分類「訂房」的 PMS 串接狀態應為 "enabled"
      And 大分類「訂房」的 PMS 串接 last_synced_at 應有值

  Rule: 管理員可停用與重啟 PMS 串接

    Example: 管理員停用 PMS 串接
      Given 大分類「訂房」已有啟用的 PMS 串接設定
      When 管理員停用大分類「訂房」的 PMS 串接
      Then 操作成功
      And 大分類「訂房」的 PMS 串接狀態應為 "disabled"

    Example: 管理員重啟 PMS 串接
      Given 大分類「訂房」已有停用的 PMS 串接設定
      When 管理員啟用大分類「訂房」的 PMS 串接
      Then 操作成功
      And 大分類「訂房」的 PMS 串接狀態應為 "enabled"

  Rule: 首次串接 PMS 時自動快照至自訂 FAQ 欄位（PMS 快照機制）

    Example: 首次串接 PMS 時系統自動帶入對應值至自訂 FAQ
      Given 大分類「訂房」尚未有 PMS 串接設定
      When 管理員為大分類「訂房」建立 PMS 串接設定：
        | api_endpoint                        | api_key    | auth_type |
        | https://pms.example.com/api/rooms   | valid-key  | api_key   |
      Then 操作成功
      And 大分類「訂房」的 PMS 串接 snapshot_completed 應為 true

    Example: 重新串接 PMS 時不再觸發快照
      Given 大分類「訂房」已有停用的 PMS 串接設定且 snapshot_completed 為 true
      When 管理員啟用大分類「訂房」的 PMS 串接
      Then 操作成功
      And 大分類「訂房」的 PMS 串接 snapshot_completed 應為 true

  Rule: 查詢 PMS 串接設定

    Example: 查詢大分類的 PMS 串接設定
      Given 大分類「訂房」已有啟用的 PMS 串接設定
      When 管理員查詢大分類「訂房」的 PMS 串接設定
      Then 操作成功
      And PMS 串接設定回應應包含：
        | field          | expected       |
        | status         | enabled        |
        | auth_type      | api_key        |
