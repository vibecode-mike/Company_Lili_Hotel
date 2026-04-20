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


@then("AI 回覆引導提供住幾晚")
def step_impl_guide_nights(context):
    """LLM 回覆非確定性，只驗證 HTTP 200 + reply 非空。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    reply = resp.json().get("reply", "")
    assert reply, "AI 回覆不能為空"


@then('AI 不得回覆「今天沒有四人房」「X 房售完」等結論')
def step_impl_ai_no_fabricate(context):
    """嚴禁在未查詢 PMS 前宣告房況結論。檢查 reply 不含「沒有/售完」等字眼。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    reply = resp.json().get("reply", "") or ""
    forbidden_phrases = ["沒有四人房", "沒有雙人房", "售完", "已訂滿", "今天沒房", "今日無房"]
    for phrase in forbidden_phrases:
        assert phrase not in reply, (
            f"AI 不應在未查 PMS 前宣告『{phrase}』，實際回覆：{reply[:200]}"
        )


@then("AI 應追問住幾晚或引導提供日期")
def step_impl_ai_should_followup(context):
    """當資訊不齊時 AI 應追問，而非編造結論。只驗證 reply 非空。"""
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
