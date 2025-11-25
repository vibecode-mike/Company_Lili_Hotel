"""
manage_botinfo.py
=================

用途：
    提供後端 API，透過「客戶自行輸入的 Messaging API Channel Access Token」
    呼叫 LINE 官方 `/v2/bot/info` 端點，並回傳該官方帳號的基本資料，
    包含 Basic ID（@xxxxxxx）、displayName、pictureUrl 等。

為什麼需要這支模組：
    LINE 官方並沒有提供可以直接查詢「Basic ID」的後台 API，
    但 `/v2/bot/info` 會在回應中包含 `basicId` 欄位。
    因為客戶會在後台自行輸入 token，因此不能依賴 .env，
    必須透過程式動態取得並回傳 basicId，讓系統可自動記錄並使用。

API：
    POST /api/bot/basic-id
        Body:
            {
                "channel_access_token": "<客戶提供的長期 token>"
            }

        Response:
            {
                "ok": true,
                "basicId": "@xxxxxxx",
                "displayName": "...",
                "pictureUrl": "...",
                "raw": {...LINE完整回應...}
            }

注意：
    - Token 必須為 Messaging API 長期 Channel Access Token（非 Short-lived）。 
    - 若 token 無效或過期，LINE 會回傳錯誤，API 會同步回傳錯誤資訊。
"""
import requests
from flask import Blueprint, request, jsonify

bp = Blueprint("manage_botinfo", __name__)

@bp.post("/api/bot/basic-id")
def get_basic_id():
    body = request.get_json(force=True) or {}
    token = (body.get("channel_access_token") or "").strip()

    if not token:
        return jsonify({"ok": False, "error": "missing_channel_access_token"}), 400

    resp = requests.get(
        "https://api.line.me/v2/bot/info",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10
    )

    try:
        data = resp.json()
    except:
        return jsonify({"ok": False, "error": "invalid_response"}), 500

    if not resp.ok:
        return jsonify({"ok": False, "error": data}), resp.status_code

    # data = { userId, basicId, displayName, pictureUrl ...}
    return jsonify({
        "ok": True,
        "basicId": data.get("basicId"),
        "displayName": data.get("displayName"),
        "pictureUrl": data.get("pictureUrl"),
        "raw": data
    })
