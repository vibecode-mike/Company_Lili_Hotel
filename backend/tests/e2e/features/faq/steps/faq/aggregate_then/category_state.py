from behave import then
from sqlalchemy import text


@then('大分類「{category_name}」的 is_active 應為 {expected}')
def step_impl(context, category_name, expected):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    assert category_id, f"找不到大分類 '{category_name}' 的 ID"

    # Refresh session to see latest data
    db.expire_all()
    result = db.execute(text(
        "SELECT is_active FROM faq_categories WHERE id = :cid"
    ), {"cid": category_id})
    row = result.fetchone()
    assert row is not None, f"大分類 '{category_name}' 不存在於 DB"

    expected_bool = expected.lower() in ("true", "1", "yes")
    actual_bool = bool(row[0])
    assert actual_bool == expected_bool, (
        f"大分類 '{category_name}' is_active 預期 {expected_bool}，實際 {actual_bool}"
    )
