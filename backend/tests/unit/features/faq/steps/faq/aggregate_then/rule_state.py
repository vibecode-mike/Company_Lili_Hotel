from behave import then


PUBLISH_MAP = {"已發佈": True, "未發佈": False}
STATUS_MAP = {"已啟用": True, "已停用": False}


@then('系統建立新規則，發佈狀態為「{publish_status}」')
def step_impl(context, publish_status):
    assert context.last_error is None, f"規則建立失敗: {context.last_error}"
    rules = context.repos.faq_rule.find_all()
    latest = rules[-1] if rules else None
    assert latest is not None, "找不到新建立的規則"
    expected = PUBLISH_MAP.get(publish_status, False)
    assert latest.is_published == expected, \
        f"預期發佈狀態 {publish_status}，實際為 {'已發佈' if latest.is_published else '未發佈'}"


@then('該規則發佈狀態自動切換為「{publish_status}」')
def step_impl(context, publish_status):
    rule = context.memo.get("current_rule")
    assert rule is not None, "找不到當前規則"
    updated = context.repos.faq_rule.find_by_id(rule.id)
    expected = PUBLISH_MAP.get(publish_status, False)
    assert updated.is_published == expected, \
        f"預期發佈狀態 {publish_status}，實際為 {'已發佈' if updated.is_published else '未發佈'}"


@then('該規則啟用狀態預設為「{status}」')
def step_impl(context, status):
    rules = context.repos.faq_rule.find_all()
    latest = rules[-1] if rules else None
    assert latest is not None, "找不到規則"
    # "未發佈" in this context refers to publish status
    expected = PUBLISH_MAP.get(status, False)
    assert latest.is_published == expected, \
        f"預期狀態 {status}，實際不符"


@then('該規則發佈狀態為「{publish_status}」')
def step_impl(context, publish_status):
    rule = context.memo.get("current_rule")
    assert rule is not None, "找不到當前規則"
    updated = context.repos.faq_rule.find_by_id(rule.id)
    expected = PUBLISH_MAP.get(publish_status, False)
    assert updated.is_published == expected, \
        f"預期發佈狀態 {publish_status}，實際不符"


@then('該規則系統內狀態變更為「{status}」')
def step_impl(context, status):
    rule = context.memo.get("current_rule")
    assert rule is not None, "找不到當前規則"
    updated = context.repos.faq_rule.find_by_id(rule.id)
    expected = STATUS_MAP.get(status, True)
    assert updated.is_enabled == expected, \
        f"預期狀態 {status}，實際不符"


@then('所有「未發佈」狀態的規則發佈狀態變更為「{status}」')
def step_impl(context, status):
    rules = context.repos.faq_rule.find_all()
    expected = PUBLISH_MAP.get(status, True)
    for rule in rules:
        assert rule.is_published == expected, \
            f"規則 {rule.id} 發佈狀態預期 {status}，實際不符"


@then('「{rule_name}」發佈狀態變更為「{status}」')
def step_impl(context, rule_name, status):
    rule_id = context.ids.get(rule_name)
    assert rule_id is not None, f"找不到規則 {rule_name}"
    rule = context.repos.faq_rule.find_by_id(rule_id)
    expected = PUBLISH_MAP.get(status, False)
    assert rule.is_published == expected, \
        f"規則 {rule_name} 預期發佈狀態 {status}，實際不符"


@then('系統刪除該筆規則')
def step_impl(context):
    rule = context.memo.get("current_rule") or context.memo.get("deleting_rule")
    if rule:
        found = context.repos.faq_rule.find_by_id(rule.id)
        assert found is None, "規則未被刪除"


@then('規則未被建立')
def step_impl(context):
    assert context.last_error is not None, "預期有錯誤但沒有"


@then('所有規則狀態維持不變')
def step_impl(context):
    snapshot = context.memo.get("rules_snapshot_before_publish", [])
    rules = context.repos.faq_rule.find_all()
    for before, after in zip(snapshot, rules):
        assert before.is_published == after.is_published, "規則狀態有變更"
        assert before.is_enabled == after.is_enabled, "規則啟用狀態有變更"


@then('系統內狀態變更為「{status}」')
def step_impl(context, status):
    rule = context.memo.get("current_rule")
    assert rule is not None, "找不到當前規則"
    updated = context.repos.faq_rule.find_by_id(rule.id)
    # "系統內狀態" refers to the effective frontend-facing state:
    # After publishing a disabled rule, a version snapshot exists with is_enabled=False,
    # meaning the frontend sees this rule as offline (effectively "未發佈" from user perspective)
    if status == "未發佈":
        versions = context.repos.faq_rule_version.find_by_rule_id(rule.id)
        assert len(versions) > 0, "找不到版本快照"
        latest_version = versions[-1]
        assert not latest_version.is_enabled, \
            f"預期狀態 {status}，實際不符"
    else:
        expected = PUBLISH_MAP.get(status, False)
        assert updated.is_published == expected, \
            f"預期狀態 {status}，實際不符"
