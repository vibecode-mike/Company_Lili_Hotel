# language: zh-TW
Feature: 點擊與互動追蹤
  作為一位行銷人員
  我希望系統能記錄會員在推播活動中的互動行為（點擊、瀏覽等）
  以便分析活動成效並優化未來的行銷策略

  Background:
    Given 管理員已登入系統

  # ============================================================================
  # 第一部分：記錄用戶互動
  # ============================================================================

  Rule: 系統可記錄用戶在活動中的互動行為

    Example: 成功記錄用戶點擊互動
      Given 系統中存在活動 ID 為 1 的推播活動
      And 會員 LINE UID 為「U1234567890abcdef」
      When 透過 POST /tracking/interactions 提交互動記錄
        | 欄位              | 值                    |
        | line_uid          | U1234567890abcdef     |
        | campaign_id       | 1                     |
        | interaction_type  | click                 |
        | template_id       | 10                    |
        | carousel_item_id  | 5                     |
        | component_slot    | button_1              |
      Then 系統回傳 code 200 與訊息「記錄成功」
      And 回傳資料包含互動記錄 ID、LINE ID、活動 ID、互動類型與觸發時間

    Example: 記錄包含互動標籤的用戶行為
      Given 系統中存在活動 ID 為 2 的推播活動
      And 系統中存在互動標籤 ID 為 3
      When 透過 POST /tracking/interactions 提交互動記錄
        | 欄位                | 值                    |
        | line_uid            | U1234567890abcdef     |
        | campaign_id         | 2                     |
        | interaction_type    | click                 |
        | interaction_tag_id  | 3                     |
        | interaction_value   | https://example.com   |
      Then 系統回傳 code 200
      And 互動記錄關聯至互動標籤 ID 3

    Example: 提交無效的互動記錄回傳錯誤
      Given 提交的互動記錄中 line_uid 不存在於系統中
      When 透過 POST /tracking/interactions 提交互動記錄
      Then 系統回傳 HTTP 400 錯誤

  # ============================================================================
  # 第二部分：活動統計數據
  # ============================================================================

  Rule: 可查詢特定活動的統計數據

    Example: 查詢活動統計數據
      Given 系統中存在活動 ID 為 1 的推播活動
      And 該活動已有多筆互動記錄
      When 透過 GET /tracking/campaigns/1/statistics 查詢統計
      Then 系統回傳 code 200 與訊息「查詢成功」
      And 回傳資料包含該活動的統計摘要

    Example: 查詢不存在的活動統計回傳 404
      Given 系統中不存在活動 ID 為 9999 的推播活動
      When 透過 GET /tracking/campaigns/9999/statistics 查詢統計
      Then 系統回傳 HTTP 404 錯誤

  # ============================================================================
  # 第三部分：活動互動記錄列表
  # ============================================================================

  Rule: 可查詢特定活動的互動記錄列表並支援篩選與分頁

    Example: 查詢活動互動記錄列表
      Given 系統中存在活動 ID 為 1 的推播活動
      And 該活動有 50 筆互動記錄
      When 透過 GET /tracking/campaigns/1/interactions 查詢互動記錄
      Then 系統回傳 code 200 與訊息「查詢成功」
      And 回傳資料包含 total 總數與 items 互動記錄陣列
      And 每筆記錄包含 id、line_id、campaign_id、interaction_type、triggered_at 等欄位

    Example: 依模板 ID 篩選互動記錄
      Given 系統中存在活動 ID 為 1 的推播活動
      When 透過 GET /tracking/campaigns/1/interactions?template_id=10 查詢
      Then 系統僅回傳 template_id 為 10 的互動記錄

    Example: 依互動類型篩選互動記錄
      Given 系統中存在活動 ID 為 1 的推播活動
      When 透過 GET /tracking/campaigns/1/interactions?interaction_type=click 查詢
      Then 系統僅回傳 interaction_type 為 click 的互動記錄

    Example: 依日期區間篩選互動記錄
      Given 系統中存在活動 ID 為 1 的推播活動
      When 透過 GET /tracking/campaigns/1/interactions 查詢
        | 參數       | 值                    |
        | start_date | 2025-01-01T00:00:00   |
        | end_date   | 2025-01-31T23:59:59   |
      Then 系統僅回傳在指定日期區間內的互動記錄

    Example: 分頁查詢互動記錄
      Given 系統中存在活動 ID 為 1 的推播活動
      And 該活動有 200 筆互動記錄
      When 透過 GET /tracking/campaigns/1/interactions?limit=50&offset=100 查詢
      Then 系統回傳第 101 至 150 筆互動記錄
      And total 為 200

    Example: 互動記錄包含輪播項目與互動標籤資訊
      Given 系統中存在活動 ID 為 1 的推播活動
      And 該活動的互動記錄關聯至輪播項目與互動標籤
      When 透過 GET /tracking/campaigns/1/interactions 查詢
      Then 每筆互動記錄包含 carousel_item_title 與 interaction_tag_name
