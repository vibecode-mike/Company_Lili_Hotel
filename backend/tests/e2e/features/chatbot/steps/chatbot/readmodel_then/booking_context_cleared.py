from behave import then


@then("舊的 booking_context 清除")
def step_impl(context):
    """驗證 rotate 後 booking_context 中的日期已清空。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    booking_context = data.get("booking_context", {})
    assert booking_context.get("checkin_date") is None, (
        f"rotate 後 booking_context.checkin_date 應為 None，"
        f"實際 '{booking_context.get('checkin_date')}'"
    )
    assert booking_context.get("checkout_date") is None, (
        f"rotate 後 booking_context.checkout_date 應為 None，"
        f"實際 '{booking_context.get('checkout_date')}'"
    )
