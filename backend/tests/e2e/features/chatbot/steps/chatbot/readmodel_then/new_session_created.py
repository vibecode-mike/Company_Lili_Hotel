from behave import then


@then("系統建立新 session（新 session_id）")
def step_impl(context):
    """驗證 rotate 後 session_id 已更新。"""
    resp = context.last_response
    assert resp is not None, "context.last_response 為 None"
    assert resp.status_code == 200, f"期望 200，實際 {resp.status_code}"
    data = resp.json()
    new_session_id = data.get("session_id")
    old_session_id = context.memo.get("old_session_id")
    assert new_session_id, "新 session_id 不能為空"
    assert old_session_id, "old_session_id 未記錄，請確認 Given 步驟"
    assert new_session_id != old_session_id, (
        f"session_id 應已更新（rotate），舊={old_session_id}，新={new_session_id}"
    )
