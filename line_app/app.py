# ============================================================
# app.py — Flask + LINE SDK v3 + GPT-4o + SQLAlchemy
# 只升級 LINE v3，其他功能完整保留
# - 內嵌提示詞（不讀 prompt.txt）
# - 聊天與記憶
# - Members / Messages DB 紀錄
# - 活動推播 + 追蹤點擊 /__click
# - 問卷（LIFF 動態表單）建立/推播/儲存
# - 靜態 /uploads 提供給 LINE 取圖
# - /test_push 測試推播
# 顯示訊息群發餘額功能 調用usage_monitor.py程式 並將usage_status.html放置在lili_hotel/backend/uploads/ 若要改動請注意路徑
# ============================================================

import os
import sys
import re
import io
import json
import base64
import hashlib
import logging
import datetime
import requests
import uuid
import time  # 用來在 backfill 抓所有好友個資時 時稍微 sleep，避免打太兇
from pathlib import Path
from typing import Optional

# 確保以任何工作目錄啟動時都能匯入同目錄模組
# 取得 app.py 所在目錄的絕對路徑
BASE_DIR = Path(__file__).resolve().parent

# 強制將此目錄加到 sys.path 最前面（即使已存在也重新插入確保優先權）
if str(BASE_DIR) in sys.path:
    sys.path.remove(str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR))

# 使用共用的配置和資料庫模組
from config import (
    LINE_CHANNEL_SECRET,
    LINE_CHANNEL_ACCESS_TOKEN,
    PUBLIC_BASE,
    LIFF_ID,
    LIFF_ID_OPEN,
    AUTO_BACKFILL_FRIENDS,
    MYSQL_DB,
    ASSET_LOCAL_DIR,
    ASSET_ROUTE_PREFIX,
)
from db import (
    engine,
    fetchone,
    fetchall,
    execute,
    table_has_column as _table_has,
    column_is_required as _col_required,
)

# 現在才開始匯入同目錄模組
import usage_monitor #群發餘額量顯示
from member_liff import bp as member_liff_bp # 載入 LIFF 會員表單的 Blueprint 模組
from manage_botinfo import bp as manage_botinfo_bp # 顯示透過「客戶自行輸入的 Messaging API Channel Access Token」呼叫 LINE 官方 `/v2/bot/info` 端點，並回傳該官方帳號的基本資料，包含 Basic ID（@xxxxxxx）、displayName、pictureUrl 等。

# ===== Service Layer (Phase 1 重構) =====
from services.line_sdk import (
    config as _line_config,
    api_client,
    default_handler as _default_handler,
    messaging_api as _messaging_api,
    LINE_CHANNEL_ID_COL,
    get_credentials,
    get_credentials_by_line_id,
    get_channel_access_token_by_channel_id,
    get_messaging_api,
    get_messaging_api_by_line_id,
    fetch_line_profile,
    setup_line_webhook,
    get_login_access_token,
    setup_line_liff,
)
from services.member_service import (
    upsert_member,
    upsert_line_friend,
    fetch_member_profile,
    maybe_update_member_profile,
    is_gpt_enabled_for_user,
    get_all_follower_ids,
    backfill_line_friends_on_startup,
    DISPLAY_NAME_TOKEN,
    DISPLAY_NAME_TOKEN_SIMPLE,
    _get_display_name_for_uid,
    render_template_text,
)
from services.conversation_service import (
    ensure_thread_for_user,
    insert_conversation_message,
    get_chat_history,
    get_member_conversations,
)
from typing import Any, Dict, List, Optional, Tuple, Iterable
from urllib.parse import quote_plus, quote, parse_qs
from linebot.exceptions import InvalidSignatureError

from flask import Flask, request, abort, jsonify, render_template_string, redirect, send_from_directory, g

# LINE Bot SDK v3
from linebot.v3 import WebhookHandler
from linebot.v3.messaging import (
    ApiClient,
    Configuration,
    MessagingApi,
    ReplyMessageRequest,
    PushMessageRequest,
    TextMessage,
    FlexMessage,
    BroadcastRequest,
    MulticastRequest

)
from linebot.v3.webhooks import (
    FollowEvent,
    UnfollowEvent,
    MessageEvent,
    PostbackEvent,
    TextMessageContent,
)

from linebot.v3.messaging.models import FlexContainer


# SQLAlchemy Core
from sqlalchemy import text

# 確保上傳目錄存在
os.makedirs(ASSET_LOCAL_DIR, exist_ok=True)

# -------------------------------------------------
# init
# -------------------------------------------------
if not LINE_CHANNEL_SECRET or not LINE_CHANNEL_ACCESS_TOKEN:
    raise RuntimeError("請在 .env 設定 LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN")
if not PUBLIC_BASE:
    raise RuntimeError("請在 .env 設定 PUBLIC_BASE")
# LIFF 可選：未設定就跳過，僅停用 LIFF 相關功能
if not LIFF_ID_OPEN:
    logging.info("LIFF_ID_OPEN 還未設定; 若要使用 LIFF 功能，請先填入")

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_url_path=ASSET_ROUTE_PREFIX, static_folder=ASSET_LOCAL_DIR)

# 將群發餘額量顯示功能該模組註冊進 Flask 主應用，啟用其 API 路由
app.register_blueprint(usage_monitor.bp)
# 將LIFF 會員表單的 Blueprint 模組該模組註冊進 Flask 主應用，啟用其 API 路由
app.register_blueprint(member_liff_bp)
# 將的 manage_botinfo.py 顯示官方基本資料如ID等 Blueprint 模組該模組註冊進 Flask 主應用，啟用其 API 路由
app.register_blueprint(manage_botinfo_bp)

# LINE v3 — 全域 singleton 由 services.line_sdk 管理
# 這裡保留別名供 app.py 其餘程式碼使用（向後相容）
config = _line_config
default_handler = _default_handler
messaging_api = _messaging_api

# DB engine 已在 db.py 中建立並匯入

def utcnow():
    return datetime.datetime.utcnow()

def jdump(x): return json.dumps(x, ensure_ascii=False)

# ===== Multi-channel / DB / Profile helpers =====
# 已遷移至 services/ 模組：
#   - services/line_sdk.py: get_credentials, get_messaging_api, get_credentials_by_line_id,
#     get_channel_access_token_by_channel_id, get_messaging_api_by_line_id,
#     fetch_line_profile, setup_line_webhook, get_login_access_token, setup_line_liff
#   - services/member_service.py: upsert_member, upsert_line_friend, fetch_member_profile,
#     maybe_update_member_profile, is_gpt_enabled_for_user, render_template_text,
#     DISPLAY_NAME_TOKEN, DISPLAY_NAME_TOKEN_SIMPLE
# 全部透過頂部 import 提供，向後相容


def _map_question_for_liff(q: dict) -> dict:
    t = (q.get("question_type") or "").upper()
    mapped = dict(q)  # 不破壞原資料

    # 這些通通顯示成單行輸入框
    if t in {"NAME", "PHONE", "EMAIL", "ID_NUMBER", "ADDRESS", "BIRTHDAY", "LINK"}:
        mapped["question_type"] = "TEXT"
        # 可選：給個提示
        ph = {
            "NAME": "請輸入姓名",
            "PHONE": "請輸入聯絡電話",
            "EMAIL": "請輸入電子信箱",
            "ID_NUMBER": "請輸入證件號碼",
            "ADDRESS": "請輸入地址",
            "BIRTHDAY": "YYYY-MM-DD",
            "LINK": "請貼上連結"
        }.get(t)
        if ph:
            mapped["placeholder"] = ph
        # TEXT 不需要 options，保證回傳空陣列
        mapped["options"] = []

    elif t == "GENDER":
        mapped["question_type"] = "SINGLE_CHOICE"
        opts = mapped.get("options") or []
        if not opts:
            mapped["options"] = [{"label": "男"}, {"label": "女"}]

    elif t in {"IMAGE", "VIDEO"}:
        # 先暫時用 TEXT 提示（不改 DB 的前提下，避免前端不支援而消失）
        mapped["question_type"] = "TEXT"
        mapped["placeholder"] = "請輸入網址或說明（圖片/影片暫以文字填寫）"
        mapped["options"] = []

    else:
        # 其他不識別的類型，統一當 TEXT，避免被前端忽略而整題消失
        mapped["question_type"] = "TEXT"
        mapped.setdefault("options", [])

    # 保底：options 必為 list
    if mapped.get("options") is None:
        mapped["options"] = []

    return mapped


# DB helpers (_table_has, _col_required, fetchall, fetchone, execute)
# 已移至共用模組 db.py

# ensure_thread_for_user, insert_conversation_message
# 已遷移至 services/conversation_service.py

# -------------------------------------------------
# Members / Messages
# -------------------------------------------------
# upsert_member, insert_message (已廢棄) 已遷移至 services/member_service.py

# upsert_line_friend, get_all_follower_ids, backfill_line_friends_on_startup
# 已遷移至 services/member_service.py

# 啟動時自動補齊 line_friends 的好友資料（只補缺少的）
backfill_line_friends_on_startup()




# -------------------------------------------------
# Auto Response 檢查函數
# -------------------------------------------------
# DB schema compatibility for auto_response tables
AUTO_RESPONSE_MSG_ID_COL = (
    "response_id" if _table_has("auto_response_messages", "response_id") else "auto_response_id"
)
AUTO_RESPONSE_KW_ID_COL = (
    "auto_response_id" if _table_has("auto_response_keywords", "auto_response_id") else "response_id"
)
AUTO_RESPONSE_KW_TEXT_COL = (
    "keyword" if _table_has("auto_response_keywords", "keyword") else "keyword_text"
)

# Security: validate all dynamically-determined column names against whitelist
_VALID_COL_NAMES = frozenset({
    "line_channel_id", "channel_id",
    "response_id", "auto_response_id",
    "keyword", "keyword_text",
})
for _col_var_name, _col_val in [
    ("LINE_CHANNEL_ID_COL", LINE_CHANNEL_ID_COL),
    ("AUTO_RESPONSE_MSG_ID_COL", AUTO_RESPONSE_MSG_ID_COL),
    ("AUTO_RESPONSE_KW_ID_COL", AUTO_RESPONSE_KW_ID_COL),
    ("AUTO_RESPONSE_KW_TEXT_COL", AUTO_RESPONSE_KW_TEXT_COL),
]:
    if _col_val not in _VALID_COL_NAMES:
        raise RuntimeError(f"Invalid column name for {_col_var_name}: {_col_val!r}")

def _get_basic_id_for_line_channel(line_channel_id: Optional[str]) -> Optional[str]:
    if not line_channel_id:
        return None
    try:
        row = fetchone(
            f"SELECT basic_id FROM line_channels WHERE {LINE_CHANNEL_ID_COL}=:cid LIMIT 1",
            {"cid": line_channel_id},
        )
        return row.get("basic_id") if row else None
    except Exception:
        return None


def _parse_json_list(val) -> Optional[list]:
    if val is None:
        return None
    if isinstance(val, list):
        return val
    if isinstance(val, (str, bytes)):
        try:
            return json.loads(val)
        except Exception:
            return None
    return None


def _time_to_seconds(t) -> Optional[int]:
    if t is None:
        return None
    if isinstance(t, datetime.timedelta):
        return int(t.total_seconds())
    if isinstance(t, datetime.time):
        return int(t.hour * 3600 + t.minute * 60 + t.second)
    if isinstance(t, str):
        try:
            parts = [int(p) for p in t.split(":")]
            while len(parts) < 3:
                parts.append(0)
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        except Exception:
            return None
    return None


def _is_within_date_range(start, end, today: datetime.date) -> bool:
    if start is None and end is None:
        return True
    if start is None:
        return today <= end
    if end is None:
        return today >= start
    return start <= today <= end


def _is_within_time_range(start, end, now: datetime.datetime) -> bool:
    if start is None and end is None:
        return True
    now_sec = now.hour * 3600 + now.minute * 60 + now.second
    start_sec = _time_to_seconds(start)
    end_sec = _time_to_seconds(end)
    if start_sec is None and end_sec is None:
        return True
    if start_sec is None:
        return now_sec <= end_sec
    if end_sec is None:
        return now_sec >= start_sec
    if start_sec == end_sec:
        # Treat equal bounds as "no time restriction"
        return True
    if start_sec < end_sec:
        return start_sec <= now_sec <= end_sec
    # Crosses midnight
    return now_sec >= start_sec or now_sec <= end_sec


def _auto_response_applicable(row: Dict[str, Any], line_channel_id: Optional[str]) -> bool:
    # Channel filter
    ar_channel_id = row.get("channel_id")
    if ar_channel_id:
        basic_id = _get_basic_id_for_line_channel(line_channel_id)
        if line_channel_id and ar_channel_id == line_channel_id:
            pass
        elif basic_id and ar_channel_id == basic_id:
            pass
        else:
            return False

    # Channels list filter (if set and doesn't include LINE)
    channels = _parse_json_list(row.get("channels"))
    if channels is not None and "LINE" not in channels:
        return False

    today = datetime.datetime.now().date()
    now = datetime.datetime.now()
    if not _is_within_date_range(row.get("date_range_start"), row.get("date_range_end"), today):
        return False
    if not _is_within_time_range(row.get("trigger_time_start"), row.get("trigger_time_end"), now):
        return False
    return True


def check_keyword_trigger(line_uid: str, text: str, line_channel_id: Optional[str] = None):
    """
    檢查是否有匹配的關鍵字自動回應

    Returns:
        回應內容（如果有匹配且啟用）或 None
    """
    try:
        rows = fetchall(f"""
            SELECT ar.channel_id, ar.channels, ar.trigger_time_start, ar.trigger_time_end,
                   ar.date_range_start, ar.date_range_end, ar.updated_at, ar.created_at,
                   arm.message_content
            FROM auto_responses ar
            JOIN auto_response_keywords ark ON ar.id = ark.{AUTO_RESPONSE_KW_ID_COL}
            JOIN auto_response_messages arm ON ar.id = arm.{AUTO_RESPONSE_MSG_ID_COL}
            WHERE ar.is_active = 1
              AND ar.trigger_type = 'keyword'
              AND ark.is_enabled = 1
              AND LOWER(:text) = LOWER(ark.{AUTO_RESPONSE_KW_TEXT_COL})
            ORDER BY COALESCE(ar.updated_at, ar.created_at) DESC, arm.sequence_order ASC
        """, {"text": text})
        for row in rows:
            if _auto_response_applicable(row, line_channel_id):
                logging.info(f"Keyword matched for user {line_uid}: {text}")
                return row.get("message_content") if isinstance(row, dict) else row[0]
        return None
    except Exception as e:
        logging.exception(f"check_keyword_trigger error: {e}")
        return None

def check_always_response(line_channel_id: Optional[str] = None):
    """
    檢查是否有啟用的一律回應

    Returns:
        回應內容（如果有啟用）或 None
    """
    try:
        rows = fetchall(f"""
            SELECT ar.channel_id, ar.channels, ar.trigger_time_start, ar.trigger_time_end,
                   ar.date_range_start, ar.date_range_end, ar.updated_at, ar.created_at,
                   arm.message_content
            FROM auto_responses ar
            JOIN auto_response_messages arm ON ar.id = arm.{AUTO_RESPONSE_MSG_ID_COL}
            WHERE ar.is_active = 1
              AND ar.trigger_type IN ('always', 'follow')
            ORDER BY COALESCE(ar.updated_at, ar.created_at) DESC, arm.sequence_order ASC
        """)
        for row in rows:
            if _auto_response_applicable(row, line_channel_id):
                logging.info("Always response is active")
                return row.get("message_content") if isinstance(row, dict) else row[0]
        return None
    except Exception as e:
        logging.exception(f"check_always_response error: {e}")
        return None

def check_welcome_response(line_channel_id: Optional[str] = None):
    """
    檢查是否有啟用的歡迎訊息

    Returns:
        回應內容（如果有啟用）或 None
    """
    try:
        rows = fetchall(f"""
            SELECT ar.channel_id, ar.channels, ar.trigger_time_start, ar.trigger_time_end,
                   ar.date_range_start, ar.date_range_end, ar.updated_at,
                   arm.message_content
            FROM auto_responses ar
            JOIN auto_response_messages arm ON ar.id = arm.{AUTO_RESPONSE_MSG_ID_COL}
            WHERE ar.is_active = 1
              AND ar.trigger_type = 'welcome'
            ORDER BY ar.updated_at DESC, arm.sequence_order ASC
        """)
        for row in rows:
            if _auto_response_applicable(row, line_channel_id):
                logging.info("Welcome response is active")
                return row.get("message_content") if isinstance(row, dict) else row[0]
        return None
    except Exception as e:
        logging.exception(f"check_welcome_response error: {e}")
        return None

# -------------------------------------------------
# Base64 圖片 → 檔案
# -------------------------------------------------
_data_uri_re = re.compile(r"^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$")

def save_base64_image(base64_str: str) -> Tuple[str,str]:
    """
    return (public_url, relative_path)
    """
    m = _data_uri_re.match(base64_str.strip())
    if m:
        mime, b64 = m.group(1), m.group(2)
        exts = {"image/jpeg":"jpg","image/jpg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"}
        ext = exts.get(mime,"png")
    else:
        b64 = base64_str.strip()
        ext = "png"
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        raw = base64.b64decode(b64 + "===")

    h = hashlib.sha256(raw).hexdigest()[:24]
    rel = f"{ASSET_ROUTE_PREFIX}/{h}.{ext}"
    abs_path = os.path.join(ASSET_LOCAL_DIR, f"{h}.{ext}")
    with open(abs_path, "wb") as f:
        f.write(raw)

    public_url = f"{PUBLIC_BASE}{rel}"
    return public_url, rel

def image_url_from_item(item: dict) -> Optional[str]:
    if item.get("image_base64"):
        url, _ = save_base64_image(item["image_base64"])
        return url
    path = item.get("image_url")
    if not path: return None
    if path.startswith("http"): return path
    return f"{PUBLIC_BASE}{path}"

# -------------------------------------------------
# Flex builders（推廣）
# -------------------------------------------------
def make_image_button_bubble(item: dict, tracked_uri: Optional[str]):
    body = []
    if item.get("title"):
        body.append({"type":"text","text":str(item["title"]),"weight":"bold","size":"lg","wrap":True})
    if item.get("description"):
        body.append({"type":"text","text":str(item["description"]),"wrap":True,"margin":"sm"})
    if item.get("price") is not None:
        body.append({"type":"text","text":f"$ {item['price']}", "weight":"bold","margin":"sm"})

    hero = {"type":"image","url": image_url_from_item(item) or "https://dummyimage.com/1200x800/eeeeee/333333&text=No+Image",
            "size":"full","aspectMode":"cover","aspectRatio":"1:1"}

    # 無論如何 hero 直接可點
    action_uri = tracked_uri or item.get("action_url") or item.get("url") or f"{PUBLIC_BASE}/"
    hero["action"] = {"type":"uri","uri": action_uri}

    return {
        "type":"bubble",
        "hero": hero,
        "body":{"type":"box","layout":"vertical","spacing":"sm","contents": body or [{"type":"text","text":" "}]},
        **({
            "footer":{
                "type":"box","layout":"vertical","spacing":"sm",
                "contents":[{"type":"button","style":"primary","action":{"type":"uri","label": item.get("action_button_text") or "詳情","uri": action_uri}}]
            }
        } if action_uri else {})
    }

def make_image_click_bubble(item: dict, tracked_uri: Optional[str]):
    image_url = image_url_from_item(item) or "https://dummyimage.com/1200x800/eeeeee/333333&text=No+Image"
    aspect_ratio = item.get("image_aspect_ratio", "1:1")
    action_button_enabled = item.get("action_button_enabled", False)

    if not action_button_enabled:
        click_action_type = item.get("image_click_action_type", "open_image")
        click_action_value = item.get("image_click_action_value")

        if click_action_type == "open_image":
            action_uri = image_url
        elif click_action_type == "open_url" and click_action_value:
            action_uri = tracked_uri or click_action_value
        else:
            action_uri = tracked_uri or image_url

        return {
            "type": "bubble",
            "hero": {
                "type": "image",
                "url": image_url,
                "size": "full",
                "aspectRatio": aspect_ratio,
                "aspectMode": "cover",
                "action": {"type": "uri", "uri": action_uri}
            }
        }

    # 有動作按鈕
    btn_action_type = (item.get("action_button_interaction_type") or "open_url").lower()
    btn_label = item.get("action_button_text") or "查看詳情"

    # 按鈕：open_url 走追蹤
    if btn_action_type == "open_url":
        button_action = {"type": "uri", "label": btn_label, "uri": tracked_uri}
    else:
        button_action = {"type": "message", "label": btn_label, "text": btn_label}

    # 圖片：也導到追蹤（如不想記圖片點擊，可改 image_url）
    hero_action = {"type": "uri", "uri": tracked_uri}

    return {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": image_url,
            "size": "full",
            "aspectRatio": aspect_ratio,
            "aspectMode": "cover",
            "action": hero_action
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [{
                "type": "button",
                "style": "primary",
                "action": button_action
            }]
        }
    }


def build_room_card_flex_carousel(room_cards: list) -> dict:
    """
    將 backend room_cards (list[dict]) 轉為 LINE Flex Carousel JSON。
    每張房卡 = 一個 bubble：hero 圖片 + 房名/剩餘 + 價格 + separator + 數量選擇器。
    """
    bubbles = []
    for card in room_cards[:12]:  # LINE carousel 最多 12 bubbles
        image_url = card.get("image_url") or "https://dummyimage.com/1200x800/cccccc/333333&text=No+Image"
        room_type_code = card.get("room_type_code", "")
        room_type_name = card.get("room_type_name", "房型")
        price = card.get("price", 0)
        available_count = card.get("available_count")

        name_row_contents = [
            {"type": "text", "text": room_type_name, "weight": "bold", "size": "xl", "flex": 4},
        ]
        if available_count is not None:
            name_row_contents.append({
                "type": "text",
                "text": f"剩 {available_count} 間",
                "color": "#FF5555" if available_count <= 3 else "#999999",
                "size": "sm", "align": "end", "gravity": "bottom", "flex": 2,
            })

        price_text = f"每晚 TWD {price:,}"
        qty = 0

        qty_selector = {
            "type": "box", "layout": "horizontal", "margin": "lg", "alignItems": "center",
            "contents": [
                {"type": "text", "text": "選擇預訂數量", "flex": 2, "color": "#666666", "size": "md"},
                {
                    "type": "box", "layout": "horizontal", "flex": 3, "spacing": "md",
                    "contents": [
                        {
                            "type": "box", "layout": "horizontal",
                            "contents": [{"type": "text", "text": "－", "align": "center",
                                          "gravity": "center", "color": "#ffffff", "weight": "bold", "size": "md"}],
                            "width": "40px", "height": "40px",
                            "backgroundColor": "#BBBBBB", "cornerRadius": "8px",
                            "action": {"type": "postback", "label": "minus",
                                       "data": f"action=minus&roomType={quote(room_type_code)}&currentQty={qty}"},
                        },
                        {"type": "text", "text": str(qty), "align": "center",
                         "gravity": "center", "weight": "bold", "size": "lg", "flex": 1},
                        {
                            "type": "box", "layout": "horizontal",
                            "contents": [{"type": "text", "text": "＋", "align": "center",
                                          "gravity": "center", "color": "#ffffff", "weight": "bold", "size": "md"}],
                            "width": "40px", "height": "40px",
                            "backgroundColor": "#1DB446", "cornerRadius": "8px",
                            "action": {"type": "postback", "label": "plus",
                                       "data": f"action=plus&roomType={quote(room_type_code)}&currentQty={qty}"},
                        },
                    ],
                },
            ],
        }

        bubble = {
            "type": "bubble",
            "hero": {
                "type": "image", "url": image_url,
                "size": "full", "aspectRatio": "20:13", "aspectMode": "cover",
            },
            "body": {
                "type": "box", "layout": "vertical",
                "contents": [
                    {"type": "box", "layout": "horizontal", "contents": name_row_contents},
                    {"type": "text", "text": price_text, "size": "sm", "color": "#999999", "margin": "sm"},
                    {"type": "separator", "margin": "lg"},
                    qty_selector,
                ],
            },
        }
        bubbles.append(bubble)

    if len(bubbles) == 1:
        return bubbles[0]
    return {"type": "carousel", "contents": bubbles}


def build_user_messages_from_payload(payload: dict, campaign_id: int, line_user_id: str) -> List[FlexMessage]:
    """
    從後台 payload 組成「要發給單一 user 的 Flex 訊息」列表。

    ✅ 新版：僅使用前端生成的 flex_message_json，移除舊格式處理邏輯。

    🔹 跟『通知 / 聊天室預覽』相關的欄位說明：
        - payload["notification_message"]
            → 給【手機通知列 / 鎖屏】看的文字
            → 會用在第一則 Text 訊息（在 push_campaign 裡處理）

        - payload["preview_message"]
            → 給【聊天室列表預覽】看的文字
            → 這裡會用在 FlexMessage.alt_text（Flex 的預覽文字）

    ⚠ 注意：
        - build_user_messages_from_payload 只負責產生 Flex，
          第一則「通知用文字」會在 push_campaign 裡多送一則 TextMessage。
    """

    # 後台自定義通知文字（同時用於 altText）
    notification_message = (payload.get("notification_message") or "").strip() or "新訊息"

    # -----------------------------
    # 追蹤 URL 注入函數
    # -----------------------------
    def inject_tracking_into_flex_json(flex_json, campaign_id, line_user_id, payload):
        """
        遞迴注入追蹤 URL 到 Flex JSON 的所有 action.uri

        修復：從每個 bubble 的 _metadata.interactionTags 讀取標籤
        - heroTag: 圖片點擊標籤
        - buttonTags: [按鈕1標籤, 按鈕2標籤, ...]
        """

        def make_tracking_url(original_url, interaction_type="image_click", tag_val=None):
            """生成追蹤 URL"""
            # &src (來源活動 ID)
            src = payload.get("source_campaign_id")
            src_q = f"&src={src}" if src is not None else ""

            # &tag (互動標籤) - 使用傳入的 tag_val
            if isinstance(tag_val, str):
                tag_val = tag_val.strip()
            tag_q = f"&tag={quote(tag_val, safe='')}" if tag_val else ""

            # 組成追蹤 URL
            tracking_url = (
                f"{PUBLIC_BASE}/__track"
                f"?cid={campaign_id}&uid={line_user_id}"
                f"&type={interaction_type}&to={quote(original_url, safe='')}"
                f"{src_q}{tag_q}"
            )
            logging.info(f"[TRACKING] {interaction_type}: {original_url} -> {tracking_url[:100]}...")
            return tracking_url

        def process_bubble(bubble):
            """處理單一 bubble，從其 _metadata 取得標籤"""
            # 取得此 bubble 的互動標籤
            metadata = bubble.get("_metadata", {})
            interaction_tags = metadata.get("interactionTags", {})
            hero_tag = interaction_tags.get("heroTag")
            button_tags = interaction_tags.get("buttonTags", [])

            logging.info(f"[TRACKING] Processing bubble with heroTag={hero_tag}, buttonTags={button_tags}")

            # 處理 hero 區塊（圖片）
            hero = bubble.get("hero")
            if hero and isinstance(hero, dict):
                action = hero.get("action", {})
                if action.get("type") == "uri" and "uri" in action:
                    original_uri = action["uri"]
                    action["uri"] = make_tracking_url(original_uri, "image_click", hero_tag)

            # 處理 footer 區塊（按鈕）
            footer = bubble.get("footer")
            if footer and isinstance(footer, dict):
                contents = footer.get("contents", [])
                button_index = 0
                for item in contents:
                    if isinstance(item, dict) and item.get("type") == "button":
                        action = item.get("action", {})
                        if action.get("type") == "uri" and "uri" in action:
                            original_uri = action["uri"]
                            # 取對應索引的標籤
                            tag = button_tags[button_index] if button_index < len(button_tags) else None
                            action["uri"] = make_tracking_url(original_uri, "button_url", tag)
                        button_index += 1

            return bubble

        # 深度複製避免修改原始資料
        import copy
        flex_copy = copy.deepcopy(flex_json)

        # 判斷是 carousel 還是單一 bubble
        if flex_copy.get("type") == "carousel":
            contents = flex_copy.get("contents", [])
            flex_copy["contents"] = [process_bubble(b) for b in contents]
        elif flex_copy.get("type") == "bubble":
            flex_copy = process_bubble(flex_copy)

        return flex_copy

    # -----------------------------
    # 使用 flex_message_json
    # -----------------------------
    flex_json_raw = payload.get("flex_message_json")
    if not flex_json_raw:
        error_msg = f"flex_message_json is required (campaign_id={campaign_id})"
        logging.error(error_msg)
        raise ValueError(error_msg)

    try:
        # 解析 JSON（可能是字串或已解析的 dict）
        if isinstance(flex_json_raw, str):
            flex_json = json.loads(flex_json_raw)
        else:
            flex_json = flex_json_raw

        logging.info(f"[FLEX_JSON] Original: {json.dumps(flex_json, ensure_ascii=False)[:200]}...")

        # 注入追蹤 URL
        flex_json = inject_tracking_into_flex_json(flex_json, campaign_id, line_user_id, payload)

        logging.info(f"[FLEX_JSON] After tracking injection: {json.dumps(flex_json, ensure_ascii=False)[:200]}...")

        # 轉換為 FlexContainer
        fc = FlexContainer.from_dict(flex_json)

        logging.info(f"[FLEX_MESSAGE] Created FlexMessage with alt_text='{notification_message}'")

        # 回傳 FlexMessage
        return [FlexMessage(alt_text=notification_message, contents=fc)]

    except json.JSONDecodeError as e:
        error_msg = f"Failed to parse flex_message_json (campaign_id={campaign_id}): {e}"
        logging.error(error_msg)
        raise ValueError(error_msg)
    except Exception as e:
        error_msg = f"Failed to process flex_message_json (campaign_id={campaign_id}): {e}"
        logging.error(error_msg)
        raise


# 活動推播 (Campaign Push)
def _create_campaign_row(payload: dict) -> int:
    """
    建立一筆 messages「群發活動」紀錄，回傳 messages.id。

    ⚠ 不改資料庫結構，只使用你現在 messages / message_templates 表裡「確實存在」的欄位。
      - message_templates: 用 template_type 找 id，找不到就讓 template_id = NULL
      - messages: 寫入欄位：
          message_content, template_id, target_type, trigger_condition,
          interaction_tags, send_time, send_status,
          send_count, open_count, created_at, updated_at
    """

    # 1) 先決定 template_id（可以為 None）
    tid = payload.get("template_id")
    if not tid:
        raw_type = payload.get("type") or payload.get("template_type") or ""
        ttype = raw_type.strip().upper()

        # 後台傳來的類型，先做個簡單對應（你之前用 IMAGE_CARD / IMAGE_CLICK）
        ALIAS = {
            "IMAGE_CARD": "IMAGE_CARD",
            "IMAGE_CLICK": "IMAGE_CLICK",
            "IMAGE": "IMAGE_CARD",
            "CARD": "IMAGE_CARD",
            "CLICK": "IMAGE_CLICK",
        }
        ttype = ALIAS.get(ttype, ttype)

        if not ttype:
            # 連 type/template_type 都沒有，就不要再硬找模板，直接用 None
            tid = None
        else:
            try:
                # ✅ 這裡只用「真的存在」的 template_type 欄位
                row = fetchone("""
                    SELECT id FROM message_templates
                    WHERE template_type = :t
                    ORDER BY id DESC
                    LIMIT 1
                """, {"t": ttype})
                if row:
                    tid = row["id"]
                else:
                    # 找不到就算了，不要炸掉，template_id 用 NULL
                    logging.warning(
                        "[_create_campaign_row] message_templates 找不到 template_type=%s 的模板，template_id 先用 NULL",
                        ttype,
                    )
                    tid = None
            except Exception as e:
                # 查模板失敗一樣不要讓整個流程掛掉
                logging.warning(
                    "[_create_campaign_row] 查詢 message_templates 失敗，template_id 先用 NULL：%s",
                    e,
                )
                tid = None

    # 2) 準備要寫進 messages 的其他欄位
    now = utcnow()
    title = payload.get("title") or payload.get("name") or "未命名活動"
    audience = payload.get("target_audience") or "all"

    # 標籤 → 轉成 JSON 文字存進 interaction_tags（你的欄位名稱就是 interaction_tags）
    interaction_tags = payload.get("interaction_tags")
    if isinstance(interaction_tags, str):
        interaction_tags = [x.strip() for x in interaction_tags.split(",") if x.strip()]
    elif not interaction_tags:
        interaction_tags = None

    # 發送狀態：立即送 / 預約
    status = "sent" if (payload.get("schedule_type") or "immediate") == "immediate" else "scheduled"

    # 映射 target_audience → target_type（messages 表裡有 target_type）
    target_type = "all_friends" if audience == "all" else "filtered"

    # 映射 status → send_status（messages 表裡有 send_status）
    status_map = {
        "sent": "已發送",
        "scheduled": "排程發送",
        "draft": "草稿",
        "failed": "發送失敗",
    }
    send_status = status_map.get(status, "草稿")

    params = {
        "content": title,
        "tid": tid,
        "target_type": target_type,
        "itag": json.dumps(interaction_tags, ensure_ascii=False) if interaction_tags is not None else None,
        "now": now,
        "send_status": send_status,
    }

    # 3) ✅ 寫入 messages（完全照你現在 messages 表有的欄位，不多加）
    #
    #   欄位：
    #     message_title, template_id, target_type, trigger_condition,
    #     interaction_tags, send_time, send_status,
    #     send_count, open_count, created_at, updated_at
    #
    #   ❌ 沒有 click_count
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO messages
                (message_title, template_id, target_type, trigger_condition,
                 interaction_tags, send_time, send_status,
                 send_count, open_count, created_at, updated_at)
            VALUES
                (:content, :tid, :target_type, NULL,
                 :itag, :now, :send_status,
                 0, 0, :now, :now)
        """), params)
        rid = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()

    return int(rid)


def _add_campaign_recipients(campaign_id: int, mids: List[int]):
    """新增訊息發送明細（message_deliveries）"""
    if not mids: return
    with engine.begin() as conn:
        for mid in mids:
            conn.execute(text("""
                INSERT INTO message_deliveries (message_id, member_id, delivery_status, sent_at, created_at, updated_at)
                VALUES (:cid,:mid,'sent',:now,:now,:now)
            """), {"cid": campaign_id, "mid": mid, "now": utcnow()})
        conn.execute(text("UPDATE messages SET send_count=send_count+:n, updated_at=:now WHERE id=:cid"),
                     {"n": len(mids), "cid": campaign_id, "now": utcnow()})

def push_campaign(payload: dict) -> Dict[str, Any]:
    cid = _create_campaign_row(payload)

    # 依 target_audience 取得目標用戶（使用 members 表）
    target_audience = payload.get("target_audience", "all")
    include_tags = payload.get("include_tags", [])
    exclude_tags = payload.get("exclude_tags", [])

    logging.info(f"=== [Broadcast Start] ===")
    logging.info(f"Target audience: {target_audience}")
    logging.info(f"Include tags: {include_tags}")
    logging.info(f"Exclude tags: {exclude_tags}")

    if target_audience == "all":
        # 情境 A: 發送給所有會員（只發給正在關注的）
        rs = fetchall("""
            SELECT m.line_uid, m.id
            FROM members m
            WHERE m.line_uid IS NOT NULL
              AND m.line_uid != ''
              AND m.is_following = 1
        """)
    elif target_audience == "filtered":
        # 根據 include 和 exclude 標籤進行篩選
        if include_tags and exclude_tags:
            # 情境 B: 同時有包含和排除標籤
            include_placeholders = ", ".join([f":inc{i}" for i in range(len(include_tags))])
            exclude_placeholders = ", ".join([f":exc{i}" for i in range(len(exclude_tags))])

            params = {}
            params.update({f"inc{i}": tag for i, tag in enumerate(include_tags)})
            params.update({f"exc{i}": tag for i, tag in enumerate(exclude_tags)})

            rs = fetchall(f"""
                SELECT DISTINCT m.line_uid, m.id
                FROM members m
                INNER JOIN member_tags mt ON m.id = mt.member_id
                WHERE m.line_uid IS NOT NULL
                  AND m.line_uid != ''
                  AND m.is_following = 1
                  AND mt.tag_name IN ({include_placeholders})
                  AND m.id NOT IN (
                      SELECT DISTINCT m2.id
                      FROM members m2
                      INNER JOIN member_tags mt2 ON m2.id = mt2.member_id
                      WHERE mt2.tag_name IN ({exclude_placeholders})
                  )
            """, params)

        elif include_tags:
            # 情境 C: 僅包含標籤
            include_placeholders = ", ".join([f":inc{i}" for i in range(len(include_tags))])
            params = {f"inc{i}": tag for i, tag in enumerate(include_tags)}

            rs = fetchall(f"""
                SELECT DISTINCT m.line_uid, m.id
                FROM members m
                INNER JOIN member_tags mt ON m.id = mt.member_id
                WHERE m.line_uid IS NOT NULL
                  AND m.line_uid != ''
                  AND m.is_following = 1
                  AND mt.tag_name IN ({include_placeholders})
            """, params)

        elif exclude_tags:
            # 情境 D: 僅排除標籤
            exclude_placeholders = ", ".join([f":exc{i}" for i in range(len(exclude_tags))])
            params = {f"exc{i}": tag for i, tag in enumerate(exclude_tags)}

            rs = fetchall(f"""
                SELECT DISTINCT m.line_uid, m.id
                FROM members m
                WHERE m.line_uid IS NOT NULL
                  AND m.line_uid != ''
                  AND m.is_following = 1
                  AND m.id NOT IN (
                      SELECT DISTINCT m2.id
                      FROM members m2
                      INNER JOIN member_tags mt ON m2.id = mt.member_id
                      WHERE mt.tag_name IN ({exclude_placeholders})
                  )
            """, params)
        else:
            # 沒有指定標籤，發送給所有會員（只發給正在關注的）
            rs = fetchall("""
                SELECT m.line_uid, m.id
                FROM members m
                WHERE m.line_uid IS NOT NULL
                  AND m.line_uid != ''
                  AND m.is_following = 1
            """)
    else:
        # 預設發送給所有會員（只發給正在關注的）
        rs = fetchall("""
            SELECT m.line_uid, m.id
            FROM members m
            WHERE m.line_uid IS NOT NULL
              AND m.line_uid != ''
              AND m.is_following = 1
        """)

    logging.info(f"Found {len(rs)} members with line_uid")
    if rs:
        sample_uids = [r['line_uid'] for r in rs[:5]]
        logging.info(f"Sample line_uids: {sample_uids}")

    if not rs:
        # 檢查是數據庫完全無會員，還是標籤篩選無匹配
        total_members_result = fetchone("""
            SELECT COUNT(*) as cnt
            FROM members
            WHERE line_uid IS NOT NULL
              AND line_uid != ''
        """)
        total_members = total_members_result['cnt'] if total_members_result else 0

        # 生成更友好的錯誤消息
        if total_members == 0:
            error_msg = "目前沒有會員（members 表為空或無 line_uid），請先同步會員數據"
        elif target_audience == "filtered":
            if include_tags and exclude_tags:
                include_str = ", ".join(include_tags)
                exclude_str = ", ".join(exclude_tags)
                error_msg = f"沒有同時符合包含標籤 [{include_str}] 且不包含排除標籤 [{exclude_str}] 的會員"
            elif include_tags:
                tags_str = ", ".join(include_tags)
                error_msg = f"沒有會員擁有指定的包含標籤: {tags_str}"
            elif exclude_tags:
                tags_str = ", ".join(exclude_tags)
                error_msg = f"所有會員都擁有排除標籤: {tags_str}"
            else:
                error_msg = "未找到符合篩選條件的會員"
        else:
            error_msg = "未找到符合條件的會員"

        logging.error(f"[Broadcast Error] {error_msg}")
        execute(
            "UPDATE messages SET send_status='发送失败', failure_reason=:reason, updated_at=:now WHERE id=:cid",
            {"cid": cid, "reason": error_msg, "now": utcnow()},
        )
        return {"ok": False, "campaign_id": cid, "sent": 0, "error": error_msg}

    # 在迴圈外先決定要用哪個 Messaging API（避免重複 new client）
    # channel_id 和 line_channel_id 都是 LINE 官方的 Channel ID，統一用 get_messaging_api_by_line_id()
    line_cid = (payload or {}).get("line_channel_id") or (payload or {}).get("channel_id")
    api = get_messaging_api_by_line_id(line_cid)

    sent = 0
    failed = 0
    total_targets = len(rs)

    logging.info(f"Starting to send to {total_targets} members.")

    # 後台自訂的兩段文案（可以是空）
    notification_message = (payload.get("notification_message") or "").strip()
    preview_message = (payload.get("preview_message") or "").strip()

    for idx, r in enumerate(rs, 1):
        uid = r["line_uid"]
        mid = r["id"]

        if not _is_valid_line_user_id(uid):
            logging.warning(f"[{idx}/{total_targets}] Skip invalid user id: {uid}")
            failed += 1
            continue

        try:
            # 先組 Flex（裡面的 alt_text 已經用 preview_message）
            msgs = build_user_messages_from_payload(payload, cid, uid)

            # 判斷是否啟用「雙訊息模式」
            #   - 兩個欄位都有值，而且內容不同：才啟用
            #   - 否則就跟原本一樣只送一次 Flex
            
            #use_two_step = (
            #   notification_message
            #  and preview_message
            #  and notification_message != preview_message
            #)

            use_two_step = False
            
            logging.info(
                f"[{idx}/{total_targets}] Sending to {uid} "
                f"(member_id={mid}), two_step={use_two_step}"
            )

            # - altText = notification_message（作為通知內容）
            # - notification_disabled = False（讓通知跳出）
            # - 聊天室不會顯示文字 notification_message

            try:
                # 用 notification_message 當 alt_text（LINE 通知會用 alt_text）
                alt_txt = notification_message or preview_message or payload.get("title", "通知")

                # msgs 是 build_user_messages_from_payload 回傳的 list
                # 通常 msgs[0] 就是 FlexMessage
                flex_msg = msgs[0]

                # 強制設置 Flex 的 alt_text
                flex_msg.alt_text = alt_txt

                api.push_message(PushMessageRequest(
                    to=uid,
                    messages=[flex_msg],
                    notification_disabled=False     # 允許通知跳出
                ))

                sent += 1
                logging.info(f"[{idx}/{total_targets}] ✓ Success to {uid}")

                # 記錄 outgoing log
                # 註解：群發記錄已在 _create_campaign_row() 和 _add_campaign_recipients() 中處理
                # insert_message() 使用錯誤的 schema (試圖寫 member_id 到 messages 表)
                # if mid is not None:
                #     payload_for_log = dict(payload)
                #     payload_for_log.pop("image_base64", None)
                #     payload_for_log.pop("image_url", None)
                #     insert_message(
                #         mid,
                #         "outgoing",
                #         "flex",
                #         {"campaign_id": cid, "payload": payload_for_log},
                #         campaign_id=cid,
                #     )

            except Exception as e:
                logging.exception(f"[{idx}/{total_targets}] ✗ Failed to {uid}: {e}")
                failed += 1
                continue

            sent += 1
            logging.info(f"[{idx}/{total_targets}] ✓ Success to {uid}")

            # 紀錄一筆 outgoing 訊息（清掉大欄位避免塞爆）
            # 註解：群發記錄已在 _create_campaign_row() 和 _add_campaign_recipients() 中處理
            # if mid is not None:
            #     payload_for_log = dict(payload)
            #     payload_for_log.pop("image_base64", None)
            #     payload_for_log.pop("image_url", None)
            #     insert_message(
            #         mid,
            #         "outgoing",
            #         "text",
            #         {"campaign_id": cid, "payload": payload_for_log},
            #         campaign_id=cid,
            #     )

        except Exception as e:
            logging.exception(f"[{idx}/{total_targets}] ✗ Failed to {uid}: {e}")
            failed += 1
            continue

    logging.info(f"[Broadcast Done] sent={sent}, failed={failed}")

    return {
        "ok": True,
        "campaign_id": cid,
        "sent": sent,
        "failed": failed,
    }


# -------------------------------------------------
# 問卷（LIFF）
# -------------------------------------------------
def register_survey_from_json(payload: dict) -> dict:
    def _enum_choices(conn, table, column):
        dbname = engine.url.database
        ct = conn.execute(text("""
            SELECT COLUMN_TYPE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA=:db AND TABLE_NAME=:tb AND COLUMN_NAME=:col
        """), {"db": dbname, "tb": table, "col": column}).scalar()
        if not ct or not ct.startswith("enum("):
            return None
        inside = ct[5:-1]  # 去掉 enum(  )
        vals, cur, inq = [], "", False
        for ch in inside:
            if ch == "'" and (not cur or cur[-1] != "\\"):
                inq = not inq
                if not inq:
                    vals.append(cur)
                    cur = ""
            elif inq:
                cur += ch
        return vals

    def _normalize(s: str) -> str:
        return (s or "").strip().replace("-", "_").upper()

    def _choose_qtype(db_allowed: list[str], incoming: str) -> str:
        """
        盡量把 JSON 的 question_type 對映到 DB ENUM 允許值。
        規則：
          1) 先用內建別名表直接對映
          2) 若還不行，再做關鍵字 heuristic（single/multi/text/textarea/select/name/phone/email/birthday/address/gender/image/video）
          3) 最後嘗試去底線比對
        對不到就 raise，並把允許值全部列出來
        """
        alias = {
            # 核心題型
            "SINGLE_CHOICE": ["SINGLE_CHOICE", "SINGLE", "RADIO", "CHOICE_SINGLE"],
            "MULTI_CHOICE":  ["MULTI_CHOICE", "MULTI", "CHECKBOX", "CHOICE_MULTI", "MULTIPLE"],
            "SELECT":        ["SELECT", "DROPDOWN", "PULLDOWN"],
            "TEXT":          ["TEXT", "INPUT"],
            "TEXTAREA":      ["TEXTAREA", "LONG_TEXT", "PARAGRAPH"],
            "NAME":          ["NAME"],
            "PHONE":         ["PHONE", "TEL", "MOBILE"],
            "EMAIL":         ["EMAIL"],
            "BIRTHDAY":      ["BIRTHDAY", "DOB", "DATE_OF_BIRTH", "DATE"],
            "ADDRESS":       ["ADDRESS"],
            "GENDER":        ["GENDER", "SEX"],
            "IMAGE":         ["IMAGE", "PHOTO"],
            "VIDEO":         ["VIDEO"]
        }

        incomingN = _normalize(incoming)
        allowedN  = { _normalize(x): x for x in db_allowed }  # map: NORMALIZED -> 原字

        # 1) 直接命中
        if incomingN in allowedN:
            return allowedN[incomingN]

        # 2) 內建別名命中（把 incoming 映成一個 canonical，再找 allowed）
        for canon, syns in alias.items():
            if incomingN in map(_normalize, syns):
                # 試著在 DB 允許值中找能對應到此 canon 的任何別名
                for s in syns:
                    sN = _normalize(s)
                    if sN in allowedN:
                        return allowedN[sN]

        # 3) 關鍵字 heuristic（含單/多/文字/下拉/姓名/電話/信箱/生日/地址/性別/圖片/影片）
        keys = [
            ("SINGLE", ["SINGLE"]), ("MULTI", ["MULTI"]),
            ("TEXTAREA", ["TEXTAREA", "LONG"]), ("TEXT", ["TEXT", "INPUT"]),
            ("SELECT", ["SELECT", "DROPDOWN", "PULLDOWN"]),
            ("NAME", ["NAME"]), ("PHONE", ["PHONE", "TEL", "MOBILE"]),
            ("EMAIL", ["EMAIL"]), ("BIRTHDAY", ["BIRTHDAY", "DOB", "DATE"]),
            ("ADDRESS", ["ADDRESS"]), ("GENDER", ["GENDER", "SEX"]),
            ("IMAGE", ["IMAGE", "PHOTO"]), ("VIDEO", ["VIDEO"])
        ]
        for canon, kws in keys:
            if any(k in incomingN for k in kws):
                # 在 allowed 裡找最像的
                for candN, orig in allowedN.items():
                    if canon in candN:
                        return orig

        # 4) 去底線再比
        incomingFlat = incomingN.replace("_", "")
        for candN, orig in allowedN.items():
            if candN.replace("_", "") == incomingFlat:
                return orig

        raise ValueError(
            f"question_type 不被 DB 接受：{incoming!r}；允許值：{', '.join(db_allowed)}"
        )

    with engine.begin() as conn:
        now  = utcnow()
        name = payload.get("name") or "未命名問卷"
        desc = payload.get("description") or ""
        cat  = (payload.get("category") or "general")[:64]
        aud  = (payload.get("target_audience") or "ALL").upper()  # ENUM: ALL / FILTERED

        # 1) 建立樣板（補 category / is_active 與時間）
        conn.execute(text("""
            INSERT INTO survey_templates (name, description, category, is_active, created_at, updated_at)
            VALUES (:n, :d, :c, 1, :now, :now)
        """), {"n": name, "d": desc, "c": cat, "now": now})
        tid = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # 2) 建立 survey（必填：schedule_type/status/target_audience）
        conn.execute(text("""
            INSERT INTO surveys
                (name, template_id, description, target_audience, schedule_type, status, created_at, updated_at)
            VALUES
                (:n,   :tid,        :d,          :aud,            'IMMEDIATE',  'published', :now, :now)
        """), {"n": name, "tid": tid, "d": desc, "aud": aud, "now": now})
        sid = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # 3) 讀出 DB 真正允許的 question_type ENUM
        qtypes_allowed = _enum_choices(conn, "survey_questions", "question_type") or []

        # 4) 寫入題目（把 JSON 的 question_type 智能對映到 DB ENUM 允許值）
        for q in sorted(payload.get("questions", []), key=lambda x: x.get("order") or 0):
            raw_qt = (q.get("question_type") or "").strip()
            qt = _choose_qtype(qtypes_allowed, raw_qt)

            conn.execute(text("""
                INSERT INTO survey_questions
                    (survey_id, question_type, question_text, options, is_required, `order`, created_at, updated_at)
                VALUES
                    (:sid, :qt, :qx, :opt, :req, :ord, :now, :now)
            """), {
                "sid": sid,
                "qt": qt,
                "qx": q.get("question_text"),
                "opt": json.dumps(q.get("options") or [], ensure_ascii=False),
                "req": 1 if q.get("is_required") else 0,
                "ord": q.get("order") or 0,
                "now": now
            })

    return {"template_id": int(tid), "survey_id": int(sid)}


def _get_questions(template_id: int) -> list[dict]:
    return fetchall("""
        SELECT id, question_type, question_text, font_size, description, options_json, is_required, display_order
          FROM survey_questions
         WHERE template_id=:tid
         ORDER BY display_order ASC, id ASC
    """, {"tid": template_id})

def liff_form_url(survey_id: int) -> str:
    return f"https://liff.line.me/{LIFF_ID_OPEN}?sid={survey_id}"

def render_survey_html(survey_id: int) -> str:
    # 動態表單(保留你之前的外觀與欄位類型)
    return f"""
<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>問卷填寫</title>
<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
<style>
 body{{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;background:#f6f7fb}}
 .wrap{{max-width:680px;margin:0 auto;padding:16px}}
 .card{{background:#fff;border-radius:14px;box-shadow:0 6px 26px rgba(28,36,51,.08);padding:20px}}
 h1{{font-size:20px;margin:0 0 8px}}
 .desc{{color:#666;margin-bottom:16px}}
 .q{{margin:16px 0}}
 label{{display:block;font-weight:600;margin-bottom:6px}}
 input[type=text], input[type=tel], input[type=email], input[type=date], textarea, select{{
   width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;box-sizing:border-box
 }}
 textarea{{min-height:96px}}
 .row{{display:flex;gap:10px;align-items:center;flex-wrap:wrap}}
 .chip{{padding:8px 12px;border:1px solid #e5e7eb;border-radius:999px;cursor:pointer}}
 .chip input{{margin-right:6px}}
 button{{width:100%;margin-top:16px;padding:12px;border:0;border-radius:12px;background:#06c755;color:#fff;font-weight:700}}
 .hint{{color:#999;font-size:12px;margin-top:6px}}
 .loading{{text-align:center;padding:40px;color:#999}}
 .error{{background:#fee;border:1px solid #fcc;border-radius:8px;padding:12px;margin:16px 0;color:#c33}}
</style>
</head><body>
<div class="wrap">
 <div class="card">
  <div id="loading" class="loading">載入中...</div>
  <div id="error" class="error" style="display:none"></div>
  <h1 id="title" style="display:none">問卷</h1>
  <div id="desc" class="desc" style="display:none"></div>
  <form id="f" style="display:none"></form>
  <button id="submitBtn" style="display:none">送出</button>
  <div class="hint" style="display:none">送出即表示同意使用與隱私權政策。</div>
 </div>
</div>
<script>
(async () => {{
  try {{
    await liff.init({{ liffId: "{LIFF_ID_OPEN}" }});
    console.log("✅ LIFF initialized");
    
    const u = new URL(location.href);
    const sid = u.searchParams.get("sid") || "{survey_id}";
    console.log("📋 Survey ID:", sid);
    
    const prof = await liff.getProfile().catch(()=>null);
    const lineUserId = (prof && prof.userId) ? prof.userId : (liff.getContext()||{{}}).userId || "";
    console.log("👤 User ID:", lineUserId);

    // ✅ 使用完整 URL
    const apiUrl = window.location.origin + "/__survey_load?sid=" + sid;
    console.log("🔗 Fetching:", apiUrl);
    
    const meta = await fetch(apiUrl).then(r => {{
      if (!r.ok) throw new Error(`HTTP ${{r.status}}: ${{r.statusText}}`);
      return r.json();
    }});
    
    console.log("✅ Survey data loaded:", meta);
    
    // 隱藏 loading,顯示內容
    document.getElementById("loading").style.display = "none";
    document.getElementById("title").style.display = "block";
    document.getElementById("desc").style.display = "block";
    document.getElementById("f").style.display = "block";
    document.getElementById("submitBtn").style.display = "block";
    document.querySelector(".hint").style.display = "block";

    document.getElementById("title").innerText = meta.name || "問卷";
    document.getElementById("desc").innerText  = meta.description || "";

    const f = document.getElementById("f");
    function el(tag, attrs, children) {{
      const e = document.createElement(tag);
      if (attrs) Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v));
      (children||[]).forEach(c => e.appendChild(typeof c==="string" ? document.createTextNode(c) : c));
      return e;
    }}

    function buildField(q) {{
      const wrap = el("div", {{class:"q"}});
      const fontSize = q.font_size || 14;
      const label = el("label", {{style: `font-size: ${{fontSize}}px`}}, [q.question_text || "請作答"]);
      wrap.appendChild(label);
      if (q.description) {{
        const desc = el("div", {{style: "color: #666; font-size: 13px; margin-bottom: 8px;"}}, [q.description]);
        wrap.appendChild(desc);
      }}
      const req = q.is_required ? "required" : "";
      const name = "q_"+q.id;
      const t = (q.question_type||"").toLowerCase();
      
      if (["name","phone","email","birthday","address","text","id_number","link"].includes(t)) {{
        const typeMap = {{name:"text", phone:"tel", email:"email", birthday:"date", address:"text", text:"text", id_number:"text", link:"url"}};
        const placeholderMap = {{
          name:"請輸入姓名",
          phone:"請輸入電話號碼",
          email:"請輸入電子郵件",
          birthday:"",
          address:"請輸入地址",
          text:"答案輸入區域",
          id_number:"請輸入身份證字號",
          link:"https://example.com"
        }};
        wrap.appendChild(el("input", {{type:typeMap[t]||"text", name, required:req, placeholder:placeholderMap[t]||""}}));
      }} else if (t==="textarea") {{
        wrap.appendChild(el("textarea", {{name, required:req, placeholder:"請輸入內容"}}));
      }} else if (t==="gender" || t==="single_choice") {{
        const opts = (q.options_json||q.options||[]);
        const row = el("div", {{class:"row"}});
        (opts||[]).forEach((opt,i)=>{{
          const lbl = el("label", {{class:"chip"}}, [
            el("input", {{type:"radio", name, value:(opt.value||opt.label||""), required:(i===0 && req ? "required" : "")}}),
            (opt.label||opt.value||"")
          ]);
          row.appendChild(lbl);
        }});
        wrap.appendChild(row);
      }} else if (t==="multi_choice") {{
        const opts = (q.options_json||q.options||[]);
        const row = el("div", {{class:"row"}});
        (opts||[]).forEach((opt,i)=>{{
          const lbl = el("label", {{class:"chip"}}, [
            el("input", {{type:"checkbox", name, value:(opt.value||opt.label||"")}}),
            (opt.label||opt.value||"")
          ]);
          row.appendChild(lbl);
        }});
        wrap.appendChild(row);
      }} else if (t==="select") {{
        const s = el("select", {{name, required:req}});
        (q.options_json||q.options||[]).forEach(opt=>{{
          s.appendChild(el("option", {{value:(opt.value||opt.label||"")}}, [opt.label||opt.value||""]));
        }});
        wrap.appendChild(s);
      }} else if (t==="image" || t==="video") {{
        const link = (q.image_link || q.video_link);
        if (link) wrap.appendChild(el("a", {{href:link, target:"_blank"}}, [t==="image"?"開啟圖片":"播放影片"]));
      }} else {{
        wrap.appendChild(el("input", {{type:"text", name, required:req, placeholder:"答案輸入區域"}}));
      }}
      f.appendChild(wrap);
    }}
    
    (meta.questions||[]).forEach(buildField);
    console.log(`✅ Rendered ${{meta.questions.length}} questions`);

    document.getElementById("submitBtn").addEventListener("click", async (e) => {{
      e.preventDefault();
      
      // 檢查必填欄位
      if (!f.checkValidity()) {{
        f.reportValidity();
        return;
      }}
      
      const fd = new FormData(f);
      const payload = {{}};
      for (const [k, v] of fd.entries()) {{
        if (payload[k]) {{
          if (Array.isArray(payload[k])) payload[k].push(v);
          else payload[k] = [payload[k], v];
        }} else {{
          payload[k] = v;
        }}
      }}
      
      console.log("📤 Submitting:", payload);
      
      const submitUrl = window.location.origin + "/__survey_submit";
      const res = await fetch(submitUrl, {{
        method:"POST", 
        headers:{{"Content-Type":"application/json"}},
        body: JSON.stringify({{ sid, data: payload, liff: {{ userId: lineUserId }} }})
      }}).then(r=>r.json());
      
      console.log("✅ Submit result:", res);
      alert(res.ok ? "感謝填寫!" : ("提交失敗:"+(res.error||"")));
      if (res.ok && liff.isInClient()) liff.closeWindow();
    }});
    
  }} catch (err) {{
    console.error("❌ Error:", err);
    document.getElementById("loading").style.display = "none";
    const errDiv = document.getElementById("error");
    errDiv.style.display = "block";
    errDiv.innerText = "載入失敗: " + err.message;
  }}
}})();
</script>
</body></html>
    """

def load_survey_meta_for_liff(survey_id: int) -> dict:
    """
    用 survey_id 讀題目（符合你的 DB 結構）並轉成 LIFF 可渲染格式。
    * survey_questions 欄位：id, survey_id, question_type, question_text, options(JSON字串), is_required, `order`
    * 前端期望鍵名：options_json, display_order（舊程式就是用這兩個）
    """
    # 先取標題/描述（從 template 帶）
    tpl = fetchone("""
        SELECT st.id AS template_id, st.name, st.description
          FROM surveys s
          JOIN survey_templates st ON st.id = s.template_id
         WHERE s.id = :sid
    """, {"sid": survey_id})
    if not tpl:
        return {"name": "問卷", "description": "", "questions": []}

    # ✅ 用 survey_id 抓題目（不是 template_id）
    rows = fetchall("""
        SELECT id,
               question_type,
               question_text,
               options,        -- JSON 字串
               is_required,
               `order`
          FROM survey_questions
         WHERE survey_id = :sid
         ORDER BY `order`
    """, {"sid": survey_id})

    qs = []
    for r in rows:
        q = dict(r)

        # options 轉 list
        try:
            opts = json.loads(q.get("options") or "[]")
        except Exception:
            opts = []

        # 把 DB 題型（NAME/PHONE/EMAIL/GENDER…）轉成 LIFF 可畫的型別
        mapped = _map_question_for_liff({
            "id": q.get("id"),
            "question_type": q.get("question_type"),
            "question_text": q.get("question_text"),
            "options": opts,
            "is_required": q.get("is_required"),
            "order": q.get("order") or 0,
        })

        # ⚠️ 關鍵：同時給前端慣用鍵名（options_json / display_order）
        qs.append({
            "id": mapped.get("id"),
            "question_type": mapped.get("question_type"),
            "question_text": mapped.get("question_text"),
            # 前端歷史程式吃 options_json；保險起見兩個都給
            "options_json": mapped.get("options") or [],
            "options": mapped.get("options") or [],
            "is_required": 1 if mapped.get("is_required") else 0,
            "display_order": mapped.get("order") or 0,
            "order": mapped.get("order") or 0,
        })

    # 可選：打log確認真的有題目
    try:
        app.logger.info(f"[LIFF] survey_id={survey_id} questions={len(qs)}")
    except Exception:
        pass

    return {
        "name": tpl["name"],
        "description": tpl.get("description") or "",
        "questions": qs
    }


def save_survey_submission(survey_id: int, line_uid: str, answers: dict):
    """
    將 LIFF 表單的 payload（如 {"q_1": "張三", "q_2": "0912...", "q_3": ["男"]}）
    轉存為一列 JSON 到 survey_responses.answers，並標記完成。

    備註：
      - 只有在 line_uid 是合法的 LINE userId（U 開頭、長度 33）時，
        才會去 members 建立/取得 member_id。
      - 若 line_uid 無效，member_id 會是 None，只寫入 survey_responses，
        不會在 members 生出「空白會員」那種垃圾資料。
    """
    # 1) 取得/建立會員 id（先檢查 line_uid 是否為合法 LINE userId）
    if _is_valid_line_user_id(line_uid):
        with engine.begin() as conn:
            mid = conn.execute(
                text("SELECT id FROM members WHERE line_uid=:u"),
                {"u": line_uid}
            ).scalar()
        if not mid:
            mid = upsert_member(line_uid)
    else:
        # 無效的 line_uid：不建立 member，只讓 member_id 為 None
        mid = None

    # 2) 只取以 q_ 開頭的鍵，並把 "q_12" -> "12"
    normalized = {}
    for k, v in (answers or {}).items():
        if not str(k).startswith("q_"):
            continue
        try:
            # 只留數字 id，存成字串 key
            qid = str(int(str(k).split("_", 1)[1]))
        except Exception:
            continue

        # 轉成可序列化格式：list 直接存 list，或你要改成字串也可以
        if isinstance(v, list):
            normalized[qid] = v  # 若要字串可改成 ", ".join(map(str, v))
        else:
            normalized[qid] = v

    # 3) 組其他欄位
    src = "LIFF"
    ip  = request.headers.get("X-Forwarded-For", request.remote_addr or "")
    ua  = request.headers.get("User-Agent", "")
    now = utcnow()

    # 4) 寫入一列（答案存 JSON）
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO survey_responses
                (survey_id, member_id, answers, is_completed, completed_at,
                 source, ip_address, user_agent, created_at, updated_at)
            VALUES
                (:sid, :mid, :ans, 1, :now, :src, :ip, :ua, :now, :now)
        """), {
            "sid": survey_id,
            "mid": mid,
            "ans": json.dumps(normalized, ensure_ascii=False),
            "now": now,
            "src": src,
            "ip":  ip,
            "ua":  ua,
        })


def _is_valid_line_user_id(uid: str) -> bool:
    # 真正的 LINE userId：U 開頭、長度 33
    return isinstance(uid, str) and uid.startswith("U") and len(uid) == 33

def push_survey_entry(
    survey_id: int,
    title: Optional[str] = None,
    notification_message: Optional[str] = None,
    channel_id: Optional[str] = None,          # 舊系統內部 id
    line_channel_id: Optional[str] = None      # LINE 官方 Channel ID
) -> int:
    """
    入口卡片推送(含三重保險):
      1) 只推給有效的 userId(U 開頭、長度 33)
      2) 可用環境變數 TEST_UIDS 指定只推給自己
      3) Flex 失敗時自動改推文字 + 連結
    """
    liff_url = liff_form_url(survey_id)
    title = str(title or "問卷")
    notification_message = str(notification_message or "").strip()

    # ✅ 使用 dict 構建 Flex (最穩定的方式)
    bubble_dict = {
        "type": "bubble",
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": title,
                    "weight": "bold",
                    "size": "lg",
                    "wrap": True
                },
                {
                    "type": "text",
                    "text": "請點下方按鈕開始填寫問卷。",
                    "size": "sm",
                    "color": "#666666",
                    "wrap": True,
                    "margin": "md"
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "height": "sm",
                    "action": {
                        "type": "uri",
                        "label": "開始填寫",
                        "uri": liff_url
                    }
                }
            ]
        }
    }

    # ✅ Debug: 印出 Flex 結構
    logging.info(f"=== FLEX STRUCTURE ===\n{json.dumps(bubble_dict, ensure_ascii=False, indent=2)}")

    # ✅ 轉換成 FlexContainer
    try:
        flex_container = FlexContainer.from_dict(bubble_dict)
    except Exception as e:
        logging.error(f"FlexContainer conversion failed: {e}")
        # Fallback: 只推文字
        text_only = TextMessage(text=f"{title}\n\n{notification_message}\n\n開始填寫:{liff_url}".strip())
        msgs = [text_only]
    else:
        # ✅ 組合訊息 (只推 Flex,不推前置文字)
        msgs = [FlexMessage(alt_text=title, contents=flex_container)]

    # ✅ Debug: 印出訊息內容
    logging.info(f"=== MESSAGES ({len(msgs)}) ===")
    for i, m in enumerate(msgs):
        logging.info(f"  [{i}] {type(m).__name__}")

    # channel_id 和 line_channel_id 都是 LINE 官方的 Channel ID，統一用 get_messaging_api_by_line_id()
    line_cid = line_channel_id or channel_id
    api = get_messaging_api_by_line_id(line_cid)

    # --- 收件者名單 ---
    test_uids = [u.strip() for u in os.getenv("TEST_UIDS", "").split(",") if u.strip()]
    if test_uids:
        rs = []
        for u in test_uids:
            if not _is_valid_line_user_id(u):
                continue
            row = fetchone("SELECT id FROM members WHERE line_uid=:u", {"u": u})
            rs.append({"line_uid": u, "id": (row["id"] if row and "id" in row else None)})
    else:
        rs = fetchall("""
            SELECT line_uid, id
            FROM members
            WHERE line_uid IS NOT NULL
              AND line_uid <> ''
              AND line_uid LIKE 'U%'
              AND LENGTH(line_uid) = 33
        """)

    sent = 0

    for r in rs:
        uid = r["line_uid"]
        if not _is_valid_line_user_id(uid):
            continue

        try:
            api.push_message(PushMessageRequest(to=uid, messages=msgs))
            # 註解：push_message 是群發性質，記錄應在 campaign 層級，不應使用 insert_message()
            # insert_message(r.get("id"), "outgoing", "text",
            #                {"survey_id": survey_id, "payload": {"liff_url": liff_url, "title": title}})
            sent += 1
            logging.info(f"✅ Successfully pushed to {uid}")
        except Exception as e:
            logging.error(f"❌ Push failed for {uid}: {e}")
            # Fallback: 純文字
            try:
                text_fallback = TextMessage(text=f"{title}\n\n開始填寫:{liff_url}")
                api.push_message(PushMessageRequest(to=uid, messages=[text_fallback]))
                sent += 1
                logging.info(f"✅ Fallback text sent to {uid}")
            except Exception as e2:
                logging.exception(f"❌ Even fallback failed for {uid}: {e2}")

    return sent

# get_messaging_api_by_line_id 已遷移至 services/line_sdk.py


def send_survey_via_liff(payload: dict) -> dict:
    ids = register_survey_from_json(payload)
    pushed = push_survey_entry(
    ids["survey_id"],
    title=payload.get("name") or "問卷",
    notification_message=payload.get("description"),
    channel_id=payload.get("channel_id"),  # ← 允許從後台 JSON 帶頻道
    line_channel_id=payload.get("line_channel_id")
    )

    return {"template_id": ids["template_id"], "survey_id": ids["survey_id"], "pushed": pushed}

# -------------------------------------------------
# Flask routes
# -------------------------------------------------
@app.get(f"{ASSET_ROUTE_PREFIX}/<path:filename>")
def _serve_uploads(filename):
    return send_from_directory(ASSET_LOCAL_DIR, filename, conditional=True)

@app.get("/")
def health():
    return "OK", 200

@app.get("/liff/form")
def liff_form():
    sid = int(request.args.get("sid", "0"))
    return render_template_string(render_survey_html(sid))

@app.get("/__survey_load")
def __survey_load():
    sid = int(request.args.get("sid", "0"))
    return jsonify(load_survey_meta_for_liff(sid))

# 點擊追蹤（v3 不影響，沿用；/__click?cid=&uid=&to=）
@app.get("/__click")
def __click():
    try:
        cid = int(request.args.get("cid", "0"))
    except Exception:
        cid = 0
    uid = request.args.get("uid", "") or request.headers.get("X-Line-UserId", "")
    to  = request.args.get("to", "")

    mid = None
    if uid:
        try:
            r = fetchone("SELECT id FROM members WHERE line_uid=:u", {"u": uid})
            mid = (r["id"] if r else None)
            if mid is None:
                mid = upsert_member(uid)
        except Exception:
            pass

    # 註解：campaign_click 追蹤應使用專用的 click tracking 系統，不應使用 insert_message()
    # try:
    #     if mid is not None:
    #         insert_message(
    #             mid,
    #             "incoming",
    #             "text",
    #             {"event": "campaign_click", "campaign_id": cid, "target": to},
    #             campaign_id=cid
    #         )
    # except Exception:
        pass

    try:
        execute("UPDATE messages SET click_count=click_count+1, updated_at=:now WHERE id=:cid",
                {"cid": cid, "now": utcnow()})
    except Exception:
        pass

    if not to:
        return redirect("/", code=302)
    return redirect(to, code=302)

@app.get("/__track")
def __track():
    uid  = request.args.get("uid", "")
    cid  = request.args.get("cid", "")
    ityp = request.args.get("type", "") or "image_click"
    to   = request.args.get("to", "")
    src  = request.args.get("src", None)
    tag_str = (request.args.get("tag", "") or "").strip()  # 可能是 "優惠,萬聖節"

    logging.warning("[TRACK_HIT] uid=%s cid=%s type=%s tag=%s", uid, cid, ityp, tag_str)

    # 你既有的 display_name 查詢邏輯，如無可維持 None
    display_name = None

    # ---- 1) 先把「新傳入的 tag 串」正規化成有序不重複的 list ----
    def normalize_tags(s: str) -> list[str]:
        out = []
        for x in (s.split(",") if s else []):
            t = str(x).strip()
            if t and t not in out:
                out.append(t)
        return out

    incoming = normalize_tags(tag_str)

    # ---- 2) 查出 DB 目前已存的 tag，和 incoming 做「集合合併」 ----
    existing_str = None
    try:
        row = fetchone(f"""
            SELECT last_click_tag
            FROM `{MYSQL_DB}`.`click_tracking_demo`
            WHERE line_id = :uid AND source_campaign_id = :src
            LIMIT 1
        """, {"uid": uid, "src": src})
        if row:
            existing_str = row.get("last_click_tag")
    except Exception as e:
        logging.exception(e)

    existing = normalize_tags(existing_str or "")
    # 合併：保留「既有順序」，再把新出現的依 incoming 順序追加
    merged = existing[:]  # copy
    for t in incoming:
        if t not in merged:
            merged.append(t)
    merged_str = ",".join(merged) if merged else None  # 無標籤則存 NULL

    # ---- 3) upsert：不再用 FIND_IN_SET；直接寫入合併後的 merged_str ----
    try:
        member_display_subq = (
            f"(SELECT m.line_display_name FROM `{MYSQL_DB}`.`members` m WHERE m.line_uid = :uid LIMIT 1)"
        )
        insert_display_expr = f"COALESCE(:dname, {member_display_subq})"
        update_display_expr = f"COALESCE(:dname, {member_display_subq}, line_display_name)"

        execute(f"""
            INSERT INTO `{MYSQL_DB}`.`click_tracking_demo`
                (line_id, source_campaign_id, line_display_name, total_clicks, last_clicked_at, last_click_tag)
            VALUES
                (
                    :uid,
                    :src,
                    {insert_display_expr},
                    1,
                    NOW(),
                    :merged
                )
            ON DUPLICATE KEY UPDATE
                total_clicks = 1,
                line_display_name = {update_display_expr},
                last_click_tag = :merged,
                last_clicked_at = NOW();
        """, {"uid": uid, "src": src, "dname": display_name, "merged": merged_str})
    except Exception as e:
        logging.exception(e)

    # ---- 4) 處理新的互動標籤追蹤機制 ----
    # 對每個標籤：
    # a) 確保 interaction_tags 表中存在該標籤
    # b) 更新 interaction_tags 的統計數據
    # c) 記錄到 component_interaction_logs 並關聯 interaction_tag_id

    for tag_name in incoming:
        try:
            # 查詢或創建標籤
            tag_row = fetchone(f"""
                SELECT id FROM `{MYSQL_DB}`.`interaction_tags`
                WHERE tag_name = :tag_name
                LIMIT 1
            """, {"tag_name": tag_name})

            tag_id = None
            if tag_row:
                tag_id = tag_row.get("id")
            else:
                # 標籤不存在，自動創建（tag_source 設為 'auto_click'）
                execute(f"""
                    INSERT INTO `{MYSQL_DB}`.`interaction_tags`
                        (tag_name, tag_source, trigger_count, trigger_member_count, last_triggered_at, created_at)
                    VALUES
                        (:tag_name, 'auto_click', 1, 1, NOW(), NOW())
                """, {"tag_name": tag_name})

                # 獲取新創建的標籤 ID
                new_tag_row = fetchone(f"""
                    SELECT id FROM `{MYSQL_DB}`.`interaction_tags`
                    WHERE tag_name = :tag_name
                    LIMIT 1
                """, {"tag_name": tag_name})
                if new_tag_row:
                    tag_id = new_tag_row.get("id")

            # 更新標籤統計數據
            if tag_id:
                # trigger_count: 總觸發次數 +1
                # trigger_member_count: 需要去重計算（使用子查詢）
                execute(f"""
                    UPDATE `{MYSQL_DB}`.`interaction_tags`
                    SET
                        trigger_count = trigger_count + 1,
                        trigger_member_count = (
                            SELECT COUNT(DISTINCT line_id)
                            FROM `{MYSQL_DB}`.`component_interaction_logs`
                            WHERE interaction_tag_id = :tag_id
                        ) + 1,
                        last_triggered_at = NOW(),
                        updated_at = NOW()
                    WHERE id = :tag_id
                """, {"tag_id": tag_id})

                # 記錄到 component_interaction_logs 並關聯 interaction_tag_id
                # cid 實際上是 messages.id，使用 message_id 欄位
                message_id_value = None
                try:
                    if cid:
                        message_id_value = int(cid)
                except (ValueError, TypeError):
                    pass

                execute(f"""
                    INSERT INTO `{MYSQL_DB}`.`component_interaction_logs`
                        (line_id, message_id, interaction_tag_id, interaction_type, interaction_value, triggered_at, created_at)
                    VALUES (:uid, :msg_id, :tag_id, :itype, :to, NOW(), NOW())
                """, {"uid": uid, "msg_id": message_id_value, "tag_id": tag_id, "itype": ityp, "to": to})

                # ---- 寫入 member_interaction_tags（會員互動標籤）----
                # 根據 line_uid 查找 member_id
                member_row = fetchone(f"""
                    SELECT id FROM `{MYSQL_DB}`.`members`
                    WHERE line_uid = :uid
                    LIMIT 1
                """, {"uid": uid})

                if member_row:
                    member_id = member_row.get("id")
                    # 查詢是否已存在該會員的該標籤
                    existing_mit = fetchone(f"""
                        SELECT id, click_count FROM `{MYSQL_DB}`.`member_interaction_tags`
                        WHERE member_id = :mid AND tag_name = :tag_name
                        LIMIT 1
                    """, {"mid": member_id, "tag_name": tag_name})

                    if existing_mit:
                        # 已存在：累加 click_count
                        execute(f"""
                            UPDATE `{MYSQL_DB}`.`member_interaction_tags`
                            SET click_count = click_count + 1,
                                last_triggered_at = NOW(),
                                updated_at = NOW()
                            WHERE id = :mit_id
                        """, {"mit_id": existing_mit.get("id")})
                        logging.info(f"[TRACK] Updated member_interaction_tag for member {member_id}, tag '{tag_name}'")
                    else:
                        # 不存在：創建新記錄
                        execute(f"""
                            INSERT INTO `{MYSQL_DB}`.`member_interaction_tags`
                                (member_id, tag_name, tag_source, click_count, last_triggered_at, created_at)
                            VALUES (:mid, :tag_name, 'auto_click', 1, NOW(), NOW())
                        """, {"mid": member_id, "tag_name": tag_name})
                        logging.info(f"[TRACK] Created member_interaction_tag for member {member_id}, tag '{tag_name}'")

                logging.info(f"[TRACK] Updated tag '{tag_name}' (id={tag_id}) for user {uid}")
        except Exception as e:
            logging.exception(f"[TRACK] Failed to process tag '{tag_name}': {e}")

    # 如果沒有標籤，仍然記錄基本互動（舊版邏輯）
    if not incoming:
        try:
            # cid 實際上是 messages.id，使用 message_id 欄位
            msg_id = None
            try:
                if cid:
                    msg_id = int(cid)
            except (ValueError, TypeError):
                pass
            execute(f"""
                INSERT INTO `{MYSQL_DB}`.`component_interaction_logs`
                    (line_id, message_id, interaction_type, interaction_value, triggered_at, created_at)
                VALUES (:uid, :msg_id, :itype, :to, NOW(), NOW())
            """, {"uid": uid, "msg_id": msg_id, "itype": ityp, "to": to})
        except Exception as e:
            logging.exception(e)

    if request.args.get("debug") == "1":
        return {"ok": True, "uid": uid, "cid": cid, "src": src, "merged": merged_str}

    try:
        return redirect(to, code=302)
    except Exception:
        return "OK"


# 群發
@app.route("/api/broadcast", methods=["POST"])
@app.route("/api/v1/messages/broadcast", methods=["POST"])  # 新增：兼容 backend 的調用路徑
def api_broadcast():
    payload = request.get_json(force=True) or {}

    # 1) 用量 preflight（不足就擋）
    from usage_monitor import preflight_check
    check = preflight_check(payload)
    if not check.get("ok"):
        # 409：讓前端彈出「餘額不足」提示
        # 回傳 { code:"INSUFFICIENT_QUOTA", remaining, needed, deficit }
        return jsonify(check), 409

    # 2) 足夠才真正送推播（沿用你現有的推播主流程）
    result = push_campaign(payload)  # 你現成的群發函式
    return jsonify({**result, "preflight": check})


# ============================================
# 1:1 聊天 API
# ============================================
@app.post("/api/v1/chat/send")
def api_send_chat_message():
    """
    發送 1:1 聊天訊息給指定會員

    Request Body:
        {
            "line_uid": "U1234567890abcdef",
            "text": "您好，需要幫助嗎？"
        }

    Response:
        {
            "ok": true,
            "message_id": "msg_abc123",
            "thread_id": "U1234567890abcdef"
        }
    """
    try:
        data = request.get_json(force=True) or {}
        line_uid = data.get("line_uid", "").strip()
        text = data.get("text", "").strip()

        if not line_uid:
            return jsonify({"ok": False, "error": "line_uid required"}), 400
        if not text:
            return jsonify({"ok": False, "error": "text required"}), 400

        # 1. 發送訊息
        text = render_template_text(text, line_uid=line_uid)
        messaging_api.push_message(
            PushMessageRequest(
                to=line_uid,
                messages=[TextMessage(text=text)]
            )
        )
        logging.info(f"[api_send_chat_message] 成功發送訊息給 {line_uid}")

        # 2. 確保對話串存在
        thread_id = ensure_thread_for_user(line_uid)

        # 3. 記錄到資料庫
        msg_id = insert_conversation_message(
            thread_id=thread_id,
            role="assistant",
            direction="outgoing",
            message_type="text",
            response=text,
            message_source="manual",  # 標記為手動發送
            status="sent"
        )
        logging.info(f"[api_send_chat_message] 記錄訊息 {msg_id} 到 DB")

        # 4. 通知 Backend 進行 WebSocket 推送（讓前端聊天室即時更新）
        try:
            backend_url = os.getenv("BACKEND_API_URL", "http://localhost:8700")
            current_ts = int(time.time() * 1000)
            requests.post(
                f"{backend_url}/api/v1/line/message-notify",
                json={
                    "line_uid": line_uid,
                    "message_text": text,
                    "timestamp": current_ts,
                    "message_id": str(msg_id),
                    "direction": "outgoing",
                    "source": "manual"
                },
                timeout=5
            )
            logging.info(f"[api_send_chat_message] 已通知 Backend WebSocket 推送")
        except Exception as notify_err:
            logging.warning(f"[api_send_chat_message] 通知 Backend 失敗: {notify_err}")

        return jsonify({
            "ok": True,
            "message_id": msg_id,
            "thread_id": thread_id
        }), 200

    except Exception as e:
        logging.exception("[api_send_chat_message] 失敗")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.put("/api/v1/chat/mark-read")
def api_mark_chat_read():
    """
    標記指定會員的聊天訊息為已讀

    Request Body:
        {
            "line_uid": "U1234567890abcdef"
        }

    Response:
        {
            "ok": true,
            "marked_count": 3
        }
    """
    try:
        data = request.get_json(force=True) or {}
        line_uid = data.get("line_uid", "").strip()

        if not line_uid:
            return jsonify({"ok": False, "error": "line_uid required"}), 400

        # 更新該 thread 的所有 incoming 訊息為已讀
        result = execute("""
            UPDATE conversation_messages
            SET status = 'read', updated_at = NOW()
            WHERE thread_id = :thread_id
              AND direction = 'incoming'
              AND status != 'read'
        """, {"thread_id": line_uid})

        marked_count = result.rowcount if hasattr(result, 'rowcount') else 0
        logging.info(f"[api_mark_chat_read] 標記 {marked_count} 則訊息為已讀，thread_id={line_uid}")

        return jsonify({
            "ok": True,
            "marked_count": marked_count
        }), 200

    except Exception as e:
        logging.exception("[api_mark_chat_read] 失敗")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.post("/__survey_submit")
def __survey_submit():
    """
    【動態問卷專用 API】
    ---------------------------------------------------------
    用途：
        - 給「未來的動態問卷系統」使用
        - 問卷題目由後端動態產生（JSON 格式）
        - 前端會回傳 sid + data 結構
        
    接收格式 (範例)：
        {
            "sid": 10,
            "liff": { "userId": "Uxxxxxxxx" },
            "data": { ...問卷答案... }
        }

    寫入位置：
        - 寫入 survey_responses 資料表
        - 不會寫入 members

    注意：
        - 這裡只處理「動態問卷」，不要放會員表單邏輯
    ---------------------------------------------------------
    """
    data = request.get_json(force=True) or {}
    sid = int(data.get("sid", "0"))
    line_uid = (data.get("liff") or {}).get("userId") or request.headers.get("X-Line-UserId","")
    answers = data.get("data") or {}
    try:
        save_survey_submission(sid, line_uid, answers)
        return jsonify({"ok": True})
    except Exception as e:
        logging.exception(e)
        return jsonify({"ok": False, "error": str(e)[:200]}), 400

@app.post("/api/member_form_submit")
def api_member_form_submit():
    """
    【會員表單專用 API（寫死的 HTML）】
    ---------------------------------------------------------
    用途：
        - 專門給 member_form.html 提交會員資料使用
        - 表單欄位是固定的（姓名 / 電話 / 性別 / 住址 / 證件號等）
        - 與動態問卷完全分開、互不影響

    接收格式 (範例)：
        {
            "userId": "Uxxxxxx",
            "formId": 1,
            "answers": {
                "name": "...",
                "gender": "...",
                "birthday": "...",
                "email": "...",
                "phone": "...",
                "id_number": "...",
                "residence": "...",
                "receive_notification": 1
            }
        }

    寫入位置：
        - members（主要資料）
        - line_friends（同步更新 LINE 綁定資訊）

    注意：
        - 這條 API 專門處理固定會員表單
        - 不會寫到 survey_responses
        - 不要跟 /__survey_submit 混用
    ---------------------------------------------------------
    """
    data = request.get_json(force=True) or {}

    # 1) 取得 LINE userId（優先用前端給的 userId）
    uid = (
        data.get("line_uid")
        or data.get("userId")
        or (data.get("liff") or {}).get("userId")
        or request.headers.get("X-Line-UserId", "")
    )

    if not _is_valid_line_user_id(uid):
        return jsonify({"ok": False, "error": "無效的 LINE userId"}), 400

    answers = data.get("answers") or {}
    line_channel_id = data.get("line_channel_id")  # 若前端有傳 line_channel_id

    # 2) 取最新 LINE profile（名字、頭像）
    try:
        dn, pu = fetch_line_profile(uid, line_channel_id=line_channel_id)
    except Exception:
        dn = answers.get("line_display_name") or None
        pu = answers.get("line_avatar") or None

    # 3) 先更新 members
    mid = upsert_member(
        line_uid=uid,
        display_name=dn,
        picture_url=pu,

        name=answers.get("name"),
        gender=answers.get("gender") or 0,   # 預設值

        birthday_date=answers.get("birthday"),
        email=answers.get("email"),
        phone=answers.get("phone"),

        id_number=answers.get("id_number"),
        passport_number=answers.get("passport_number"),

        residence=answers.get("residence"),
        address_detail=answers.get("address_detail"),

        join_source=answers.get("join_source") or "LINE",
        receive_notification=answers.get("receive_notification") or 1,
        line_channel_id=line_channel_id,  # 多帳號支援
    )

    # 4) 同步更新 line_friends
    upsert_line_friend(
        line_uid=uid,
        display_name=dn,
        picture_url=pu,
        member_id=mid,
        is_following=True,
    )

    return jsonify({"ok": True})

    
# -------------------------------------------------
# LINE Channel Connect API
# -------------------------------------------------
@app.post("/api/connect_line_channel")
def connect_line_channel():
    data = request.json
    line_channel_id = data["channel_id"]
    secret = data["channel_secret"]
    token = data["access_token"]

    # 存入資料庫（若重複 channel_id 則更新）
    id_col = LINE_CHANNEL_ID_COL
    execute(f"""
        INSERT INTO line_channels ({id_col}, channel_secret, channel_access_token, is_active)
        VALUES (:cid, :sec, :tok, 1)
        ON CONFLICT({id_col})
        DO UPDATE SET channel_secret=:sec, channel_access_token=:tok, is_active=1
    """, {"cid": line_channel_id, "sec": secret, "tok": token})

    # 自動註冊 webhook
    result = setup_line_webhook(line_channel_id, token)
    return jsonify(result)

# 後台送進 Channel ID/Secret + 要開啟的 view_url，自動建立 LIFF 並回存 liff_id_open
@app.post("/api/connect_line_liff")
def connect_line_liff():
    data = request.json or {}
    line_channel_id = data.get("channel_id", "").strip()
    channel_secret  = data.get("channel_secret", "").strip()
    view_url        = data.get("view_url", "").strip()
    size            = (data.get("size") or "full").strip()  # full/tall/compact

    if not line_channel_id or not channel_secret or not view_url:
        return jsonify({"ok": False, "error": "channel_id / channel_secret / view_url are required"}), 400

    try:
        result = setup_line_liff(line_channel_id, channel_secret, view_url, size=size)
        return jsonify(result)
    except requests.RequestException as re:
        logging.exception(f"[connect_line_liff] network error: {re}")
        return jsonify({"ok": False, "error": "network", "detail": str(re)}), 502
    except Exception as e:
        logging.exception(f"[connect_line_liff] unexpected error: {e}")
        return jsonify({"ok": False, "error": "unknown", "detail": str(e)}), 500


# -------------------------------------------------
# LINE Webhook（v3）
# -------------------------------------------------

@app.post("/callback")
def callback():
    signature = request.headers.get("X-Line-Signature", "")
    body = request.get_data(as_text=True)
    try:
        default_handler.handle(body, signature)   # ← 這裡要用 default_handler
    except Exception as e:
        logging.exception(f"Webhook error: {e}")
        abort(400)
    return "OK"

# ========= 以「LINE Channel ID」為路徑後綴的 Webhook =========
@app.route("/callback/<line_channel_id>", methods=['POST'])
def callback_by_line_id(line_channel_id):
    # 1) 取該頻道 secret（用 line_channel_id 當 key）
    cred = get_credentials_by_line_id(line_channel_id)
    if not cred or not cred.get("secret"):
        logging.error(f"[callback] unknown line_channel_id={line_channel_id}")
        return "channel not found", 404

    # 1.1) 儲存 line_channel_id 到 Flask g，讓 event handler 可以存取
    g.line_channel_id = line_channel_id

    # 2) 讀 header 與 body
    signature = request.headers.get("X-Line-Signature")
    if not signature:
        return "missing signature", 400
    body = request.get_data(as_text=True)
    logging.info(f"[callback/{line_channel_id}] body length={len(body)}")

    # 3) 以該 secret 建 handler，掛上同一組事件處理
    h = WebhookHandler(cred["secret"])
    register_handlers(h)

    # 4) 驗章 + 分派事件
    try:
        h.handle(body, signature)
    except InvalidSignatureError:
        logging.exception(f"[callback/{line_channel_id}] invalid signature")
        return "invalid signature", 400
    except Exception:
        logging.exception(f"[callback/{line_channel_id}] handler error")
        return "handler error", 500

    return "OK", 200


def _source_key(ev_source) -> str:
    uid = getattr(ev_source, "user_id", None)
    if uid: return uid
    st = getattr(ev_source, "type", "")
    if st == "group":  return f"group_{getattr(ev_source, 'group_id', 'unknown')}"
    if st == "room":   return f"room_{getattr(ev_source, 'room_id', 'unknown')}"
    return "anonymous"


def _is_duplicate_webhook(message_id: str, handler_name: str = "webhook") -> bool:
    """
    檢查 webhook 事件是否已處理過（LINE 在未及時收到 200 時會重送）。
    透過 conversation_messages.id 比對，避免重複處理。
    """
    try:
        if fetchone("SELECT 1 FROM conversation_messages WHERE id = :mid LIMIT 1", {"mid": message_id}):
            logging.info(f"[{handler_name}] Skipping duplicate webhook: msg_id={message_id}")
            return True
    except Exception:
        pass  # 查詢失敗時不阻擋正常流程
    return False


def _notify_backend(*, line_uid: str, message_text: str, timestamp, message_id: str,
                    direction: str = "incoming", source: str | None = None,
                    handler_name: str = "webhook"):
    """
    通知 Backend 有新訊息（觸發 SSE 推送給前端）。
    """
    backend_url = os.getenv("BACKEND_API_URL", "http://localhost:8700")
    payload = {
        "line_uid": line_uid,
        "message_text": message_text,
        "timestamp": timestamp,
        "message_id": message_id,
    }
    if direction != "incoming":
        payload["direction"] = direction
    if source:
        payload["source"] = source
    try:
        resp = requests.post(
            f"{backend_url}/api/v1/line/message-notify",
            json=payload,
            timeout=5,
        )
        logging.info(f"[{handler_name}] Backend notify ({direction}): {resp.status_code} - {resp.text[:200]}")
    except Exception as e:
        logging.error(f"[{handler_name}] Failed to notify backend ({direction}): {e}")


def _call_backend_ai(line_uid: str, message: str) -> dict | None:
    """
    呼叫 Backend AI 聊天 API。
    Returns: {"reply": str, "token_exhausted": bool, ...} or None on failure
    """
    backend_url = os.getenv("BACKEND_API_URL", "http://localhost:8700")
    try:
        resp = requests.post(
            f"{backend_url}/api/v1/ai/chat",
            json={"message": message, "line_uid": line_uid},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json().get("data")
            return data
        else:
            logging.error(f"[_call_backend_ai] HTTP {resp.status_code}: {resp.text[:200]}")
            return None
    except Exception as e:
        logging.error(f"[_call_backend_ai] Request failed: {e}")
        return None


def on_follow(event: FollowEvent):
    """
    處理用戶加入好友事件
    檢查是否有啟用的歡迎訊息自動回應
    """
    uid = getattr(event.source, "user_id", None)
    reply_token = getattr(event, "reply_token", None)

    # 確保 uid 去除空白字元
    if uid:
        uid = uid.strip()

    logging.info(f"[on_follow] uid={uid}")

    # 若同一個 follow 事件被多個 webhook 觸發（reply_token 相同），直接跳過以避免重複回覆
    if reply_token:
        try:
            existed = fetchone("SELECT 1 FROM conversation_messages WHERE id=:id", {"id": reply_token})
            if existed:
                logging.info(f"[on_follow] Duplicate follow detected (reply_token={reply_token}), skip welcome.")
                return
        except Exception:
            logging.exception("[on_follow] Duplicate check failed, continue to handle follow")

    # === 1. 檢查是否有啟用的歡迎訊息 ===
    welcome_msg = None
    try:
        welcome_msg = check_welcome_response(line_channel_id)
    except Exception as e:
        logging.exception(f"[on_follow] Failed to check welcome response: {e}")

    # 如果沒有啟用的歡迎訊息，使用預設訊息
    if not welcome_msg:
        welcome_msg = (
            "Hi~ 歡迎加入！\n"
            "需要我協助什麼樣的服務呢?\n"
        )
        logging.info("[on_follow] Using default welcome message")

    line_channel_id = getattr(g, "line_channel_id", None) or getattr(event, "destination", None)

    # === 2. 發送歡迎訊息 ===
    try:
        welcome_msg = render_template_text(
            welcome_msg,
            line_uid=uid,
            line_channel_id=line_channel_id,
            display_name=dn,
        )
        token = get_channel_access_token_by_channel_id(line_channel_id)
        api = MessagingApi(ApiClient(Configuration(access_token=token)))
        api.reply_message(ReplyMessageRequest(
            reply_token=event.reply_token,
            messages=[TextMessage(text=welcome_msg)]
        ))
        logging.info(f"[on_follow] Welcome message sent to uid={uid}")
    except Exception:
        logging.exception("[on_follow] Failed to send welcome message")

    # === 3. 更新會員和好友資訊 ===
    if uid:
        try:
            # 取得 LINE profile
            dn, pu = fetch_line_profile(uid, line_channel_id=line_channel_id)

            # 創建/更新 LINE 好友記錄
            friend_id = upsert_line_friend(
                line_uid=uid,
                display_name=dn,
                picture_url=pu,
                is_following=True
            )

            # 兼容性：同時更新 members 表
            # 從 Flask g 取得 line_channel_id（webhook 路徑 /callback/<line_channel_id>）
            channel_id = getattr(g, 'line_channel_id', None)
            mid = upsert_member(uid, dn, pu, line_channel_id=channel_id)

            # 關聯 LINE 好友和會員
            if friend_id and mid:
                execute(
                    "UPDATE line_friends SET member_id = :mid WHERE id = :fid",
                    {"mid": mid, "fid": friend_id}
                )

            # 儲存歡迎訊息到舊的 messages 表（兼容性）
            # 註解：insert_message() 使用錯誤的 schema，改用下方的 conversation_messages
            # insert_message(mid, "outgoing", "text", welcome_msg)

            # === 4. 儲存歡迎訊息到 conversation_messages ===
            try:
                thread_id = ensure_thread_for_user(uid)
                insert_conversation_message(
                    thread_id=thread_id,
                    role="assistant",
                    direction="outgoing",
                    message_type="text",
                    response=welcome_msg,
                    message_source="welcome",
                    status="sent",
                    # 使用 LINE reply_token 當作 message_id，避免同一個 follow 事件重複寫入聊天室紀錄
                    message_id=getattr(event, "reply_token", None)
                )
                logging.info(f"[on_follow] Welcome message saved to conversation_messages for uid={uid}")
            except Exception:
                logging.exception("[on_follow] Failed to save welcome message to conversation_messages")

        except Exception:
            logging.exception("[on_follow] Failed to update member/line_friends")


def on_unfollow(event: UnfollowEvent):
    """处理用户取消关注事件"""
    if getattr(event.source, "user_id", None):
        try:
            uid = event.source.user_id
            logging.info(f"用户取消关注: {uid}")

            # 更新 LINE 好友状态为未关注
            upsert_line_friend(
                line_uid=uid,
                is_following=False
            )

            logging.info(f"已标记用户 {uid} 为未关注状态")
        except Exception:
            logging.exception("on_unfollow error")


def on_postback(event: PostbackEvent):
    uid = getattr(event.source, "user_id", None)
    data = getattr(event.postback, "data", "") if getattr(event, "postback", None) else ""
    line_channel_id = getattr(g, "line_channel_id", None) or getattr(event, "destination", None)
    if uid:
        try:
            cur = fetch_member_profile(uid) or {}
            api_dn, api_pu = fetch_line_profile(uid, line_channel_id=line_channel_id)
            dn_to_write = api_dn if (api_dn and api_dn != cur.get("line_display_name")) else None
            pu_to_write = api_pu if (api_pu and api_pu != cur.get("line_avatar")) else None

            # 1) 一樣先處理 members（問卷用的那張表）
            channel_id = getattr(g, 'line_channel_id', None)
            mid = upsert_member(uid, dn_to_write, pu_to_write, line_channel_id=channel_id)

            # 2) ★新增：同時把這個使用者寫/更新到 line_friends
            #    只要有 postback（操作選單），就視為有互動 = 是好友
            upsert_line_friend(
                line_uid=uid,
                # 優先用 API 最新 profile，沒有就退回 DB 原本的值
                display_name=api_dn or cur.get("line_display_name"),
                picture_url=api_pu or cur.get("line_avatar"),
                member_id=mid,
                is_following=True,
            )

            # 3) 原本就有的訊息紀錄到 conversation_messages 表（1:1 對話）
            thread_id = ensure_thread_for_user(uid)
            insert_conversation_message(
                thread_id=thread_id,
                role="user",
                direction="incoming",
                message_type="postback",
                question=json.dumps({"data": data}),
                message_source="webhook",
                status="received"
            )
        except Exception:
            # 建議留 log，比較好除錯，不要完全吃掉
            logging.exception("[on_postback] update member/line_friends failed")

    # --- 房卡數量 +/- 按鈕 ---
    params = parse_qs(data)
    action = params.get("action", [""])[0]
    if action in ("plus", "minus"):
        try:
            room_type_code = params.get("roomType", [""])[0]

            token = get_channel_access_token_by_channel_id(line_channel_id)
            api = MessagingApi(ApiClient(Configuration(access_token=token)))
            reply_token = getattr(event, "reply_token", None)
            if reply_token:
                if action == "plus":
                    confirm_text = f"您對「{room_type_code}」有興趣，請告訴我您想預訂幾間，我來為您安排！"
                else:
                    confirm_text = f"已減少「{room_type_code}」的數量。"
                api.reply_message(ReplyMessageRequest(
                    reply_token=reply_token,
                    messages=[TextMessage(text=confirm_text)]
                ))
                logging.info(f"[on_postback] room {action}: {room_type_code}")
        except Exception:
            logging.exception("[on_postback] room qty handling failed")
        return


def on_text(event: MessageEvent):
    """
    處理 LINE 文字訊息 Webhook
    處理順序：GPT (優先) → keyword trigger (後備) → always response (後備)
    """
    # 取得基本資訊
    user_key = _source_key(event.source)
    text_in  = event.message.text.strip()
    uid      = getattr(event.source, "user_id", None)
    line_channel_id = getattr(g, "line_channel_id", None) or getattr(event, "destination", None)

    # 確保 uid 去除空白字元
    if uid:
        uid = uid.strip()

    logging.info(f"[on_text] uid={uid} text={text_in[:80]}")

    # === 0. 防止 webhook 重試造成重複處理 ===
    if _is_duplicate_webhook(event.message.id, "on_text"):
        return

    # === 1. 建立 thread 並儲存用戶的 incoming message ===
    thread_id = None
    try:
        thread_id = ensure_thread_for_user(uid)
        insert_conversation_message(
            thread_id=thread_id,
            role="user",
            direction="incoming",
            message_type="text",
            question=text_in,
            event_id=event.message.id,
            status="received",
            message_source="webhook",
            message_id=event.message.id,
        )
    except Exception:
        logging.exception("[on_text] Failed to save incoming message")

    # === 2. 更新會員資訊 ===
    mid = None
    display_name_for_reply = None
    if uid:
        try:
            # 讀取現有 DB 資料
            cur = fetch_member_profile(uid) or {}
            cur_dn = cur.get("line_display_name")
            cur_pu = cur.get("line_avatar")

            # 從 LINE API 取得最新 profile
            api_dn, api_pu = fetch_line_profile(uid, line_channel_id=line_channel_id)

            # 只在有變更時才更新
            dn_to_write = api_dn if (api_dn and api_dn != cur_dn) else None
            pu_to_write = api_pu if (api_pu and api_pu != cur_pu) else None

            # 更新 members 表
            channel_id = getattr(g, 'line_channel_id', None)
            mid = upsert_member(uid, dn_to_write, pu_to_write, line_channel_id=channel_id)

            # 更新 line_friends 表
            upsert_line_friend(
                line_uid=uid,
                display_name=api_dn or cur_dn,
                picture_url=api_pu or cur_pu,
                member_id=mid,
                is_following=True,
	            )
            display_name_for_reply = api_dn or cur_dn
        except Exception:
            logging.exception("[on_text] Failed to update member/line_friends")

    # === 4. 自動回應處理（AI 優先 → keyword → always 降級備援）===
    reply_text = None
    message_source = None
    ai_room_cards = []

    # 檢查是否啟用 GPT
    gpt_enabled = is_gpt_enabled_for_user(uid)

    # 4.1 優先：Backend AI（需 gpt_enabled）
    if gpt_enabled:
        try:
            ai_result = _call_backend_ai(uid, text_in)
            if ai_result:
                if ai_result.get("token_exhausted"):
                    logging.info(f"[on_text] Token exhausted, falling back for uid={uid}")
                elif ai_result.get("reply") and not ai_result["reply"].startswith("AI Token 額度已用完"):
                    reply_text = ai_result["reply"]
                    message_source = "gpt"
                    ai_room_cards = ai_result.get("room_cards", [])
                    logging.info(f"[on_text] Backend AI response for uid={uid}, room_cards={len(ai_room_cards)}")
        except Exception as e:
            logging.exception(f"[on_text] Backend AI failed: {e}")
    else:
        logging.info(f"[on_text] AI disabled for uid={uid}, using fallback")

    # 4.2 降級：關鍵字觸發
    if not reply_text:
        try:
            reply_text = check_keyword_trigger(uid, text_in, line_channel_id=line_channel_id)
            if reply_text:
                message_source = "keyword"
                logging.info(f"[on_text] Keyword response triggered for uid={uid}")
        except Exception as e:
            logging.exception(f"[on_text] Keyword check failed: {e}")

    # 4.3 降級：一律回應（在有效期/時段內）
    if not reply_text:
        try:
            reply_text = check_always_response(line_channel_id=line_channel_id)
            if reply_text:
                message_source = "always"
                logging.info(f"[on_text] Always response triggered for uid={uid}")
        except Exception as e:
            logging.exception(f"[on_text] Always response check failed: {e}")

    # === 5. 發送回覆訊息 ===
    if reply_text:
        reply_text = reply_text[:5000]
        reply_text = render_template_text(
            reply_text,
            line_uid=uid,
            line_channel_id=line_channel_id,
            display_name=display_name_for_reply,
        )

        try:
            # ★ 關鍵修正：依 webhook 事件所屬 channel 取得正確 token
            token = get_channel_access_token_by_channel_id(line_channel_id)

            api = MessagingApi(ApiClient(Configuration(
                access_token=token
            )))

            messages_to_send = [TextMessage(text=reply_text)]

            # 房卡 → Flex Message carousel
            if ai_room_cards:
                try:
                    carousel_dict = build_room_card_flex_carousel(ai_room_cards)
                    flex_container = FlexContainer.from_dict(carousel_dict)
                    messages_to_send.append(
                        FlexMessage(alt_text="為您找到以下房型", contents=flex_container)
                    )
                    logging.info(f"[on_text] Room card FlexMessage appended, {len(ai_room_cards)} cards")
                except Exception:
                    logging.exception("[on_text] Failed to build room card FlexMessage")

            api.reply_message(ReplyMessageRequest(
                reply_token=event.reply_token,
                messages=messages_to_send[:5]
            ))

            logging.info(f"[on_text] Reply sent successfully, source={message_source}")

        except Exception:
            logging.exception(f"[on_text] Failed to send reply via LINE API")


        # 儲存 outgoing message 到資料庫
        if thread_id:
            try:
                msg_id = insert_conversation_message(
                    thread_id=thread_id,
                    role="assistant",
                    direction="outgoing",
                    message_type="chat" if message_source == "gpt" else "text",
                    response=reply_text,
                    message_source=message_source,
                    status="sent"
                )

                # 房卡另存一筆 room_cards 訊息（供 CRM 聊天室顯示）
                if ai_room_cards:
                    try:
                        insert_conversation_message(
                            thread_id=thread_id,
                            role="assistant",
                            direction="outgoing",
                            message_type="room_cards",
                            response=json.dumps({"room_cards": ai_room_cards}, ensure_ascii=False),
                            message_source=message_source,
                            status="sent"
                        )
                    except Exception:
                        logging.exception("[on_text] Failed to save room_cards message")

            except Exception:
                logging.exception("[on_text] Failed to save outgoing message")
    else:
        logging.warning(f"[on_text] No response generated for uid={uid}, text={text_in[:50]}")

    # === 通知 Backend 有新訊息 ===
    # 順序重要：先推 incoming（用戶訊息），再推 outgoing（自動回應）
    # 這樣前端 SSE append 時順序才正確
    if uid:
        _notify_backend(
            line_uid=uid,
            message_text=text_in,
            timestamp=event.timestamp,
            message_id=event.message.id,
            handler_name="on_text",
        )

    if uid and reply_text and thread_id:
        current_ts = int(time.time() * 1000)
        _notify_backend(
            line_uid=uid,
            message_text=reply_text,
            timestamp=current_ts,
            message_id=str(msg_id) if msg_id else f"auto_{current_ts}",
            direction="outgoing",
            source=message_source,
            handler_name="on_text",
        )

# 處理使用者傳貼圖事件
def on_sticker(event: MessageEvent):
    if _is_duplicate_webhook(event.message.id, "on_sticker"):
        return

    # 從事件來源取得使用者 user_id
    uid = getattr(event.source, "user_id", None)

    # 取得使用者對應的 thread_id（每個人一個對話 thread）
    thread_id = ensure_thread_for_user(uid)

    # 建立要存進資料庫的貼圖 JSON（之後後台可用來顯示）
    payload = {
        "type": "sticker",
        "packageId": event.message.package_id,
        "stickerId": event.message.sticker_id
    }

    # 寫入 conversation_messages（使用者 → incoming）
    insert_conversation_message(
        thread_id=thread_id,
        role="user",
        direction="incoming",
        message_type="sticker",
        question=json.dumps(payload, ensure_ascii=False),
        event_id=event.message.id,
        status="received"
    )

# 處理圖片事件
def on_image(event: MessageEvent):
    if _is_duplicate_webhook(event.message.id, "on_image"):
        return

    uid = getattr(event.source, "user_id", None)
    thread_id = ensure_thread_for_user(uid)
    line_channel_id = getattr(g, "line_channel_id", None) or getattr(event, "destination", None)

    message_id = event.message.id
    token = get_channel_access_token_by_channel_id(line_channel_id)
    api = MessagingApi(ApiClient(Configuration(access_token=token)))
    content = api.get_message_content(message_id)

    filename = f"{message_id}.jpg"
    filepath = os.path.join(ASSET_LOCAL_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content.body)

    image_url = f"{PUBLIC_BASE}/uploads/{filename}"

    payload = {
        "type": "image",
        "url": image_url
    }

    insert_conversation_message(
        thread_id=thread_id,
        role="user",
        direction="incoming",
        message_type="image",
        question=json.dumps(payload, ensure_ascii=False),
        event_id=message_id,
        status="received"
    )

def on_message_router(event: MessageEvent):
    msg = event.message

    # 文字
    if isinstance(msg, TextMessageContent):
        return on_text(event)

    # 貼圖（舊 SDK 正確寫法）
    if msg.type == "sticker":
        return on_sticker(event)

    # 圖片（等一下再處理）
    if msg.type == "image":
        return on_image(event)

    print("[router] unsupported type:", msg.type)

# 可重複註冊事件處理（新增）
def register_handlers(h):
    # 使用者加入好友
    h.add(FollowEvent)(on_follow)

    # 使用者封鎖 / 取消好友
    h.add(UnfollowEvent)(on_unfollow)

    # 按下 postback（選單等）
    h.add(PostbackEvent)(on_postback)

    # 所有 MessageEvent（文字、貼圖、圖片）都先進 router
    h.add(MessageEvent)(on_message_router)

# 啟動時，先把事件註冊到預設 handler（吃 .env 的 secret）
register_handlers(default_handler)

# -------------------------------------------------
# 測試路由
# -------------------------------------------------
@app.route("/test_push")
def test_push():
    payload = {
        "title": "雙十快樂優惠",
        "notification_text": "連住兩晚 85 折｜含早餐",
        "url": "https://www.star-bit.io",
        "image_url": f"{PUBLIC_BASE}/uploads/banner_20251020.jpg?v=20251020",
    }
    result = push_campaign(payload)
    return jsonify(result)

# -------------------------------------------------
# Serve static files (uploads)
# -------------------------------------------------

@app.route(f"{ASSET_ROUTE_PREFIX}/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(ASSET_LOCAL_DIR, filename)
# -------------------------------------------------
# Dev run（正式用 gunicorn）
# -------------------------------------------------
if __name__ == "__main__":
    # 依你之前：port 3001
    # 生產環境：停用 debug 和 reloader 避免重啟時路徑問題
    app.run(host="0.0.0.0", port=3001, debug=False, use_reloader=False)
