# liff_page.py
# 角色：平台整合層（和 LINE 官方 API 溝通）
# - OAuth2 取 access_token（client_credentials）
# - 建立 LIFF App（v2）
# - 用 Messaging API 群發 LIFF 連結
# - 從 DB 撈出有效 userId（U 開頭、長度 33）

import os, math, requests
from typing import List, Optional, Dict, Any

from linebot import LineBotApi
from linebot.models import TextSendMessage

from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

# ===== DB 連線（沿用你現有的環境參數）=====
MYSQL_USER = os.getenv("MYSQL_USER", os.getenv("DB_USER", "root"))
MYSQL_PASS = os.getenv("MYSQL_PASS", os.getenv("DB_PASS", "123456"))
MYSQL_HOST = os.getenv("MYSQL_HOST", os.getenv("DB_HOST", "127.0.0.1"))
MYSQL_PORT = int(os.getenv("MYSQL_PORT", os.getenv("DB_PORT", "3306")))
MYSQL_DB   = os.getenv("MYSQL_DB",   os.getenv("DB_NAME", "lili_hotel"))

DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{quote_plus(MYSQL_PASS)}@"
    f"{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600, future=True)

def fetchall(sql: str, p: dict | None = None) -> list[dict]:
    with engine.begin() as conn:
        return [dict(r) for r in conn.execute(text(sql), p or {}).mappings().all()]

# ===== OAuth2：用 Channel ID + Secret 取 access_token =====
def exchange_access_token(client_id: str, client_secret: str) -> Dict[str, Any]:
    r = requests.post(
        "https://api.line.me/v2/oauth/token",
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        },
        timeout=15,
    )
    try:
        j = r.json()
    except Exception:
        j = {"error": "invalid_response", "text": r.text}
    if r.ok and j.get("access_token"):
        return {"ok": True, **j}
    return {"ok": False, "error": j}

# ===== LIFF：建立 LIFF App（用 Login/LIFF Channel 的 access_token）=====
def create_liff_app(liff_access_token: str, endpoint_url: str, size: str = "full") -> Dict[str, Any]:
    payload = {"view": {"type": size, "url": endpoint_url}}
    r = requests.post(
        "https://api.line.me/liff/v1/apps",
        headers={"Authorization": f"Bearer {liff_access_token}"},
        json=payload,
        timeout=15,
    )
    j = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text}
    if r.ok and j.get("liffId"):
        return {"ok": True, "liffId": j["liffId"], "liffUrl": f"https://liff.line.me/{j['liffId']}"}
    return {"ok": False, "error": j}

# ===== 受眾：撈出全部有效 LINE userId（U 開頭 / 長度 33）=====
def get_all_valid_user_ids(limit: Optional[int] = None) -> List[str]:
    sql = """
        SELECT line_uid
          FROM members
         WHERE line_uid IS NOT NULL
           AND line_uid <> ''
           AND line_uid LIKE 'U%%'
           AND LENGTH(line_uid) = 33
    """
    if limit:
        sql += " LIMIT :lim"
        rows = fetchall(sql, {"lim": limit})
    else:
        rows = fetchall(sql)
    return [r["line_uid"] for r in rows]

# ===== 群發（multicast 每次最多 500；自動分批）=====
def multicast_liff_url(msg_access_token: str, user_ids: List[str], liff_url: str) -> Dict[str, Any]:
    if not user_ids:
        return {"ok": False, "error": "empty_audience"}

    line_bot_api = LineBotApi(msg_access_token)
    msg = TextSendMessage(text=f"請點擊以下連結填寫：\n{liff_url}")

    batch, total = 500, len(user_ids)
    pages = math.ceil(total / batch)

    sent = 0
    for i in range(pages):
        chunk = user_ids[i * batch:(i + 1) * batch]
        if not chunk:
            continue
        line_bot_api.multicast(chunk, msg)
        sent += len(chunk)

    return {"ok": True, "sent": sent, "total": total}
