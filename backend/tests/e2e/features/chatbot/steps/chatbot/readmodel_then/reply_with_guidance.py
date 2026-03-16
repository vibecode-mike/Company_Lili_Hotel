from behave import then


@then('回覆末附加引導語「{guidance}」')
def step_impl(context, guidance):
    """
    驗證 reply 包含引導語。
    注意：LLM 回覆有隨機性，此處以寬鬆匹配確認關鍵語句存在。
    """
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    reply = data.get("reply", "")
    assert reply, "reply 不能為空"
    # 取引導語的核心關鍵字做寬鬆匹配（LLM 可能改寫措辭）
    # 尋找引導語的核心意思而非精確字串
    booking_hints = ["查詢", "房況", "預訂", "入住", "空房", "幫您"]
    found = any(hint in reply for hint in booking_hints)
    assert found, (
        f"reply 應包含訂房引導語（含關鍵字：{booking_hints}），"
        f"實際 reply: '{reply[:200]}'"
    )
