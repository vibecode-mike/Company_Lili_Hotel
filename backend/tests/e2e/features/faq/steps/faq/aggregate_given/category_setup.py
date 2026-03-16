from behave import given
from sqlalchemy import text


@given('旅宿業有以下大分類：')
def step_impl(context):
    db = context.db_session
    industry_id = context.ids.get("industry:旅宿業")
    if not industry_id:
        raise KeyError("找不到產業 '旅宿業' 的 ID，請先建立產業")

    headings = context.table.headings
    for row in context.table:
        is_active = row["is_active"].lower() == "true" if "is_active" in headings else True
        data_source_type = row["data_source_type"] if "data_source_type" in headings else "custom"
        is_system_default = row["is_system_default"].lower() == "true" if "is_system_default" in headings else False
        sort_order = int(row["sort_order"]) if "sort_order" in headings else 0

        db.execute(text(
            "INSERT INTO faq_categories "
            "(industry_id, name, is_active, data_source_type, is_system_default, sort_order, created_at, updated_at) "
            "VALUES (:industry_id, :name, :is_active, :data_source_type, :is_system_default, :sort_order, NOW(), NOW())"
        ), {
            "industry_id": industry_id,
            "name": row["name"],
            "is_active": is_active,
            "data_source_type": data_source_type,
            "is_system_default": is_system_default,
            "sort_order": sort_order,
        })
    db.commit()

    # Store category IDs
    result = db.execute(text(
        "SELECT id, name FROM faq_categories WHERE industry_id = :iid"
    ), {"iid": industry_id})
    for r in result:
        context.ids[f"category:{r[1]}"] = r[0]
