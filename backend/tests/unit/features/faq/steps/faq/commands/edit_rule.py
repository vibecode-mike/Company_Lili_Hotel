from behave import when


@when('使用者點擊該規則的編輯按鈕')
def step_impl(context):
    rule = context.memo.get("current_rule")
    context.memo["editing_rule"] = rule


@when('修改「{field_name}」欄位從「{old_value}」改為「{new_value}」')
def step_impl(context, field_name, old_value, new_value):
    rule = context.memo.get("editing_rule") or context.memo.get("current_rule")
    if rule:
        rule.content_json[field_name] = new_value
        context.memo["edit_changes"] = {field_name: new_value}


@when('使用者編輯該規則內容並儲存')
def step_impl(context):
    rule = context.memo.get("editing_rule") or context.memo.get("current_rule")
    if rule:
        try:
            context.services.faq_rule.edit_rule(rule.id, rule.content_json)
            context.last_error = None
        except Exception as e:
            context.last_error = e
