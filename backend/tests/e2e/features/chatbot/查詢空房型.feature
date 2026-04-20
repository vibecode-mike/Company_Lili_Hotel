@query
Feature: 查詢空房型
  作為系統
  當訂房資訊齊全（入住日期 + 住幾晚）時，查詢 PMS 或 FAQ_KB 取得可用房型
  並決定推薦策略。人數／房型屬選填，未指定時回傳所有房型依人數由小到大排序。

  Background:
    Given booking_context 中 checkin_date、checkout_date 皆已齊全

  Rule: PMS 啟用時優先查詢 PMS 即時資料

    Example: PMS 啟用、未指定人數 → 呼叫 query_pms_all_roomtypes 取得所有房型
      Given ENABLE_PMS = true
      And PMS API 連線正常
      And 民眾未指定人數或房型
      When 系統呼叫 query_pms_all_roomtypes(startdate, enddate)
      Then 回傳房型列表，每筆包含 room_type_code、price、available_count、max_occupancy
      And 房卡依 max_occupancy 由小到大排序，相同人數則依價格由低至高
      And 系統以 PMS 資料為主，FAQ_KB 資料補充房型圖片與特色描述

    Example: PMS 啟用、民眾指定人數或房型 → 呼叫 query_pms 依條件過濾
      Given ENABLE_PMS = true
      And PMS API 連線正常
      And 民眾主動指定人數 4 或房型「V1」
      When 系統呼叫 query_pms(startdate, enddate, housingcnt, roomtype)
      Then 回傳符合條件的房型列表
      And 系統以 PMS 資料為主，FAQ_KB 資料補充房型圖片與特色描述

    @ignore
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

    @ignore
    Example: PMS API 拋出 exception 時降級
      Given ENABLE_PMS = true
      And PMS API 呼叫拋出 requests.Timeout
      When run_tool("query_pms_availability") 執行
      Then 系統捕獲例外，自動改用 kb_search 回覆
      And reply 中不顯示剩餘間數

  @ignore
  Rule: 多房型混搭查詢（mixed availability）

    @ignore
    Example: 民眾要 4 人，但無 4 人房，可拆為 2 間雙人房
      Given 民眾需求 room_plan_requests = [{ room_count:1, adults_per_room:4 }]
      And PMS 無 4 人房剩餘
      When 系統執行 _get_room_cards 並判斷 _auto_split_options
      Then response 包含 _auto_split_options，建議 2 間雙人房
      And 前台顯示混搭推薦卡片

    @ignore
    Example: 民眾明確要求不同房型組合
      Given 民眾傳送「我要1間雙人房和1間四人房」
      When _extract_mixed_requests_from_text 解析
      Then room_plan_requests = [{ room_count:1, adults_per_room:2 }, { room_count:1, adults_per_room:4 }]
      And 系統分別查詢兩種房型可用性

  Rule: 完全無可用房型時引導民眾調整

    Example: PMS 與 FAQ_KB 均無符合房型
      Given PMS 回傳空房型
      And FAQ_KB 亦無符合條件的靜態房型
      When AI 生成回覆
      Then reply = "哎呀，找不到完全符合條件的房型！目前根據您輸入的日期，暫時沒有對應的選項。建議您可以調整入住日期，或是留下您的資訊，如有空房以利客服專員主動聯繫您！"
      And missing_fields 重新包含日期欄位，引導民眾重新輸入
