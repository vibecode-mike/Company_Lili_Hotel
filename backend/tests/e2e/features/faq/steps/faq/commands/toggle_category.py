import requests
from behave import when


@when('使用者將大分類「{category_name}」設為關閉')
def step_impl_close(context, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    context.last_response = requests.put(
        f"{context.api_base}/faq/categories/{category_id}/toggle",
        headers=context.auth_headers,
        json={"is_active": False},
        timeout=10,
    )


@when('使用者將大分類「{category_name}」設為啟用')
def step_impl_enable(context, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    context.last_response = requests.put(
        f"{context.api_base}/faq/categories/{category_id}/toggle",
        headers=context.auth_headers,
        json={"is_active": True},
        timeout=10,
    )
