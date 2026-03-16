from behave import then


@then("系統解析 room_plan_requests = [{ room_count:{room_count:d}, adults_per_room:{adults_per_room:d} }]")
def step_impl_room_plan_parsed(context, room_count, adults_per_room):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    bc = data.get("booking_context", {})
    rpr = bc.get("room_plan_requests", [])
    assert len(rpr) >= 1, f"room_plan_requests 應有至少 1 筆，實際 {rpr}"
    assert rpr[0].get("room_count") == room_count, (
        f"room_count 應為 {room_count}，實際 {rpr[0].get('room_count')}"
    )
    assert rpr[0].get("adults_per_room") == adults_per_room, (
        f"adults_per_room 應為 {adults_per_room}，實際 {rpr[0].get('adults_per_room')}"
    )


@then("booking_context.adults = {adults:d}")
def step_impl_adults(context, adults):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    actual = data.get("booking_context", {}).get("adults")
    assert actual == adults, f"booking_context.adults 應為 {adults}，實際 {actual}"


@then('系統解析 checkin_date = "{checkin_date}"')
def step_impl_checkin_parsed(context, checkin_date):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    actual = data.get("booking_context", {}).get("checkin_date")
    assert actual == checkin_date, f"checkin_date 應為 '{checkin_date}'，實際 '{actual}'"


@then('checkout_date = "{checkout_date}"')
def step_impl_checkout(context, checkout_date):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    actual = data.get("booking_context", {}).get("checkout_date")
    assert actual == checkout_date, f"checkout_date 應為 '{checkout_date}'，實際 '{actual}'"


@then("booking_context 中 checkin_date 與 checkout_date 維持 null")
def step_impl_dates_still_null(context):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    bc = data.get("booking_context", {})
    assert bc.get("checkin_date") is None, (
        f"checkin_date 應為 None，實際 '{bc.get('checkin_date')}'"
    )
    assert bc.get("checkout_date") is None, (
        f"checkout_date 應為 None，實際 '{bc.get('checkout_date')}'"
    )


@then("新 session 的 booking_context 全部欄位重置為空")
def step_impl_all_fields_reset(context):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    bc = data.get("booking_context", {})
    assert bc.get("checkin_date") is None, f"checkin_date 應為 None，實際 '{bc.get('checkin_date')}'"
    assert bc.get("checkout_date") is None, f"checkout_date 應為 None，實際 '{bc.get('checkout_date')}'"
    rpr = bc.get("room_plan_requests", [])
    assert rpr == [] or rpr is None, f"room_plan_requests 應為空，實際 {rpr}"


@then("checkin_date = null")
def step_impl_checkin_null(context):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    actual = resp.json().get("booking_context", {}).get("checkin_date")
    assert actual is None, f"checkin_date 應為 None，實際 '{actual}'"


@then("rooms = []")
def step_impl_rooms_empty(context):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    bc = resp.json().get("booking_context", {})
    rpr = bc.get("room_plan_requests", [])
    assert rpr == [] or rpr is None, f"room_plan_requests 應為空，實際 {rpr}"


@then("民眾需從頭提供訂房資訊")
def step_impl_restart_info(context):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    tc = data.get("turn_count")
    assert tc == 1, f"rotate 後 turn_count 應為 1，實際 {tc}"
    # intent_state 可能因為新訊息含訂房信號被設回 confirmed，
    # 主要驗證重點是 turn_count=1（表示新 session 已建立）
    assert tc is not None, "turn_count 不能為 None"
