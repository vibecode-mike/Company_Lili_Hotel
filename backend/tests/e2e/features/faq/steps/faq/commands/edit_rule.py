import json
import requests
from behave import when
from sqlalchemy import text


@when('使用者編輯該規則，修改房價為 "{new_price}"')
def step_impl(context, new_price):
    rule_id = context.ids.get("last_rule_id")
    if not rule_id:
        raise KeyError("找不到目標規則 ID，請先在 Given 步驟中建立規則")

    # Read current content from DB, modify price
    db = context.db_session
    result = db.execute(text(
        "SELECT content_json FROM faq_rules WHERE id = :rid"
    ), {"rid": rule_id})
    row = result.fetchone()
    content = json.loads(row[0]) if row else {}
    content["房價"] = new_price

    context.last_response = requests.put(
        f"{context.api_base}/faq/rules/{rule_id}",
        headers=context.auth_headers,
        json={"content_json": content, "tag_names": []},
        timeout=10,
    )
