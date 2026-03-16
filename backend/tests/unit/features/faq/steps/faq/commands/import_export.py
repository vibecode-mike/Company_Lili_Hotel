from behave import given, when


@when('使用者在大分類「{category_name}」內頁點擊「匯出」')
def step_impl(context, category_name):
    try:
        context.query_result = context.services.import_export.export_rules(category_name)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者在大分類「{category_name}」內頁點擊「匯入」')
def step_impl(context, category_name):
    context.memo["importing_category"] = category_name
    context.memo["import_state"] = "file_picker_open"


@when('使用者點擊「確認匯入」')
def step_impl(context):
    category_name = context.memo.get("importing_category", "default")
    file_data = context.memo.get("import_file_data", {})
    try:
        context.services.import_export.import_rules(category_name, file_data)
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者點擊「取消」')
def step_impl(context):
    context.memo["import_state"] = "cancelled"


@given('使用者選取了合法格式的匯入檔案')
def step_impl(context):
    context.memo["import_file_data"] = {"format": "csv", "data": []}
    context.memo["import_state"] = "file_selected"


@given('系統已彈出匯入二次確認視窗')
def step_impl(context):
    context.memo["import_state"] = "confirm_dialog_open"
