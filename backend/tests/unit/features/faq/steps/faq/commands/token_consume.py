from behave import when


@when('一次 AI 回覆消耗了 {amount:d} 個 Token')
def step_impl(context, amount):
    client_id = list(context.ids.keys())[0] if context.ids else "default_client"
    try:
        context.services.token.consume(client_id, amount)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('Token 剩餘額度變為 {remaining:d}')
def step_impl(context, remaining):
    # This is a state assertion following the consume action
    # The consume in the previous step should have reduced it to this level
    context.memo["expected_remaining"] = remaining
