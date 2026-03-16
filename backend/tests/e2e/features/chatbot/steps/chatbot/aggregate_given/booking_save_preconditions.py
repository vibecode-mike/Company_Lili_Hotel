"""
Scenario-specific Given steps for 訂單確認儲存.feature
"""
from behave import given
import requests


@given("session 缺少 checkin_date")
def step_missing_checkin(context):
    """Override: use a fresh browser_key that never had dates set."""
    # Create a new browser_key that only has selected_rooms (no dates)
    import uuid
    bare_key = str(uuid.uuid4())
    context.memo["missing_fields_key"] = bare_key
    # Send just a room selection without dates
    requests.post(
        f"{context.api_base}/chatbot/confirm-room",
        json={
            "browser_key": bare_key,
            "rooms": [{"room_type_code": "DLX", "room_count": 1, "room_type_name": "豪華雙人房", "source": "pms"}],
        },
        timeout=10,
    )
    # Mark that booking-save should use this bare key
    context.memo["use_key_for_booking_save"] = bare_key


@given('傳入 phone = "091234567"（9 位）')
def step_invalid_phone(context):
    """Override member phone with 9-digit invalid number."""
    context.memo["member_phone"] = "091234567"


@given('checkin_date = "2026-03-09", checkout_date = "2026-03-07"')
def step_invalid_date_range(context):
    """Override dates to invalid range (checkout before checkin)."""
    context.memo["checkin_date"] = "2026-03-09"
    context.memo["checkout_date"] = "2026-03-07"


@given("ENABLE_DB = true")
def step_enable_db_true(context):
    """Mark that DB should be enabled. Backend defaults to env setting."""
    context.memo["enable_db"] = True


@given("DB 連線正常")
def step_db_ok(context):
    """Assumed: backend MySQL is running. No additional action needed."""
    pass


@given("ENABLE_DB = false")
def step_enable_db_false(context):
    """Mark that DB is disabled (test/JSON mode)."""
    context.memo["enable_db"] = False


@given('CRM 中已有 phone="0912345678", email="test@example.com" 的會員')
def step_existing_crm_member(context):
    """Mark that an existing member with this phone+email should exist.
    In E2E: we rely on the upsert logic; no direct DB write needed here.
    """
    context.memo["expect_upsert"] = True


@given("PMS 購物車 API 正常")
def step_pms_cart_ok(context):
    """Assumed: PMS API available. No additional action for @ignore scenario."""
    pass


@given("booking-save 執行成功且 response 含 cart_url")
def step_booking_save_done_with_cart_url(context):
    """Pre-call booking-save and store response."""
    resp = requests.post(
        f"{context.api_base}/chatbot/booking-save",
        json={"browser_key": context.memo["browser_key"]},
        timeout=15,
    )
    context.last_response = resp


@given("前台取得 response")
def step_frontend_gets_response(context):
    """Frontend: just verify last_response exists."""
    assert context.last_response is not None, "last_response is None"
