import requests
from behave import when


@when('使用者查詢 FAQ 大分類列表')
def step_impl(context):
    context.last_response = requests.get(
        f"{context.api_base}/faq/categories",
        headers=context.auth_headers,
        timeout=10,
    )
