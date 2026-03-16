from behave import given
import requests


@given('民眾 intent_state 為 "{intent_state}"')
def step_impl(context, intent_state):
    """建立 session 並觸發對應 intent_state 的訊息，確保 session 存在。"""
    browser_key = context.memo["browser_key"]
    api_base = context.api_base

    # 發送含訂房意圖的訊息以確保 intent_state=confirmed
    if intent_state == "confirmed":
        payload = {"browser_key": browser_key, "message": "我想訂房"}
    else:
        payload = {"browser_key": browser_key, "message": "您好"}

    resp = requests.post(f"{api_base}/chatbot/message", json=payload, timeout=15)
    assert resp.status_code == 200, f"初始化 session 失敗：{resp.status_code} {resp.text[:200]}"
    context.memo["setup_response"] = resp.json()
