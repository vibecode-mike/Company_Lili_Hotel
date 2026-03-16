import json
from behave import given
from sqlalchemy import text


@given('大分類「{category_name}」下有以下規則：')
def step_impl(context, category_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    for row in context.table:
        content = row["content_json"]
        # Ensure it's a valid JSON string
        if isinstance(content, str):
            try:
                json.loads(content)
            except json.JSONDecodeError:
                content = json.dumps({"raw": content})

        db.execute(text(
            "INSERT INTO faq_rules "
            "(category_id, content_json, status, created_at, updated_at) "
            "VALUES (:category_id, :content_json, :status, NOW(), NOW())"
        ), {
            "category_id": category_id,
            "content_json": content,
            "status": row["status"],
        })
    db.commit()

    # Store rule IDs by extracting name from content_json
    result = db.execute(text(
        "SELECT id, content_json, status FROM faq_rules WHERE category_id = :cid"
    ), {"cid": category_id})
    for r in result:
        try:
            content = json.loads(r[1]) if isinstance(r[1], str) else r[1]
            # Try common name fields
            name = content.get("房型名稱") or content.get("設施名稱") or content.get("name", "")
            if name:
                context.ids[f"rule:{name}"] = r[0]
        except (json.JSONDecodeError, AttributeError):
            pass


@given('大分類「{category_name}」下已有 {count:d} 筆規則')
def step_impl_count(context, category_name, count):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    for i in range(count):
        content = json.dumps({"房型名稱": f"測試房型{i+1}", "房價": str(1000 + i * 100)})
        db.execute(text(
            "INSERT INTO faq_rules "
            "(category_id, content_json, status, created_at, updated_at) "
            "VALUES (:category_id, :content_json, 'active', NOW(), NOW())"
        ), {
            "category_id": category_id,
            "content_json": content,
        })
    db.commit()


@given('大分類「{category_name}」下有一筆已啟用的規則「{rule_name}」')
def step_impl_active_rule(context, category_name, rule_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    content = json.dumps({"房型名稱": rule_name, "房價": "3500", "房型特色": "測試", "人數": "2"}, ensure_ascii=False)
    db.execute(text(
        "INSERT INTO faq_rules "
        "(category_id, content_json, status, created_at, updated_at) "
        "VALUES (:category_id, :content_json, 'active', NOW(), NOW())"
    ), {
        "category_id": category_id,
        "content_json": content,
    })
    db.commit()

    result = db.execute(text("SELECT LAST_INSERT_ID()"))
    rule_id = result.scalar()
    context.ids[f"rule:{rule_name}"] = rule_id
    context.ids["last_rule_id"] = rule_id


@given('大分類「{category_name}」下有一筆 draft 狀態的規則「{rule_name}」')
def step_impl_draft_rule(context, category_name, rule_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    content = json.dumps({"房型名稱": rule_name, "房價": "5000", "房型特色": "測試", "人數": "4"}, ensure_ascii=False)
    db.execute(text(
        "INSERT INTO faq_rules "
        "(category_id, content_json, status, created_at, updated_at) "
        "VALUES (:category_id, :content_json, 'draft', NOW(), NOW())"
    ), {
        "category_id": category_id,
        "content_json": content,
    })
    db.commit()

    result = db.execute(text("SELECT LAST_INSERT_ID()"))
    rule_id = result.scalar()
    context.ids[f"rule:{rule_name}"] = rule_id
    context.ids["last_rule_id"] = rule_id


@given('大分類「{category_name}」下有一筆已停用的規則「{rule_name}」')
def step_impl_disabled_rule(context, category_name, rule_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    content = json.dumps({"房型名稱": rule_name, "房價": "3500", "房型特色": "測試", "人數": "2"}, ensure_ascii=False)
    db.execute(text(
        "INSERT INTO faq_rules "
        "(category_id, content_json, status, created_at, updated_at) "
        "VALUES (:category_id, :content_json, 'disabled', NOW(), NOW())"
    ), {
        "category_id": category_id,
        "content_json": content,
    })
    db.commit()

    result = db.execute(text("SELECT LAST_INSERT_ID()"))
    rule_id = result.scalar()
    context.ids[f"rule:{rule_name}"] = rule_id
    context.ids["last_rule_id"] = rule_id


@given('大分類「{category_name}」目前為關閉狀態')
def step_impl_category_closed(context, category_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    db.execute(text(
        "UPDATE faq_categories SET is_active = 0 WHERE id = :cid"
    ), {"cid": category_id})
    db.commit()
