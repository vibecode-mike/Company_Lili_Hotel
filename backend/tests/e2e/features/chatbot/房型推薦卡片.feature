@query
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
        | 欄位            | 說明                  |
        | room_type_name  | 房型名稱              |
        | price           | 即時房價（NT$）       |
        | available_count | 剩餘間數              |
        | image_url       | 房型圖片 URL          |
        | max_occupancy   | 最大可入住人數        |
      And 排序依 max_occupancy 接近民眾需求人數由高至低

  Rule: FAQ_KB 來源卡片 available_count 顯示「待確認」，房價與 PMS 來源顯示一致

    Example: FAQ 降級時的卡片格式
      Given 房型資料來源為 "faq_static"
      Then 每張卡片顯示：
        | 欄位            | 說明                              |
        | room_type_name  | 房型名稱                          |
        | price           | 一般參考房價（NT$）               |
        | available_count | 顯示「待確認」（非即時，無數字）  |
        | image_url       | 房型圖片 URL                      |
        | max_occupancy   | 最大可入住人數                    |
      And available_count 為 null 時前台顯示「待確認」而非隱藏欄位
      And 房價不加「參考：」前綴，卡片外觀與 PMS 來源一致

  @ignore
  Rule: 混搭推薦時顯示組合說明

    @ignore
    Example: 系統建議拆房組合
      Given _auto_split_options 含建議方案
      And 單一房型無法滿足民眾人數
      When 前台渲染
      Then 卡片上方顯示「以下組合可滿足您的需求」說明文字
      And 每個選項顯示建議間數（recommended_room_count）

  @ignore
  Rule: 圖片 URL 解析規則

    @ignore
    Example: 房型已上傳自訂圖片
      Given /kb/upload/room-image 已上傳房型圖片
      And booking_billing.json 對應房型 Image_URL 非空
      Then 卡片 image_url = 該自訂圖片 URL

    @ignore
    Example: 房型無自訂圖片時使用預設圖
      Given 對應房型 Image_URL 為空
      Then 卡片 image_url = DEFAULT_ROOM_IMAGE_URL（環境變數）
