from behave import given
from sqlalchemy import text


@given('大分類「{category_name}」尚未有 PMS 串接設定')
def step_impl(context, category_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    # Ensure no PMS connection exists for this category
    db.execute(text(
        "DELETE FROM faq_pms_connections WHERE faq_category_id = :cid"
    ), {"cid": category_id})
    db.commit()
