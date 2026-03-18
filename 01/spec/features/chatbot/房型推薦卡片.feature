@ignore @query
Feature: 房型推薦卡片
  作為系統
  當查詢到可用房型後
  以房型卡片格式呈現給民眾選取

  Background:
    Given 查詢已取得至少一筆可用房型資料
    And 資料來源已知（pms 或 faq_static）

  Rule: PMS 來源卡片顯示即時資料（含剩餘間數）

    Example: PMS 來源正常回傳
      Given 房型資料來源為 "pms"
      Then 每張卡片顯示：
        | 欄位           | 說明                  |
        | room_type_name | 房型名稱              |
        | price          | 即時房價（NT$）       |
        | available_count| 剩餘間數              |
        | image_url      | 房型圖片 URL          |
        | max_occupancy  | 最大可入住人數        |
      And 排序依 max_occupancy 接近民眾需求人數由高至低

  Rule: FAQ_KB 來源卡片 available_count 顯示「待確認」，房價與 PMS 來源顯示一致

    Example: FAQ 降級時的卡片格式
      Given 房型資料來源為 "faq_static"
      Then 每張卡片顯示：
        | 欄位           | 說明                              |
        | room_type_name | 房型名稱                          |
        | price          | 一般參考房價（NT$）               |
        | available_count| 顯示「待確認」（非即時，無數字）  |
        | image_url      | 房型圖片 URL                      |
        | max_occupancy  | 最大可入住人數                    |
      And available_count 為 null 時前台顯示「待確認」而非隱藏欄位
      And 房價不加「參考：」前綴，卡片外觀與 PMS 來源一致
      ; 採用實作行為：兩種來源卡片外觀統一，available_count=null → 顯示「待確認」

  Rule: 混搭推薦由 LLM 在回覆文字中建議

    說明:
      不使用程式碼 _auto_split_options 欄位。
      LLM 透過 system prompt 指引，在回覆文字中建議拆房組合（如「4人可選2間雙人房」）。
      房型卡片仍按 occupancy match 排序顯示，LLM 回覆文字補充組合建議。

    Example: LLM 建議拆房組合
      Given 民眾需求 4 人，PMS 無 4 人房
      And PMS 回傳雙人房有空房
      When AI 生成回覆
      Then LLM 回覆文字包含組合建議（如「建議預訂2間雙人房」）
      And 卡片按 occupancy match 排序顯示可用房型

  Rule: 圖片 URL 解析規則

    Example: 房型已上傳自訂圖片
      Given 管理員透過 POST /api/v1/upload 上傳房型圖片
      And FaqRule.content_json 對應房型 image_url 非空
      Then 卡片 image_url = 該自訂圖片 URL

    Example: 房型無自訂圖片時使用預設圖
      Given 對應房型 Image_URL 為空
      Then 卡片 image_url = DEFAULT_ROOM_IMAGE_URL（環境變數）
