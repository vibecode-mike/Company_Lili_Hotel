from behave import given
import requests


def _send(context, message: str) -> dict:
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": message},
        timeout=15,
    )
    assert resp.status_code == 200, f"發送訊息失敗：{resp.status_code}"
    return resp.json()


@given("booking_context 中 room_plan_requests、checkin_date、checkout_date 皆已齊全")
def step_impl_all_complete(context):
    """送房型 + 日期訊息，讓 booking_context 齊全（人數／房型已改為選填，但仍可解析）。"""
    _send(context, "我想訂房")
    _send(context, "我要1間雙人房")
    _send(context, "3月20號住到3月22號")


@given("booking_context 中 checkin_date、checkout_date 皆已齊全")
def step_impl_dates_complete(context):
    """只送日期訊息，讓 checkin_date 與 checkout_date 齊全（不提供房型）。"""
    _send(context, "我想訂房")
    _send(context, "3月20號住到3月22號")


@given("民眾未指定人數或房型")
def step_no_headcount_or_roomtype(context):
    """民眾沒主動提房型／人數，走 query_pms_all_roomtypes 路徑。"""
    context.memo["no_headcount"] = True


@given("民眾主動指定人數 {n:d} 或房型「{code}」")
def step_has_headcount_or_roomtype(context, n, code):
    """民眾主動提人數或房型，走 query_pms 路徑。"""
    context.memo["requested_headcount"] = n
    context.memo["requested_roomtype"] = code


@given("ENABLE_PMS = true")
def step_pms_enabled(context):
    """記錄期望 PMS 啟用（E2E 無法改設定，只記錄供 skip 判斷）。"""
    context.memo["expect_pms"] = True


@given("ENABLE_PMS = false")
def step_pms_disabled(context):
    """記錄期望 PMS 停用。"""
    context.memo["expect_pms"] = False


@given("PMS API 連線正常")
def step_pms_ok(context):
    pass


@given("民眾需求為 {n:d} 人")
def step_n_people(context, n):
    context.memo["adults_request"] = n


@given("PMS 在 housingcnt={n:d} 時回傳空陣列")
def step_pms_empty_n(context, n):
    pass


@given("PMS API 呼叫拋出 requests.Timeout")
def step_pms_timeout(context):
    pass


@given("民眾需求 room_plan_requests = [{{ room_count:{room_count:d}, adults_per_room:{adults_per_room:d} }}]")
def step_mixed_request(context, room_count, adults_per_room):
    context.memo["room_plan"] = {"room_count": room_count, "adults_per_room": adults_per_room}


@given("PMS 無 {n:d} 人房剩餘")
def step_no_n_people_room(context, n):
    pass


@given("PMS 回傳空房型")
def step_pms_empty(context):
    pass


@given("FAQ_KB 亦無符合條件的靜態房型")
def step_kb_empty(context):
    pass
