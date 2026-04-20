from behave import given
import requests


def _send(context, message: str) -> dict:
    """Helper: 呼叫 /chatbot/message 並回傳 response body。"""
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": message},
        timeout=15,
    )
    assert resp.status_code == 200, f"發送訊息失敗：{resp.status_code} {resp.text[:200]}"
    return resp.json()


@given("booking_context 中 room_plan_requests 為空")
def step_impl_room_plan_empty(context):
    """新 session 預設 room_plan_requests 為空，無需特別設定。"""
    # 確認 browser_key 已存在，session 將在第一次 When 時建立
    assert "browser_key" in context.memo


@given("checkin_date 與 checkout_date 已知")
def step_impl_dates_set(context):
    """送含日期訊息讓系統解析 checkin/checkout。"""
    _send(context, "3月20號住到3月22號")


@given("booking_context 中 checkin_date 已設定")
def step_impl_checkin_only(context):
    """只送入住日，不含退房日，讓 checkout_date 維持 null。"""
    _send(context, "3月20號入住")


@given("booking_context 中 checkin_date 為 null")
def step_impl_checkin_still_null(context):
    """新 session 預設 checkin_date 為 null。"""
    assert "browser_key" in context.memo


@given("booking_context 為新 session")
def step_impl_new_session(context):
    """新 session，尚未送任何訊息。"""
    assert "browser_key" in context.memo


@given("booking_context 中 room_plan_requests 已設定")
def step_impl_room_plan_set(context):
    """送含房型訊息讓系統解析（選填資訊）。"""
    _send(context, "我要1間雙人房")


@given("checkin_date 為 null")
def step_impl_checkin_null(context):
    """新 session 預設 checkin_date 為 null，無需特別設定。"""
    assert "browser_key" in context.memo


@given("checkout_date 為 null")
def step_impl_checkout_null(context):
    """新 session 預設 checkout_date 為 null，無需特別設定。"""
    assert "browser_key" in context.memo


@given("booking_context room_plan_requests 已設定")
def step_impl_room_plan_set_alt(context):
    """送含房型訊息讓系統解析（備用 Given 文案；選填資訊）。"""
    _send(context, "我要1間雙人房")


@given('今天日期為 "{today}"')
def step_impl_today(context, today):
    """記錄今天日期供後續 Then 驗證用。"""
    context.memo["today"] = today


@given('booking_context.checkin_date = "{checkin_date}"')
def step_impl_checkin_set(context, checkin_date):
    """送含日期訊息設定 checkin_date。"""
    # 將 "2026-03-10" 轉成訊息（"3月10號入住"）
    from datetime import datetime
    dt = datetime.strptime(checkin_date, "%Y-%m-%d")
    message = f"{dt.month}月{dt.day}號入住"
    _send(context, message)
    context.memo["old_checkin_date"] = checkin_date


@given('booking_context.rooms 已設定為某房型')
def step_impl_rooms_set(context):
    """記錄已選房型（此 Given 在 rotate 測試中用於描述 rotate 前狀態）。
    使用 context.table 讀取 DataTable 或直接記錄狀態即可。
    """
    context.memo["pre_rotate_rooms"] = {"noted": True}


@given("booking_context 目前 room_plan_requests 為空")
def step_impl_room_plan_currently_empty(context):
    """新 session 預設 room_plan_requests 為空。"""
    assert "browser_key" in context.memo
