from behave import when
import requests


@when("系統呼叫 query_pms(startdate, enddate, housingcnt)")
def step_query_pms(context):
    """觸發房型查詢：發送含訂房信號訊息讓 LLM 呼叫 query_pms tool。"""
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "幫我看有什麼房型可以住"},
        timeout=30,
    )
    context.last_response = resp


@when("系統嘗試查詢房型")
def step_try_query_rooms(context):
    """觸發房型查詢（ENABLE_PMS=false 時走 FAQ_KB）。"""
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "有什麼房型可以住"},
        timeout=30,
    )
    context.last_response = resp


@when("query_pms 執行")
def step_query_pms_exec(context):
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "請查詢有無空房"},
        timeout=30,
    )
    context.last_response = resp


@when("run_tool(\"query_pms_availability\") 執行")
def step_run_tool_pms(context):
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "有什麼房間可以住"},
        timeout=30,
    )
    context.last_response = resp


@when("系統執行 _get_room_cards 並判斷 _auto_split_options")
def step_get_room_cards(context):
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "有什麼房間可以住"},
        timeout=30,
    )
    context.last_response = resp


@when("_extract_mixed_requests_from_text 解析")
def step_extract_mixed(context):
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "我要1間雙人房和1間四人房"},
        timeout=30,
    )
    context.last_response = resp


@when("AI 生成回覆")
def step_ai_gen(context):
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": "有什麼房型"},
        timeout=30,
    )
    context.last_response = resp
