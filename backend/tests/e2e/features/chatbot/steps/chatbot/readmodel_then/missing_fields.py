from behave import then


@then('missing_fields 包含 "{field}"')
def step_impl_contains(context, field):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    missing = data.get("missing_fields", [])
    assert field in missing, (
        f"missing_fields 應包含 '{field}'，實際 {missing}"
    )


@then('missing_fields 不包含 "{field}"')
def step_impl_not_contains(context, field):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    missing = data.get("missing_fields", [])
    assert field not in missing, (
        f"missing_fields 不應包含 '{field}'，實際 {missing}"
    )


@then("missing_fields 不包含日期欄位")
def step_impl_not_contains_dates(context):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    missing = data.get("missing_fields", [])
    assert "checkin_date" not in missing and "checkout_date" not in missing, (
        f"missing_fields 不應包含日期欄位，實際 {missing}"
    )


@then('missing_fields 仍包含 "checkin_date"')
def step_impl_still_contains_checkin(context):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    missing = data.get("missing_fields", [])
    assert "checkin_date" in missing, (
        f"missing_fields 應仍包含 'checkin_date'，實際 {missing}"
    )


@then("missing_fields 仍包含日期欄位")
def step_impl_still_contains_dates(context):
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    missing = data.get("missing_fields", [])
    assert "checkin_date" in missing or "checkout_date" in missing, (
        f"missing_fields 應仍包含日期欄位，實際 {missing}"
    )
