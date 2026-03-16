from behave import when
import requests


@when("民眾再次傳送訊息")
def step_impl(context):
    """POST /api/v1/chatbot/message 送出任意訊息（用於觸發 session rotate）。"""
    browser_key = context.memo["browser_key"]
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": browser_key, "message": "您好"},
        timeout=30,
    )
    context.last_response = resp
