# member_liff.py
# ----------------------------------------------------------------------
# 目的：
#   提供「LIFF 會員表單」整條流程的後端端點。採用「同一個 LIFF App 重複使用；
#   若尚未建立則自動建立」的策略，並把表單頁面放在
#   /data2/lili_hotel/backend/public/uploads/member_form.html 由 LIFF 開啟。
#
# 本模組涵蓋三件事：
#   A) LIFF 入口管理與群發：
#      - POST /api/liff/auto_broadcast
#          有既定 liffId 就沿用，沒有就以指定 endpoint_url 建立新的 LIFF，
#          之後用 Messaging API 將 LIFF URL 群發（或對指定 userIds 發送）。
#          回傳 liffId / liffUrl / 實際送達數。
#
#   B) 表單載入（供前端 member_form.html 呼叫）：
#      - GET  /__survey_load?sid=<form_id>
#          依 sid 取出該版表單 schema 與預設值（並可合併 members 基本資料做回填）。
#
#   C) 表單提交（存入資料庫）：
#      - POST /__survey_submit
#          接收使用者填答，標準化後寫入 ryan_member_responses（以 (form_id, user_id)
#          控制同版限填一次），並更新/回寫 members 資料（如電話、email 等）。
#
# 重要約定：
#   - 靜態頁面：/uploads/member_form.html（由 Nginx/Flask 對外 /uploads 路徑提供）
#   - 採多租戶：可透過 line_channel_id 決定使用哪一個頻道／token
#   - LIFF 策略：優先使用現有 liffId；若無則建立並（可選）回存至資料庫
#   測試頁面 /data2/lili_hotel/backend/public/uploads/member_form.html

# member_liff.py
from __future__ import annotations
import os
from flask import Blueprint, request, jsonify

from liff_page import (
    exchange_access_token,
    create_liff_app,
    list_liff_apps,
    update_liff_view,
    get_all_valid_user_ids,
    multicast_liff_url,
)
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

bp = Blueprint("member_liff", __name__)

# 你的 HTML 放 /uploads（對外 URL 寫在這）
DEFAULT_FORM_URL = os.getenv(
    "DEFAULT_MEMBER_FORM_URL",
    "http://192.168.50.123:3001/uploads/member_form.html"  # ← 改成實際網址
)

# 如果你想全域共用同一個 LIFF，也可先在 .env 放 DEFAULT_LIFF_ID
ENV_DEFAULT_LIFF_ID = (os.getenv("DEFAULT_LIFF_ID") or "").strip()
ENV_MSG_ACCESS_TOKEN = (os.getenv("LINE_CHANNEL_ACCESS_TOKEN") or "").strip()

# === 可選：若你想把 liffId 存在 DB（每個租戶一筆），以下沿用你現有連線 ===
MYSQL_USER = os.getenv("MYSQL_USER", os.getenv("DB_USER", "root"))
MYSQL_PASS = os.getenv("MYSQL_PASS", os.getenv("DB_PASS", "123456"))
MYSQL_HOST = os.getenv("MYSQL_HOST", os.getenv("DB_HOST", "127.0.0.1"))
MYSQL_PORT = int(os.getenv("MYSQL_PORT", os.getenv("DB_PORT", "3306")))
MYSQL_DB   = os.getenv("MYSQL_DB",   os.getenv("DB_NAME", "lili_hotel"))

from sqlalchemy import create_engine
DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{quote_plus(MYSQL_PASS)}@"
    f"{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600, future=True)

def db_get_liff_id(line_channel_id: str) -> str | None:
    """
    若你的 ryan_line_channels 有欄位 liff_id，就可在這裡讀取；
    若沒有，不會報錯（直接回 None）。
    """
    try:
        with engine.begin() as conn:
            r = conn.execute(
                text("SELECT liff_id FROM ryan_line_channels WHERE line_channel_id=:cid LIMIT 1"),
                {"cid": line_channel_id},
            ).scalar()
            return (r or "").strip() or None
    except Exception:
        return None

def db_set_liff_id(line_channel_id: str, liff_id: str):
    """可選：把新建的 liff_id 存回資料庫（欄位若不存在會被忽略）。"""
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""
                    UPDATE ryan_line_channels
                       SET liff_id = :lid
                     WHERE line_channel_id = :cid
                    LIMIT 1
                """),
                {"lid": liff_id, "cid": line_channel_id},
            )
    except Exception:
        pass


@bp.post("/api/liff/auto_broadcast")
def api_liff_auto_broadcast():
    data = request.get_json(force=True) or {}

    endpoint_url = data.get("endpoint_url") or DEFAULT_FORM_URL
    line_channel_id_for_db = data.get("line_channel_id")

    # Step A) 先決定「訊息 / LIFF 共用的 access token」
    # 直接優先使用 msg_access_token（Messaging API 長期 token）
    msg_access_token = (data.get("msg_access_token") or ENV_MSG_ACCESS_TOKEN or "").strip()
    if not msg_access_token:
        # 若沒直接給 token，才退回用 msg_channel_id + msg_channel_secret 去換
        msg_channel_id = data.get("msg_channel_id")
        msg_channel_secret = data.get("msg_channel_secret")
        if not (msg_channel_id and msg_channel_secret):
            return jsonify({"ok": False, "error": "missing_messaging_token_or_channel_cred"}), 400
        msg_oauth = exchange_access_token(msg_channel_id, msg_channel_secret)
        if not msg_oauth.get("ok"):
            return jsonify({"ok": False, "error": {"where": "oauth(msg)", "detail": msg_oauth.get("error")}}), 400
        msg_access_token = msg_oauth["access_token"]

    # ✅ LIFF 也直接用同一組 access token
    liff_token = msg_access_token
