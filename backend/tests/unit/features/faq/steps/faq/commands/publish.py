from behave import when


@when('使用者點擊右上角「發佈」按鈕')
def step_impl(context):
    try:
        context.services.faq_rule.publish()
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('使用者點擊「發佈」按鈕')
def step_impl(context):
    try:
        context.services.faq_rule.publish()
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('發佈 API 呼叫失敗或連線錯誤')
def step_impl(context):
    context.memo["publish_should_fail"] = True
    from app.exceptions import FaqPublishError
    context.last_error = FaqPublishError("發佈失敗，請稍後再試")


@when('後台使用者執行發佈（豪華雙人房房價更新為 3800）')
def step_impl(context):
    try:
        context.services.faq_rule.publish()
        context.last_error = None
    except Exception as e:
        context.last_error = e


@when('後台使用者執行發佈')
def step_impl(context):
    try:
        context.services.faq_rule.publish()
        context.last_error = None
    except Exception as e:
        context.last_error = e
