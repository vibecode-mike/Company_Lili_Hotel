from behave import when


@when('系統執行初始化程序')
def step_impl(context):
    try:
        context.services.industry.initialize_system()
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('系統商管理員新增產業「{industry_name}」')
def step_impl(context, industry_name):
    try:
        context.services.industry.create_industry(industry_name)
        context.last_error = None
        context.memo["last_created_industry"] = industry_name
    except Exception as e:
        context.last_error = e


@when('定義該產業的大分類與欄位')
def step_impl(context):
    industry_name = context.memo.get("last_created_industry", "unknown")
    try:
        context.services.industry.define_category_fields(industry_name, [])
        context.last_error = None
    except Exception as e:
        context.last_error = e
