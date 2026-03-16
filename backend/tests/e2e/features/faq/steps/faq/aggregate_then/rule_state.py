import json
from behave import then
from sqlalchemy import text


@then('該規則的狀態應為 "{expected_status}"')
def step_impl(context, expected_status):
    db = context.db_session
    rule_id = context.ids.get("last_rule_id")
    assert rule_id, "找不到目標規則 ID"

    db.expire_all()
    result = db.execute(text(
        "SELECT status FROM faq_rules WHERE id = :rid"
    ), {"rid": rule_id})
    row = result.fetchone()
    assert row is not None, f"規則 ID={rule_id} 不存在於 DB"
    assert row[0] == expected_status, (
        f"規則狀態預期 '{expected_status}'，實際 '{row[0]}'"
    )


@then('大分類「{category_name}」下不存在規則「{rule_name}」')
def step_impl_not_exists(context, category_name, rule_name):
    db = context.db_session
    category_id = context.ids.get(f"category:{category_name}")
    assert category_id, f"找不到大分類 '{category_name}' 的 ID"

    db.expire_all()
    result = db.execute(text(
        "SELECT id, content_json FROM faq_rules WHERE category_id = :cid"
    ), {"cid": category_id})

    for row in result:
        try:
            content = json.loads(row[1]) if isinstance(row[1], str) else row[1]
            name = content.get("房型名稱") or content.get("設施名稱") or ""
            assert name != rule_name, (
                f"規則 '{rule_name}' 仍存在於 DB（id={row[0]}）"
            )
        except (json.JSONDecodeError, AttributeError):
            pass


@then('規則「{rule_name}」的狀態應為 "{expected_status}"')
def step_impl_named_rule(context, rule_name, expected_status):
    db = context.db_session
    rule_id = context.ids.get(f"rule:{rule_name}")
    assert rule_id, f"找不到規則 '{rule_name}' 的 ID"

    db.expire_all()
    result = db.execute(text(
        "SELECT status FROM faq_rules WHERE id = :rid"
    ), {"rid": rule_id})
    row = result.fetchone()
    assert row is not None, f"規則 '{rule_name}' (id={rule_id}) 不存在於 DB"
    assert row[0] == expected_status, (
        f"規則 '{rule_name}' 狀態預期 '{expected_status}'，實際 '{row[0]}'"
    )


@then('規則「{rule_name}」的狀態維持 "{expected_status}"')
def step_impl_unchanged(context, rule_name, expected_status):
    # Same logic as above - just verify current state
    db = context.db_session
    rule_id = context.ids.get(f"rule:{rule_name}")
    assert rule_id, f"找不到規則 '{rule_name}' 的 ID"

    db.expire_all()
    result = db.execute(text(
        "SELECT status FROM faq_rules WHERE id = :rid"
    ), {"rid": rule_id})
    row = result.fetchone()
    assert row is not None, f"規則 '{rule_name}' (id={rule_id}) 不存在於 DB"
    assert row[0] == expected_status, (
        f"規則 '{rule_name}' 狀態預期維持 '{expected_status}'，實際 '{row[0]}'"
    )
