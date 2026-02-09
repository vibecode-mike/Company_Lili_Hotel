# language: zh-TW
Feature: Facebook 自動回覆模板管理
  作為一位管理員
  我希望能管理 Facebook 的自動回覆關鍵字與訊息模板
  以便在 Facebook Messenger 上自動回應會員訊息

  Background:
    Given 管理員已登入系統
    And 管理員持有有效的 Meta JWT Token

  # ============================================================================
  # 第一部分：關鍵字狀態更新
  # ============================================================================

  Rule: 可更新 FB 關鍵字的啟用/停用狀態

    Example: 啟用 FB 關鍵字
      Given 系統中存在 FB 關鍵字 ID 為 1 且狀態為停用
      When 透過 PATCH /admin/meta-page/keyword 更新關鍵字狀態
        | 欄位       | 值    |
        | keyword_id | 1     |
        | enabled    | true  |
      Then 系統回傳訊息「更新成功」
      And 該關鍵字狀態更新為啟用

    Example: 停用 FB 關鍵字
      Given 系統中存在 FB 關鍵字 ID 為 2 且狀態為啟用
      When 透過 PATCH /admin/meta-page/keyword 更新關鍵字狀態
        | 欄位       | 值    |
        | keyword_id | 2     |
        | enabled    | false |
      Then 系統回傳訊息「更新成功」
      And 該關鍵字狀態更新為停用

    Example: 缺少 JWT Token 時回傳錯誤
      When 透過 PATCH /admin/meta-page/keyword 更新但未提供 jwt_token
      Then 系統回傳 HTTP 400 錯誤
      And 錯誤訊息為「缺少 jwt_token，請先完成 Facebook 授權」

    Example: 外部 API 呼叫失敗時回傳錯誤
      Given 外部 FB API 服務暫時不可用
      When 透過 PATCH /admin/meta-page/keyword 更新關鍵字狀態
      Then 系統回傳 HTTP 500 錯誤
      And 錯誤訊息包含「更新 FB 關鍵字失敗」

  # ============================================================================
  # 第二部分：關鍵字刪除
  # ============================================================================

  Rule: 可刪除 FB 關鍵字

    Example: 成功刪除 FB 關鍵字
      Given 系統中存在 FB 關鍵字 ID 為 3
      When 透過 DELETE /admin/meta-page/keyword/3?jwt_token={token} 刪除
      Then 系統回傳訊息「刪除成功」
      And 該關鍵字已從外部系統移除

    Example: 刪除關鍵字失敗時回傳錯誤
      Given 外部 FB API 回傳錯誤
      When 透過 DELETE /admin/meta-page/keyword/3?jwt_token={token} 刪除
      Then 系統回傳 HTTP 500 錯誤
      And 錯誤訊息包含「刪除 FB 關鍵字失敗」

  # ============================================================================
  # 第三部分：訊息回覆刪除
  # ============================================================================

  Rule: 可刪除 FB 訊息回覆

    Example: 成功刪除 FB 訊息回覆
      Given 系統中存在 FB 訊息回覆 ID 為 5
      When 透過 DELETE /admin/meta-page/Reply/5?jwt_token={token} 刪除
      Then 系統回傳訊息「刪除成功」
      And 該訊息回覆已從外部系統移除

    Example: 刪除訊息回覆失敗時回傳錯誤
      Given 外部 FB API 回傳錯誤
      When 透過 DELETE /admin/meta-page/Reply/5?jwt_token={token} 刪除
      Then 系統回傳 HTTP 500 錯誤
      And 錯誤訊息包含「刪除 FB 訊息失敗」

  # ============================================================================
  # 第四部分：自動回應整組設定刪除
  # ============================================================================

  Rule: 可刪除 FB 自動回應整組設定

    Example: 成功刪除 FB 自動回應模板
      Given 系統中存在 FB 自動回應設定 basic_id 為「template_001」
      When 透過 DELETE /admin/meta-page?basic_id=template_001&jwt_token={token} 刪除
      Then 系統回傳訊息「刪除成功」
      And 該自動回應整組設定已從外部系統移除

    Example: 刪除自動回應模板失敗時回傳錯誤
      Given 外部 FB API 回傳錯誤
      When 透過 DELETE /admin/meta-page?basic_id=template_001&jwt_token={token} 刪除
      Then 系統回傳 HTTP 500 錯誤
      And 錯誤訊息包含「刪除 FB 自動回應失敗」

    Example: 刪除自動回應模板時缺少 basic_id 回傳驗證錯誤
      When 透過 DELETE /admin/meta-page?jwt_token={token} 刪除但未提供 basic_id
      Then 系統回傳 HTTP 422 驗證錯誤
