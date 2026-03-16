from behave import when


@when('使用者將大分類「{category_name}」設為關閉')
def step_impl(context, category_name):
    try:
        context.services.faq_category.toggle_category(category_name, is_active=False)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者將大分類「{category_name}」設為啟用')
def step_impl(context, category_name):
    try:
        context.services.faq_category.toggle_category(category_name, is_active=True)
        context.last_error = None
    except Exception as e:
        context.last_error = e
