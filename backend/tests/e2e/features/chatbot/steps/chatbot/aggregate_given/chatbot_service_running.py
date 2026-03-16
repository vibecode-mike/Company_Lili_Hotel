from behave import given
import requests


@given("系統已啟動聊天機器人服務")
def step_impl(context):
    """確認 chatbot API 端點可用。"""
    resp = requests.get(
        f"{context.api_base}/chatbot/rooms",
        params={
            "browser_key": context.memo["browser_key"],
            "checkin_date": "2099-01-01",
            "checkout_date": "2099-01-02",
            "adults": 1,
        },
        timeout=10,
    )
    assert resp.status_code in (200, 422, 503), (
        f"Chatbot service 無回應，狀態碼 {resp.status_code}"
    )
