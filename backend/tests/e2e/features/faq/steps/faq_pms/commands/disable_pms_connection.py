import requests
from behave import when


@when('管理員停用大分類「{category_name}」的 PMS 串接')
def step_impl(context, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    resp = requests.put(
        f"{context.api_base}/faq/categories/{category_id}/pms-connection/toggle",
        headers=context.auth_headers,
        json={"status": "disabled"},
        timeout=10,
    )
    context.last_response = resp
