from behave import given
from app.models.user import User


@given('使用者已登入系統且擁有「{permission}」權限')
def step_impl(context, permission):
    user = User(username="test_user", permissions=[permission])
    context.memo["current_user"] = user
    context.memo.setdefault("user_permissions", []).append(permission)


@given('系統商管理員已登入管理後台')
def step_impl(context):
    user = User(username="admin", permissions=["system.admin"], role="admin")
    context.memo["current_user"] = user


@given('使用者已登入客戶後台')
def step_impl(context):
    user = User(username="client_user", permissions=["faq.view"], role="user")
    context.memo["current_user"] = user


@given('使用者不擁有「{permission}」權限')
def step_impl(context, permission):
    user = context.memo.get("current_user")
    if user and permission in user.permissions:
        user.permissions.remove(permission)
