import requests
from behave import when


@when('使用者刪除該規則')
def step_impl(context):
    rule_id = context.ids.get("last_rule_id")
    if not rule_id:
        raise KeyError("找不到目標規則 ID，請先在 Given 步驟中建立規則")

    context.last_response = requests.delete(
        f"{context.api_base}/faq/rules/{rule_id}",
        headers=context.auth_headers,
        timeout=10,
    )
