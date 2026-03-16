import requests
from behave import when


@when('管理員查詢大分類「{category_name}」的 PMS 串接設定')
def step_impl(context, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    resp = requests.get(
        f"{context.api_base}/faq/categories/{category_id}/pms-connection",
        headers=context.auth_headers,
        timeout=10,
    )
    context.last_response = resp
