@ignore @query
Feature: 查詢空房型
  作為系統
  當訂房資訊齊全時，查詢 PMS 或 FAQ_KB 取得可用房型
  並決定推薦策略

  Background:
    Given booking_context 中 room_plan_requests、checkin_date、checkout_date 皆已齊全

  Rule: PMS 啟用時優先查詢 PMS 即時資料

    Example: PMS 啟用且回傳有效房型
      Given ENABLE_PMS = true
      And PMS API 連線正常
      When 系統呼叫 query_pms(startdate, enddate, housingcnt)
      Then 回傳房型列表，每筆包含 room_type_code、price、available_count、max_occupancy
      And 系統以 PMS 資料為主，FAQ_KB 資料補充房型圖片與特色描述

    Example: PMS 回傳空列表（housingcnt=1 邊界）
      Given ENABLE_PMS = true
      And 民眾需求為 1 人
      And PMS 在 housingcnt=1 時回傳空陣列
      When query_pms 執行
      Then 系統自動以 housingcnt=2 重查
      And 若 housingcnt=2 有結果則回傳（標記 _fallback_housingcnt_from）

  Rule: PMS 未啟用或異常時降級至 FAQ_KB 靜態資料

    Example: ENABLE_PMS = false 時使用 FAQ_KB
      Given ENABLE_PMS = false
      When 系統嘗試查詢房型
      Then 系統呼叫 _kb_search("booking_billing", query)
      And 回傳靜態房型資料（不含即時 available_count）

    Example: PMS API 拋出 exception 時降級
      Given ENABLE_PMS = true
      And PMS API 呼叫拋出 requests.Timeout
      When run_tool("query_pms_availability") 執行
      Then 系統捕獲例外，自動改用 kb_search 回覆
      And reply 中不顯示剩餘間數

  Rule: 多房型混搭查詢（mixed availability）

    說明:
      混搭推薦由 LLM 透過 system prompt 指引自行判斷，不使用程式碼 _auto_split_options。
      LLM 可根據 PMS 回傳的房型清單，在回覆中建議拆房組合（如「4人可選2間雙人房」）。

    Example: 民眾明確要求不同房型組合
      Given 民眾傳送「我要1間雙人房和1間四人房」
      When _extract_mixed_requests_from_text 解析
      Then room_plan_requests = [{ room_count:1, adults_per_room:2 }, { room_count:1, adults_per_room:4 }]
      And 系統分別查詢兩種房型可用性

  Rule: 完全無可用房型時由 LLM 引導民眾調整

    說明:
      採用選項 A：LLM 透過 system prompt 引導民眾調整日期或人數。
      不額外開啟「留資料待客服聯繫」的收單流程。

    Example: PMS 與 FAQ_KB 均無符合房型
      Given PMS 回傳空房型
      And FAQ_KB 亦無符合條件的靜態房型
      When AI 生成回覆
      Then LLM 根據 system prompt 引導民眾調整日期或人數
      And reply 包含建議（如「建議調整入住日期或人數」）
