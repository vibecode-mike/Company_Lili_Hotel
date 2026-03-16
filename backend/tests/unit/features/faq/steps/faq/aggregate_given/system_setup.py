from behave import given


@given('系統首次啟動或資料庫為空')
def step_impl(context):
    # Ensure repositories are empty (they start empty in before_scenario)
    pass
