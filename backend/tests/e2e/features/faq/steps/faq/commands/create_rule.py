import json
import requests
from behave import when


@when('使用者在大分類「{category_name}」下新增規則：')
def step_impl(context, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    # Build content_json from datatable
    content = {}
    tag_names = []
    for row in context.table:
        field_name = row["field_name"]
        value = row["value"]
        if field_name == "標籤":
            tag_names = [t.strip() for t in value.split(",")]
        else:
            content[field_name] = value

    body = {
        "content_json": content,
        "tag_names": tag_names,
    }

    context.last_response = requests.post(
        f"{context.api_base}/faq/categories/{category_id}/rules",
        headers=context.auth_headers,
        json=body,
        timeout=10,
    )
