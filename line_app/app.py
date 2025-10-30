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
# ============================================================

import os
import re
import io
import json
import base64
import hashlib
import logging
import datetime
import requests
from collections import defaultdict, deque
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote_plus, quote

from dotenv import load_dotenv
from flask import Flask, request, abort, jsonify, render_template_string, redirect, send_from_directory

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
    MessageEvent, TextMessageContent, FollowEvent, PostbackEvent
)

from linebot.v3.messaging.models import FlexContainer

# OpenAI
from openai import OpenAI

# SQLAlchemy Core
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# -------------------------------------------------
# env
# -------------------------------------------------
load_dotenv()

LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET", "")
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
MEMORY_TURNS = int(os.getenv("MEMORY_TURNS", "5"))
PUBLIC_BASE = (os.getenv("PUBLIC_BASE") or "").rstrip("/")
LIFF_ID = os.getenv("LIFF_ID", "").strip()
LIFF_ID_OPEN = os.getenv("LIFF_ID_OPEN", "").strip()

# DB（沿用你原先的命名與預設，避免 (using password: NO)）
MYSQL_USER = os.getenv("MYSQL_USER", os.getenv("DB_USER", "root"))
MYSQL_PASS = os.getenv("MYSQL_PASS", os.getenv("DB_PASS", "123456"))
MYSQL_HOST = os.getenv("MYSQL_HOST", os.getenv("DB_HOST", "192.168.50.123"))
MYSQL_PORT = int(os.getenv("MYSQL_PORT", os.getenv("DB_PORT", "3306")))
MYSQL_DB   = os.getenv("MYSQL_DB",   os.getenv("DB_NAME", "lili_hotel"))

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{quote_plus(MYSQL_PASS)}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"

# 本機存 Base64 圖檔；Nginx 可對外 /uploads → /data2/lili_hotel/backend/public/uploads
ASSET_LOCAL_DIR    = "/data2/lili_hotel/backend/public/uploads"
ASSET_ROUTE_PREFIX = "/uploads"
os.makedirs(ASSET_LOCAL_DIR, exist_ok=True)

# -------------------------------------------------
# 固定 SYSTEM_PROMPT（**內嵌版**；不讀外部檔案）
# -------------------------------------------------
SYSTEM_PROMPT = (
    "你是思偉達飯店的智能管家，只會回答所有飯店相關的訊息，請用專業且親切的語氣回復。"
    "請務必只回答有關思偉達飯店的相關問題，例如房價、優惠、設施、服務，附近周遭景點、餐廳、或服務也算相關問題，"
    "其他延伸或無關的問題一律用婉拒方式A處理。"
    "婉拒方式A：很抱歉，我無法回答您這個問題，歡迎致電讓我們為您服務：電話：07-xxx-xxxx。"
    "飯店地址為台北市中正區博愛路80號，如果使用者詢問附近景點或餐廳或相關問題，請以這個地區(西門町)附近搜尋相關回答。"
    "回答請簡潔講重點即可。"
)

# -------------------------------------------------
# init
# -------------------------------------------------
if not LINE_CHANNEL_SECRET or not LINE_CHANNEL_ACCESS_TOKEN:
    raise RuntimeError("請在 .env 設定 LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN")
if not OPENAI_API_KEY:
    raise RuntimeError("請在 .env 設定 OPENAI_API_KEY")
if not PUBLIC_BASE:
    raise RuntimeError("請在 .env 設定 PUBLIC_BASE")
if not LIFF_ID_OPEN:
    raise RuntimeError("請在 .env 設定 LIFF_ID_OPEN")

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_url_path=ASSET_ROUTE_PREFIX, static_folder=ASSET_LOCAL_DIR)

# LINE v3
config = Configuration(access_token=LINE_CHANNEL_ACCESS_TOKEN)
api_client = ApiClient(config)  
handler = WebhookHandler(LINE_CHANNEL_SECRET)
messaging_api = MessagingApi(api_client)

# OpenAI
oai = OpenAI(api_key=OPENAI_API_KEY)

# DB
engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600, future=True)

def utcnow():
    return datetime.datetime.utcnow()

def jdump(x): return json.dumps(x, ensure_ascii=False)

# -------------------------------------------------
# DB helpers
# -------------------------------------------------

# 
def fetch_line_profile(user_id: str) -> tuple[Optional[str], Optional[str]]:
    """
    透過 LINE 官方 API 取回 displayName / pictureUrl
    回傳 (display_name, picture_url)；失敗時皆回 None
    """
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

# 補使用者line資料
def maybe_update_member_profile(uid: str) -> None:
    """
    若 members 裡 display_name / picture_url 有缺，就向 LINE 抓一次並補寫。
    抓不到（None）時不覆蓋，以避免把舊值清空。
    """
    try:
        row = fetchone("""
            SELECT line_display_name, line_picture_url
            FROM members
            WHERE line_uid = :uid
        """, {"uid": uid})

        has_name = bool(row and row.get("line_display_name"))
        has_pic  = bool(row and row.get("line_picture_url"))
        if has_name and has_pic:
            return  # 都有就不打 API

        # 打 LINE Profile API（你專案已有 fetch_line_profile，就直接用）
        display_name, picture_url = fetch_line_profile(uid)

        # 有抓到才更新，避免用空值覆蓋
        if display_name or picture_url:
            upsert_member(uid,
                          display_name if display_name else None,
                          picture_url  if picture_url  else None)
            logging.info(f"[PROFILE] backfilled member uid={uid} "
                         f"name={display_name!r} pic={'Y' if picture_url else 'N'}")
    except Exception as e:
        logging.warning(f"[PROFILE] maybe_update_member_profile failed uid={uid}: {e}")


# 將 DB 題型映成 LIFF 前端支援的題型
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


def _table_has(table: str, col: str) -> bool:
    with engine.begin() as conn:
        r = conn.execute(text("""
            SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA=:db AND TABLE_NAME=:t AND COLUMN_NAME=:c
        """), {"db": MYSQL_DB, "t": table, "c": col}).scalar()
    return bool(r)

def _col_required(table: str, col: str) -> bool:
    with engine.begin() as conn:
        r = conn.execute(text("""
            SELECT IS_NULLABLE, COLUMN_DEFAULT
              FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA=:db AND TABLE_NAME=:t AND COLUMN_NAME=:c
        """), {"db": MYSQL_DB, "t": table, "c": col}).mappings().first()
    if not r: return False
    return (r["IS_NULLABLE"] == "NO" and r["COLUMN_DEFAULT"] is None)

def fetchall(sql, p=None):
    with engine.begin() as conn:
        return [dict(r) for r in conn.execute(text(sql), p or {}).mappings().all()]

def fetchone(sql, p=None):
    with engine.begin() as conn:
        r = conn.execute(text(sql), p or {}).mappings().first()
        return dict(r) if r else None

def execute(sql, p=None):
    with engine.begin() as conn:
        conn.execute(text(sql), p or {})

# -------------------------------------------------
# Members / Messages
# -------------------------------------------------
def upsert_member(line_uid: str,
                  display_name: Optional[str] = None,
                  picture_url: Optional[str] = None,
                  gender: Optional[str] = None,
                  birthday_date: Optional[str] = None,
                  email: Optional[str] = None,
                  phone: Optional[str] = None) -> int:
    fields, ph, p = ["line_uid"], [":uid"], {"uid": line_uid}
    def add(col,key,val):
        if _table_has("members", col) and val is not None:
            fields.append(col); ph.append(f":{key}"); p[key]=val
    add("line_display_name","dn",display_name)
    add("line_picture_url","pu",picture_url)
    add("gender","g",gender)
    add("birthday","bd",birthday_date)
    add("email","em",email)
    add("phone","phn",phone)
    add("source","src","LINE")

    if _col_required("members","created_at"):
        fields.append("created_at"); ph.append(":cat"); p["cat"]=utcnow()
    if _table_has("members","updated_at"):
        fields.append("updated_at"); ph.append(":uat"); p["uat"]=utcnow()

    set_parts=[]
    for k in ("line_display_name","line_picture_url","gender","birthday","email","phone","source"):
        if _table_has("members",k): set_parts.append(f"{k}=VALUES({k})")
    if _table_has("members","updated_at"): set_parts.append("updated_at=VALUES(updated_at)")
    if _table_has("members","last_interaction_at"): set_parts.append("last_interaction_at=NOW()")

    sql = f"INSERT INTO members ({', '.join(fields)}) VALUES ({', '.join(ph)}) " \
          f"ON DUPLICATE KEY UPDATE {', '.join(set_parts)}"
    with engine.begin() as conn:
        conn.execute(text(sql), p)
        mid = conn.execute(text("SELECT id FROM members WHERE line_uid=:u"), {"u": line_uid}).scalar()
    return int(mid)

def insert_message(member_id: Optional[int], direction: str, message_type: str, content_obj: Any,
                   campaign_id: Optional[int] = None, sender_type: Optional[str] = None):
    # 注意：為避免 ENUM 撞型，這裡 message_type 儘量使用 "text" 或你既有允許的值
    fields = ["member_id","direction","message_type","content"]
    ph = [":mid",":dir",":mt",":ct"]
    p = {"mid": member_id, "dir": direction, "mt": message_type, "ct": jdump(content_obj)}
    if _table_has("messages","campaign_id") and campaign_id is not None:
        fields.append("campaign_id"); ph.append(":cid"); p["cid"]=campaign_id
    if _table_has("messages","sender_type") and sender_type:
        fields.append("sender_type"); ph.append(":st"); p["st"]=sender_type
    if _col_required("messages","created_at"):
        fields.append("created_at"); ph.append(":cat"); p["cat"]=utcnow()
    execute(f"INSERT INTO messages ({', '.join(fields)}) VALUES ({', '.join(ph)})", p)

# -------------------------------------------------
# Chatbot（記憶 + GPT）
# -------------------------------------------------
user_memory = defaultdict(lambda: deque(maxlen=MEMORY_TURNS * 2))

FAQ = {
    "聯絡資訊": "☎️ 電話：07-xxx-xxxx｜Email：hotel@example.com｜櫃檯 24 小時服務",
    "住宿": "🏨 入住 15:00、退房 11:00。可行李寄放／嬰兒床／加床（需預約）。\n🔗 預約：https://your-hotel.com/booking",
    "餐飲": "🍽 早餐 06:30–10:00（2F 自助），晚餐 17:30–21:30，提供素食（請提前告知）。",
    "停車場": "🅿️ 住客免費，B2–B4，高度限 2.0m，電動車位 12 格（需登記）。",
}
PRICE_TABLE = {"標準雙人房": 2800, "豪華雙人房": 3500, "家庭四人房": 4800, "行政套房": 6800}
PRICE_UNIT = "TWD/晚"
PRICE_NOTES = "以上價格含稅含早餐；週六與連假 +500/晚；7–8 月旺季 +300/晚。以官網與現場公告為準。"
BOOK_URL = "https://your-hotel.com/booking"
AMENITIES = [
    "免費 Wi-Fi（全館）","24 小時櫃檯與行李寄放","B2–B4 住客免費停車（車高 ≤ 2.0 m）",
    "健身房 06:00–22:00（3F）","自助洗衣 24H（B1，投幣式）","商務中心 08:00–22:00（2F）",
    "無障礙客房 2 間（需預約）","溫水游泳池 06:00–22:00（10F）",
]
PRICE_TRIGGERS = ["房價","價格","費用","每晚","price","rate","價目","優惠","折扣"]
AMENITY_TRIGGERS = ["設施","設備","amenities","有哪些設備","有什麼設施","游泳池","健身房","停車"]

def _is_price_query(t:str)->bool: return any(k in t for k in PRICE_TRIGGERS)
def _is_amenity_query(t:str)->bool: return any(k in t for k in AMENITY_TRIGGERS)

def build_price_text()->str:
    lines=["💰 房價"]+[f"• {room}：{price:,} {PRICE_UNIT}" for room,price in PRICE_TABLE.items()]
    lines+=["",f"🔗 預約：{BOOK_URL}","",f"※ {PRICE_NOTES}"]
    return "\n".join(lines)

def build_amenities_text()->str:
    return "🏨 飯店設施\n"+"\n".join([f"• {x}" for x in AMENITIES])

def _build_messages(user_key: str, user_text: str):
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    for role, content in user_memory[user_key]:
        msgs.append({"role": role, "content": content})
    msgs.append({"role": "user", "content": user_text})
    return msgs

def _ask_gpt(messages):
    try:
        resp = oai.chat.completions.create(model=OPENAI_MODEL, messages=messages, temperature=0.6, max_tokens=500)
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"（抱歉，目前服務忙線中，請稍後再試）\n\nError: {e}"

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
    """
    生成圖片點擊型 Flex Message Bubble

    支援 5 種場景：
    1. image_only.json - 純圖片（無動作按鈕）
    2. interaction_no.json - 圖片 + 浮動按鈕（無互動）
    3. interaction_text.json - 圖片 + 浮動按鈕（觸發訊息）
    4. interaction_uri.json - 圖片 + 浮動按鈕（開啟網址）
    5. interaction_image.json - 圖片 + 浮動按鈕（觸發圖片）
    """
    image_url = image_url_from_item(item) or "https://dummyimage.com/1200x800/eeeeee/333333&text=No+Image"
    aspect_ratio = item.get("image_aspect_ratio", "1:1")

    # 檢查是否啟用動作按鈕
    action_button_enabled = item.get("action_button_enabled", False)

    # 場景 1: 無動作按鈕 → 使用 hero 結構（Phase 1 格式，向後兼容）
    if not action_button_enabled:
        # 取得點擊圖片的動作類型
        click_action_type = item.get("image_click_action_type", "open_image")
        click_action_value = item.get("image_click_action_value")

        # 決定點擊圖片的 URI
        if click_action_type == "open_image":
            action_uri = image_url
        elif click_action_type == "open_url" and click_action_value:
            action_uri = tracked_uri or click_action_value
        else:
            action_uri = tracked_uri or image_url

        # 返回純圖片格式（image_only.json）
        return {
            "type": "bubble",
            "hero": {
                "type": "image",
                "url": image_url,
                "size": "full",
                "aspectRatio": aspect_ratio,
                "aspectMode": "cover",
                "action": {
                    "type": "uri",
                    "uri": action_uri
                }
            }
        }

    # 場景 2-5: 有動作按鈕 → 使用 body 結構 + 浮動按鈕
    action_button_text = item.get("action_button_text", "點擊查看")
    interaction_type = item.get("action_button_interaction_type", "none")

    # 構建浮動按鈕的 action（根據互動類型）
    button_box = {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#00000077",
        "cornerRadius": "999px",
        "paddingTop": "8px",
        "paddingBottom": "8px",
        "paddingStart": "20px",
        "paddingEnd": "20px",
        "width": "180px",
        "alignItems": "center",
        "justifyContent": "center",
        "contents": [
            {
                "type": "text",
                "text": action_button_text,
                "weight": "bold",
                "size": "sm",
                "align": "center",
                "color": "#FFFFFF"
            }
        ]
    }

    # 根據互動類型添加 action
    if interaction_type == "trigger_message":
        # 場景 3: interaction_text.json（觸發訊息）
        button_box["action"] = {
            "type": "message",
            "label": "action",
            "text": item.get("action_button_trigger_message", "")
        }
    elif interaction_type == "open_url":
        # 場景 4: interaction_uri.json（開啟網址）
        button_box["action"] = {
            "type": "uri",
            "label": "action",
            "uri": tracked_uri or item.get("action_button_url") or item.get("action_url") or item.get("url") or f"{PUBLIC_BASE}/"
        }
    elif interaction_type == "trigger_image":
        # 場景 5: interaction_image.json（觸發圖片）
        button_box["action"] = {
            "type": "uri",
            "label": "action",
            "uri": item.get("action_button_trigger_image_url", "")
        }
    # else: 場景 2: interaction_no.json（無互動，不添加 action）

    # 返回帶浮動按鈕的格式
    return {
        "type": "bubble",
        "body": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "0px",
            "contents": [
                {
                    "type": "image",
                    "url": image_url,
                    "size": "full",
                    "aspectMode": "cover",
                    "aspectRatio": aspect_ratio
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "position": "absolute",
                    "offsetBottom": "20px",
                    "offsetStart": "0px",
                    "offsetEnd": "0px",
                    "width": "100%",
                    "alignItems": "center",
                    "justifyContent": "center",
                    "contents": [button_box]
                }
            ]
        }
    }

def build_user_messages_from_payload(payload: dict, campaign_id: int, line_user_id: str) -> List[FlexMessage]:
    ttype = (payload.get("template_type") or payload.get("type") or "").strip().lower()
    title = payload.get("title") or "活動通知"
    messages = []

    # 準備項目內容
    if payload.get("carousel_items"):
        items = sorted(payload["carousel_items"], key=lambda x: x.get("sort_order") or 0)
    else:
        items = [{
            "image_base64": payload.get("image_base64"),
            "image_url": payload.get("image_url"),
            "title": payload.get("title"),
            "description": payload.get("notification_text"),
            "price": payload.get("price"),
            "action_url": payload.get("url"),
            "interaction_tags": payload.get("interaction_tags"),
            "action_button_enabled": True if payload.get("interaction_type") == "open_url" else False,
            "action_button_text": payload.get("action_button_text") or "查看詳情",
            "action_button_interaction_type": payload.get("interaction_type") or "open_url",
            "sort_order": 0
        }]

    # ==============================
    # 產生追蹤連結（追蹤網址含活動 ID）
    # ==============================
    def tracked_uri(item) -> Optional[str]:
        target_url = (
            item.get("action_url")
            or item.get("action_button_url")
            or item.get("url")
            or f"{PUBLIC_BASE}/"
        )

        btn_enabled = item.get("action_button_enabled", False)
        btn_type = (item.get("action_button_interaction_type") or "").lower()

        # 按鈕開網址 → button_url，其餘（含圖片）→ image_click
        interaction_type = "button_url" if (btn_enabled and btn_type == "open_url") else "image_click"

        # 統一數據源：嚴格從 payload 提取 source_campaign_id
        src = payload.get("source_campaign_id")

        # 驗證 source_campaign_id 是否存在
        if src is None:
            logging.error(
                f"[TRACKED_URI] Missing source_campaign_id in payload! "
                f"campaign_id={campaign_id}, payload_keys={list(payload.keys())}"
            )
            # 不使用備援值，保持 src=None 以便追蹤問題根源
            src_q = ""
        else:
            src_q = f"&src={src}"

        # 加上 &src=xxx 到追蹤網址裡
        return f"{PUBLIC_BASE}/__track?cid={campaign_id}&uid={line_user_id}&type={interaction_type}&to={quote(target_url, safe='')}{src_q}"

    # ==============================
    # 建立氣泡內容
    # ==============================
    bubbles = []
    for it in items:
        uri = tracked_uri(it)
        # ✅ 改成圖片預設也會走 open_url（即會打 /__track）
        it["image_click_action_type"] = it.get("image_click_action_type", "open_url")
        if ttype == "image_card":
            bubbles.append(make_image_button_bubble(it, uri))
        elif ttype in ("image_click", "carousel", ""):
            bubbles.append(make_image_click_bubble(it, uri))
        else:
            bubbles.append(make_image_button_bubble(it, uri))

    # ==============================
    # 合併成 Flex 結構
    # ==============================
    if len(bubbles) > 1 or ttype == "carousel":
        flex = {"type": "carousel", "contents": bubbles}
    else:
        flex = bubbles[0]

    # Debug 輸出
    logging.error("=== FLEX DEBUG OUTPUT ===\n%s", json.dumps(flex, ensure_ascii=False, indent=2))

    # ✅ 將 dict 轉成 FlexContainer 再包進 FlexMessage
    fc = FlexContainer.from_dict(flex)
    messages.append(FlexMessage(alt_text=title, contents=fc))
    return messages



# 活動推播 (Campaign Push)
def _create_campaign_row(payload: dict) -> int:
    # 先決定 template_id
    tid = payload.get("template_id")
    if not tid:
        raw_type = payload.get("type") or payload.get("template_type") or ""
        ttype = raw_type.strip().upper()

        # 容錯對應（例如傳 image_card、image_click）
        ALIAS = {
            "IMAGE_CARD": "IMAGE_CARD",
            "IMAGE_CLICK": "IMAGE_CLICK",
            "IMAGE": "IMAGE_CARD",
            "CARD": "IMAGE_CARD",
            "CLICK": "IMAGE_CLICK",
        }
        ttype = ALIAS.get(ttype, ttype)

        if not ttype:
            raise ValueError("payload 需要 type 或 template_id")

        # 從 message_templates 找出對應類型的最新一筆 id
        row = fetchone("""
            SELECT id
            FROM message_templates
            WHERE type = :t
            ORDER BY id DESC
            LIMIT 1
        """, {"t": ttype})
        if not row:
            raise ValueError(f"message_templates 找不到 type={ttype} 的模板")
        tid = row["id"]

    now = utcnow()
    sat = utcnow()
    title = payload.get("title") or payload.get("name") or "未命名活動"
    audience = payload.get("target_audience") or "all"
    interaction_tags = payload.get("interaction_tags")

    status = "sent" if (payload.get("schedule_type") or "immediate") == "immediate" else "scheduled"

    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO campaigns
                (title, template_id, target_audience, trigger_condition,
                 interaction_tags, scheduled_at, sent_at, status,
                 sent_count, opened_count, clicked_count, created_at, updated_at)
            VALUES
                (:title, :tid, :aud, NULL, :itag, :sat, :now, :status, 0, 0, 0, :now, :now)
        """), {
            "title": title,
            "tid": tid,
            "aud": json.dumps(audience, ensure_ascii=False),
            "itag": interaction_tags,
            "sat": sat,
            "now": now,
            "status": status,
        })
        rid = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()

    return int(rid)

def _add_campaign_recipients(campaign_id: int, mids: List[int]):
    if not mids: return
    with engine.begin() as conn:
        for mid in mids:
            conn.execute(text("""
                INSERT INTO campaign_recipients (campaign_id, member_id, sent_at, status, created_at, updated_at)
                VALUES (:cid,:mid,:now,'sent',:now,:now)
            """), {"cid": campaign_id, "mid": mid, "now": utcnow()})
        conn.execute(text("UPDATE campaigns SET sent_count=sent_count+:n, updated_at=:now WHERE id=:cid"),
                     {"n": len(mids), "cid": campaign_id, "now": utcnow()})

def push_campaign(payload: dict) -> Dict[str, Any]:
    cid = _create_campaign_row(payload)

    # 根據 target_audience 取得目標用戶
    target_audience = payload.get("target_audience", "all")
    target_tags = payload.get("target_tags", [])

    # 構建查詢條件
    if target_audience == "all":
        # 發送給所有用戶
        rs = fetchall("SELECT line_uid, id FROM members WHERE line_uid IS NOT NULL AND line_uid<>''")
    elif target_audience == "tags" and target_tags:
        # 發送給特定標籤的用戶
        # 將標籤列表轉換為 SQL IN 條件
        tag_placeholders = ", ".join([f":tag{i}" for i in range(len(target_tags))])
        tag_params = {f"tag{i}": tag for i, tag in enumerate(target_tags)}

        query = f"""
            SELECT DISTINCT m.line_uid, m.id
            FROM members m
            JOIN member_tag_relations mtr ON m.id = mtr.member_id
            JOIN member_tags mt ON mtr.tag_id = mt.id
            WHERE m.line_uid IS NOT NULL
              AND m.line_uid <> ''
              AND mt.name IN ({tag_placeholders})
        """
        rs = fetchall(query, tag_params)
    else:
        # 預設發送給所有用戶
        rs = fetchall("SELECT line_uid, id FROM members WHERE line_uid IS NOT NULL AND line_uid<>''")

    if not rs:
        execute("UPDATE campaigns SET status='no_recipients', updated_at=:now WHERE id=:cid",
                {"cid": cid, "now": utcnow()})
        return {"ok": False, "campaign_id": cid, "sent": 0, "error": "no recipients found"}

    sent = 0
    failed = 0
    for r in rs:
        uid = r["line_uid"]
        mid = r["id"]
                
        if not _is_valid_line_user_id(uid):
            logging.warning(f"skip invalid user id: {uid}")
            continue

        try:
            msgs = build_user_messages_from_payload(payload, cid, uid)

            # LINE v3 push
            messaging_api.push_message(PushMessageRequest(to=uid, messages=msgs))
            sent += 1

            if mid is not None:
                payload_for_log = dict(payload)
                payload_for_log.pop("image_base64", None)
                payload_for_log.pop("image_url", None)
                insert_message(
                    mid,
                    "outgoing",
                    "text",
                    {"campaign_id": cid, "payload": payload_for_log},
                    campaign_id=cid
                )
        except Exception as e:
            failed += 1
            logging.exception(f"push to {uid} failed: {e}")

    # 更新活動發送統計
    execute("UPDATE campaigns SET sent_count=:sent, updated_at=:now WHERE id=:cid",
            {"sent": sent, "cid": cid, "now": utcnow()})

    logging.info(f"📤 Campaign {cid} sent to {sent} users (failed: {failed})")
    return {"ok": True, "campaign_id": cid, "sent": sent, "failed": failed}


# 群發（支援追蹤的替代：實際走逐一推播）
def broadcast_message(payload):
    logging.info("broadcast_message: fan-out via push_campaign() for per-user tracking")
    return push_campaign(payload)



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
    """
    # 1) 取得/建立會員 id
    with engine.begin() as conn:
        mid = conn.execute(text("SELECT id FROM members WHERE line_uid=:u"), {"u": line_uid}).scalar()
    if not mid:
        mid = upsert_member(line_uid)

    # 2) 只取以 q_ 開頭的鍵，並把 "q_12" -> "12"
    normalized = {}
    for k, v in (answers or {}).items():
        if not str(k).startswith("q_"):
            continue
        try:
            qid = str(int(str(k).split("_", 1)[1]))  # 只留數字 id，存成字串 key
        except Exception:
            continue
        # 轉成可序列化文字：list -> 逗號分隔，或直接保留 list 也可以
        if isinstance(v, list):
            normalized[qid] = v  # 想存字串可改為 ", ".join(map(str, v))
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
                (survey_id, member_id, answers, is_completed, completed_at, source, ip_address, user_agent, created_at, updated_at)
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

def push_survey_entry(survey_id: int, title: Optional[str] = None, preview_text: Optional[str] = None) -> int:
    """
    入口卡片推送(含三重保險):
      1) 只推給有效的 userId(U 開頭、長度 33)
      2) 可用環境變數 TEST_UIDS 指定只推給自己
      3) Flex 失敗時自動改推文字 + 連結
    """
    liff_url = liff_form_url(survey_id)
    title = str(title or "問卷")
    preview_text = str(preview_text or "").strip()

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
        text_only = TextMessage(text=f"{title}\n\n{preview_text}\n\n開始填寫:{liff_url}".strip())
        msgs = [text_only]
    else:
        # ✅ 組合訊息 (只推 Flex,不推前置文字)
        msgs = [FlexMessage(alt_text=title, contents=flex_container)]

    # ✅ Debug: 印出訊息內容
    logging.info(f"=== MESSAGES ({len(msgs)}) ===")
    for i, m in enumerate(msgs):
        logging.info(f"  [{i}] {type(m).__name__}")

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
            messaging_api.push_message(PushMessageRequest(to=uid, messages=msgs))
            insert_message(r.get("id"), "outgoing", "text",
                           {"survey_id": survey_id, "payload": {"liff_url": liff_url, "title": title}})
            sent += 1
            logging.info(f"✅ Successfully pushed to {uid}")
        except Exception as e:
            logging.error(f"❌ Push failed for {uid}: {e}")
            # Fallback: 純文字
            try:
                text_fallback = TextMessage(text=f"{title}\n\n開始填寫:{liff_url}")
                messaging_api.push_message(PushMessageRequest(to=uid, messages=[text_fallback]))
                sent += 1
                logging.info(f"✅ Fallback text sent to {uid}")
            except Exception as e2:
                logging.exception(f"❌ Even fallback failed for {uid}: {e2}")

    return sent

def send_survey_via_liff(payload: dict) -> dict:
    ids = register_survey_from_json(payload)
    pushed = push_survey_entry(ids["survey_id"], title=payload.get("name") or "問卷", preview_text=payload.get("description"))
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

    try:
        if mid is not None:
            insert_message(
                mid,
                "incoming",
                "text",
                {"event": "campaign_click", "campaign_id": cid, "target": to},
                campaign_id=cid
            )
    except Exception:
        pass

    try:
        execute("UPDATE campaigns SET clicked_count=clicked_count+1, updated_at=:now WHERE id=:cid",
                {"cid": cid, "now": utcnow()})
    except Exception:
        pass

    if not to:
        return redirect("/", code=302)
    return redirect(to, code=302)

@app.get("/__track")
def __track():
    # 1) 取參數
    try:
        cid = int(request.args.get("cid", "0"))
    except Exception:
        cid = 0
    
    src = int(request.args.get("src", "0") or "0")

    # 驗證 source_campaign_id 是否有效
    if src == 0:
        logging.warning(
            f"[TRACK] Missing or invalid source_campaign_id in URL: "
            f"cid={cid}, src={src}, url={request.url}"
        )
        # 注意：即使 src=0 也繼續處理，但會記錄警告以便追蹤問題

    uid   = request.args.get("uid", "") or request.headers.get("X-Line-UserId", "")
    ityp  = request.args.get("type", "") or "image_click"   # image_click / button_url ...
    to    = request.args.get("to", "")                      # 目標跳轉網址
    debug = request.args.get("debug", "0") == "1"

    # broadcast/舊訊息沒有 uid 的情況，給預設值，避免 NULL 入庫
    if not uid:
        uid = "broadcast"

    # 2) 印出目前使用的 DB 與參數（方便排查）
    dbname = None
    try:
        r = fetchone("SELECT DATABASE() AS db")
        dbname = (r or {}).get("db")
        logging.info(f"[TRACK] db={dbname} cid={cid} uid={uid} type={ityp} to={to}")
    except Exception:
        logging.exception("[TRACK] read DATABASE() failed")

    # 2.5) 先補會員 profile（讓只有「點擊」也能補上暱稱/頭像）
    try:
        if uid != "broadcast" and uid.startswith("U"):  # 避免對 broadcast / 測試值打 API
            maybe_update_member_profile(uid)
    except Exception as e:
        logging.warning(f"[TRACK] maybe_update_member_profile ignored: {e}")

    # 3) 寫互動紀錄（主表）
    cil_ok, cil_err = False, None
    try:
        execute("""
            INSERT INTO component_interaction_logs
              (line_id, campaign_id, interaction_type, interaction_value, triggered_at)
            VALUES (:uid, :cid, :itype, :to, NOW())
        """, {"uid": uid, "cid": cid, "itype": ityp, "to": to})
        cil_ok = True
    except Exception as e:
        cil_err = str(e)
        logging.exception(f"[TRACK] insert component_interaction_logs failed: {e}")

    # 4) 取 LINE 的 display name（保險：若沒抓到就回退到 members.name）
    display_name = None
    try:
        row = fetchone(
            "SELECT COALESCE(line_display_name, name) AS line_display_name "
            "FROM members WHERE line_uid = :uid",
            {"uid": uid}
        )
        display_name = row["line_display_name"] if row and row.get("line_display_name") else None
    except Exception as e:
        logging.warning(f"[TRACK] fetch member display name failed (ignore): {e}")

    # 5) upsert ryan_click_demo（※ 欄位名已是 line_display_name；total_clicks 當布林 0/1）
    rcd_ok, rcd_err = False, None
    try:
        execute(f"""
            INSERT INTO `{MYSQL_DB}`.`ryan_click_demo`
                (line_id, source_campaign_id, line_display_name, total_clicks, last_clicked_at)
            VALUES
                (
                    :uid,
                    :src,
                    COALESCE(:dname, (SELECT m.line_display_name FROM `{MYSQL_DB}`.`members` m WHERE m.line_uid = :uid LIMIT 1)),
                    1,
                    NOW()
                )
            ON DUPLICATE KEY UPDATE
                total_clicks = 1,  -- 只要點過就是 1（布林）
                line_display_name = COALESCE(
                    :dname,
                    (SELECT m.line_display_name FROM `{MYSQL_DB}`.`members` m WHERE m.line_uid = :uid LIMIT 1),
                    line_display_name
                ),
                last_clicked_at = NOW();
        """, {"uid": uid, "src": src, "dname": display_name})

        rcd_ok = True
        logging.info(f"[TRACK] upsert ryan_click_demo ok: uid={uid} dname={display_name!r} src={src}")

    except Exception as e:
        rcd_err = str(e)
        logging.exception(f"[TRACK] upsert ryan_click_demo failed: {e}")



    # 6) debug 模式：直接回傳診斷
    if debug:
        import json
        try:
            last_rcd = fetchall(f"""
                SELECT id,line_id,source_campaign_id,line_display_name,total_clicks,last_clicked_at,created_at,updated_at
                FROM `{MYSQL_DB}`.`ryan_click_demo`
                ORDER BY updated_at DESC
                LIMIT 5
            """)
        except Exception as e:
            last_rcd = [{"error": str(e)}]
        try:
            last_cil = fetchall("""
                SELECT id,campaign_id,line_id,interaction_type,interaction_value,triggered_at
                FROM component_interaction_logs
                ORDER BY id DESC
                LIMIT 5
            """)
        except Exception as e:
            last_cil = [{"error": str(e)}]
        report = [
            f"DB: {dbname}",
            f"CIL insert: {'OK' if cil_ok else 'FAIL'}  err={cil_err}",
            f"RCD upsert: {'OK' if rcd_ok else 'FAIL'}  err={rcd_err}",
            "Last ryan_click_demo:",
            json.dumps(last_rcd, ensure_ascii=False, default=str),
            "Last component_interaction_logs:",
            json.dumps(last_cil, ensure_ascii=False, default=str),
        ]
        return "\n".join(report), 200, {"Content-Type": "text/plain; charset=utf-8"}

    # 7) 正常重導
    if not to:
        return redirect("/", code=302)
    return redirect(to, code=302)


# 群發
@app.route("/api/broadcast", methods=["POST"])
def api_broadcast():
    payload = request.get_json()
    logging.info(f"📣 Received broadcast request: {payload}")
    result = broadcast_message(payload)
    return jsonify(result)

@app.post("/__survey_submit")
def __survey_submit():
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

# -------------------------------------------------
# LINE Webhook（v3）
# -------------------------------------------------
@app.post("/callback")
def callback():
    signature = request.headers.get("X-Line-Signature", "")
    body = request.get_data(as_text=True)
    try:
        handler.handle(body, signature)
    except Exception as e:
        logging.exception(f"Webhook error: {e}")
        abort(400)
    return "OK"

def _source_key(ev_source) -> str:
    uid = getattr(ev_source, "user_id", None)
    if uid: return uid
    st = getattr(ev_source, "type", "")
    if st == "group":  return f"group_{getattr(ev_source, 'group_id', 'unknown')}"
    if st == "room":   return f"room_{getattr(ev_source, 'room_id', 'unknown')}"
    return "anonymous"

@handler.add(FollowEvent)
def on_follow(event: FollowEvent):
    welcome = "歡迎光臨思偉達飯店，很高興為您服務！輸入「會員設定」即可完成基本資料。"
    try:
        messaging_api.reply_message(ReplyMessageRequest(
            reply_token=event.reply_token,
            messages=[TextMessage(text=welcome)]
        ))
    except Exception:
        logging.exception("reply follow failed")

    if getattr(event.source, "user_id", None):
        try:
            uid = event.source.user_id
            # 取 profile
            dn, pu = fetch_line_profile(uid)
            # 寫入（帶入非 None 的值才會更新 DB）
            mid = upsert_member(uid, dn, pu)
            insert_message(mid, "outgoing", "text", welcome)
        except Exception:
            pass

@handler.add(PostbackEvent)
def on_postback(event: PostbackEvent):
    uid = getattr(event.source, "user_id", None)
    data = getattr(event.postback, "data", "") if getattr(event, "postback", None) else ""
    if uid:
        try:
            cur = fetchone(
                "SELECT line_display_name, line_picture_url FROM members WHERE line_uid=:u",
                {"u": uid}
            ) or {}
            api_dn, api_pu = fetch_line_profile(uid)
            dn_to_write = api_dn if (api_dn and api_dn != cur.get("line_display_name")) else None
            pu_to_write = api_pu if (api_pu and api_pu != cur.get("line_picture_url")) else None

            mid = upsert_member(uid, dn_to_write, pu_to_write)
            insert_message(mid, "incoming", "postback", {"data": data})
        except Exception:
            pass


@handler.add(MessageEvent, message=TextMessageContent)
def on_text(event: MessageEvent):
    user_key = _source_key(event.source)
    text_in = event.message.text.strip()

    uid = getattr(event.source, "user_id", None)
    mid = None
    if uid:
        try:
            # 先讀目前 DB 值
            cur = fetchone(
                "SELECT line_display_name, line_picture_url FROM members WHERE line_uid=:u",
                {"u": uid}
            ) or {}
            cur_dn = cur.get("line_display_name")
            cur_pu = cur.get("line_picture_url")

            # 拿最新 profile
            api_dn, api_pu = fetch_line_profile(uid)

            # 防呆：只有在 DB 沒值或與最新不同時，才帶進 upsert 覆蓋
            dn_to_write = api_dn if (api_dn and api_dn != cur_dn) else None
            pu_to_write = api_pu if (api_pu and api_pu != cur_pu) else None

            mid = upsert_member(uid, dn_to_write, pu_to_write)
            insert_message(mid, "incoming", "text", {"text": text_in})
        except Exception:
            pass

    if _is_price_query(text_in):
        msg = build_price_text()
        try:
            messaging_api.reply_message(ReplyMessageRequest(
                reply_token=event.reply_token,
                messages=[TextMessage(text=msg)]
            ))
        except Exception:
            logging.exception("reply price failed")
        user_memory[user_key].append(("user", text_in)); user_memory[user_key].append(("assistant", msg))
        return

    if _is_amenity_query(text_in):
        msg = build_amenities_text()
        try:
            messaging_api.reply_message(ReplyMessageRequest(
                reply_token=event.reply_token,
                messages=[TextMessage(text=msg)]
            ))
        except Exception:
            logging.exception("reply amenity failed")
        user_memory[user_key].append(("user", text_in)); user_memory[user_key].append(("assistant", msg))
        return

    if text_in in FAQ:
        reply = FAQ[text_in]
        try:
            messaging_api.reply_message(ReplyMessageRequest(
                reply_token=event.reply_token,
                messages=[TextMessage(text=reply)]
            ))
        except Exception:
            logging.exception("reply FAQ failed")
        user_memory[user_key].append(("user", text_in)); user_memory[user_key].append(("assistant", reply))
        return

    # 其他 → GPT
    msgs = _build_messages(user_key, text_in)
    answer = _ask_gpt(msgs)
    try:
        messaging_api.reply_message(ReplyMessageRequest(
            reply_token=event.reply_token,
            messages=[TextMessage(text=answer[:5000])]
        ))
    except Exception:
        logging.exception("reply gpt failed")
    user_memory[user_key].append(("user", text_in)); user_memory[user_key].append(("assistant", answer))

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
# Dev run（正式用 gunicorn）
# -------------------------------------------------
if __name__ == "__main__":
    # 依你之前：port 3001
    app.run(host="0.0.0.0", port=3001, debug=True)
