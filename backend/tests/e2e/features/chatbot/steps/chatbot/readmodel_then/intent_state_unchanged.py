from behave import then


@then('intent_state 維持 "{intent_state}"')
def step_impl(context, intent_state):
    """驗證 /chatbot/message 回傳的 intent_state 未改變。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    actual = data.get("intent_state")
    assert actual == intent_state, (
        f"intent_state 應維持 '{intent_state}'，實際 '{actual}'"
    )
