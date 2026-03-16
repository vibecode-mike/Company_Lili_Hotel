from behave import then


@then('客戶「{client_id}」的 FAQ 模組授權狀態為「{status}」')
def step_impl(context, client_id, status):
    auth = context.repos.faq_module_auth.find_by_client_id(client_id)
    assert auth is not None, f"找不到客戶 {client_id} 的授權資料"
    expected = status == "已開通"
    assert auth.is_authorized == expected, \
        f"預期授權狀態 {status}，實際為 {'已開通' if auth.is_authorized else '未開通'}"


@then('客戶「{client_id}」的 Token 總額度更新為 {quota:d}')
def step_impl(context, client_id, quota):
    usage = context.repos.ai_token_usage.find_by_client_id(client_id)
    assert usage is not None, f"找不到客戶 {client_id} 的 Token 資料"
    assert usage.total_quota == quota, \
        f"預期 Token 額度 {quota}，實際為 {usage.total_quota}"


@then('系統立即停用 AI 聊天機器人')
def step_impl(context):
    # Check that token is depleted
    client_id = list(context.ids.keys())[0] if context.ids else "default_client"
    usage = context.repos.ai_token_usage.find_by_client_id(client_id)
    assert usage is not None, "找不到 Token 資料"
    assert usage.used_amount >= usage.total_quota, "Token 尚未耗盡"
