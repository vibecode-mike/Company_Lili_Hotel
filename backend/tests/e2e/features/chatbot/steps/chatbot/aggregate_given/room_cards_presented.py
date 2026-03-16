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


@given('reply_type = "room_cards" 已呈現給民眾')
def step_room_cards_presented(context):
    """建立 session 並確保 booking_context 齊全（讓系統有機會查詢房型）。"""
    _send(context, "我想訂房")
    _send(context, "我要1間雙人房")
    _send(context, "3月20號住到3月22號")
    # 觸發房型查詢
    _send(context, "有什麼房型可以住")


@given("民眾未點選任何房型卡片")
def step_no_room_selected(context):
    pass


@given("民眾選取「豪華雙人房 × 1」")
def step_select_deluxe_1(context):
    context.memo["selected_rooms"] = [
        {"room_type_code": "DLX", "room_count": 1, "room_type_name": "豪華雙人房", "source": "pms"}
    ]


@given("民眾選取「雙人房 × 1」與「四人房 × 1」")
def step_select_mixed(context):
    rooms = [
        {"room_type_code": "DBL", "room_count": 1, "room_type_name": "雙人房", "source": "pms"},
        {"room_type_code": "QUAD", "room_count": 1, "room_type_name": "四人房", "source": "pms"},
    ]
    context.memo["selected_rooms"] = rooms
    # Update the session via confirm-room API so booking-save reads 2 rooms
    requests.post(
        f"{context.api_base}/chatbot/confirm-room",
        json={"browser_key": context.memo["browser_key"], "rooms": rooms},
        timeout=10,
    )


@given("前端送出 room_count = 0")
def step_room_count_zero(context):
    context.memo["room_count_zero"] = True
