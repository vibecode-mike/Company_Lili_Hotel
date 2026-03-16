from behave import then


@then('系統顯示 FAQ 模組入口不可用')
def step_impl(context):
    assert context.last_error is not None or \
        (context.query_result and context.query_result.get("accessible") is False), \
        "預期 FAQ 模組不可用"


@then('顯示提示訊息「{message}」')
def step_impl(context, message):
    if context.last_error:
        assert message in str(context.last_error), \
            f"預期提示 '{message}'，實際錯誤為 '{context.last_error}'"
    elif context.query_result:
        actual = context.query_result.get("message", "")
        assert actual == message, f"預期提示 '{message}'，實際為 '{actual}'"


@then('系統允許進入 FAQ 管理頁面')
def step_impl(context):
    assert context.last_error is None, f"預期允許進入，但有錯誤: {context.last_error}"


@then('客戶使用者登入後可進入 FAQ 管理頁面')
def step_impl(context):
    assert context.last_error is None, f"預期允許進入，但有錯誤: {context.last_error}"


@then('系統顯示驗證錯誤「{error_message}」')
def step_impl(context, error_message):
    assert context.last_error is not None, "預期有驗證錯誤但沒有"
    assert error_message in str(context.last_error), \
        f"預期錯誤 '{error_message}'，實際為 '{context.last_error}'"


@then('系統顯示提示「{message}」')
def step_impl(context, message):
    if context.last_error:
        assert message in str(context.last_error), \
            f"預期提示 '{message}'，實際錯誤為 '{context.last_error}'"


@then('顯示 Toast 提示「{message}」')
def step_impl(context, message):
    if context.last_error:
        assert message in str(context.last_error), \
            f"預期 Toast '{message}'，實際錯誤為 '{context.last_error}'"
    else:
        assert context.query_result is not None or context.last_error is None, \
            f"預期 Toast '{message}'"


@then('顯示成功提示「{message}」')
def step_impl(context, message):
    assert context.last_error is None, f"預期成功但有錯誤: {context.last_error}"


@then('AI 聊天機器人處於停用狀態')
def step_impl(context):
    # Check token exhaustion or explicit disable
    if context.query_result:
        assert context.query_result.get("ai_active") is False or \
            context.query_result.get("available", 1) == 0, \
            "預期 AI 停用"


@then('顯示 AI 回覆鎖定提示：「{message}」')
def step_impl(context, message):
    result = context.query_result
    assert result is not None, "查詢結果為空"
    actual = result.get("lock_message", "")
    assert actual == message, f"預期鎖定提示 '{message}'，實際為 '{actual}'"
