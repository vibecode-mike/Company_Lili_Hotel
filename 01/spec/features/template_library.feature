# language: zh-TW
Feature: 模板庫管理
  作為一位行銷人員
  我希望能瀏覽、複製和管理訊息模板庫
  以便快速建立推播訊息而不需每次從頭設計

  Background:
    Given 管理員已登入系統

  # ============================================================================
  # 第一部分：瀏覽模板庫
  # ============================================================================

  Rule: 可瀏覽所有標記為「在模板庫中」的模板

    Example: 依使用次數排序瀏覽模板庫（預設）
      Given 模板庫中存在多個模板
      When 透過 GET /templates/library 查詢模板庫
      Then 系統回傳所有 is_in_library 為 true 的模板列表
      And 結果按 usage_count 降序排列

    Example: 依建立時間排序瀏覽模板庫
      Given 模板庫中存在多個模板
      When 透過 GET /templates/library?sort_by=created_at 查詢模板庫
      Then 系統回傳模板列表
      And 結果按 created_at 降序排列

    Example: 模板庫為空時回傳空陣列
      Given 模板庫中沒有任何模板（所有模板的 is_in_library 為 false）
      When 透過 GET /templates/library 查詢模板庫
      Then 系統回傳空陣列

  # ============================================================================
  # 第二部分：複製模板
  # ============================================================================

  Rule: 可從模板庫複製模板以建立新訊息

    Example: 成功複製模板
      Given 模板庫中存在 ID 為 1 的模板
      And 該模板的 usage_count 為 5
      When 透過 POST /templates/1/copy 複製模板
      Then 系統建立新的模板副本
      And 新模板的 source_template_id 為 1
      And 原模板的 usage_count 更新為 6

    Example: 複製不存在的模板回傳 404
      Given 模板庫中不存在 ID 為 9999 的模板
      When 透過 POST /templates/9999/copy 複製模板
      Then 系統回傳 HTTP 404 錯誤

  # ============================================================================
  # 第三部分：模板庫加入與移除
  # ============================================================================

  Rule: 可將模板加入或從模板庫中移除

    Example: 將模板加入模板庫
      Given 系統中存在 ID 為 1 的模板
      And 該模板的 is_in_library 為 false
      When 透過 PUT /templates/1/library 更新
        | 欄位           | 值   |
        | add_to_library | true |
      Then 系統將該模板的 is_in_library 設為 true
      And 回傳更新後的模板資訊

    Example: 將模板從模板庫移除
      Given 系統中存在 ID 為 2 的模板
      And 該模板的 is_in_library 為 true
      When 透過 PUT /templates/2/library 更新
        | 欄位           | 值    |
        | add_to_library | false |
      Then 系統將該模板的 is_in_library 設為 false
      And 模板不再出現在模板庫列表中

    Example: 更新不存在的模板回傳 404
      Given 系統中不存在 ID 為 9999 的模板
      When 透過 PUT /templates/9999/library 更新
      Then 系統回傳 HTTP 404 錯誤
