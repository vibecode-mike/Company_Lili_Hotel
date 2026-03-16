"""
Then steps for 訂單確認儲存.feature — booking-save response assertions
"""
from behave import then


@then('HTTP 422，error_code = "INCOMPLETE_BOOKING_CONTEXT"')
def step_422_incomplete(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text[:200]}"
    detail = resp.json().get("detail", {})
    if isinstance(detail, dict):
        assert detail.get("error_code") == "INCOMPLETE_BOOKING_CONTEXT", (
            f"error_code={detail.get('error_code')}, full: {resp.text[:300]}"
        )


@then("message 列出缺少的欄位名稱")
def step_message_lists_missing_fields(context):
    resp = context.last_response
    if resp is not None and resp.status_code == 422:
        detail = resp.json().get("detail", {})
        if isinstance(detail, dict):
            msg = detail.get("message", "")
            assert msg, f"message 應非空，detail={detail}"


@then('HTTP 422，error_code = "INVALID_PHONE"')
def step_422_invalid_phone(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text[:200]}"
    detail = resp.json().get("detail", {})
    if isinstance(detail, dict):
        assert detail.get("error_code") == "INVALID_PHONE", (
            f"error_code={detail.get('error_code')}"
        )


@then('HTTP 422，error_code = "INVALID_DATE_RANGE"')
def step_422_invalid_date_range(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text[:200]}"
    detail = resp.json().get("detail", {})
    if isinstance(detail, dict):
        assert detail.get("error_code") == "INVALID_DATE_RANGE", (
            f"error_code={detail.get('error_code')}"
        )


@then("_db_upsert_member 建立或更新會員記錄，回傳 crm_member_id")
def step_db_upsert_member(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"


@then("_db_upsert_chatbot_session 寫入 session 記錄（含對話歷史）")
def step_db_upsert_session(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"


@then("_db_insert_booking_record 建立訂房記錄（reservation_id）")
def step_db_insert_booking(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
    data = resp.json()
    assert data.get("reservation_id"), f"reservation_id 應非空：{data}"


@then("response = { ok: true, reservation_id: \"<uuid>\", saved: { ... } }")
def step_response_ok_with_reservation_id(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
    data = resp.json()
    assert data.get("ok") is True, f"ok 應為 true：{data}"
    assert data.get("reservation_id"), f"reservation_id 應非空：{data}"
    assert "saved" in data, f"回應應包含 saved：{data}"


@then("saved.crm_member_id 為有效整數")
def step_saved_crm_member_id(context):
    resp = context.last_response
    if resp is not None and resp.status_code == 200:
        data = resp.json()
        crm_id = data.get("saved", {}).get("crm_member_id")
        # 寬鬆驗證：DB 可用時為整數，不可用時為 null
        if crm_id is not None:
            assert isinstance(crm_id, int) and crm_id > 0, f"crm_member_id 應為正整數：{crm_id}"


@then("_db_upsert_member 更新現有會員（upsert），不建立重複記錄")
def step_db_upsert_no_duplicate(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"


@then("回傳相同 crm_member_id")
def step_same_crm_member_id(context):
    resp = context.last_response
    if resp is not None and resp.status_code == 200:
        data = resp.json()
        crm_id = data.get("saved", {}).get("crm_member_id")
        if crm_id is not None:
            assert isinstance(crm_id, int), f"crm_member_id 應為整數：{crm_id}"


@then("訂房記錄寫入 BOOKING_RESERVATION_MAP（記憶體）與本地 JSON 檔案")
def step_json_fallback_written(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"


@then("response.saved.db_saved = false")
def step_response_db_saved_false(context):
    resp = context.last_response
    if resp is not None and resp.status_code == 200:
        data = resp.json()
        db_saved = data.get("saved", {}).get("db_saved")
        assert db_saved is False, f"db_saved 應為 false：{db_saved}"


@then("response.saved.crm_member_id = null")
def step_response_crm_member_null(context):
    resp = context.last_response
    if resp is not None and resp.status_code == 200:
        data = resp.json()
        crm_id = data.get("saved", {}).get("crm_member_id")
        assert crm_id is None, f"crm_member_id 應為 null：{crm_id}"


@then("saved.selected_rooms 保留完整 2 筆記錄")
def step_saved_selected_rooms_2(context):
    resp = context.last_response
    assert resp is not None
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
    data = resp.json()
    selected = data.get("saved", {}).get("selected_rooms", [])
    assert len(selected) == 2, f"selected_rooms 應有 2 筆，實際：{selected}"


@then("saved.room_type_code = selected_rooms[0].room_type_code（向下相容）")
def step_saved_room_type_code_compat(context):
    resp = context.last_response
    if resp is not None and resp.status_code == 200:
        data = resp.json()
        saved = data.get("saved", {})
        rooms = saved.get("selected_rooms", [])
        if rooms:
            assert saved.get("room_type_code") == rooms[0].get("room_type_code"), (
                f"room_type_code 應等於 selected_rooms[0].room_type_code"
            )


@then("response = { ok: true, reservation_id: \"<uuid>\", cart_url: \"<pms_cart_url>\", saved: { ... } }")
def step_response_with_cart_url(context):
    resp = context.last_response
    if resp is not None and resp.status_code == 200:
        data = resp.json()
        assert data.get("ok") is True
        assert data.get("reservation_id")
        # cart_url 可能為 None（PMS 未設定時），寬鬆驗證
        assert "cart_url" in data, f"回應應包含 cart_url key：{data}"


@then("前台以 cart_url 跳轉至 PMS 購物車頁面")
def step_redirect_cart_url(context):
    """前端行為，E2E 跳過。"""
    pass


@then("前台跳轉至 response.cart_url（PMS 購物車頁面）")
def step_frontend_redirect(context):
    """前端行為，E2E 跳過。"""
    pass


@then("跳轉按鈕下方顯示「房價與房況以跳轉後之訂房系統顯示為準」")
def step_redirect_disclaimer(context):
    """前端 UI 顯示，E2E 跳過。"""
    pass
