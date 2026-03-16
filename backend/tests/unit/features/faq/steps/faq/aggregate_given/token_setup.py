from behave import given
from app.models.ai_token_usage import AiTokenUsage


@given('客戶「{client_id}」的 AI Token 額度為 {quota:d}')
def step_impl(context, client_id, quota):
    usage = AiTokenUsage(client_id=client_id, total_quota=quota, used_amount=0)
    context.repos.ai_token_usage.save(usage)
    context.ids[client_id] = client_id


@given('客戶「{client_id}」的 Token 設定為')
def step_impl(context, client_id):
    row = context.table[0]
    usage = AiTokenUsage(
        client_id=client_id,
        total_quota=int(row["total_quota"]),
        used_amount=int(row["used_amount"]),
    )
    context.repos.ai_token_usage.save(usage)
    context.ids[client_id] = client_id


@given('客戶「{client_id}」的 Token 剩餘額度為 {remaining:d}')
def step_impl(context, client_id, remaining):
    total = remaining + 100  # arbitrary total
    usage = AiTokenUsage(
        client_id=client_id,
        total_quota=total,
        used_amount=total - remaining,
    )
    context.repos.ai_token_usage.save(usage)
    context.ids[client_id] = client_id


@given('前台聊天機器人目前使用 AI 回覆')
def step_impl(context):
    context.memo["ai_active"] = True
