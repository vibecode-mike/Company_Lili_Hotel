from behave import then


@then('回應中規則狀態應為 "{expected_status}"')
def step_impl(context, expected_status):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應"
    data = resp.json().get("data", {})
    actual_status = data.get("status")
    assert actual_status == expected_status, (
        f"預期規則狀態 '{expected_status}'，實際 '{actual_status}'"
    )


@then('回應 Content-Type 為 {content_type}')
def step_impl_content_type(context, content_type):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應"
    actual_ct = resp.headers.get("content-type", "")
    assert content_type in actual_ct, (
        f"預期 Content-Type 包含 '{content_type}'，實際 '{actual_ct}'"
    )


@then('回應中 imported_count 大於 {count:d}')
def step_impl_import_count(context, count):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應"
    data = resp.json()
    imported = data.get("imported_count", 0)
    assert imported > count, (
        f"預期 imported_count > {count}，實際 {imported}"
    )
