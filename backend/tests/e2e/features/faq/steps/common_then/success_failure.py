from behave import then


@then('操作成功')
def step_impl(context):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應（last_response 為 None）"
    assert resp.status_code in (200, 201, 204), (
        f"預期 HTTP 2XX，實際為 {resp.status_code}：{resp.text[:500]}"
    )


@then('操作失敗，錯誤為「{error_message}」')
def step_impl_failure(context, error_message):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應（last_response 為 None）"
    assert resp.status_code >= 400, (
        f"預期 HTTP 4XX，實際為 {resp.status_code}"
    )
    body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    detail = body.get("detail", "") or body.get("message", "")
    assert error_message in str(detail), (
        f"預期錯誤訊息包含「{error_message}」，實際為「{detail}」"
    )


@then('操作失敗，HTTP 狀態碼為 {status_code:d}')
def step_impl_http_failure(context, status_code):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應（last_response 為 None）"
    assert resp.status_code == status_code, (
        f"預期 HTTP {status_code}，實際為 {resp.status_code}：{resp.text[:500]}"
    )
