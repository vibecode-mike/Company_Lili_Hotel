from behave import then


@then('顯示 AI Token 可用數量：{available:d}')
def step_impl(context, available):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    actual = result.get("available", 0)
    assert actual == available, \
        f"預期可用 Token {available}，實際為 {actual}"


@then('顯示 AI Token 已消耗數量：{used:d}')
def step_impl(context, used):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    actual = result.get("used_amount", 0)
    assert actual == used, \
        f"預期已消耗 Token {used}，實際為 {actual}"


@then('顯示 AI Token 總額度：{total:d}')
def step_impl(context, total):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    actual = result.get("total_quota", 0)
    assert actual == total, \
        f"預期 Token 總額度 {total}，實際為 {actual}"


@then('顯示 Token 用量為 {used:d} / {total:d}')
def step_impl(context, used, total):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    actual_used = result.get("used_amount", 0)
    actual_total = result.get("total_quota", 0)
    assert actual_used == used, f"預期已用 {used}，實際為 {actual_used}"
    assert actual_total == total, f"預期總額 {total}，實際為 {actual_total}"
