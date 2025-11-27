# member_liff.py
# ----------------------------------------------------------------------
# 目的：
#   提供「會員問卷 LIFF」相關的後端端點。
#   現在改成：平台預先準備一顆「固定的 LIFF App」，所有客戶共用這顆 LIFF，
#   問卷頁面固定是 /uploads/member_form.html，由該 LIFF 開啟。
#
# 本模組目前涵蓋三件事：
#   A) LIFF 問卷入口群發（固定 LIFF 版本）：
#      - POST /api/liff/auto_broadcast
#          不再替客戶建立 / 管理 LIFF App，而是使用環境變數 DEFAULT_LIFF_ID
#          指定的那一顆 LIFF App，組出 https://liff.line.me/<DEFAULT_LIFF_ID>，
#          然後用客戶提供的 Messaging API access token 對所有會員（或指定 user_ids）
#          發送這個問卷連結。
#
#   B) 表單載入（供前端 member_form.html 呼叫）：
#      - GET  /__survey_load?sid=<form_id>
#          依 sid 取出該版表單 schema 與預設值（並可合併 members 基本資料回填）。
#
#   C) 表單提交（存入資料庫）：
#      - POST /__survey_submit
#          接收使用者填答，標準化後寫入 ryan_member_responses（以 (form_id, user_id)
#          控制同版限填一次），並更新/回寫 members 資料（如電話、email 等）。
#
# 重要約定：
#   - 問卷靜態頁面：/uploads/member_form.html
#       對外 URL 由 DEFAULT_MEMBER_FORM_URL / Nginx 提供，並在 LIFF App 中設定。
#   - LIFF App：平台自行在 LINE Developers 建立一顆固定的 LIFF App，
#       liffId 放在環境變數 DEFAULT_LIFF_ID 中，所有客戶共用。
#   - 多租戶：客戶的 Messaging API access token 由各自後台設定，
#       /api/liff/auto_broadcast 依傳入的 msg_access_token 決定使用哪一個官方帳號。
# ----------------------------------------------------------------------

from __future__ import annotations
from flask import Blueprint, request, jsonify
from sqlalchemy import text

from liff_page import (
    exchange_access_token,
    create_liff_app,
    list_liff_apps,
    update_liff_view,
    get_all_valid_user_ids,
    multicast_liff_url,
)

# 使用共用的配置和資料庫模組
from config import (
    DEFAULT_MEMBER_FORM_URL as DEFAULT_FORM_URL,
    DEFAULT_LIFF_ID as ENV_DEFAULT_LIFF_ID,
    LINE_CHANNEL_ACCESS_TOKEN as ENV_MSG_ACCESS_TOKEN,
)
from db import engine

bp = Blueprint("member_liff", __name__)


def db_get_liff_id(channel_id: str) -> str | None:
    """
    若 ryan_line_channels 有欄位 liff_id，可在這裡讀取；
    若沒有此欄位，會直接忽略（回傳 None）。
    """
    try:
        with engine.begin() as conn:
            r = conn.execute(
                text("SELECT liff_id FROM ryan_line_channels WHERE channel_id=:cid LIMIT 1"),
                {"cid": channel_id},
            ).scalar()
            return (r or "").strip() or None
    except Exception:
        return None


def db_set_liff_id(channel_id: str, liff_id: str):
    """可選：若 ryan_line_channels 有 liff_id 欄位，可以把固定 LIFF Id 存回去。"""
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""
                    UPDATE ryan_line_channels
                       SET liff_id = :lid
                     WHERE channel_id = :cid
                    LIMIT 1
                """),
                {"lid": liff_id, "cid": channel_id},
            )
    except Exception:
        pass


@bp.post("/api/liff/auto_broadcast")
def api_liff_auto_broadcast():
    """
    使用者在後台輸入三個欄位：

    - liff_channel_id      ← 先收下來，目前不直接呼叫 LINE（保留日後擴充）
    - liff_channel_secret  ← 同上，暫不使用
    - msg_access_token     ← Messaging API channel access token（一定要，用來群發）

    現在這支 API 的行為：

    1. 從環境變數 DEFAULT_LIFF_ID 取得「平台共用的 LIFF App」 Id。
    2. 組出 liff_url = https://liff.line.me/<DEFAULT_LIFF_ID>。
       （該 LIFF App 的 URL 請預先設定為 DEFAULT_MEMBER_FORM_URL 指向的問卷頁）
    3. 決定發送對象：
       - 若 body 有傳 user_ids（list），只發給這些 user；
       - 否則呼叫 get_all_valid_user_ids() 發給所有有效會員。
    4. 使用 msg_access_token 呼叫 multicast_liff_url(msg_access_token, audience, liff_url)，
       把問卷連結群發出去。
    5. 回傳 liffId / liffUrl / 實際送達數等資訊。
    """
    data = request.get_json(force=True) or {}

    # 這兩個先收下來，目前不直接拿去呼叫 LINE（避免遇到 client_assertion_type 那類 OAuth 規格差異）
    liff_channel_id = (data.get("liff_channel_id") or "").strip()
    liff_channel_secret = (data.get("liff_channel_secret") or "").strip()

    # 真正要用來發訊息的是這個 Messaging API token
    msg_access_token = (data.get("msg_access_token") or "").strip()
    if not msg_access_token:
        # 也可以考慮從環境變數讀預設 token，現在先強制要有避免誤判
        return jsonify({
            "ok": False,
            "error": "missing_msg_access_token"
        }), 400

    # 從環境變數讀固定的 LIFF Id
    liff_id = (ENV_DEFAULT_LIFF_ID or "").strip()
    if not liff_id:
        return jsonify({
            "ok": False,
            "error": "missing_DEFAULT_LIFF_ID_in_env"
        }), 500

    liff_url = f"https://liff.line.me/{liff_id}"

    # 決定要發給誰：有給 user_ids 就用 user_ids，沒有就發全體
    user_ids = data.get("user_ids")
    if isinstance(user_ids, list) and user_ids:
        audience = user_ids
    else:
        audience = get_all_valid_user_ids()

    if not audience:
        return jsonify({
            "ok": False,
            "error": "no_recipients"
        }), 400

    # 真正送出群發（沿用你原本在 liff_page 裡的實作）
    sent = multicast_liff_url(msg_access_token, audience, liff_url)

    if not sent.get("ok"):
        return jsonify({
            "ok": False,
            "error": {
                "where": "multicast",
                "detail": sent.get("error")
            }
        }), 400

    return jsonify({
        "ok": True,
        "liffId": liff_id,
        "liffUrl": liff_url,
        "sent": sent.get("sent", 0),
        "total": sent.get("total", len(audience)),
        "liff_channel_id": liff_channel_id,
        "liff_channel_secret_present": bool(liff_channel_secret),
    })
