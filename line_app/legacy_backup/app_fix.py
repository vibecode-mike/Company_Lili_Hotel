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
import uuid
from collections import defaultdict, deque
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote_plus, quote
from linebot.exceptions import InvalidSignatureError

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
from sqlalchemy import create_engine, text as sql_text
from sqlalchemy.engine import Engine
from sqlalchemy import text
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
"""
你是「水漾月明度假文旅（Hana Mizu Tsuki Hotel）」的智能客服。你只提供本飯店的官方且已知資訊；不得臆測或延伸至館外商家名單。若使用者需求超出已知資訊或需要館外名單，請婉拒並引導致電櫃檯（037-255-358）。

【回答範圍（必遵守）】
- 可回：房型與價格、訂房、交通與聯絡、優惠專案、館內設施、環保政策、周邊景點（僅提供清單，不提供第三方評價/營業資訊），與飯店相關的內容可回答。
- 不可回：與本飯店不相關的內容。

【語氣與格式】
- 以精簡條列回覆；首行給出主題 emoji 與標題（如「🛏 房型定價」）。
- 能提供官方連結就給官方連結。
- 若使用者問到日期，務必用西元年或清楚表述（範例已內嵌於優惠專案）。

一、基本資料 / 訂房
- 飯店：水漾月明度假文旅（Hana Mizu Tsuki Hotel）
- 地址：362苗栗縣頭屋鄉明德路54號
- 電話：037-255-358
- Email：mizutsukihotel@gmail.com
- Google 地圖：https://www.google.com/maps?ll=24.585596,120.887298&z=17&t=m&hl=zh-TW&gl=US&mapclient=embed&cid=709365327370099103
- 線上訂房：https://res.windsurfercrs.com/ibe/index.aspx?propertyID=17658&nono=1&lang=zh-tw&adults=2

二、客房資訊（定價 / 晚）
- 豪華雙人房（床型若需指定請來電洽詢）：$12,000｜日式軟墊・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/3
- 湖景雙人房（側湖景）：$14,000｜一大床・兩小床｜http://www.younglake.com.tw/Home/ProductsDetail/5
- 豪華三人房：$15,000｜一大一小床・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/6
- 湖景四人房（床型若需指定請來電洽詢）：$22,000｜兩大床・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/7
- 豪華四人房（床型若需指定請來電洽詢）：$18,000｜兩大床・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/9
- 家庭四人房：$25,000｜兩大床・客廳・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/8
- 蜜月雙人房：$13,000｜一大床・客廳・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/2
- 水漾套房（正湖景）：$20,000｜一大床・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/1
（備註：以上為定價；實際專案或加人加價以現場與官網公告為準。需指定床型請改以電話洽詢。）

三、優惠方案 — 水上腳踏車住房專案
- 合作：水漾月明 × 海棠島水域遊憩中心
- 活動日期：114/8/28 ~ 114/10/30
- 方案：一泊一食（含早餐）
- 平日價格：豪華雙人 3,980｜湖景雙人 4,980｜豪華三人 5,300｜豪華四人 6,380
- 週六價格：豪華雙人 4,880｜湖景雙人 7,280｜豪華三人 6,280｜豪華四人 7,380
- 專案贈送：
  1) 早餐（依房型人數） 2) 水上自行車兌換券（半小時，$350/張；雙人2張/三人3張/四人4張）
  3) 7歲以下不佔床不收費（早餐另計） 4) 120cm 以上方可自行騎乘
- 兌換券注意：
  - 入住日1個月內使用；逾期/遺失不補發。
  - 現場至海棠島兌換並遵守安全規範。
  - 票券使用須先致電海棠島預約（非教練陪同券，如需教練需加價）。
  - 加購 Span Outdoor（SUP/獨木舟/水上自行車）享9折優惠。
- 暑假加碼：水漾環湖電動自行車 $250/台/2.5小時（贈飲料一瓶），騎至海棠島約15分鐘。
- 訂房連結：同「線上訂房」。

四、設施介紹（名稱｜連結｜備註）
- 環湖電動自行車｜http://www.younglake.com.tw/Home/FacilityDetail/14｜可租借
- 渡假會議｜http://www.younglake.com.tw/Home/FacilityDetail/4｜適合商務與活動
- 汗蒸幕體驗｜http://www.younglake.com.tw/Home/FacilityDetail/11｜放鬆身心
- 西餐廳｜http://www.younglake.com.tw/Home/FacilityDetail/7｜中式桌菜・客家風味・歐式百匯（訂位：037-255358）
- 視聽室｜http://www.younglake.com.tw/Home/FacilityDetail/6｜影音娛樂空間
- 水漾小賽車手俱樂部｜http://www.younglake.com.tw/Home/FacilityDetail/10｜兒童遊樂設施
- 24SHOP 智能販賣機｜http://www.younglake.com.tw/Home/FacilityDetail/8｜無人販售服務
- 清潔服務機器人｜http://www.younglake.com.tw/Home/FacilityDetail/12｜智能清潔體驗

五、環保政策 — 一次性備品
- 自 2025/01/01 起，客房不再提供一次性備品。建議旅客自備盥洗用品；如需可洽櫃檯。

六、周邊景點（僅清單）
【湖畔與水上活動】
- 日新島（可步行或騎車前往）、海棠島水域遊憩中心（SUP/獨木舟/水上自行車，車程約9分鐘）、明德水庫環湖（部分路段設自行車道）
【森林與花園】
- 橙香森林、雅聞玫瑰園、葛瑞絲香草田（距離飯店約2分鐘車程）
【其他推薦】
- 皇家高爾夫球場、魯冰花休閒農莊、卓也小屋（藍染/在地料理/綠色旅遊）

若任何資訊未在上表，請回答：「抱歉，我只能提供本館官方已知資訊。若需進一步協助，請洽櫃檯 037-255-358。」
"""
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
# LIFF 可選：未設定就跳過，僅停用 LIFF 相關功能
if not LIFF_ID_OPEN:
    logging.info("LIFF_ID_OPEN 還未設定; 若要使用 LIFF 功能，請先填入")

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_url_path=ASSET_ROUTE_PREFIX, static_folder=ASSET_LOCAL_DIR)

# LINE v3
config = Configuration(access_token=LINE_CHANNEL_ACCESS_TOKEN)
api_client = ApiClient(config)  
default_handler = WebhookHandler(LINE_CHANNEL_SECRET)   
messaging_api = MessagingApi(api_client)

# OpenAI
oai = OpenAI(api_key=OPENAI_API_KEY)

# DB - 优化连接池配置以支持高并发
engine: Engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # 连接前健康检查
    pool_recycle=3600,        # 1小时回收连接
    pool_size=20,             # 核心连接数：20
    max_overflow=30,          # 溢出连接数：30（总计50）
    pool_timeout=30,          # 获取连接超时：30秒
    echo_pool=False,          # 生产环境关闭连接池日志
    future=True
)

def utcnow():
    return datetime.datetime.utcnow()

def jdump(x): return json.dumps(x, ensure_ascii=False)

# ===== Multi-channel helpers (新增) =====
def get_credentials(channel_id: str | None):
    """
    從資料表抓該 channel 的 access_token / secret / liff_id_open。
    你之後建一張 ryan_line_channels 表即可（id, channel_name, channel_secret, channel_access_token, liff_id_open）。
    若查不到就回 None，代表用預設 .env。
    """
    if not channel_id:
        return None
    try:
        row = fetchone("""
            SELECT channel_access_token AS token,
                   channel_secret       AS secret,
                   COALESCE(liff_id_open, '') AS liff_id_open
              FROM ryan_line_channels
             WHERE id = :cid AND is_active = 1
             LIMIT 1
        """, {"cid": channel_id})
        return row if row else None
    except Exception:
        return None

def get_messaging_api(channel_id: str | None = None):
    """
    有給 channel_id → 用該 token 建臨時 MessagingApi
    沒給 → 回傳全域 messaging_api（= .env 預設）
    """
    if not channel_id:
        return messaging_api  # 相容舊行為
    cred = get_credentials(channel_id)
    if not cred or not cred.get("token"):
        return messaging_api  # 找不到就退回預設，避免出錯
    cfg = Configuration(access_token=cred["token"])
    return MessagingApi(ApiClient(cfg))

# ========= 用 LINE 的 Channel ID（line_channel_id）抓憑證 =========
def get_credentials_by_line_id(line_channel_id: str) -> dict | None:
    row = fetchone("""
        SELECT
            channel_access_token AS token,
            channel_secret       AS secret,
            COALESCE(liff_id_open, '') AS liff_id_open
        FROM ryan_line_channels
        WHERE line_channel_id = :cid AND is_active = 1
        LIMIT 1
    """, {"cid": line_channel_id})
    return row  # 可能為 None

# 用 Messaging API 的 Channel Access Token 設定/啟用 Webhook
def setup_line_webhook(line_channel_id: str, access_token: str):
    # 你要單一路徑就用 /callback；要每客戶一條就用 /callback/<id>
    webhook_url = f"https://linebot.star-bit.io/callback/{line_channel_id}"
    # 如果你目前伺服器沒有 /callback/<id> 路由，請改成：
    # webhook_url = "https://linebot.star-bit.io/callback"

    headers = {
        "Authorization": f"Bearer {access_token}",   # ★ 一定是 Messaging API 的長期 token
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
# 功能：用 Channel ID + Secret 換取可呼叫 LIFF API 的 access_token（client_credentials）
def get_login_access_token(channel_id: str, channel_secret: str) -> str:
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


# 用 access_token 建立 LIFF App 並回傳 liffId，同時寫回資料庫的 liff_id_open
def setup_line_liff(line_channel_id: str, channel_secret: str, view_url: str, size: str = "full") -> dict:

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

    # 3) 建立成功就把 liff_id_open 寫回 DB（你已經有這個欄位）
    if ok and liff_id:
        execute(
            "UPDATE ryan_line_channels SET liff_id_open=:liff, updated_at=:now WHERE line_channel_id=:cid",
            {"liff": liff_id, "cid": line_channel_id, "now": utcnow()},
        )

    return {
        "ok": ok,
        "status": create.status_code,
        "liff_id": liff_id,
        "resp": (create.json() if ok else {"text": create.text[:500]}),
    }



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

# [新增] 依 LINE 使用者建立/取得 thread（用 userId 當 thread_id，簡單且穩定）
def ensure_thread_for_user(line_uid: str) -> str:
    """
    以 LINE userId 直接當作 ryan_threads.id 來使用。
    若不存在就建立一筆；存在則跳過。
    """
    if not line_uid:
        return "anonymous"
    try:
        execute("""
            INSERT IGNORE INTO ryan_threads (id, conversation_name, created_at, updated_at)
            VALUES (:tid, :name, NOW(), NOW())
        """, {"tid": line_uid, "name": f"LINE:{line_uid}"})
    except Exception:
        pass
    return line_uid


# [新增] 寫一筆 ryan_messages（共用的小工具）
def insert_ryan_message(*, thread_id: str, role: str, direction: str,
                        message_type: str = "chat",
                        question: str | None = None,
                        response: str | None = None,
                        event_id: str | None = None,
                        status: str = "received"):
    """
    只寫你新表 ryan_messages，不動既有 messages/ryan_chat_logs。
    由呼叫端決定是 user 問（傳 question）或 assistant 回（傳 response）。
    """
    msg_id = uuid.uuid4().hex  # 36 VARCHAR 用 hex 最穩
    try:
        execute("""
            INSERT INTO ryan_messages
                (id, thread_id, role, direction, message_type,
                 question, response, event_id, status, created_at, updated_at)
            VALUES
                (:id, :tid, :role, :dir, :mt, :q, :r, :eid, :st, NOW(), NOW())
        """, {
            "id":  msg_id,
            "tid": thread_id,
            "role": role,               # 'user' / 'assistant'
            "dir":  direction,          # 'incoming' / 'outgoing'
            "mt":  message_type,        # 預設 'chat'
            "q":   question,
            "r":   response,
            "eid": event_id,
            "st":  status
        })
    except Exception as e:
        logging.warning(f"[ryan_messages insert] {e}")


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
    "聯絡資訊": (
        "🏨 水漾月明度假文旅（Hana Mizu Tsuki Hotel）\n"
        "📍 362苗栗縣頭屋鄉明德路54號\n"
        "📞 037-255-358　✉️ mizutsukihotel@gmail.com\n"
        "🗺 Google 地圖：https://www.google.com/maps?ll=24.585596,120.887298&z=17&t=m&hl=zh-TW&gl=US&mapclient=embed&cid=709365327370099103"
    ),

    "住宿": (
        "🛏 房型與定價（每晚 / 含稅）\n"
        "• 豪華雙人房（床型若需指定請來電洽詢）：$12,000｜日式軟墊・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/3\n"
        "• 湖景雙人房（側湖景）：$14,000｜一大床／兩小床｜http://www.younglake.com.tw/Home/ProductsDetail/5\n"
        "• 豪華三人房：$15,000｜一大一小床・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/6\n"
        "• 豪華四人房（床型若需指定請來電洽詢）：$18,000｜兩大床・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/9\n"
        "• 湖景四人房（床型若需指定請來電洽詢）：$22,000｜兩大床・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/7\n"
        "• 家庭四人房：$25,000｜兩大床・s客廳・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/8\n"
        "• 蜜月雙人房：$13,000｜一大床・客廳・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/2\n"
        "• 水漾套房（正湖景）：$20,000｜一大床・浴缸｜http://www.younglake.com.tw/Home/ProductsDetail/1\n"
        "🔗 立即訂房：https://res.windsurfercrs.com/ibe/index.aspx?propertyID=17658&nono=1&lang=zh-tw&adults=2\n"
        "♻️ 2025/01/01 起不提供一次性備品，請自行攜帶盥洗用品。"
    ),

    "餐飲": (
        "🍽 西餐廳｜中式桌菜・客家風味・歐式百匯\n"
        "📞 訂位：037-255358\n"
        "🔗 介紹頁：http://www.younglake.com.tw/Home/FacilityDetail/7"
    ),

    "停車場": (
        "🅿️ 現場備有停車空間；如需即時車位與動線協助，建議先電洽櫃檯（037-255-358）。"
    ),
}

# --- 房型與價格（做為「房價/價格/每晚」等關鍵字查詢的資料來源） ---
PRICE_TABLE = {
    "豪華雙人房（床型若需指定請來電洽詢）": 12000,
    "湖景雙人房（側湖景）": 14000,
    "豪華三人房": 15000,
    "湖景四人房（床型若需指定請來電洽詢）": 22000,
    "豪華四人房（床型若需指定請來電洽詢）": 18000,
    "家庭四人房": 25000,
    "蜜月雙人房": 13000,
    "水漾套房（正湖景）": 20000,
}
PRICE_UNIT = "TWD/晚"
PRICE_NOTES = "以上為定價；實際專案與加人加價以現場與官網公告為準。"
BOOK_URL = "https://res.windsurfercrs.com/ibe/index.aspx?propertyID=17658&nono=1&lang=zh-tw&adults=2"


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


def build_user_messages_from_payload(payload: dict, campaign_id: int, line_user_id: str) -> List[FlexMessage]:
    ttype = (payload.get("template_type") or payload.get("type") or "").strip().lower()
    title = payload.get("title") or "活動通知"
    messages = []

    # 準備項目
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

    # 產生追蹤連結（含 &src &tag）
    def tracked_uri(item) -> Optional[str]:
        target_url = (
            item.get("action_url")
            or item.get("action_button_url")
            or item.get("url")
            or f"{PUBLIC_BASE}/"
        )

        btn_enabled = item.get("action_button_enabled", False)
        btn_type = (item.get("action_button_interaction_type") or "").lower()
        interaction_type = "button_url" if (btn_enabled and btn_type == "open_url") else "image_click"

        # &src
        src = payload.get("source_campaign_id")
        src_q = f"&src={src}" if src is not None else ""

        # &tag（支援 list / str）
        tag_val = item.get("interaction_tags") or payload.get("interaction_tags")
        if isinstance(tag_val, list):
            tag_val = ",".join([str(x).strip() for x in tag_val if str(x).strip()])
        if isinstance(tag_val, str):
            tag_val = tag_val.strip()
        tag_q = f"&tag={quote(tag_val, safe='')}" if tag_val else ""

        uri = (
            f"{PUBLIC_BASE}/__track"
            f"?cid={campaign_id}&uid={line_user_id}"
            f"&type={interaction_type}&to={quote(target_url, safe='')}"
            f"{src_q}{tag_q}"
        )
        logging.warning("[TRACK_URI] %s", uri)  # debug
        return uri

    # 建立 Bubble（確保 action 用 tracked_uri）
    bubbles = []
    for it in items:
        uri = tracked_uri(it)
        it["image_click_action_type"] = it.get("image_click_action_type", "open_url")
        if ttype == "image_card":
            bubbles.append(make_image_button_bubble(it, uri))
        elif ttype in ("image_click", "carousel", ""):
            bubbles.append(make_image_click_bubble(it, uri))
        else:
            bubbles.append(make_image_button_bubble(it, uri))

    # 合併 Flex
    if len(bubbles) > 1 or ttype == "carousel":
        flex = {"type": "carousel", "contents": bubbles}
    else:
        flex = bubbles[0]

    logging.error("=== FLEX DEBUG OUTPUT ===\n%s", json.dumps(flex, ensure_ascii=False, indent=2))
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
        row = fetchone("""
            SELECT id FROM message_templates
            WHERE type = :t
            ORDER BY id DESC
            LIMIT 1
        """, {"t": ttype})
        if not row:
            raise ValueError(f"message_templates 找不到 type={ttype} 的模板")
        tid = row["id"]

    # 主要欄位
    now = utcnow()
    sat = utcnow()
    title = payload.get("title") or payload.get("name") or "未命名活動"
    audience = payload.get("target_audience") or "all"

    # 標籤正規化 → JSON
    interaction_tags = payload.get("interaction_tags")
    if isinstance(interaction_tags, str):
        interaction_tags = [x.strip() for x in interaction_tags.split(",") if x.strip()]
    elif not interaction_tags:
        interaction_tags = None  # 無標籤 → 存 NULL

    status = "sent" if (payload.get("schedule_type") or "immediate") == "immediate" else "scheduled"

    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO campaigns
                (title, template_id, target_audience, trigger_condition,
                 interaction_tags, scheduled_at, sent_at, status,
                 sent_count, opened_count, clicked_count, created_at, updated_at)
            VALUES
                (:title, :tid, :aud, NULL, :itag, :sat, :now, :status,
                 0, 0, 0, :now, :now)
        """), {
            "title": title,
            "tid": tid,
            "aud": json.dumps(audience, ensure_ascii=False),
            "itag": json.dumps(interaction_tags, ensure_ascii=False) if interaction_tags is not None else None,
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

    # 依 target_audience 取得目標用戶 
    target_audience = payload.get("target_audience", "all")
    target_tags = payload.get("target_tags", [])

    if target_audience == "all":
        # 發送給所有用戶
        rs = fetchall("""
            SELECT line_uid, id
            FROM members
            WHERE line_uid IS NOT NULL
              AND line_uid <> ''
        """)
    elif target_audience == "tags" and target_tags:
        # 發送給特定標籤的用戶
        tag_placeholders = ", ".join([f":tag{i}" for i in range(len(target_tags))])
        tag_params = {f"tag{i}": tag for i, tag in enumerate(target_tags)}
        rs = fetchall(f"""
            SELECT DISTINCT m.line_uid, m.id
            FROM members m
            JOIN member_tag_relations mtr ON m.id = mtr.member_id
            JOIN member_tags mt ON mtr.tag_id = mt.id
            WHERE m.line_uid IS NOT NULL
              AND m.line_uid <> ''
              AND mt.name IN ({tag_placeholders})
        """, tag_params)
    else:
        # 預設發送給所有用戶
        rs = fetchall("""
            SELECT line_uid, id
            FROM members
            WHERE line_uid IS NOT NULL
              AND line_uid <> ''
        """)

    if not rs:
        execute(
            "UPDATE campaigns SET status='no_recipients', updated_at=:now WHERE id=:cid",
            {"cid": cid, "now": utcnow()},
        )
        return {"ok": False, "campaign_id": cid, "sent": 0, "error": "no recipients found"}

    # 在迴圈外先決定要用哪個 Messaging API（避免重複 new client）
    line_cid = (payload or {}).get("line_channel_id")
    inner_cid = (payload or {}).get("channel_id")
    api = get_messaging_api_by_line_id(line_cid) if line_cid else get_messaging_api(inner_cid)

    sent = 0
    failed = 0

    for r in rs:
        uid = r["line_uid"]
        mid = r["id"]

        if not _is_valid_line_user_id(uid):
            logging.warning(f"skip invalid user id: {uid}")
            continue

        try:
            # 組訊息
            msgs = build_user_messages_from_payload(payload, inner_cid, uid)

            # 推播
            api.push_message(PushMessageRequest(to=uid, messages=msgs))
            sent += 1

            # 紀錄一筆 outgoing 訊息（清掉大欄位避免塞爆）
            if mid is not None:
                payload_for_log = dict(payload)
                payload_for_log.pop("image_base64", None)
                payload_for_log.pop("image_url", None)
                insert_message(
                    mid,
                    "outgoing",
                    "text",
                    {"campaign_id": cid, "payload": payload_for_log},
                    campaign_id=cid,
                )
        except Exception as e:
            failed += 1
            logging.exception(f"push to {uid} failed: {e}")

    # 更新活動發送統計
    execute(
        "UPDATE campaigns SET sent_count=:sent, updated_at=:now WHERE id=:cid",
        {"sent": sent, "cid": cid, "now": utcnow()},
    )

    logging.info(f"📤 Campaign {cid} sent to {sent} users (failed: {failed})")
    return {"ok": True, "campaign_id": cid, "sent": sent, "failed": failed}


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

def push_survey_entry(
    survey_id: int,
    title: Optional[str] = None,
    preview_text: Optional[str] = None,
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

    if line_channel_id:
        api = get_messaging_api_by_line_id(line_channel_id)
    else:
        api = get_messaging_api(channel_id)

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
            insert_message(r.get("id"), "outgoing", "text",
                           {"survey_id": survey_id, "payload": {"liff_url": liff_url, "title": title}})
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

# ========= 用 LINE Channel ID 取 MessagingApi =========
def get_messaging_api_by_line_id(line_channel_id: str | None) -> MessagingApi:
    # 沒帶就回退到預設（.env）
    if not line_channel_id:
        return messaging_api  # 你現有的預設 client

    cred = get_credentials_by_line_id(line_channel_id)
    if not cred or not cred.get("token"):
        logging.warning(f"[MSGAPI] line_channel_id={line_channel_id} not found; fallback to default")
        return messaging_api

    cfg = Configuration(access_token=cred["token"])
    return MessagingApi(ApiClient(cfg))


def send_survey_via_liff(payload: dict) -> dict:
    ids = register_survey_from_json(payload)
    pushed = push_survey_entry(
    ids["survey_id"],
    title=payload.get("name") or "問卷",
    preview_text=payload.get("description"),
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
    """
    URL 点击追踪端点（优化版）

    修复内容：
    1. ✅ 修正计数器逻辑（total_clicks = total_clicks + 1）
    2. ✅ 移除 UPSERT 子查询（预先查询 display_name）
    3. ✅ 标签合并使用行锁（FOR UPDATE）消除竞态条件
    4. ✅ 改进异常处理（详细日志）
    5. ✅ 统一事务管理
    """
    # ========== Phase 1: 参数解析 ==========
    uid = request.args.get("uid", "")
    cid = request.args.get("cid", "")
    ityp = request.args.get("type", "") or "image_click"
    to = request.args.get("to", "")
    src = request.args.get("src", None)
    tag_str = (request.args.get("tag", "") or "").strip()

    logging.warning("[TRACK_HIT] uid=%s cid=%s type=%s tag=%s src=%s", uid, cid, ityp, tag_str, src)

    # 参数验证
    if not to:
        logging.warning("Track request missing 'to' parameter")
        return redirect("/", code=302)

    try:
        src = int(src) if src and str(src).isdigit() else 0
    except (ValueError, AttributeError):
        src = 0

    try:
        cid = int(cid) if cid and str(cid).isdigit() else 0
    except (ValueError, AttributeError):
        cid = 0

    # ========== 辅助函数 ==========
    def normalize_tags(s: str) -> list[str]:
        """标签正规化（去重、去空）"""
        out = []
        for x in (s.split(",") if s else []):
            t = str(x).strip()
            if t and t not in out:
                out.append(t)
        return out

    # ========== Phase 2: 统一事务处理 ==========
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            mid = None
            display_name = None

            # 2.1 会员处理
            if uid:
                try:
                    member = conn.execute(
                        text("SELECT id, line_display_name FROM members WHERE line_uid = :u"),
                        {"u": uid}
                    ).mappings().first()

                    if member:
                        mid = member["id"]
                        display_name = member["line_display_name"]
                    else:
                        # 创建新会员（使用现有的 upsert_member 函数）
                        # 注意：upsert_member 可能需要在事务外执行，这里先尝试
                        try:
                            mid = upsert_member(uid)
                        except Exception as e:
                            logging.error("Failed to create member in transaction", exc_info=True, extra={"line_uid": uid})

                except Exception as e:
                    logging.error("Failed to fetch/create member", exc_info=True, extra={"line_uid": uid, "error_type": type(e).__name__})

            # 2.2 插入消息记录
            if mid and cid:
                try:
                    conn.execute(text("""
                        INSERT INTO messages (member_id, direction, message_type, content, campaign_id, created_at)
                        VALUES (:mid, 'incoming', 'text', :content, :cid, NOW())
                    """), {
                        "mid": mid,
                        "content": json.dumps({
                            "event": "campaign_click",
                            "campaign_id": cid,
                            "target": to
                        }, ensure_ascii=False),
                        "cid": cid
                    })
                except Exception as e:
                    logging.error("Failed to insert message", exc_info=True, extra={
                        "member_id": mid,
                        "campaign_id": cid,
                        "error_type": type(e).__name__
                    })

            # 2.3 更新活动计数
            if cid:
                try:
                    conn.execute(
                        text("UPDATE campaigns SET clicked_count=clicked_count+1, updated_at=NOW() WHERE id=:cid"),
                        {"cid": cid}
                    )
                except Exception as e:
                    logging.error("Failed to update campaign click count", exc_info=True, extra={
                        "campaign_id": cid,
                        "error_type": type(e).__name__
                    })

            # 2.4 标签合并 + UPSERT（带行锁，消除竞态条件）
            try:
                # 加排他锁读取现有记录
                row = conn.execute(text(f"""
                    SELECT last_click_tag, line_display_name
                    FROM `{MYSQL_DB}`.`ryan_click_demo`
                    WHERE line_id = :uid AND source_campaign_id = :src
                    FOR UPDATE
                """), {"uid": uid, "src": src}).mappings().first()

                # 合并标签（在锁保护下，消除竞态条件）
                existing_str = row["last_click_tag"] if row else None
                current_display_name = row["line_display_name"] if row else None

                existing = normalize_tags(existing_str or "")
                incoming = normalize_tags(tag_str)

                merged = existing[:]
                for t in incoming:
                    if t not in merged:
                        merged.append(t)
                merged_str = ",".join(merged) if merged else None

                # UPSERT（无子查询，修正计数器逻辑）
                conn.execute(text(f"""
                    INSERT INTO `{MYSQL_DB}`.`ryan_click_demo`
                        (line_id, source_campaign_id, line_display_name, total_clicks, last_clicked_at, last_click_tag)
                    VALUES (:uid, :src, :dname, 1, NOW(), :merged)
                    ON DUPLICATE KEY UPDATE
                        total_clicks = total_clicks + 1,
                        line_display_name = COALESCE(:dname, line_display_name),
                        last_click_tag = :merged,
                        last_clicked_at = NOW()
                """), {
                    "uid": uid,
                    "src": src,
                    "dname": display_name or current_display_name,
                    "merged": merged_str
                })

            except Exception as e:
                logging.exception(f"Failed to UPSERT ryan_click_demo: uid={uid}, src={src}, error={e}")

            # 2.5 插入互动日志
            try:
                conn.execute(text("""
                    INSERT INTO component_interaction_logs
                        (line_id, campaign_id, interaction_type, interaction_value, triggered_at)
                    VALUES (:uid, :cid, :itype, :to, NOW())
                """), {"uid": uid, "cid": cid, "itype": ityp, "to": to})
            except Exception as e:
                logging.error("Failed to insert interaction log", exc_info=True, extra={
                    "line_id": uid,
                    "campaign_id": cid,
                    "interaction_type": ityp,
                    "error_type": type(e).__name__
                })

            # 事务自动提交

    except Exception as e:
        logging.exception(f"Track endpoint critical failure: uid={uid}, cid={cid}, error={e}")
        # 即使数据库操作失败，也要跳转（避免用户体验中断）

    # ========== Phase 3: Debug 模式 ==========
    if request.args.get("debug") == "1":
        return {"ok": True, "uid": uid, "cid": cid, "src": src}

    # ========== Phase 4: 跳转到目标 URL ==========
    try:
        return redirect(to, code=302)
    except Exception:
        return "OK"


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
# LINE Channel Connect API
# -------------------------------------------------
@app.post("/api/connect_line_channel")
def connect_line_channel():
    data = request.json
    line_channel_id = data["channel_id"]
    secret = data["channel_secret"]
    token = data["access_token"]

    # 存入資料庫（若重複 channel_id 則更新）
    execute("""
        INSERT INTO ryan_line_channels (line_channel_id, channel_secret, channel_access_token, is_active)
        VALUES (:cid, :sec, :tok, 1)
        ON CONFLICT(line_channel_id)
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


def on_follow(event: FollowEvent):
    welcome = (
        "Hi~ 歡迎加入水漾月明度假文旅（Hana Mizu Tsuki Hotel）！\n"
        "需要我協助什麼樣的服務呢?\n"
    )
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


def on_text(event: MessageEvent):
    # 先取 user_key、text_in、uid
    user_key = _source_key(event.source)
    text_in  = event.message.text.strip()
    uid      = getattr(event.source, "user_id", None)
    logging.info(f"[on_text] uid={uid} text={text_in[:80]}")

    # === 新增：建立 thread 並寫入 ryan_messages（user/incoming） ===
    try:
        thread_id = ensure_thread_for_user(uid)
        insert_ryan_message(
            thread_id=thread_id,
            role="user",
            direction="incoming",
            message_type="chat",
            question=text_in,
            event_id=event.message.id,
            status="received"
        )
    except Exception:
        logging.exception("[on_text] write ryan_messages(user) failed")

    # === 寫入 ryan_chat_logs ===
    try:
        with engine.begin() as conn:
            conn.execute(sql_text("""
                INSERT INTO ryan_chat_logs
                (platform, user_id, direction, message_type, text, content, event_id, status, created_at)
                VALUES (:platform, :user_id, :direction, :message_type, :text, :content, :event_id, :status, NOW())
            """), {
                "platform": "LINE",
                "user_id": getattr(event.source, "user_id", None),
                "direction": "incoming",
                "message_type": "text",
                "text": text_in,
                "content": json.dumps({
                    "type": "text",
                    "text": text_in
                }, ensure_ascii=False),
                "event_id": event.message.id,
                "status": "received"
            })
    except Exception as e:
        print(f"[chatlog insert error] {e}")

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

    # FAQ（包含 Rich Menu 四鍵）
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
    user_memory[user_key].append(("user", text_in)); 

    # 把 AI 回覆寫進 ryan_messages（role=assistant / outgoing）
    insert_ryan_message(
        thread_id=thread_id,
        role="assistant",
        direction="outgoing",
        message_type="chat",
        response=answer[:5000],
        status="sent"
    )
    user_memory[user_key].append(("assistant", answer))

# 可重複註冊事件處理（新增）
def register_handlers(h):
    # 依事件型別把上面的函式掛到任何 handler h 上
    h.add(FollowEvent)(on_follow)
    h.add(PostbackEvent)(on_postback)
    h.add(MessageEvent, message=TextMessageContent)(on_text)

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

@app.route("/callback/<line_channel_id>", methods=["POST"])
def callback_with_id(line_channel_id):
    return callback()  # 先轉用你原本的處理；之後要做多租戶再改成用 id 驗章
# -------------------------------------------------
# Dev run（正式用 gunicorn）
# -------------------------------------------------
if __name__ == "__main__":
    # 依你之前：port 3001
    app.run(host="0.0.0.0", port=3001, debug=True)
