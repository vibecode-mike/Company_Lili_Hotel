# language: zh-TW
功能: 卡控流程
  作為一位後台系統
  我希望能控制功能模組的存取權限
  以便確保只有完成設定且已授權的管理員才能使用

  Rule: 檢查管理員是否已完成 LINE OA 基本設定

    Example: 檢查 Messaging API 設定完整性
      Given 系統需要驗證管理員「張經理」的 LINE OA 設定狀態
      When 系統檢查該管理員的 Messaging API 設定
      Then 系統檢查以下必要欄位是否都已填寫
        | 欄位名稱              | 欄位說明                   |
        | channel_id            | LINE Channel ID            |
        | channel_secret        | LINE Channel Secret        |
        | channel_access_token  | LINE Channel Access Token  |
      And 所有欄位都不為空值時，判定為「已完成設定」
      And 任一欄位為空值時，判定為「未完成設定」

    Example: 管理員已完成 LINE OA 基本設定
      Given 管理員「李經理」的 Messaging API 設定如下
        | channel_id       | channel_secret      | channel_access_token     |
        | 1234567890       | abcdef1234567890    | xyz9876543210abcdefghijk |
      When 系統檢查該管理員的 LINE OA 設定狀態
      Then 系統判定為「已完成設定」

    Example: 管理員未完成 LINE OA 基本設定（缺少 Token）
      Given 管理員「王經理」的 Messaging API 設定如下
        | channel_id       | channel_secret      | channel_access_token |
        | 1234567890       | abcdef1234567890    | (空值)               |
      When 系統檢查該管理員的 LINE OA 設定狀態
      Then 系統判定為「未完成設定」

    Example: 管理員未完成 LINE OA 基本設定（所有欄位為空）
      Given 管理員「陳經理」尚未填寫任何 Messaging API 設定
      When 系統檢查該管理員的 LINE OA 設定狀態
      Then 系統判定為「未完成設定」

  Rule: 檢查管理員是否已完成官方帳號綁定

    Example: Messaging API 設定完整視為已綁定
      Given 管理員「張經理」已在 Messaging API 設定頁輸入有效的 Channel ID、Channel Secret、Channel Access Token
      And LINE API 驗證成功並顯示 LINE 帳號 ID「@262qaash」
      When 系統檢查該管理員的官方帳號綁定狀態
      Then 系統判定為「已綁定」

    Example: Messaging API 設定缺漏時判定未綁定
      Given 管理員「王經理」的 Messaging API 設定缺少 Channel Access Token
      When 系統檢查該管理員的官方帳號綁定狀態
      Then 系統判定為「未綁定」

  Rule: 未完成 LINE OA 設定時，點選功能模組顯示提示訊息

    Example: 未完成設定時顯示卡控提示
      Given 管理員已登入系統
      And 管理員尚未完成 LINE OA 基本設定
      When 管理員點選任一功能模組頁面
      Then 操作失敗
      And 系統顯示 Toast 提示「請先完成基本設定，才可使用功能模組」


  Rule: 未獲得系統授權時無法使用功能

    Example: 授權狀態未啟用時阻擋模組存取
      Given 管理員「李經理」的授權狀態為「未啟用」
      When 管理員登入系統
      Then 登入失敗

    Example: 授權過期時立即強制登出
      Given 管理員「張經理」已登入系統，授權到期日為「2025/07/31」
      When 系統偵測當前時間為「2025/08/01 00:05」
      Then 系統將該管理員所有登入強制登出
      And 前端導向登入頁面
      And 系統顯示提示「授權已過期，請展延後再登入」


