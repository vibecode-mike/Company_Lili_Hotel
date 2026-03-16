from behave import given
from sqlalchemy import text


@given('大分類「{category_name}」有以下欄位定義：')
def step_impl(context, category_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID，請先建立大分類")

    for row in context.table:
        db.execute(text(
            "INSERT INTO faq_category_fields "
            "(category_id, field_name, field_type, is_required, sort_order, created_at, updated_at) "
            "VALUES (:category_id, :field_name, :field_type, :is_required, :sort_order, NOW(), NOW())"
        ), {
            "category_id": category_id,
            "field_name": row["field_name"],
            "field_type": row["field_type"],
            "is_required": row["is_required"].lower() == "true",
            "sort_order": int(row["sort_order"]),
        })
    db.commit()
