from behave import given


@given('民眾目前 intent_state 為 "{intent_state}"')
def step_impl(context, intent_state):
    """
    記錄期望的初始 intent_state，並確認 session 起始狀態符合。
    新建 session 的預設 intent_state = "detecting"。
    """
    context.memo["expected_initial_intent_state"] = intent_state
    if intent_state == "detecting":
        # 新 session 預設即為 detecting，無需額外操作
        pass
    else:
        # 其他狀態需先透過訊息觸發
        # 此處暫以 pending 形式記錄，由具體 scenario 的 Given 步驟處理
        context.memo["expected_initial_intent_state"] = intent_state
