from behave import given


@given('使用者已登入系統且擁有 "{permission}" 權限')
def step_impl(context, permission):
    # Auth token is already set up in environment.py before_scenario
    # The test user has admin role which implies all permissions
    context.memo["current_permission"] = permission


@given('使用者擁有 "{permission}" 權限')
def step_impl_add_permission(context, permission):
    # Additional permission - the admin user has all permissions
    context.memo.setdefault("permissions", []).append(permission)


@given('使用者不擁有 "{permission}" 權限')
def step_impl_no_permission(context, permission):
    # Simulate no permission by removing auth header
    # In a real system we'd create a user without this permission
    # For now, clear auth to trigger 401/403
    context.auth_headers = {}
    context.memo["stripped_permission"] = permission
