from behave import when
import requests


@when("民眾再次傳送訊息觸發 _new_chatbot_session()")
def step_impl(context):
    """turn_count >= 5 時再送一則訊息，應觸發 rotate 建立新 session。"""
    old_session_id = context.memo.get("old_session_id")
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "請問有空房嗎"},
        timeout=15,
    )
    context.last_response = resp
    if resp.status_code == 200:
        context.memo["new_session_id"] = resp.json().get("session_id")
