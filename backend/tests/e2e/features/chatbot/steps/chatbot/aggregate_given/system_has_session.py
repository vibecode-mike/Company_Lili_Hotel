from behave import given


@given("系統持有民眾的 browser_key 與對應 session")
def step_impl(context):
    """
    session 由前置 Given（民眾 intent_state 為 "confirmed"）建立，
    此步驟僅確認 browser_key 存在於 context.memo 中。
    """
    assert "browser_key" in context.memo, "browser_key 未初始化，請確認 before_scenario 設定"
    assert context.memo["browser_key"], "browser_key 不能為空"
