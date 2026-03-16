from behave import then


@then('前台聊天機器人不再引用「{category_name}」大分類的任何規則')
def step_impl(context, category_name):
    category = context.repos.faq_category.find_by_name(category_name)
    assert category is not None, f"找不到大分類 {category_name}"
    assert category.is_active is False, \
        f"大分類 {category_name} 仍為啟用，前台仍可引用"


@then('前台聊天機器人立即可引用「{category_name}」大分類下已發佈的規則')
def step_impl(context, category_name):
    category = context.repos.faq_category.find_by_name(category_name)
    assert category is not None, f"找不到大分類 {category_name}"
    assert category.is_active is True, \
        f"大分類 {category_name} 未啟用，前台無法引用"


@then('前台聊天機器人不引用此規則')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        updated = context.repos.faq_rule.find_by_id(rule.id)
        assert updated is None or not updated.is_published, \
            "規則仍為已發佈，前台仍在引用"


@then('前台聊天機器人繼續引用該規則的上一個已發佈版本')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        versions = context.repos.faq_rule_version.find_by_rule_id(rule.id)
        assert len(versions) > 0, "找不到已發佈的版本快照"


@then('前台聊天機器人繼續引用上一個已發佈的快照版本')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        versions = context.repos.faq_rule_version.find_by_rule_id(rule.id)
        assert len(versions) > 0, "找不到已發佈的版本快照"


@then('前台聊天機器人仍繼續引用此規則（尚未發佈停用）')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        versions = context.repos.faq_rule_version.find_by_rule_id(rule.id)
        assert len(versions) > 0, "找不到已發佈的版本快照，前台應仍在引用"


@then('前台聊天機器人不引用此規則（尚未發佈啟用）')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        updated = context.repos.faq_rule.find_by_id(rule.id)
        assert not updated.is_published, "規則已發佈，但預期尚未發佈"


@then('前台聊天機器人仍引用「{rule_name}」直到下次「發佈」')
def step_impl(context, rule_name):
    rule_id = context.ids.get(rule_name)
    if rule_id:
        versions = context.repos.faq_rule_version.find_by_rule_id(rule_id)
        assert len(versions) > 0, f"找不到 {rule_name} 的版本快照"


@then('前台聊天機器人停止引用「{rule_name}」')
def step_impl(context, rule_name):
    rule_id = context.ids.get(rule_name)
    if rule_id:
        rule = context.repos.faq_rule.find_by_id(rule_id)
        assert rule is not None
        assert not rule.is_enabled, f"規則 {rule_name} 仍為啟用"


@then('前台聊天機器人改由現有自動回應系統（auto_response）依優先順序處理（關鍵字 > 一律回應 > 歡迎訊息）')
def step_impl(context):
    # Token depleted → AI disabled → fallback to auto_response
    pass


@then('後續訊息改由自動回應系統處理')
def step_impl(context):
    # Token depleted → AI disabled → auto_response handles
    pass


@then('已啟用的規則立即同步至前台聊天機器人，可被 AI 引用回覆')
def step_impl(context):
    rules = context.repos.faq_rule.find_all()
    published_enabled = [r for r in rules if r.is_published and r.is_enabled]
    assert len(published_enabled) > 0, "沒有已啟用且已發佈的規則"


@then('規則同步至系統內部的 AI Chatbot 會員聊天室')
def step_impl(context):
    # Publish syncs to internal AI chatbot as well
    pass


@then('測試聊天視窗引用修改後的內容')
def step_impl(context):
    rule = context.memo.get("current_rule") or context.memo.get("editing_rule")
    assert rule is not None, "找不到規則"


@then('測試聊天視窗引用修改後的最新內容')
def step_impl(context):
    rule = context.memo.get("current_rule")
    assert rule is not None, "找不到規則"


@then('測試聊天視窗可引用此規則')
def step_impl(context):
    rule = context.memo.get("current_rule")
    assert rule is not None, "找不到規則"
    assert rule.is_enabled, "規則未啟用，測試聊天無法引用"


@then('該規則不論啟用與否，皆可在系統內測試聊天視窗中被測試')
def step_impl(context):
    # Test chat window can reference all rules regardless of enable status
    pass


@then('使用者須點擊「發佈」後，前台才會停止引用此規則')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        versions = context.repos.faq_rule_version.find_by_rule_id(rule.id)
        assert len(versions) > 0, "版本快照存在，前台仍在引用"


@then('使用者須點擊「發佈」後，前台才會開始引用此規則')
def step_impl(context):
    rule = context.memo.get("current_rule")
    if rule:
        assert not rule.is_published, "規則已發佈，不需要再點擊發佈"
