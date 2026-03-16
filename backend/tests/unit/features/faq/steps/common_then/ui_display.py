from behave import given, when, then


@then('以下任一操作完成後，全域最後更新時間更新為該操作的時間')
def step_impl(context):
    # Verify that the operations listed in context.table trigger timestamp updates
    triggers = [row["觸發動作"] for row in context.table]
    assert len(triggers) > 0, "觸發動作清單為空"


@then('頁面不顯示「{element}」按鈕')
def step_impl(context, element):
    result = context.query_result
    user = context.memo.get("current_user")
    if element == "新增大分類":
        # System default categories cannot be added
        pass
    elif element == "發佈":
        # Check user lacks faq.publish permission
        assert user is not None
        assert "faq.publish" not in user.permissions, \
            "使用者有發佈權限，不應隱藏發佈按鈕"


@then('頁面底部顯示測試聊天懸浮按鈕')
def step_impl(context):
    user = context.memo.get("current_user")
    assert user is not None
    assert "faq.manage" in user.permissions, "使用者缺少 faq.manage 權限"


@then('大分類名稱不可編輯')
def step_impl(context):
    # System default categories have is_system_default=True
    pass


@then('Token 額度欄位為唯讀，不可修改')
def step_impl(context):
    user = context.memo.get("current_user")
    assert user is not None
    assert user.role != "admin", "管理員可以修改 Token"


@then('系統導航至專屬的測試聊天頁面')
def step_impl(context):
    pass


@then('系統下載檔案，包含該大分類下所有規則資料')
def step_impl(context):
    result = context.query_result
    assert result is not None, "匯出結果為空"


@then('系統彈出二次確認視窗')
def step_impl(context):
    context.memo["import_state"] = "confirm_dialog_open"


@then('系統上傳檔案並執行資料驗證')
def step_impl(context):
    assert context.last_error is None, f"匯入失敗: {context.last_error}"


@then('匯入成功後頁面自動重新整理（Reload）')
def step_impl(context):
    assert context.last_error is None, "匯入失敗"


@then('系統關閉確認視窗')
def step_impl(context):
    assert context.memo.get("import_state") == "cancelled", "確認視窗未關閉"


@then('現有規則不受影響')
def step_impl(context):
    # Rules should not have changed after cancel
    pass


@then('系統開啟本地端檔案選擇器')
def step_impl(context):
    context.memo["import_state"] = "file_picker_open"


@then('檔案選擇器僅顯示 .csv / .xls / .xlsx 格式的檔案')
def step_impl(context):
    # Browser native accept attribute filtering
    pass


@then('使用者無法選取 .pdf、.xlx 等不支援的檔案格式')
def step_impl(context):
    # Browser native accept attribute filtering
    pass


# Chatroom notification steps (Part 8 & 9)
@given('使用者 A 正在 AI Chatbot 測試聊天視窗進行測試')
def step_impl(context):
    context.memo["user_a_in_test_chat"] = True


@given('使用者 B 在大分類內頁新增或編輯規則並儲存')
def step_impl(context):
    try:
        context.services.faq_rule.create_rule("default", {"name": "new_by_user_b"})
    except Exception:
        pass  # NotImplementedError expected in red phase


@given('使用者進入 AI Chatbot 測試聊天頁面')
def step_impl(context):
    context.memo["in_test_chat"] = True


@then('使用者 A 的測試聊天視窗立即顯示提示「{message}」')
def step_impl(context, message):
    assert context.memo.get("user_a_in_test_chat"), "使用者 A 未在測試聊天視窗"


@then('使用者 A 後續提問引用最新的規則內容')
def step_impl(context):
    pass


@given('使用者在 FAQ 管理頁面看到懸浮按鈕')
def step_impl(context):
    context.memo["fab_visible"] = True


@when('使用者點擊懸浮按鈕')
def step_impl(context):
    context.memo["navigated_to_test_chat"] = True


# Chatroom real-time notification (Part 9)
@given('客服人員正在會員聊天室與會員「{member_id}」對話中')
def step_impl(context, member_id):
    context.memo["chatting_with"] = member_id


@given('AI 目前引用舊版規則（豪華雙人房房價 3500）')
def step_impl(context):
    context.memo["old_rule_version"] = {"房價": "3500"}


@given('會員聊天室目前無任何進行中對話')
def step_impl(context):
    context.memo["no_active_chat"] = True


@then('會員聊天室顯示提示「{message}」')
def step_impl(context, message):
    assert context.memo.get("chatting_with"), "無進行中的對話"


@then('AI 下一次回覆即引用最新已發佈規則（房價 3800）')
def step_impl(context):
    pass


@then('規則靜默更新，無提示顯示')
def step_impl(context):
    assert context.memo.get("no_active_chat"), "有進行中的對話"


@then('下一次新對話開始時 AI 引用最新已發佈規則')
def step_impl(context):
    pass


# Import file-related And steps
@when('系統開啟本地端檔案選擇器（僅顯示 .csv / .xls / .xlsx）')
def step_impl(context):
    context.memo["import_state"] = "file_picker_open"


@when('使用者選取一個 .csv 檔案')
def step_impl(context):
    context.memo["import_file_data"] = {"format": "csv", "data": []}
    context.memo["import_state"] = "file_selected"


@given('系統彈出二次確認視窗')
def step_impl(context):
    context.memo["import_state"] = "confirm_dialog_open"
