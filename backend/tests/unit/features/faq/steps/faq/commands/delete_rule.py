from behave import when


@when('使用者點擊該規則的刪除按鈕')
def step_impl(context):
    rule = context.memo.get("current_rule")
    context.memo["deleting_rule"] = rule


@when('確認刪除')
def step_impl(context):
    rule = context.memo.get("deleting_rule") or context.memo.get("current_rule")
    if rule:
        try:
            context.services.faq_rule.delete_rule(rule.id)
            context.last_error = None
        except Exception as e:
            context.last_error = e
