# language: zh-TW
Feature: Meta 用戶資料
  作為一位管理員
  我希望能查看會員的完整資料與渠道資訊
  以便在會員管理頁面中掌握會員的跨渠道綁定狀態與標籤

  Background:
    Given 管理員已登入系統

  # ============================================================================
  # 第一部分：會員資料查詢
  # ============================================================================

  Rule: 可依會員 ID 查詢完整會員資料

    Example: 查詢 Facebook 渠道會員資料
      Given 系統中存在會員 ID 為 1 的會員
      And 該會員已綁定 Facebook 帳號（fb_customer_id 不為空）
      When 透過 GET /admin/meta-user/profile?customer_id=1&channel=Facebook 查詢
      Then 系統回傳完整會員資料
      And channel 欄位顯示 Facebook 渠道資訊
      And channel.channel_name 為該會員的 FB 顯示名稱
      And channel.source_name 為 Facebook 粉專名稱

    Example: 查詢 LINE 渠道會員資料
      Given 系統中存在會員 ID 為 2 的會員
      And 該會員已綁定 LINE 帳號（line_uid 不為空）
      When 透過 GET /admin/meta-user/profile?customer_id=2&channel=LINE 查詢
      Then 系統回傳完整會員資料
      And channel 欄位顯示 LINE 渠道資訊
      And channel.channel_name 為該會員的 LINE 顯示名稱

    Example: 查詢 Webchat 渠道會員資料
      Given 系統中存在會員 ID 為 3 的會員
      And 該會員已綁定 Webchat 帳號（webchat_uid 不為空）
      When 透過 GET /admin/meta-user/profile?customer_id=3&channel=Webchat 查詢
      Then 系統回傳完整會員資料
      And channel 欄位顯示 Webchat 渠道資訊
      And channel.source_name 為「Webchat」

  # ============================================================================
  # 第二部分：渠道自動選擇
  # ============================================================================

  Rule: 未指定渠道時系統自動選擇可用渠道（優先順序：Facebook > LINE > Webchat）

    Example: 未指定渠道且會員有 Facebook 綁定時自動選擇 Facebook
      Given 系統中存在會員 ID 為 4 的會員
      And 該會員同時綁定 Facebook 和 LINE 帳號
      When 透過 GET /admin/meta-user/profile?customer_id=4 查詢（未指定 channel）
      Then 系統自動選擇 Facebook 渠道顯示
      And channel.channel 為「Facebook」

    Example: 未指定渠道且會員僅有 LINE 綁定時自動選擇 LINE
      Given 系統中存在會員 ID 為 5 的會員
      And 該會員僅綁定 LINE 帳號
      When 透過 GET /admin/meta-user/profile?customer_id=5 查詢（未指定 channel）
      Then 系統自動選擇 LINE 渠道顯示
      And channel.channel 為「LINE」

  # ============================================================================
  # 第三部分：標籤查詢
  # ============================================================================

  Rule: 會員資料包含會員標籤（tag_type=1）與互動標籤（tag_type=2）

    Example: 查詢會員資料包含標籤
      Given 系統中存在會員 ID 為 1 的會員
      And 該會員擁有以下標籤
        | tag_name | tag_type |
        | VIP      | 1        |
        | 春節優惠 | 2        |
      When 透過 GET /admin/meta-user/profile?customer_id=1 查詢
      Then 系統回傳 tags 陣列包含 2 筆標籤
      And 會員標籤「VIP」的 tag_type 為 1
      And 互動標籤「春節優惠」的 tag_type 為 2

    Example: 查詢無標籤會員的資料
      Given 系統中存在會員 ID 為 6 的會員
      And 該會員未被貼上任何標籤
      When 透過 GET /admin/meta-user/profile?customer_id=6 查詢
      Then 系統回傳 tags 為空陣列

  # ============================================================================
  # 第四部分：錯誤處理
  # ============================================================================

  Rule: 查詢不存在的會員回傳 404

    Example: 查詢不存在的會員 ID
      Given 系統中不存在會員 ID 為 9999 的會員
      When 透過 GET /admin/meta-user/profile?customer_id=9999 查詢
      Then 系統回傳 HTTP 404 錯誤
      And 錯誤訊息為「會員不存在」
