from behave import then


@then("系統回答辦公時間")
def step_impl(context):
    """驗證系統有給出回應（LLM 自由文字，不強求特定內容）。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    reply = data.get("reply", "")
    assert reply, "系統應有回覆（回答辦公時間），reply 不能為空"
    assert data.get("reply_type") == "text", (
        f"回答辦公時間時 reply_type 應為 'text'，實際 '{data.get('reply_type')}'"
    )
