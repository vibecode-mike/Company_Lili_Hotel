from behave import then
from sqlalchemy import text


@then('大分類「{category_name}」的 PMS 串接 snapshot_completed 應為 true')
def step_impl(context, category_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    assert category_id, f"找不到大分類 '{category_name}' 的 ID"

    db.expire_all()
    result = db.execute(text(
        "SELECT snapshot_completed FROM faq_pms_connections WHERE faq_category_id = :cid"
    ), {"cid": category_id})
    row = result.fetchone()
    assert row is not None, f"大分類 '{category_name}' 沒有 PMS 串接設定"
    assert bool(row[0]) is True, (
        f"snapshot_completed 預期 true，實際 {row[0]}"
    )
