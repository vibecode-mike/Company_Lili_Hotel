from behave import then


@then('系統將 intent_state 設為 "{intent_state}"')
def step_impl(context, intent_state):
    """驗證 /chatbot/message 回傳的 intent_state 符合預期。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None，請先執行 When 步驟"
    assert resp.status_code == 200, (
        f"期望 200，實際 {resp.status_code}: {resp.text}"
    )
    data = resp.json()
    actual = data.get("intent_state")
    assert actual == intent_state, (
        f"intent_state 期望 '{intent_state}'，實際 '{actual}'"
    )
