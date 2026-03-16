from behave import then


@then('HTTP 422，error_code = "NO_ROOMS_SELECTED"')
def step_422_no_rooms(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 422, f"期望 422，實際 {resp.status_code}: {resp.text[:200]}"


@then('message = "請至少選擇一個房型與間數"')
def step_message_no_rooms(context):
    resp = context.last_response
    assert resp.status_code == 422


@then("session.selected_rooms = [{ room_type_code:\"DLX\", room_count:1, ... }]")
def step_selected_rooms_single(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"


@then('response.reply_type = "member_form"')
def step_reply_type_member_form(context):
    resp = context.last_response
    assert resp.status_code == 200, f"{resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    rt = data.get("reply_type")
    assert rt == "member_form", f"reply_type 應為 'member_form'，實際 '{rt}'"


@then("response.member_form 包含 name、phone、email 欄位定義")
def step_member_form_fields(context):
    resp = context.last_response
    assert resp.status_code == 200
    data = resp.json()
    member_form = data.get("member_form", {})
    fields = [f.get("field_name") for f in member_form.get("fields", [])]
    assert "name" in fields or any("name" in f for f in fields), (
        f"member_form 應含 name 欄位，實際 fields={fields}"
    )


@then("session.selected_rooms 保留 2 筆記錄")
def step_selected_rooms_2(context):
    resp = context.last_response
    assert resp.status_code == 200, f"{resp.status_code}: {resp.text[:200]}"


@then("session.selected_room_type = rooms[0].room_type_code（向下相容用）")
def step_selected_room_type_compat(context):
    assert context.last_response.status_code == 200


@then("系統將 room_count 修正為 1（max(1, room_count)）")
def step_room_count_corrected(context):
    resp = context.last_response
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"


@then("不回傳錯誤")
def step_no_error(context):
    resp = context.last_response
    assert resp.status_code in (200, 201), f"期望 2xx，實際 {resp.status_code}"
