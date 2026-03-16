from behave import then


@then('查詢結果應包含 {count:d} 筆規則')
def step_impl(context, count):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應"
    data = resp.json().get("data", {})
    items = data.get("items", [])
    assert len(items) == count, (
        f"預期 {count} 筆規則，實際 {len(items)} 筆"
    )
