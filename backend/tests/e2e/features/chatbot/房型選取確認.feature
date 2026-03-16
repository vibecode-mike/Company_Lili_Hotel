@command
Feature: 房型選取確認
  作為民眾
  我在房型卡片介面選取房型與間數
  系統記錄我的選擇並進入會員資訊收集

  Background:
    Given reply_type = "room_cards" 已呈現給民眾
    And 民眾持有有效的 browser_key

  Rule: 前置（狀態）- 至少選取一個房型

    Example: 未選取任何房型即送出
      Given 民眾未點選任何房型卡片
      When POST /chatbot/confirm-room body = { browser_key, rooms: [] }
      Then HTTP 422，error_code = "NO_ROOMS_SELECTED"
      And message = "請至少選擇一個房型與間數"

  Rule: 後置（狀態）- selected_rooms 寫入 session，回傳 member_form

    Example: 民眾選取單一房型
      Given 民眾選取「豪華雙人房 × 1」
      When POST /chatbot/confirm-room body:
        """
        {
          "browser_key": "placeholder",
          "rooms": [
            { "room_type_code": "DLX", "room_count": 1, "room_type_name": "豪華雙人房", "source": "pms" }
          ]
        }
        """
      Then session.selected_rooms = [{ room_type_code:"DLX", room_count:1, ... }]
      And response.reply_type = "member_form"
      And response.member_form 包含 name、phone、email 欄位定義

    Example: 民眾選取多房型混搭（rooms[] 多筆）
      Given 民眾選取「雙人房 × 1」與「四人房 × 1」
      When POST /chatbot/confirm-room body.rooms 含 2 筆
      Then session.selected_rooms 保留 2 筆記錄
      And session.selected_room_type = rooms[0].room_type_code（向下相容用）
      And response.reply_type = "member_form"

  Rule: room_count 強制最小值為 1，上限由前端控制

    Example: room_count 為 0 或負數時強制為 1
      Given 前端送出 room_count = 0
      When POST /chatbot/confirm-room 執行
      Then 系統將 room_count 修正為 1（max(1, room_count)）
      And 不回傳錯誤
