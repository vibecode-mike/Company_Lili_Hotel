from behave import then


@then('/chatbot/message 回傳 intent_state = "{intent_state}"')
def step_impl(context, intent_state):
    """驗證 /chatbot/message response 的 intent_state 欄位（與 intent_state_set 重複確認）。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    actual = data.get("intent_state")
    assert actual == intent_state, (
        f"intent_state 期望 '{intent_state}'，實際 '{actual}'"
    )
