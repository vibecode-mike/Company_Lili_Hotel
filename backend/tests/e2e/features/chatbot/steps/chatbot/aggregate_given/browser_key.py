import uuid

from behave import given


@given("民眾持有有效的 browser_key")
def step_impl(context):
    """確保 context.memo["browser_key"] 已設定（environment.py 已初始化）。"""
    if not context.memo.get("browser_key"):
        context.memo["browser_key"] = str(uuid.uuid4())
    # 確認不為空
    assert context.memo["browser_key"], "browser_key 不能為空"
