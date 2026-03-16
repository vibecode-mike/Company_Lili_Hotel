from behave import when


@when('使用者在「{category_name}」大分類內頁點擊新增規則')
def step_impl(context, category_name):
    context.memo["creating_rule_category"] = category_name
    try:
        context.query_result = context.services.faq_rule.get_edit_form(category_name)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者填入以下內容並儲存')
def step_impl(context):
    content = {}
    for row in context.table:
        content[row["field_name"]] = row["value"]
    category_name = context.memo.get("creating_rule_category", "default")
    try:
        context.services.faq_rule.create_rule(category_name, content)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者嘗試新增規則')
def step_impl(context):
    category_name = context.memo.get("creating_rule_category", "訂房")
    try:
        context.services.faq_rule.create_rule(category_name, {"name": "new_rule"})
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者未填入「{field_name}」（必填欄位）')
def step_impl(context, field_name):
    context.memo["missing_field"] = field_name
    context.memo["creating_rule_content"] = {}


@when('點擊儲存')
def step_impl(context):
    editing_rule = context.memo.get("editing_rule")
    if editing_rule:
        # Edit mode: update existing rule
        try:
            context.services.faq_rule.edit_rule(editing_rule.id, editing_rule.content_json)
            context.last_error = None
        except Exception as e:
            context.last_error = e
    else:
        # Create mode: validate and create new rule
        category_name = context.memo.get("creating_rule_category", "default")
        content = context.memo.get("creating_rule_content", {})
        try:
            context.services.faq_rule.validate_required_fields(category_name, content)
            context.services.faq_rule.create_rule(category_name, content)
            context.last_error = None
        except Exception as e:
            context.last_error = e
