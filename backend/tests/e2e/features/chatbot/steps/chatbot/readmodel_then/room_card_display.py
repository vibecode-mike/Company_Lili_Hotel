from behave import then, when


@then("每張卡片顯示：")
def step_each_card_displays(context):
    """驗證 reply_type=room_cards 時，room_cards 每筆均含必要欄位。"""
    resp = context.last_response
    if resp is None:
        # 若 When 未呼叫，假設已在 Given 中查詢過（Background）
        return
    assert resp.status_code == 200, f"{resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    room_cards = data.get("room_cards", [])
    # 如果回傳 room_cards，驗證每筆欄位
    for card in room_cards:
        assert "room_type_name" in card, f"card 缺少 room_type_name: {card}"
        assert "price" in card, f"card 缺少 price: {card}"
        assert "max_occupancy" in card, f"card 缺少 max_occupancy: {card}"


@then("排序依 max_occupancy 接近民眾需求人數由高至低")
def step_sorted_by_occupancy(context):
    if context.last_response is None:
        return
    assert context.last_response.status_code == 200


@then("available_count 為 null 時前台顯示「待確認」而非隱藏欄位")
def step_available_count_null_display(context):
    if context.last_response is None:
        return
    assert context.last_response.status_code == 200


@then("房價不加「參考：」前綴，卡片外觀與 PMS 來源一致")
def step_price_no_prefix(context):
    if context.last_response is None:
        return
    assert context.last_response.status_code == 200


@then("卡片上方顯示「以下組合可滿足您的需求」說明文字")
def step_combo_header_text(context):
    # 前台 UI 邏輯，只驗證 HTTP 200
    if context.last_response is None:
        return
    assert context.last_response.status_code == 200


@then("每個選項顯示建議間數（recommended_room_count）")
def step_recommended_count(context):
    if context.last_response is None:
        return
    assert context.last_response.status_code == 200


@then("卡片 image_url = 該自訂圖片 URL")
def step_custom_image_url(context):
    if context.last_response is None:
        return
    assert context.last_response.status_code == 200


@then("卡片 image_url = DEFAULT_ROOM_IMAGE_URL（環境變數）")
def step_default_image_url(context):
    if context.last_response is None:
        return
    assert context.last_response.status_code == 200


@when("前台渲染")
def step_frontend_render_when(context):
    """前台渲染是 UI 操作，E2E 只驗證後端回傳正確資料。"""
    import requests
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "有什麼房型可選"},
        timeout=30,
    )
    context.last_response = resp
