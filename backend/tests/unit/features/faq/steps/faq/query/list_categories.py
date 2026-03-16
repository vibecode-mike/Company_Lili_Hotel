from behave import when


@when('使用者進入 FAQ 大分類列表頁面')
def step_impl(context):
    try:
        context.query_result = context.services.faq_category.list_categories()
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者在 FAQ 大分類列表頁面')
def step_impl(context):
    try:
        context.query_result = context.services.faq_category.list_categories()
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者在大分類列表頁面')
def step_impl(context):
    try:
        context.query_result = context.services.faq_category.list_categories()
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者進入 FAQ 管理頁面')
def step_impl(context):
    try:
        result = context.services.faq_category.list_categories()
        # Also fetch token usage if client_id is available
        client_id = list(context.ids.keys())[0] if context.ids else None
        if client_id:
            token_info = context.services.token.get_usage(client_id)
            result.update(token_info)
        context.query_result = result
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者登入系統後嘗試進入 FAQ 管理頁面')
def step_impl(context):
    client_id = list(context.ids.keys())[0] if context.ids else "default_client"
    try:
        context.query_result = context.services.faq_module.check_access(client_id)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者登入系統後進入 FAQ 管理頁面')
def step_impl(context):
    try:
        result = context.services.faq_category.list_categories()
        client_id = list(context.ids.keys())[0] if context.ids else None
        if client_id:
            token_info = context.services.token.get_usage(client_id)
            result.update(token_info)
        context.query_result = result
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者登入客戶後台進入 FAQ 管理頁面')
def step_impl(context):
    industry_name = context.memo.get("assigned_industry")
    try:
        context.query_result = context.services.faq_category.list_categories()
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者在 FAQ 管理頁面查看 Token 用量')
def step_impl(context):
    client_id = list(context.ids.keys())[0] if context.ids else "default_client"
    try:
        context.query_result = context.services.token.get_usage(client_id)
        context.last_error = None
    except Exception as e:
        context.last_error = e
