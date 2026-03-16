import requests
from behave import when


@when('管理員為大分類「{category_name}」建立 PMS 串接設定：')
def step_impl(context, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    row = context.table[0]
    payload = {
        "api_endpoint": row["api_endpoint"],
        "api_key": row["api_key"],
        "auth_type": row["auth_type"],
    }

    resp = requests.post(
        f"{context.api_base}/faq/categories/{category_id}/pms-connection",
        headers=context.auth_headers,
        json=payload,
        timeout=10,
    )
    context.last_response = resp
