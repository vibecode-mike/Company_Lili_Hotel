"""
Command steps for POST /chatbot/booking-save
"""
from behave import when
import requests


def _build_booking_save_body(context) -> dict:
    """Build request body for /chatbot/booking-save from context.memo."""
    use_override_key = context.memo.get("use_key_for_booking_save")
    browser_key = use_override_key or context.memo["browser_key"]
    body = {
        "browser_key": browser_key,
        "member_name": context.memo.get("member_name", "王小明"),
        "member_phone": context.memo.get("member_phone", "0912345678"),
        "member_email": context.memo.get("member_email", "test@example.com"),
    }
    # Omit dates when using override key (missing-fields test): service reads from session (empty)
    if not use_override_key:
        body["checkin_date"] = context.memo.get("checkin_date", "2026-04-01")
        body["checkout_date"] = context.memo.get("checkout_date", "2026-04-03")
    return body


@when("POST /chatbot/booking-save")
def step_post_booking_save(context):
    """POST /chatbot/booking-save — validation test (invalid data expected)."""
    body = _build_booking_save_body(context)
    resp = requests.post(
        f"{context.api_base}/chatbot/booking-save",
        json=body,
        timeout=15,
    )
    context.last_response = resp


@when("POST /chatbot/booking-save 執行")
def step_post_booking_save_execute(context):
    """POST /chatbot/booking-save — normal execution."""
    body = _build_booking_save_body(context)
    resp = requests.post(
        f"{context.api_base}/chatbot/booking-save",
        json=body,
        timeout=15,
    )
    context.last_response = resp


@when("前台取得 response")
def step_when_frontend_gets_response(context):
    """Frontend action: just ensure last_response is present."""
    assert context.last_response is not None
