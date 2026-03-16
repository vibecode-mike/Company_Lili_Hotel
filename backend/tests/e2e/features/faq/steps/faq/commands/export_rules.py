import requests
from behave import when


@when('使用者匯出大分類「{category_name}」的規則')
def step_impl(context, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    context.last_response = requests.get(
        f"{context.api_base}/faq/categories/{category_id}/rules/export",
        headers=context.auth_headers,
        timeout=10,
    )
