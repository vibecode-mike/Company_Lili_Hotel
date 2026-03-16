from behave import then


@then('系統自動建立產業「{industry_name}」')
def step_impl(context, industry_name):
    industry = context.repos.industry.find_by_name(industry_name)
    assert industry is not None, f"找不到產業 {industry_name}"
    assert industry.name == industry_name


@then('系統自動建立以下大分類')
def step_impl(context):
    for row in context.table:
        category = context.repos.faq_category.find_by_name(row["category_name"])
        assert category is not None, f"找不到大分類 {row['category_name']}"
        assert str(category.is_system_default).lower() == row["is_system_default"].lower(), \
            f"大分類 {row['category_name']} 的 is_system_default 不符"


@then('系統自動建立「{category_name}」大分類的欄位定義')
def step_impl(context, category_name):
    category = context.repos.faq_category.find_by_name(category_name)
    assert category is not None, f"找不到大分類 {category_name}"
    fields = context.repos.faq_category_field.find_by_category_id(category.id)
    assert len(fields) == len(context.table.rows), \
        f"預期 {len(context.table.rows)} 個欄位，實際為 {len(fields)}"
    for row in context.table:
        matching = [f for f in fields if f.field_name == row["field_name"]]
        assert len(matching) > 0, f"找不到欄位 {row['field_name']}"


@then('系統建立產業「{industry_name}」及其大分類與欄位定義')
def step_impl(context, industry_name):
    industry = context.repos.industry.find_by_name(industry_name)
    assert industry is not None, f"找不到產業 {industry_name}"
