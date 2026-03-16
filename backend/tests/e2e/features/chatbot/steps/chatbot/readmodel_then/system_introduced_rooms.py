from behave import then


@then("系統介紹房型")
def step_impl(context):
    """驗證系統有給出房型相關回應。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    reply = data.get("reply", "")
    assert reply, "系統應有回覆（介紹房型），reply 不能為空"
    reply_type = data.get("reply_type")
    assert reply_type in ("text", "room_cards"), (
        f"介紹房型時 reply_type 應為 'text' 或 'room_cards'，實際 '{reply_type}'"
    )
