from behave import when
import requests


@when("/chatbot/message 計算 missing_fields")
def step_impl(context):
    """發送任意訊息觸發 missing_fields 計算，儲存 response 至 context.last_response。"""
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "您好"},
        timeout=15,
    )
    context.last_response = resp
