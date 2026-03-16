from behave import then


@then("回覆末不附加訂房引導語")
def step_impl(context):
    """
    驗證 reply 不包含訂房引導語。
    注意：LLM 回覆有隨機性，此測試可能因 LLM 行為不穩定而偶發失敗。
    """
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    reply = data.get("reply", "")
    assert reply, "reply 不能為空"
    # 常見訂房引導語關鍵字
    booking_guidance_hints = ["是否需要查詢", "查詢入住", "查詢空房", "幫您查詢房"]
    found = any(hint in reply for hint in booking_guidance_hints)
    assert not found, (
        f"reply 不應包含訂房引導語，實際 reply: '{reply[:200]}'"
    )
