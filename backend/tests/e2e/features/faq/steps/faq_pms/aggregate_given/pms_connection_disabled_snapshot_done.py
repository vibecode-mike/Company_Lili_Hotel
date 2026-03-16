from behave import given
from sqlalchemy import text


@given('大分類「{category_name}」已有停用的 PMS 串接設定且 snapshot_completed 為 true')
def step_impl(context, category_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    # Remove existing connection if any
    db.execute(text(
        "DELETE FROM faq_pms_connections WHERE faq_category_id = :cid"
    ), {"cid": category_id})

    # Insert disabled PMS connection with snapshot_completed = true
    db.execute(text(
        "INSERT INTO faq_pms_connections "
        "(faq_category_id, api_endpoint, api_key_encrypted, auth_type, status, "
        " snapshot_completed, last_synced_at, created_at, updated_at) "
        "VALUES (:cid, 'https://pms.example.com/api/rooms', 'encrypted-key', "
        "'api_key', 'disabled', 1, NOW(), NOW(), NOW())"
    ), {"cid": category_id})
    db.commit()

    result = db.execute(text("SELECT LAST_INSERT_ID()"))
    conn_id = result.scalar()
    context.ids[f"pms_connection:{category_name}"] = conn_id
