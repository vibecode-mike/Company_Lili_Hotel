from behave import when
import requests


@when("POST /chatbot/confirm-room body = { browser_key, rooms: [] }")
def step_confirm_room_empty(context):
    """送空 rooms 陣列，期望 422。"""
    resp = requests.post(
        f"{context.api_base}/chatbot/confirm-room",
        json={"browser_key": context.memo["browser_key"], "rooms": []},
        timeout=10,
    )
    context.last_response = resp


@when("POST /chatbot/confirm-room body:")
def step_confirm_room_docstring(context):
    """從 docstring 解析 rooms 陣列並呼叫 API。"""
    import json
    body = json.loads(context.text)
    body["browser_key"] = context.memo["browser_key"]
    resp = requests.post(
        f"{context.api_base}/chatbot/confirm-room",
        json=body,
        timeout=10,
    )
    context.last_response = resp


@when("POST /chatbot/confirm-room body.rooms 含 2 筆")
def step_confirm_room_2_items(context):
    """送 2 筆 rooms 陣列。"""
    rooms = context.memo.get("selected_rooms", [])
    resp = requests.post(
        f"{context.api_base}/chatbot/confirm-room",
        json={"browser_key": context.memo["browser_key"], "rooms": rooms},
        timeout=10,
    )
    context.last_response = resp


@when("POST /chatbot/confirm-room 執行")
def step_confirm_room_exec(context):
    """送 room_count=0 的請求。"""
    resp = requests.post(
        f"{context.api_base}/chatbot/confirm-room",
        json={
            "browser_key": context.memo["browser_key"],
            "rooms": [{"room_type_code": "DLX", "room_count": 0, "room_type_name": "豪華雙人房", "source": "pms"}],
        },
        timeout=10,
    )
    context.last_response = resp
