# usage_monitor.py
# 功能：
# 1) 依 LINE Channel 取本月 quota / 已使用量 / 剩餘
# 2) 群發前做用量 preflight 檢查（不足就回傳 INSUFFICIENT_QUOTA）
#
# 說明：
# - 這支檔案獨立於 app.py，透過 Blueprint 方式被 app 載入。
# - 不直接 import app.py 以避免循環依賴；自行建立最小 DB 連線。
# - 若查不到指定頻道的 token，會回退至 .env 的 LINE_CHANNEL_ACCESS_TOKEN。

from __future__ import annotations

import os
import datetime as dt
from typing import Optional, Dict, Any

import requests
from flask import Blueprint, request, jsonify, render_template
from dotenv import load_dotenv

from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

load_dotenv()

bp = Blueprint("usage_monitor", __name__)

# -------------------------------------------------
# DB 連線（與 app.py 相同環境變數，保持一致）
# -------------------------------------------------
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

def fetchone(sql: str, p: dict | None = None) -> dict | None:
    with engine.begin() as conn:
        r = conn.execute(text(sql), p or {}).mappings().first()
        return dict(r) if r else None

def fetchall(sql: str, p: dict | None = None) -> list[dict]:
    with engine.begin() as conn:
        return [dict(r) for r in conn.execute(text(sql), p or {}).mappings().all()]

# -------------------------------------------------
# LINE Token 解析（多租戶）
# -------------------------------------------------
ENV_FALLBACK_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "").strip()

def resolve_access_token(line_channel_id: Optional[str]) -> Optional[str]:
    """
    依 LINE 官方的 Channel ID 取 Messaging API 長期 token。
    查不到時，回退 .env 預設 token（單一頻道情境）。
    """
    if line_channel_id:
        row = fetchone("""
            SELECT channel_access_token AS token
            FROM line_channels
            WHERE line_channel_id = :cid AND is_active = 1
            LIMIT 1
        """, {"cid": line_channel_id})
        if row and row.get("token"):
            return row["token"]
    return ENV_FALLBACK_TOKEN or None

# -------------------------------------------------
# LINE 用量 / 額度查詢
# -------------------------------------------------
LINE_QUOTA = "https://api.line.me/v2/bot/message/quota"
LINE_CONSUMPTION = "https://api.line.me/v2/bot/message/quota/consumption"

def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def get_monthly_usage_summary(line_channel_id: Optional[str]) -> Dict[str, Any]:
    """
    回傳：{ ok, type, monthly_limit, used, remaining, updated_at }
      - type: "limited" 或 "none"（官方定義）
      - monthly_limit: 若 type=none 會給 None
    """
    token = resolve_access_token(line_channel_id)
    if not token:
        return {"ok": False, "error": "no_token"}

    headers = _auth_headers(token)

    # 額度
    q = requests.get(LINE_QUOTA, headers=headers, timeout=10)
    qj = q.json() if q.ok else {}
    qtype = (qj.get("type") or "").lower()
    if qtype == "limited":
        monthly_limit = int(qj.get("value") or 0)
    else:
        monthly_limit = None  # none = 不限額（企業帳號情境）

    # 已用量
    c = requests.get(LINE_CONSUMPTION, headers=headers, timeout=10)
    used = int((c.json() or {}).get("totalUsage") or 0) if c.ok else 0

    remaining = None if monthly_limit is None else max(0, monthly_limit - used)

    return {
        "ok": True,
        "type": qtype or "unknown",
        "monthly_limit": monthly_limit,
        "used": used,
        "remaining": remaining,
        "updated_at": dt.datetime.utcnow().isoformat() + "Z"
    }

# -------------------------------------------------
# 群發受眾數量估算（與 app.py 的推播邏輯一致）
# -------------------------------------------------
def count_recipients_for_payload(payload: dict) -> int:
    """
    依 payload.target_audience / target_tags 計算實際要推播的人數。
    和 app.py 內的選取邏輯保持一致：只推送有效的 LINE userId（U開頭、長度33）。
    """
    target_audience = (payload or {}).get("target_audience", "all")
    target_tags = (payload or {}).get("target_tags") or []

    if target_audience == "tags" and target_tags:
        placeholders = ", ".join([f":tag{i}" for i in range(len(target_tags))])
        params = {f"tag{i}": t for i, t in enumerate(target_tags)}
        sql = f"""
            SELECT COUNT(DISTINCT m.id) AS n
              FROM members m
              JOIN member_tags mt ON m.id = mt.member_id
             WHERE m.line_uid IS NOT NULL
               AND m.line_uid <> ''
               AND m.line_uid LIKE 'U%%'
               AND LENGTH(m.line_uid) = 33
               AND mt.tag_name IN ({placeholders})
        """
        row = fetchone(sql, params) or {"n": 0}
        return int(row["n"])

    # 預設：全部
    row = fetchone("""
        SELECT COUNT(*) AS n
          FROM members
         WHERE line_uid IS NOT NULL
           AND line_uid <> ''
           AND line_uid LIKE 'U%'
           AND LENGTH(line_uid) = 33
    """) or {"n": 0}
    return int(row["n"])

# -------------------------------------------------
# Preflight：檢查是否足夠本次群發
# -------------------------------------------------
def preflight_check(payload: dict) -> Dict[str, Any]:
    """
    回傳：
      { ok:True, remaining, needed }  或
      { ok:False, code:"INSUFFICIENT_QUOTA", remaining, needed, deficit }
    """
    # 解析頻道（優先 LINE 官方 channel_id；沒有就用 None → 使用 .env token）
    # 注意：移除 request.args.get() 以支援從 FastAPI 調用（無 Flask request context）
    line_channel_id = (
        payload.get("line_channel_id")
        or payload.get("lineChannelId")
        or None
    )

    summary = get_monthly_usage_summary(line_channel_id)
    if not summary.get("ok"):
        return {"ok": False, "code": "USAGE_FETCH_FAILED", "error": summary.get("error", "unknown")}

    needed = count_recipients_for_payload(payload)
    remaining = summary.get("remaining")  # 可能為 None（不限額）

    # 不限額（type=none）或 remaining 為 None → 一律視為足夠
    if remaining is None or remaining >= needed:
        return {"ok": True, "remaining": remaining, "needed": needed, "type": summary.get("type")}

    return {
        "ok": False,
        "code": "INSUFFICIENT_QUOTA",
        "remaining": remaining,
        "needed": needed,
        "deficit": max(0, needed - remaining),
        "type": summary.get("type")
    }

# -------------------------------------------------
# Blueprint 路由
# -------------------------------------------------
@bp.get("/api/usage")
def api_usage_summary():
    """
    顯示本月 quota / 已使用量 / 剩餘（僅數字，無金額）。
    支援 ?line_channel_id=xxx
    """
    line_channel_id = request.args.get("line_channel_id")
    return jsonify(get_monthly_usage_summary(line_channel_id))

@bp.post("/api/usage/preflight_broadcast")
def api_preflight_broadcast():
    """
    群發前檢查：若不足，回 409 並附上 deficit；足夠則回 200。
    前端可用此結果決定是否彈出「餘額不足」提示。
    """
    payload = request.get_json(force=True) or {}
    result = preflight_check(payload)
    if not result.get("ok"):
        return jsonify(result), 409
    return jsonify(result)
