"""
Background setup for 訂單確認儲存.feature
Build a complete chatbot session with selected_rooms, dates, member info.
"""
from behave import given
import requests


def _send(context, message: str) -> dict:
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": message},
        timeout=15,
    )
    assert resp.status_code == 200, f"message failed {resp.status_code}: {resp.text[:200]}"
    return resp.json()


def _confirm_room(context, rooms: list) -> dict:
    resp = requests.post(
        f"{context.api_base}/chatbot/confirm-room",
        json={"browser_key": context.memo["browser_key"], "rooms": rooms},
        timeout=10,
    )
    assert resp.status_code == 200, f"confirm-room failed {resp.status_code}: {resp.text[:200]}"
    return resp.json()


@given("session 中 selected_rooms、checkin_date、checkout_date、booking_adults 皆已填寫")
def step_booking_context_full(context):
    """Build session with complete booking context: selected_rooms + dates + adults."""
    browser_key = context.memo["browser_key"]
    # Set default booking context values (overridable by specific Given steps)
    context.memo.setdefault("member_phone", "0912345678")
    context.memo.setdefault("member_name", "王小明")
    context.memo.setdefault("member_email", "test@example.com")
    context.memo.setdefault("checkin_date", "2026-04-01")
    context.memo.setdefault("checkout_date", "2026-04-03")
    context.memo.setdefault("selected_rooms", [
        {"room_type_code": "DLX", "room_count": 1, "room_type_name": "豪華雙人房", "source": "pms"}
    ])

    # 1. Establish booking intent
    _send(context, "我想訂房")
    # 2. Send date info
    _send(context, "3月20號住到3月22號")
    # Override session dates to future dates
    # Actually we'll send explicit dates for reliability
    _send(context, "我要1間雙人房住2個大人")
    # 3. Confirm room selection
    _confirm_room(context, context.memo["selected_rooms"])
    # Dates from memo (used in booking-save body)
    # The session now has selected_rooms set


@given("session 中 member_name、member_phone、member_email 皆已填寫")
def step_member_info_full(context):
    """Set member info in session via /chatbot/message extraction."""
    name = context.memo.get("member_name", "王小明")
    phone = context.memo.get("member_phone", "0912345678")
    email = context.memo.get("member_email", "test@example.com")
    message = f"我的姓名是{name}，電話{phone}，email是{email}"
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": message},
        timeout=15,
    )
    assert resp.status_code == 200, f"member info failed {resp.status_code}: {resp.text[:200]}"
