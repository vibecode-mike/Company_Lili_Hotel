from behave import then


@then('大分類「{category_name}」狀態變更為關閉')
def step_impl(context, category_name):
    category = context.repos.faq_category.find_by_name(category_name)
    assert category is not None, f"找不到大分類 {category_name}"
    assert category.is_active is False, f"預期大分類 {category_name} 為關閉，實際為啟用"


@then('大分類「{category_name}」狀態變更為啟用')
def step_impl(context, category_name):
    category = context.repos.faq_category.find_by_name(category_name)
    assert category is not None, f"找不到大分類 {category_name}"
    assert category.is_active is True, f"預期大分類 {category_name} 為啟用，實際為關閉"


@then('大分類「{category_name}」目前有 {count:d} 筆規則')
def step_impl(context, category_name, count):
    category = context.repos.faq_category.find_by_name(category_name)
    category_id = category.id if category else 0
    actual_count = context.repos.faq_rule.count_by_category_id(category_id)
    assert actual_count == count, f"預期 {count} 筆規則，實際為 {actual_count}"


@then('大分類「{category_name}」的規則數量減少 {count:d}')
def step_impl(context, category_name, count):
    category = context.repos.faq_category.find_by_name(category_name)
    category_id = category.id if category else 0
    original_count = context.memo.get("original_rule_count", 0)
    actual_count = context.repos.faq_rule.count_by_category_id(category_id)
    expected = original_count - count
    assert actual_count == expected, f"預期 {expected} 筆規則，實際為 {actual_count}"
