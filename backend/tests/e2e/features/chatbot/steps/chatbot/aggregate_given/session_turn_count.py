from behave import given
import requests


@given("民眾目前 session 已進行 {n:d} 輪對話")
def step_impl(context, n):
    """
    確保 session 的 turn_count 達到目標值 n，
    再多送一則訊息就會觸發 rotate（turn_count >= max_turns=5）。
    先查詢目前 turn_count，只補送不足的輪數。
    """
    browser_key = context.memo["browser_key"]
    api_base = context.api_base

    # 先查目前 turn_count
    resp = requests.post(
        f"{api_base}/chatbot/message",
        json={"browser_key": browser_key, "message": "目前狀態"},
        timeout=30,
    )
    assert resp.status_code == 200, f"查詢 turn_count 失敗：{resp.status_code}"
    current_turn = resp.json().get("turn_count", 1)

    last_session_id = resp.json().get("session_id")
    # 補送訊息直到達到 n 輪
    while current_turn < n:
        resp = requests.post(
            f"{api_base}/chatbot/message",
            json={"browser_key": browser_key, "message": f"補充訊息"},
            timeout=30,
        )
        assert resp.status_code == 200, f"補充訊息失敗：{resp.status_code}"
        current_turn = resp.json().get("turn_count", current_turn)
        last_session_id = resp.json().get("session_id")

    # 儲存 session_id 供 Then 步驟驗證（rotate 後應產生新 session_id）
    context.memo["old_session_id"] = last_session_id
    assert last_session_id is not None, "無法取得 session_id"
