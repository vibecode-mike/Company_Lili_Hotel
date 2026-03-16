from behave import then


@then('顯示規則統計文字「{stats_text}」')
def step_impl(context, stats_text):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    actual = result.get("rule_stats_text", "")
    assert actual == stats_text, \
        f"預期規則統計文字 '{stats_text}'，實際為 '{actual}'"


@then('顯示來源文字「{source_text}」')
def step_impl(context, source_text):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    actual = result.get("source_text", "")
    assert actual == source_text, \
        f"預期來源文字 '{source_text}'，實際為 '{actual}'"


@then('系統顯示編輯彈窗，欄位依「{category_name}」大分類定義')
def step_impl(context, category_name):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    fields = result.get("fields", [])
    assert len(fields) == len(context.table.rows), \
        f"預期 {len(context.table.rows)} 個欄位，實際為 {len(fields)}"
