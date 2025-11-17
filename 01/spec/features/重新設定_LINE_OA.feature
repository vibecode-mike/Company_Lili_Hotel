# language: zh-TW
功能: 重新設定 LINE OA
  作為一位 Admin
  我希望能重新設定 LINE OA
  以便更換綁定的官方帳號

  Rule: 管理員必須已完成 LINE OA 設定

    Example: 已完成綁定才顯示重新設定按鈕
      Given 管理員已完成 Messaging API 與 Login API 設定
      And LINE 官方帳號綁定狀態為「已完成」
      When 管理員開啟基本設定頁面
      Then 系統顯示「重新設定」按鈕
      And 按鈕可供點擊

    Example: 尚未完成綁定時隱藏重新設定按鈕
      Given 管理員尚未完成 Messaging API 設定
      When 管理員開啟基本設定頁面
      Then 系統不顯示「重新設定」按鈕
      And 管理員必須先完成 LINE OA 基本設定

  Rule: 點擊「重新設定」需二次確認

    Example: 點擊重新設定顯示確認彈窗
      Given 管理員已完成 LINE OA 設定
      When 管理員點擊「重新設定」按鈕
      Then 系統彈窗顯示「確認是否要重新設定?」
      And 彈窗顯示小字「確定要解除與 @LINE 的連結嗎？解除後需要重新設定所有資料。」

  Rule: 確認解除後導向基本設定頁面

    Example: 確認解除後導向設定頁
      Given 管理員點擊「重新設定」
      And 系統彈窗顯示確認訊息
      When 管理員確認解除
      Then 系統清除現有 LINE OA 設定
      And 系統導向基本設定頁面

  Rule: 重新設定時清除所有 LINE OA 相關資料，完全重置系統

    Example: 清除所有設定資料
      Given 管理員確認重新設定 LINE OA
      When 系統執行資料清除
      Then 系統清除以下設定資料
        | 資料表名稱     | 說明                          |
        | LineOAConfig   | LINE Messaging API 設定       |
        | LoginConfig    | LINE Login API 設定           |

    Example: 清除所有業務資料
      Given 管理員確認重新設定 LINE OA
      When 系統執行資料清除
      Then 系統清除以下業務資料
        | 資料表名稱        | 說明                     |
        | Member            | 會員資料                 |
        | Campaign          | 群發訊息資料             |
        | Template          | 訊息模板                 |
        | AutoResponse      | 自動回應設定             |
        | Tag               | 標籤（會員標籤、互動標籤）|
        | MemberTag         | 會員標籤關聯             |
        | InteractionTag    | 互動標籤關聯             |
        | MessageRecord     | 訊息紀錄                 |
        | TagTriggerLog     | 標籤觸發紀錄             |
      And 系統回到初始狀態，如同首次使用

    Example: 完全重置後重新設定
      Given 系統已清除所有 LINE OA 相關資料
      When 管理員進入基本設定頁面
      Then 所有設定欄位為空
      And 會員列表為空
      And 群發訊息列表為空
      And 標籤列表為空
      And 系統提示「請重新設定 LINE OA 基本資料」
