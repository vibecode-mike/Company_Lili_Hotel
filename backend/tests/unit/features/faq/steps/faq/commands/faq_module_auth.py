from behave import when


@when('系統商管理員為客戶「{client_id}」開通 FAQ 模組授權')
def step_impl(context, client_id):
    try:
        context.services.faq_module.authorize(client_id)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('系統商管理員為客戶「{client_id}」設定 Token 額度為 {quota:d}')
def step_impl(context, client_id, quota):
    try:
        context.services.token.set_quota(client_id, quota)
        context.last_error = None
    except Exception as e:
        context.last_error = e
