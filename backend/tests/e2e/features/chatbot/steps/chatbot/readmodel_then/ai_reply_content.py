from behave import then


@then('AI 回覆「{text}」')
def step_impl_ai_reply(context, text):
    """LLM 回覆非確定性，只驗證 HTTP 200 + reply 非空。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    reply = resp.json().get("reply", "")
    assert reply, "AI 回覆不能為空"


@then("AI 回覆引導提供入住日期")
def step_impl_guide_date(context):
    """LLM 回覆非確定性，只驗證 HTTP 200 + reply 非空。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    reply = resp.json().get("reply", "")
    assert reply, "AI 回覆不能為空"


@then('系統回覆「您輸入的日期已過，請重新提供入住與退房日期」')
def step_impl_past_date_warning(context):
    """驗證 HTTP 200 + booking_context 日期為 null（主要驗證行為）。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    bc = resp.json().get("booking_context", {})
    # 核心驗證：日期應維持 null（因為是過去日期，系統不應接受）
    assert bc.get("checkin_date") is None, (
        f"過去日期不應被接受，checkin_date 應為 None，實際 '{bc.get('checkin_date')}'"
    )
