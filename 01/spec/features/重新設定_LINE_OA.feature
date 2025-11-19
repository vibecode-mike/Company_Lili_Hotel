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
      And 彈窗顯示小字「確定要解除與 @LINE 的連結嗎？請聯繫系統服務商。」
