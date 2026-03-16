from behave import then
from sqlalchemy import text


@then('大分類「{category_name}」的 PMS 串接狀態應為 "{expected_status}"')
def step_impl(context, category_name, expected_status):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    assert category_id, f"找不到大分類 '{category_name}' 的 ID"

    db.expire_all()
    result = db.execute(text(
        "SELECT status FROM faq_pms_connections WHERE faq_category_id = :cid"
    ), {"cid": category_id})
    row = result.fetchone()
    assert row is not None, f"大分類 '{category_name}' 沒有 PMS 串接設定"
    assert row[0] == expected_status, (
        f"PMS 串接狀態預期 '{expected_status}'，實際 '{row[0]}'"
    )
