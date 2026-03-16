from behave import when


@when('使用者將該規則設為停用')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        try:
            context.services.faq_rule.toggle_rule(rule.id, is_enabled=False)
            context.last_error = None
        except Exception as e:
            context.last_error = e


@when('使用者將該規則設為啟用')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        try:
            context.services.faq_rule.toggle_rule(rule.id, is_enabled=True)
            context.last_error = None
        except Exception as e:
            context.last_error = e
