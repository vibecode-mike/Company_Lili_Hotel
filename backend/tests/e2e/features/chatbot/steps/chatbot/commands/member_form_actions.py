from behave import when
import requests


@when("前台格式驗證執行")
def step_frontend_validate(context):
    """前端驗證，E2E 只驗證後端 API 的 HTTP 回應（假設格式錯誤送到後端時的行為）。"""
    # 注意：電話/Email 格式驗證主要在前端，此步驟記錄意圖
    context.memo["frontend_validate"] = True
    context.last_response = None  # 無 API 呼叫


@when("送出表單")
def step_submit_form(context):
    """送出含空姓名的表單（前端驗證）。"""
    context.last_response = None


@when("送出後前端更新 session member profile（透過 /chatbot/message 或直接帶入 booking-save）")
def step_update_member_profile(context):
    """透過發送含個人資料的訊息讓後端提取。"""
    name = context.memo.get("member_name", "王小明")
    phone = context.memo.get("member_phone", "0912345678")
    email = context.memo.get("member_email", "test@example.com")
    message = f"我的姓名是{name}，電話{phone}，email是{email}"
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": message},
        timeout=15,
    )
    context.last_response = resp


@when("_extract_member_hints 解析")
def step_extract_hints(context):
    """已在 Given 中傳送含電話的訊息，此 step 確認 last_response 存在。"""
    if context.last_response is None:
        resp = requests.post(
            f"{context.api_base}/chatbot/message",
            json={"browser_key": context.memo["browser_key"], "message": "我電話是0912345678"},
            timeout=15,
        )
        context.last_response = resp
