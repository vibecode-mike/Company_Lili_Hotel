import requests
from behave import when


@when('使用者執行發佈')
def step_impl(context):
    context.last_response = requests.post(
        f"{context.api_base}/faq/publish",
        headers=context.auth_headers,
        json={},
        timeout=10,
    )
