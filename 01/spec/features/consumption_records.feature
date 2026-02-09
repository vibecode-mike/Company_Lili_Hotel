# language: zh-TW
Feature: 消費紀錄管理
  作為一位管理員
  我希望能管理會員的消費與住宿紀錄
  以便追蹤會員的消費行為並提供個人化服務

  Background:
    Given 管理員已登入系統

  # ============================================================================
  # 第一部分：新增消費紀錄
  # ============================================================================

  Rule: 可新增會員的消費紀錄

    Example: 成功新增消費紀錄
      Given 系統中存在會員 ID 為 1 的會員
      When 透過 POST /consumption-records 新增消費紀錄
        | 欄位          | 值           |
        | member_id     | 1            |
        | amount        | 8500         |
        | room_type     | 豪華雙人房   |
        | stay_date     | 2025-01-15   |
        | checkout_date | 2025-01-17   |
        | notes         | VIP 客戶     |
      Then 系統回傳 code 200 與訊息「消費紀錄創建成功」
      And 回傳資料包含新建紀錄的 ID

    Example: 新增消費紀錄失敗時回滾資料庫
      Given 資料庫寫入發生異常
      When 透過 POST /consumption-records 新增消費紀錄
      Then 系統回傳 HTTP 500 錯誤
      And 資料庫不會留下不完整的紀錄

  # ============================================================================
  # 第二部分：查詢消費紀錄列表
  # ============================================================================

  Rule: 可查詢消費紀錄列表並支援篩選與分頁

    Example: 查詢所有消費紀錄（分頁）
      Given 系統中存在 50 筆消費紀錄
      When 透過 GET /consumption-records?page=1&page_size=20 查詢
      Then 系統回傳 code 200
      And 回傳資料包含 items 陣列（最多 20 筆）
      And 回傳 total、page、page_size、total_pages 分頁資訊
      And 紀錄按 stay_date 降序排列

    Example: 依會員 ID 篩選消費紀錄
      Given 系統中存在會員 ID 為 1 的消費紀錄 5 筆
      When 透過 GET /consumption-records?member_id=1 查詢
      Then 系統僅回傳 member_id 為 1 的消費紀錄

    Example: 依日期區間篩選消費紀錄
      Given 系統中存在多筆不同日期的消費紀錄
      When 透過 GET /consumption-records?start_date=2025-01-01&end_date=2025-01-31 查詢
      Then 系統僅回傳 stay_date 在 2025-01-01 至 2025-01-31 之間的紀錄

    Example: 依房型篩選消費紀錄
      Given 系統中存在不同房型的消費紀錄
      When 透過 GET /consumption-records?room_type=豪華雙人房 查詢
      Then 系統僅回傳 room_type 為「豪華雙人房」的消費紀錄

  # ============================================================================
  # 第三部分：查詢單筆消費紀錄
  # ============================================================================

  Rule: 可查詢單筆消費紀錄詳情

    Example: 查詢指定消費紀錄詳情
      Given 系統中存在消費紀錄 ID 為 1 的紀錄
      When 透過 GET /consumption-records/1 查詢
      Then 系統回傳 code 200
      And 回傳資料包含 id、member_id、amount、room_type、stay_date、checkout_date、notes、created_at、updated_at

    Example: 查詢不存在的消費紀錄回傳 404
      Given 系統中不存在消費紀錄 ID 為 9999 的紀錄
      When 透過 GET /consumption-records/9999 查詢
      Then 系統回傳 HTTP 404 錯誤
      And 錯誤訊息為「記錄不存在」

  # ============================================================================
  # 第四部分：更新消費紀錄
  # ============================================================================

  Rule: 可更新既有的消費紀錄

    Example: 成功更新消費紀錄的金額與備註
      Given 系統中存在消費紀錄 ID 為 1 的紀錄
      When 透過 PUT /consumption-records/1 更新
        | 欄位   | 值             |
        | amount | 9500           |
        | notes  | 升級房型補差額 |
      Then 系統回傳 code 200 與訊息「更新成功」
      And 消費紀錄的金額更新為 9500

    Example: 更新不存在的消費紀錄回傳 404
      Given 系統中不存在消費紀錄 ID 為 9999 的紀錄
      When 透過 PUT /consumption-records/9999 更新
      Then 系統回傳 HTTP 404 錯誤
      And 錯誤訊息為「記錄不存在」

  # ============================================================================
  # 第五部分：刪除消費紀錄
  # ============================================================================

  Rule: 可刪除既有的消費紀錄

    Example: 成功刪除消費紀錄
      Given 系統中存在消費紀錄 ID 為 1 的紀錄
      When 透過 DELETE /consumption-records/1 刪除
      Then 系統回傳 code 200 與訊息「刪除成功」
      And 該消費紀錄已從資料庫移除

    Example: 刪除不存在的消費紀錄回傳 404
      Given 系統中不存在消費紀錄 ID 為 9999 的紀錄
      When 透過 DELETE /consumption-records/9999 刪除
      Then 系統回傳 HTTP 404 錯誤
      And 錯誤訊息為「記錄不存在」

  # ============================================================================
  # 第六部分：會員消費統計摘要
  # ============================================================================

  Rule: 可查詢會員的消費統計摘要

    Example: 查詢會員消費統計摘要
      Given 會員 ID 為 1 的會員有以下消費紀錄
        | stay_date  | amount |
        | 2025-01-10 | 4500   |
        | 2025-01-15 | 8500   |
        | 2025-01-20 | 6000   |
      When 透過 GET /consumption-records/member/1/summary 查詢
      Then 系統回傳 code 200
      And 回傳資料包含
        | 欄位            | 值         |
        | member_id       | 1          |
        | total_records   | 3          |
        | total_amount    | 19000.0    |
        | last_stay_date  | 2025-01-20 |

    Example: 查詢無消費紀錄會員的統計摘要
      Given 會員 ID 為 2 的會員無任何消費紀錄
      When 透過 GET /consumption-records/member/2/summary 查詢
      Then 系統回傳 code 200
      And 回傳資料包含
        | 欄位            | 值   |
        | member_id       | 2    |
        | total_records   | 0    |
        | total_amount    | 0.0  |
        | last_stay_date  | null |
