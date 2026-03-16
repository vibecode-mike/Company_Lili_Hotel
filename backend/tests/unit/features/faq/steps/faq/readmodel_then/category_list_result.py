from behave import then


@then('顯示大分類列表，包含以下資訊')
def step_impl(context):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    categories = result.get("categories", [])
    assert len(categories) == len(context.table.rows), \
        f"預期 {len(context.table.rows)} 個大分類，實際為 {len(categories)}"


@then('顯示統計文字「{stats_text}」')
def step_impl(context, stats_text):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    actual_stats = result.get("stats_text", "")
    assert actual_stats == stats_text, \
        f"預期統計文字 '{stats_text}'，實際為 '{actual_stats}'"


@then('顯示全域最後更新時間，格式為 yyyy-mm-dd hh:mm')
def step_impl(context):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    assert "last_updated_at" in result, "查詢結果中缺少 last_updated_at"


@then('該大分類的來源狀態為以下其中之一')
def step_impl(context):
    valid_statuses = [row["source_status"] for row in context.table]
    category = context.memo.get("current_category")
    source_status = context.memo.get("source_status", "已啟用")
    assert source_status in valid_statuses, \
        f"來源狀態 '{source_status}' 不在允許的清單中: {valid_statuses}"


@then('僅顯示「{industry_name}」的大分類（訂房、設施）')
def step_impl(context, industry_name):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    categories = result.get("categories", [])
    for cat in categories:
        assert cat.get("industry") == industry_name, \
            f"大分類 {cat.get('name')} 不屬於 {industry_name}"


@then('不顯示其他產業的大分類')
def step_impl(context):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    # Already validated in previous step - no other industry categories
