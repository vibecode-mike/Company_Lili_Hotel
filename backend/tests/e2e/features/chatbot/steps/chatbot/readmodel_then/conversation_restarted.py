from behave import then


@then("對話從頭開始")
def step_impl(context):
    """驗證 rotate 後 turn_count = 1、intent_state = 'detecting'。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    turn_count = data.get("turn_count")
    intent_state = data.get("intent_state")
    assert turn_count == 1, (
        f"rotate 後 turn_count 應為 1，實際 {turn_count}"
    )
    assert intent_state == "detecting", (
        f"rotate 後 intent_state 應為 'detecting'，實際 '{intent_state}'"
    )
