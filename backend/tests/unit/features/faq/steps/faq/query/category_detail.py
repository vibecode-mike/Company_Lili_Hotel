from behave import when


@when('使用者進入大分類「{category_name}」內頁')
def step_impl(context, category_name):
    try:
        context.query_result = context.services.faq_category.get_category_detail(category_name)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者在大分類「{category_name}」內頁')
def step_impl(context, category_name):
    try:
        context.query_result = context.services.faq_category.get_category_detail(category_name)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者進入測試聊天頁面')
def step_impl(context):
    user = context.memo.get("current_user")
    context.query_result = {
        "page": "test_chat",
        "permissions": user.permissions if user else [],
    }
