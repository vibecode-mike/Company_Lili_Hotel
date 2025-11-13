# member_liff.py
# 測試頁面 /data2/lili_hotel/backend/public/uploads/member_form.html
# 功能：
# 1) 提供 LIFF 問卷載入與提交 API
# 2) 前端可透過 LIFF SDK 開啟此頁面，載入會員問卷
# 3) 送出資料後寫入 ryan_member_responses（或暫存 logs）

# member_liff.py
from __future__ import annotations
import os
from flask import Blueprint, request, jsonify

from liff_page import (
    exchange_access_token,
    create_liff_app,
    get_all_valid_user_ids,
    multicast_liff_url,
)

bp = Blueprint("member_liff", __name__)

# 你的 HTML 在 /uploads；這裡放對外可訪問 URL
DEFAULT_FORM_URL = os.getenv(
    "DEFAULT_MEMBER_FORM_URL",
    "http://192.168.50.123:3001/uploads/member_form.html"  # 暫時寫死的會員表單html路徑位置
)

# 若已在 .env 放 Messaging API 的 access token，這裡會自動抓
ENV_MSG_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "").strip()

@bp.post("/api/liff/auto_broadcast")
def api_liff_auto_broadcast():
    data = request.get_json(force=True) or {}

    # 1) 用 Login/LIFF Channel 建 LIFF
    liff_channel_id = data.get("liff_channel_id")
    liff_channel_secret = data.get("liff_channel_secret")
    if not (liff_channel_id and liff_channel_secret):
        return jsonify({"ok": False, "error": "missing_liff_channel_id_or_secret"}), 400

    endpoint_url = data.get("endpoint_url") or DEFAULT_FORM_URL

    oauth = exchange_access_token(liff_channel_id, liff_channel_secret)
    if not oauth.get("ok"):
        return jsonify({"ok": False, "error": {"where": "oauth(liff)", "detail": oauth.get("error")}}), 400

    liff_token = oauth["access_token"]
    created = create_liff_app(liff_token, endpoint_url, size="full")
    if not created.get("ok"):
        return jsonify({"ok": False, "error": {"where": "create_liff", "detail": created.get("error")}}), 400

    liff_id, liff_url = created["liffId"], created["liffUrl"]

    # 2) Messaging API access token：payload > ENV > 用 msg_channel_id/secret 再換
    msg_access_token = (data.get("msg_access_token") or ENV_MSG_ACCESS_TOKEN or "").strip()
    if not msg_access_token:
        msg_channel_id = data.get("msg_channel_id")
        msg_channel_secret = data.get("msg_channel_secret")
        if not (msg_channel_id and msg_channel_secret):
            return jsonify({"ok": False, "error": "missing_messaging_token_or_channel_cred"}), 400
        msg_oauth = exchange_access_token(msg_channel_id, msg_channel_secret)
        if not msg_oauth.get("ok"):
            return jsonify({"ok": False, "error": {"where": "oauth(msg)", "detail": msg_oauth.get("error")}}), 400
        msg_access_token = msg_oauth["access_token"]

    # 3) 受眾：不給 user_ids 就全體
    user_ids = data.get("user_ids")
    audience = user_ids if (isinstance(user_ids, list) and user_ids) else get_all_valid_user_ids()
    if not audience:
        return jsonify({"ok": False, "error": "no_recipients"}), 400

    sent = multicast_liff_url(msg_access_token, audience, liff_url)
    if not sent.get("ok"):
        return jsonify({"ok": False, "error": {"where": "multicast", "detail": sent.get("error")}}), 400

    return jsonify({
        "ok": True,
        "liffId": liff_id,
        "liffUrl": liff_url,
        "endpoint_url": endpoint_url,
        "sent": sent.get("sent", 0),
        "total": sent.get("total", 0)
    })
