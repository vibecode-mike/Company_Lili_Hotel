from behave import given
from app.models.faq_module_auth import FaqModuleAuth


@given('客戶帳號「{client_id}」尚未開通 FAQ 模組授權')
def step_impl(context, client_id):
    auth = FaqModuleAuth(client_id=client_id, is_authorized=False)
    context.repos.faq_module_auth.save(auth)
    context.ids[client_id] = client_id


@given('客戶帳號「{client_id}」已開通 FAQ 模組授權')
def step_impl(context, client_id):
    auth = FaqModuleAuth(client_id=client_id, is_authorized=True)
    context.repos.faq_module_auth.save(auth)
    context.ids[client_id] = client_id


@given('客戶帳號「{client_id}」尚未開通 FAQ 模組')
def step_impl(context, client_id):
    auth = FaqModuleAuth(client_id=client_id, is_authorized=False)
    context.repos.faq_module_auth.save(auth)
    context.ids[client_id] = client_id


@given('客戶已開通 FAQ 模組授權')
def step_impl(context):
    client_id = context.memo.get("current_client_id", "default_client")
    auth = FaqModuleAuth(client_id=client_id, is_authorized=True)
    context.repos.faq_module_auth.save(auth)


@given('客戶「{client_id}」被分配產業「{industry_name}」')
def step_impl(context, client_id, industry_name):
    from app.models.industry import Industry
    industry = Industry(name=industry_name)
    context.repos.industry.save(industry)
    context.ids[client_id] = client_id
    context.memo["assigned_industry"] = industry_name
