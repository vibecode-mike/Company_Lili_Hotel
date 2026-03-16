import requests
from behave import when


@when('使用者將該規則設為停用')
def step_impl_disable(context):
    rule_id = context.ids.get("last_rule_id")
    if not rule_id:
        raise KeyError("找不到目標規則 ID")

    context.last_response = requests.patch(
        f"{context.api_base}/faq/rules/{rule_id}/toggle",
        headers=context.auth_headers,
        json={"status": "disabled"},
        timeout=10,
    )


@when('使用者將該規則設為啟用')
def step_impl_enable(context):
    rule_id = context.ids.get("last_rule_id")
    if not rule_id:
        raise KeyError("找不到目標規則 ID")

    context.last_response = requests.patch(
        f"{context.api_base}/faq/rules/{rule_id}/toggle",
        headers=context.auth_headers,
        json={"status": "active"},
        timeout=10,
    )
