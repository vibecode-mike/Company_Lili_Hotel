from behave import given
import requests


def _send(context, message: str):
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": message},
        timeout=15,
    )
    assert resp.status_code == 200
    return resp.json()


def _setup_member_form_session(context):
    """建立 session 並讓 reply_type 進入 member_form 狀態。"""
    _send(context, "我想訂房")
    _send(context, "我要1間雙人房")
    _send(context, "3月20號住到3月22號")
    # confirm-room 讓系統進入 member_form 狀態
    requests.post(
        f"{context.api_base}/chatbot/confirm-room",
        json={
            "browser_key": context.memo["browser_key"],
            "rooms": [{"room_type_code": "DLX", "room_count": 1, "room_type_name": "豪華雙人房", "source": "pms"}],
        },
        timeout=10,
    )


@given('reply_type = "member_form" 已呈現給民眾')
def step_member_form_presented(context):
    _setup_member_form_session(context)


@given("session.selected_rooms 非空")
def step_selected_rooms_not_empty(context):
    # 已由 reply_type = "member_form" Given 設定
    pass


@given('民眾填入電話 "0912345"（僅 7 位）')
def step_short_phone(context):
    context.memo["test_phone"] = "0912345"


@given('民眾填入 email "testexample.com"')
def step_invalid_email(context):
    context.memo["test_email"] = "testexample.com"


@given("民眾未填入姓名")
def step_no_name(context):
    context.memo["test_name"] = ""


@given('民眾填入：name="{name}", phone="{phone}", email="{email}"')
def step_fill_all_fields(context, name, phone, email):
    context.memo["member_name"] = name
    context.memo["member_phone"] = phone
    context.memo["member_email"] = email


@given("民眾看到會員資訊表單")
def step_sees_form(context):
    pass  # already set up in Background
