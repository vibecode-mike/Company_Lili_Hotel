# line_app/services/line_sdk.py
# ============================================================
# LINE SDK 工廠 + 憑證管理
# - 全域 LINE SDK singleton (config, api_client, handler, messaging_api)
# - 多頻道憑證查詢 (get_credentials, get_credentials_by_line_id)
# - MessagingApi 工廠 (get_messaging_api, get_messaging_api_by_line_id)
# - LINE Profile 取得 (fetch_line_profile)
# - Webhook / LIFF 設定 (setup_line_webhook, setup_line_liff)
# ============================================================

import logging
import os
import requests
from typing import Optional

from linebot.v3 import WebhookHandler
from linebot.v3.messaging import (
    ApiClient,
    Configuration,
    MessagingApi,
)

from config import LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN
from db import fetchone, execute, table_has_column as _table_has

# -------------------------------------------------
# 全域 LINE SDK singleton
# -------------------------------------------------
config = Configuration(access_token=LINE_CHANNEL_ACCESS_TOKEN)
api_client = ApiClient(config)
default_handler = WebhookHandler(LINE_CHANNEL_SECRET)
messaging_api = MessagingApi(api_client)

# -------------------------------------------------
# 資料庫欄位相容層
# -------------------------------------------------
# line_channels 表可能使用 channel_id 或 line_channel_id
LINE_CHANNEL_ID_COL = "line_channel_id" if _table_has("line_channels", "line_channel_id") else "channel_id"


# -------------------------------------------------
# 憑證查詢
# -------------------------------------------------
def get_credentials(channel_id: str | None):
    """
    從資料表抓該 channel 的 access_token / secret / liff_id_open。
    若查不到就回 None，代表用預設 .env。
    """
    if not channel_id:
        return None
    try:
        row = fetchone("""
            SELECT channel_access_token AS token,
                   channel_secret       AS secret,
                   COALESCE(liff_id_open, '') AS liff_id_open
              FROM line_channels
             WHERE id = :cid AND is_active = 1
             LIMIT 1
        """, {"cid": channel_id})
        return row if row else None
    except Exception:
        return None


def get_credentials_by_line_id(line_channel_id: str) -> dict | None:
    """用 LINE 的 Channel ID（line_channel_id）抓憑證"""
    row = fetchone(f"""
        SELECT
            channel_access_token AS token,
            channel_secret       AS secret,
            COALESCE(liff_id_open, '') AS liff_id_open
        FROM line_channels
        WHERE {LINE_CHANNEL_ID_COL} = :cid AND is_active = 1
        LIMIT 1
    """, {"cid": line_channel_id})
    return row  # 可能為 None


def get_channel_access_token_by_channel_id(line_channel_id: Optional[str]) -> str:
    """
    多 LINE 專頁支援：
    - 有 line_channel_id -> 從 DB 取對應的 channel_access_token
    - 沒有 line_channel_id -> fallback 使用 .env 的 LINE_CHANNEL_ACCESS_TOKEN
    - 任何情況下：一定回傳 str，否則直接丟 RuntimeError
    """
    # 指定了 line_channel_id -> 從 DB 查
    if line_channel_id:
        row = fetchone(f"""
            SELECT channel_access_token
            FROM line_channels
            WHERE {LINE_CHANNEL_ID_COL} = :cid AND is_active = 1
            LIMIT 1
        """, {"cid": line_channel_id})

        if row:
            token = row.get("channel_access_token")
            if token:
                return token

        logging.warning(
            "[LINE] line_channel_id not found or missing token, fallback to env token: %s",
            line_channel_id,
        )

    # 沒指定 line_channel_id -> fallback 用 .env（舊行為）
    token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("LINE_CHANNEL_ACCESS_TOKEN not set in environment")

    return token


# -------------------------------------------------
# MessagingApi 工廠
# -------------------------------------------------
def get_messaging_api(channel_id: str | None = None):
    """
    有給 channel_id -> 用該 token 建臨時 MessagingApi
    沒給 -> 回傳全域 messaging_api（= .env 預設）
    """
    if not channel_id:
        return messaging_api  # 相容舊行為
    cred = get_credentials(channel_id)
    if not cred or not cred.get("token"):
        # 有指定 channel_id 但找不到 -> 明確錯誤，不 fallback
        raise RuntimeError(f"Invalid channel_id or missing token: {channel_id}")
    cfg = Configuration(access_token=cred["token"])
    return MessagingApi(ApiClient(cfg))


def get_messaging_api_by_line_id(line_channel_id: str | None) -> MessagingApi:
    """用 LINE Channel ID 取得 MessagingApi，沒帶就回退到預設（.env）"""
    if not line_channel_id:
        return messaging_api  # 預設 client

    cred = get_credentials_by_line_id(line_channel_id)
    if not cred or not cred.get("token"):
        raise RuntimeError(f"Invalid line_channel_id or missing token: {line_channel_id}")

    cfg = Configuration(access_token=cred["token"])
    return MessagingApi(ApiClient(cfg))


# -------------------------------------------------
# LINE Profile 取得
# -------------------------------------------------
def fetch_line_profile(user_id: str, line_channel_id: Optional[str] = None) -> tuple[Optional[str], Optional[str]]:
    """
    透過 LINE 官方 API 取回 displayName / pictureUrl
    回傳 (display_name, picture_url)；失敗時皆回 None
    """
    token = None
    if line_channel_id:
        try:
            token = get_channel_access_token_by_channel_id(line_channel_id)
        except Exception as e:
            logging.warning("[PROFILE] token lookup failed for %s: %s", line_channel_id, e)
    if not token:
        token = LINE_CHANNEL_ACCESS_TOKEN
    if not user_id or not token:
        return None, None
    try:
        r = requests.get(
            f"https://api.line.me/v2/bot/profile/{user_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
        if r.ok:
            j = r.json()
            return j.get("displayName"), j.get("pictureUrl")
    except Exception:
        pass
    return None, None


# -------------------------------------------------
# Webhook / LIFF 設定
# -------------------------------------------------
def setup_line_webhook(line_channel_id: str, access_token: str):
    """用 Messaging API 的 Channel Access Token 設定/啟用 Webhook"""
    webhook_url = f"https://linebot.star-bit.io/callback/{line_channel_id}"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # 1) 設定 Webhook URL
    r1 = requests.put(
        "https://api.line.me/v2/bot/channel/webhook/endpoint",
        headers=headers, json={"endpoint": webhook_url}, timeout=10
    )
    # 2) 啟用 Use webhook
    r2 = requests.put(
        "https://api.line.me/v2/bot/channel/webhook/enable",
        headers=headers, timeout=10
    )

    return {"webhook_url": webhook_url, "set_status": r1.status_code, "enable_status": r2.status_code}


def get_login_access_token(channel_id: str, channel_secret: str) -> str:
    """用 Channel ID + Secret 換取可呼叫 LIFF API 的 access_token（client_credentials）"""
    resp = requests.post(
        "https://api.line.me/v2/oauth/accessToken",
        data={
            "grant_type": "client_credentials",
            "client_id": channel_id,
            "client_secret": channel_secret,
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json().get("access_token", "")


def setup_line_liff(line_channel_id: str, channel_secret: str, view_url: str, size: str = "full") -> dict:
    """用 access_token 建立 LIFF App 並回傳 liffId，同時寫回資料庫的 liff_id_open"""
    import datetime

    # 1) 先用 Channel ID+Secret 換 LIFF 管理用 access_token
    access_token = get_login_access_token(line_channel_id, channel_secret)
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    # 2) 建立 LIFF（view_url 是你要在 LIFF 裡面開啟的頁面 URL）
    payload = {
        "view": {"type": size, "url": view_url},
        "description": f"auto-{line_channel_id}",
    }
    create = requests.post("https://api.line.me/liff/v1/apps", headers=headers, json=payload, timeout=10)
    ok = create.status_code // 100 == 2
    liff_id = ""
    try:
        body = create.json()
        liff_id = body.get("liffId", "")
    except Exception:
        pass

    # 3) 建立成功就把 liff_id_open 寫回 DB
    if ok and liff_id:
        execute(
            f"UPDATE line_channels SET liff_id_open=:liff, updated_at=:now WHERE {LINE_CHANNEL_ID_COL}=:cid",
            {"liff": liff_id, "cid": line_channel_id, "now": datetime.datetime.utcnow()},
        )

    return {
        "ok": ok,
        "status": create.status_code,
        "liff_id": liff_id,
        "resp": (create.json() if ok else {"text": create.text[:500]}),
    }
