from behave import given
from app.models.faq_rule import FaqRule
from app.models.faq_category import FaqCategory


STATUS_MAP = {
    "已啟用": True, "已停用": False,
}
PUBLISH_MAP = {
    "已發佈": True, "未發佈": False,
}


def _ensure_category(context, category_name):
    """Ensure category exists, auto-create with fields if needed."""
    category = context.repos.faq_category.find_by_name(category_name)
    if category is None:
        from app.models.faq_category_field import FaqCategoryField
        from .category_setup import _create_category_with_fields
        category = _create_category_with_fields(context, category_name, is_active=True)
    return category


@given('大分類「{category_name}」下有以下規則')
def step_impl(context, category_name):
    category = _ensure_category(context, category_name)
    for row in context.table:
        is_published = PUBLISH_MAP.get(row["發佈狀態"], False)
        rule = FaqRule(
            category_id=category.id,
            content_json={"name": row["rule_name"]},
            is_enabled=STATUS_MAP.get(row["啟用狀態"], True),
            is_published=is_published,
        )
        context.repos.faq_rule.save(rule)
        context.ids[row["rule_name"]] = rule.id


@given('大分類「{category_name}」下有 {count:d} 筆已發佈的規則')
def step_impl(context, category_name, count):
    category = _ensure_category(context, category_name)
    for i in range(count):
        rule = FaqRule(
            category_id=category.id,
            content_json={"name": f"rule_{i+1}"},
            is_enabled=True,
            is_published=True,
        )
        context.repos.faq_rule.save(rule)


@given('大分類「{category_name}」目前有 {count:d} 筆規則')
def step_impl(context, category_name, count):
    category = _ensure_category(context, category_name)
    for i in range(count):
        rule = FaqRule(
            category_id=category.id,
            content_json={"name": f"rule_{i+1}"},
            is_enabled=True,
            is_published=False,
        )
        context.repos.faq_rule.save(rule)


@given('大分類「{category_name}」目前已有 {count:d} 筆規則')
def step_impl(context, category_name, count):
    category = _ensure_category(context, category_name)
    for i in range(count):
        rule = FaqRule(
            category_id=category.id,
            content_json={"name": f"rule_{i+1}"},
            is_enabled=True,
            is_published=False,
        )
        context.repos.faq_rule.save(rule)


@given('大分類「{category_name}」下有一筆已發佈的規則「{rule_name}」')
def step_impl(context, category_name, rule_name):
    category = _ensure_category(context, category_name)
    rule = FaqRule(
        category_id=category.id,
        content_json={"name": rule_name, "房型名稱": rule_name, "房價": "3500"},
        is_enabled=True,
        is_published=True,
    )
    context.repos.faq_rule.save(rule)
    context.ids[rule_name] = rule.id
    context.memo["current_rule"] = rule


@given('大分類「{category_name}」下有一筆「{publish_status}」狀態的規則')
def step_impl(context, category_name, publish_status):
    category = _ensure_category(context, category_name)
    is_published = PUBLISH_MAP.get(publish_status, False)
    rule = FaqRule(
        category_id=category.id,
        content_json={"name": "test_rule"},
        is_enabled=True,
        is_published=is_published,
    )
    context.repos.faq_rule.save(rule)
    context.memo["current_rule"] = rule
    context.memo["original_rule_count"] = context.repos.faq_rule.count_by_category_id(category.id)


@given('大分類「{category_name}」下有一筆「{publish_status}」狀態的規則「{rule_name}」')
def step_impl(context, category_name, publish_status, rule_name):
    category = _ensure_category(context, category_name)
    is_published = PUBLISH_MAP.get(publish_status, False)
    rule = FaqRule(
        category_id=category.id,
        content_json={"name": rule_name},
        is_enabled=True,
        is_published=is_published,
    )
    context.repos.faq_rule.save(rule)
    context.ids[rule_name] = rule.id
    context.memo["current_rule"] = rule
    context.memo["original_rule_count"] = context.repos.faq_rule.count_by_category_id(category.id)


@given('一筆規則目前發佈狀態為「{publish_status}」')
def step_impl(context, publish_status):
    is_published = PUBLISH_MAP.get(publish_status, False)
    rule = FaqRule(
        category_id=0,
        content_json={"name": "test_rule"},
        is_enabled=True,
        is_published=is_published,
    )
    context.repos.faq_rule.save(rule)
    context.memo["current_rule"] = rule


@given('一筆規則目前狀態為「{status}」且前台聊天機器人正在引用')
def step_impl(context, status):
    rule = FaqRule(
        category_id=0,
        content_json={"name": "test_rule"},
        is_enabled=True,
        is_published=True,
    )
    context.repos.faq_rule.save(rule)
    context.memo["current_rule"] = rule


@given('一筆規則目前狀態為「{status}」')
def step_impl(context, status):
    is_enabled = STATUS_MAP.get(status, True)
    rule = FaqRule(
        category_id=0,
        content_json={"name": "test_rule"},
        is_enabled=is_enabled,
        is_published=False,
    )
    context.repos.faq_rule.save(rule)
    context.memo["current_rule"] = rule


@given('使用者新增一筆規則並儲存')
def step_impl(context):
    try:
        context.services.faq_rule.create_rule(
            category_name="default",
            content={"name": "new_rule"},
        )
        context.last_error = None
    except Exception as e:
        context.last_error = e


@given('使用者正在「{category_name}」大分類下新增規則')
def step_impl(context, category_name):
    _ensure_category(context, category_name)
    context.memo["creating_rule_category"] = category_name
    context.memo["creating_rule_content"] = {}


@given('系統有以下未發佈狀態的規則')
def step_impl(context):
    for row in context.table:
        rule = FaqRule(
            category_id=0,
            content_json={"name": row["rule_name"]},
            is_enabled=STATUS_MAP.get(row["啟用狀態"], True),
            is_published=PUBLISH_MAP.get(row["發佈狀態"], False),
        )
        context.repos.faq_rule.save(rule)
        context.ids[row["rule_name"]] = rule.id


@given('系統有以下規則')
def step_impl(context):
    last_rule = None
    for row in context.table:
        is_published = PUBLISH_MAP.get(row["發佈狀態"], False)
        rule = FaqRule(
            category_id=0,
            content_json={"name": row["rule_name"]},
            is_enabled=STATUS_MAP.get(row["啟用狀態"], True),
            is_published=is_published,
        )
        context.repos.faq_rule.save(rule)
        context.ids[row["rule_name"]] = rule.id
        last_rule = rule
    if last_rule:
        context.memo["current_rule"] = last_rule
