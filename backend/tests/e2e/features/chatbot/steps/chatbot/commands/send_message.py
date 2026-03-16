from behave import when, given
import requests


@given("民眾傳送「{message}」")
@when("民眾傳送「{message}」")
def step_impl(context, message):
    """POST /api/v1/chatbot/message 送出指定訊息。"""
    browser_key = context.memo["browser_key"]
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": browser_key, "message": message},
        timeout=30,
    )
    context.last_response = resp
