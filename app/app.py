# app.py
# -*- coding: utf-8 -*-
"""
完整單檔（照你現在的 .env；其它設定寫死）：
- 讀 .env：LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN / OPENAI_API_KEY / OPENAI_MODEL / MEMORY_TURNS / PROMPT_FILE / PUBLIC_BASE / LIFF_ID / LIFF_ID_OPEN
- SYSTEM_PROMPT 鎖死（不讀 .env，不會被覆蓋）
- Flask 主服務：3001（/、/callback）
- 內建靜態圖伺服：8081（/uploads/<file>，供 Flex 抓 Base64 轉檔後的圖片）
- 功能：聊天機器人、推廣活動（Base64 圖片）、問卷（逐題 Postback）
- DB 寫入：members / messages / campaigns / campaign_recipients / interaction_tags / tag_trigger_logs / survey_templates / survey_questions / survey_responses / surveys
"""

from __future__ import annotations
import os
import re
import json
import base64
import hashlib
import datetime
import logging
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict, deque
from threading import Thread
from urllib.parse import urlparse

# ---------------- 讀你 .env（只讀你給的這些；其它寫死在程式） ----------------
LINE_CHANNEL_SECRET       = os.getenv("LINE_CHANNEL_SECRET", "")
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
OPENAI_API_KEY            = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL              = os.getenv("OPENAI_MODEL", "gpt-4o")
MEMORY_TURNS              = int(os.getenv("MEMORY_TURNS", "5"))
PROMPT_FILE               = os.getenv("PROMPT_FILE", "prompt.txt")  # 只是保留，不會覆蓋 SYSTEM_PROMPT
PUBLIC_BASE               = os.getenv("PUBLIC_BASE", "https://linebot.star-bit.io").rstrip("/")
LIFF_ID                   = os.getenv("LIFF_ID", "")
LIFF_ID_OPEN              = os.getenv("LIFF_ID_OPEN", "")

# ---------------- DB 連線（寫死） ----------------
MYSQL_USER = "root"
MYSQL_PASS = "123456"
MYSQL_HOST = "192.168.50.123"
MYSQL_PORT = 3306
MYSQL_DB   = "lili_hotel"
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASS}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"

# ---------------- 其它寫死設定 ----------------
STATIC_HOST = "0.0.0.0"
STATIC_PORT = 8081
ASSET_LOCAL_DIR = "./public/uploads"  # Base64 圖片存放處（自動建立）
FLEX_IMAGE_BASE = None  # 若 None 就用 http://<public-host>:8081；否則可改為 PUBLIC_BASE（走 nginx）

# ---------------- SYSTEM_PROMPT（鎖死） ----------------
SYSTEM_PROMPT = (
    "你是思偉達飯店的智能管家，只會回答所有飯店相關的訊息，請用專業且親切的語氣回復。"
    "請務必只回答有關思偉達飯店的相關問題，例如房價、優惠、設施、服務，附近周遭景點、餐廳、或服務也算相關問題，其他延伸或無關的問題一律用婉拒方式A處理。"
    "請判斷使用者問題是否超出一個飯店管家接待客服能回答的問題，即便對方加上特定關鍵字如思偉達飯店、房價、設施、優惠之類的，如果判斷問題非一般接待員能回的問題，請用婉拒方式A回答，婉拒方式A:很抱歉，我無法回答您這個問題，歡迎致電讓我們為您服務：電話：07-xxx-xxxx。"
    "飯店地址為台北市中正區博愛路80號，如果使用者詢問附近景點或餐廳或相關問題，請以這個地區(西門町)附近搜尋相關回答。"
    "回答請簡潔講重點即可。"
)

# ---------------- 相依套件 ----------------
from flask import Flask, request, abort, jsonify, send_from_directory
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import (
    MessageEvent, TextMessage, TextSendMessage, FollowEvent, PostbackEvent,
    FlexSendMessage
)

# ---------------- 日誌 ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hotelbot")

# ---------------- 小工具 ----------------
def utcnow() -> datetime.datetime:
    return datetime.datetime.utcnow()

def jdump(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False)

def ensure_dirs():
    os.makedirs(ASSET_LOCAL_DIR, exist_ok=True)

def _hostname_from_public_base() -> str:
    try:
        host = urlparse(PUBLIC_BASE).hostname or "localhost"
        return host
    except Exception:
        return "localhost"

# ---------------- 迷你靜態圖伺服（Flask）: http://<host>:8081/uploads/<file> ----------------
static_app = Flask("static_server")

@static_app.route("/uploads/<path:filename>")
def serve_file(filename):
    return send_from_directory(ASSET_LOCAL_DIR, filename)

def start_static_server():
    ensure_dirs()
    static_app.run(host=STATIC_HOST, port=STATIC_PORT, debug=False, use_reloader=False)

# ---------------- 主 Flask app ----------------
app = Flask(__name__)

# ---------------- Bot 主類別 ----------------
class HotelBot:
    PRICE_TABLE = {
        "標準雙人房": 2800, "豪華雙人房": 3500, "家庭四人房": 4800, "行政套房": 6800,
    }
    PRICE_UNIT  = "TWD/晚"
    PRICE_NOTES = "以上價格含稅含早餐；週六與連假 +500/晚；7–8 月旺季 +300/晚。以官網與現場公告為準。"
    BOOK_URL    = "https://your-hotel.com/booking"
    AMENITIES = [
        "免費 Wi-Fi（全館）","24 小時櫃檯與行李寄放","B2–B4 住客免費停車（車高 ≤ 2.0 m）",
        "健身房 06:00–22:00（3F）","自助洗衣 24H（B1，投幣式）","商務中心 08:00–22:00（2F）",
        "無障礙客房 2 間（需預約）","溫水游泳池 06:00–22:00（10F）",
    ]
    PRICE_TRIGGERS   = ["房價","價格","費用","每晚","price","rate","價目","優惠","折扣"]
    AMENITY_TRIGGERS = ["設施","設備","amenities","有哪些設備","有什麼設施","游泳池","健身房","停車"]

    _data_uri_re = re.compile(r"^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$")

    def __init__(self):
        if not LINE_CHANNEL_ACCESS_TOKEN or not LINE_CHANNEL_SECRET:
            raise RuntimeError("請在 .env 設定 LINE_CHANNEL_ACCESS_TOKEN 與 LINE_CHANNEL_SECRET")

        self.line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)
        self.handler = WebhookHandler(LINE_CHANNEL_SECRET)

        # OpenAI（可空）
        self.oai = None
        if OPENAI_API_KEY and OpenAI:
            try:
                self.oai = OpenAI(api_key=OPENAI_API_KEY)
            except Exception as e:
                logger.warning("OpenAI init failed: %s", e)

        # DB
        self.engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600, future=True)

        # 對話記憶（只影響 LLM；完整訊息照樣寫 DB）
        self.memory = defaultdict(lambda: deque(maxlen=MEMORY_TURNS * 2))

        # 綁定 handler
        self._bind_handlers()

    # ---------- DB helpers ----------
    def _table_has(self, table: str, col: str) -> bool:
        with self.engine.begin() as conn:
            r = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA=:db AND TABLE_NAME=:t AND COLUMN_NAME=:c
            """), {"db": MYSQL_DB, "t": table, "c": col}).scalar()
        return bool(r)

    def _col_required(self, table: str, col: str) -> bool:
        with self.engine.begin() as conn:
            r = conn.execute(text("""
                SELECT IS_NULLABLE, COLUMN_DEFAULT
                  FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA=:db AND TABLE_NAME=:t AND COLUMN_NAME=:c
            """), {"db": MYSQL_DB, "t": table, "c": col}).mappings().first()
        if not r: return False
        return (r["IS_NULLABLE"] == "NO" and r["COLUMN_DEFAULT"] is None)

    def _fetchall(self, sql: str, params: dict = None):
        with self.engine.begin() as conn:
            return conn.execute(text(sql), params or {}).mappings().all()

    def _fetchone(self, sql: str, params: dict = None):
        with self.engine.begin() as conn:
            return conn.execute(text(sql), params or {}).mappings().first()

    def _execute(self, sql: str, params: dict = None):
        with self.engine.begin() as conn:
            conn.execute(text(sql), params or {})

    # ---------- members / messages ----------
    def upsert_member(self, line_uid: str, display_name: Optional[str] = None,
                      picture_url: Optional[str] = None,
                      gender: Optional[str] = None,
                      birthday_date: Optional[str] = None,
                      email: Optional[str] = None,
                      phone: Optional[str] = None) -> int:
        fields, ph, p = ["line_uid"], [":uid"], {"uid": line_uid}
        def add(col, key, val):
            if self._table_has("members", col) and val is not None:
                fields.append(col); ph.append(f":{key}"); p[key] = val
        add("line_display_name","dn",display_name)
        add("line_picture_url","pu",picture_url)
        add("gender","g",gender)
        add("birthday","bd",birthday_date)
        add("email","em",email)
        add("phone","phn",phone)
        add("source","src","LINE")

        if self._col_required("members","created_at"):
            fields.append("created_at"); ph.append(":cat"); p["cat"]=utcnow()
        if self._table_has("members","updated_at"):
            fields.append("updated_at"); ph.append(":uat"); p["uat"]=utcnow()

        set_parts=[]
        for k in ("line_display_name","line_picture_url","gender","birthday","email","phone","source"):
            if self._table_has("members",k):
                set_parts.append(f"{k}=VALUES({k})")
        if self._table_has("members","updated_at"):
            set_parts.append("updated_at=VALUES(updated_at)")
        if self._table_has("members","last_interaction_at"):
            set_parts.append("last_interaction_at=NOW()")

        sql = f"INSERT INTO members ({', '.join(fields)}) VALUES ({', '.join(ph)}) " \
              f"ON DUPLICATE KEY UPDATE {', '.join(set_parts)}"
        with self.engine.begin() as conn:
            conn.execute(text(sql), p)
            mid = conn.execute(text("SELECT id FROM members WHERE line_uid=:u"), {"u": line_uid}).scalar()
        return int(mid)

    def insert_message(self, member_id: int, direction: str, message_type: str, content_obj: Any,
                       campaign_id: Optional[int] = None, sender_type: Optional[str] = None):
        fields = ["member_id","direction","message_type","content"]
        ph = [":mid",":dir",":mt",":ct"]
        p = {"mid": member_id, "dir": direction, "mt": message_type, "ct": jdump(content_obj)}
        if self._table_has("messages","campaign_id") and campaign_id is not None:
            fields.append("campaign_id"); ph.append(":cid"); p["cid"] = campaign_id
        if self._table_has("messages","sender_type") and sender_type:
            fields.append("sender_type"); ph.append(":st"); p["st"] = sender_type
        if self._col_required("messages","created_at"):
            fields.append("created_at"); ph.append(":cat"); p["cat"] = utcnow()
        with self.engine.begin() as conn:
            conn.execute(text(f"INSERT INTO messages ({', '.join(fields)}) VALUES ({', '.join(ph)})"), p)

    # ---------- Base64 圖片 ----------
    _data_uri_re = re.compile(r"^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$")

    def _save_base64_image(self, base64_str: str) -> Tuple[str, str]:
        """
        Decode base64 (data URI or raw) and save to ASSET_LOCAL_DIR.
        Returns (public_url, filename)
        """
        s = base64_str.strip()
        m = self._data_uri_re.match(s)
        if m:
            mime, b64 = m.group(1), m.group(2)
            ext = {"image/jpeg":"jpg","image/jpg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"}.get(mime, "png")
        else:
            b64 = s
            ext = "png"

        try:
            raw = base64.b64decode(b64, validate=True)
        except Exception:
            raw = base64.b64decode(b64 + "===")

        ensure_dirs()
        h = hashlib.sha256(raw).hexdigest()[:24]
        filename = f"{h}.{ext}"
        abs_path = os.path.join(ASSET_LOCAL_DIR, filename)
        with open(abs_path, "wb") as f:
            f.write(raw)

        # 圖片對外 URL：預設用 http://<PUBLIC_BASE host>:8081/uploads/<file>
        host = _hostname_from_public_base()
        public_url = f"http://{host}:{STATIC_PORT}/uploads/{filename}"
        return public_url, filename

    def _image_url_from_item(self, item: dict) -> Optional[str]:
        if item.get("image_base64"):
            url, _ = self._save_base64_image(item["image_base64"])
            return url
        path = item.get("image_path")
        if not path:
            return None
        if path.startswith("http"):
            return path
        # 後端給 /uploads/xxx.jpg → 用 PUBLIC_BASE 拼
        return f"{PUBLIC_BASE.rstrip('/')}{path}"

    # ---------- Flex builders ----------
    def _bubble_image_click(self, title: str, desc: str, image_url: Optional[str], uri: Optional[str]) -> dict:
        hero = {"type": "image", "url": image_url or "https://dummyimage.com/1200x800/eeeeee/333333&text= ", "size": "full", "aspectMode": "cover"}
        if uri: hero["action"] = {"type":"uri","uri":uri}
        return {
            "type":"bubble",
            "hero": hero,
            "body":{"type":"box","layout":"vertical","contents":[
                {"type":"text","text":title or "", "weight":"bold","wrap":True},
                {"type":"text","text":desc or "", "wrap":True, "size":"sm","color":"#666666"}
            ]}
        }

    def _bubble_image_card(self, item: dict, uri: Optional[str]) -> dict:
        image_url = self._image_url_from_item(item)
        body = []
        if item.get("title"):
            body.append({"type":"text","text":str(item["title"]), "weight":"bold","size":"lg","wrap":True})
        if item.get("description"):
            body.append({"type":"text","text":str(item["description"]), "wrap":True, "margin":"sm"})
        if item.get("price") is not None:
            body.append({"type":"text","text":f"$ {item['price']}", "weight":"bold","margin":"sm"})
        bubble = {
            "type":"bubble",
            "hero":{"type":"image","url":image_url or "https://dummyimage.com/1200x800/eeeeee/333333&text= ", "size":"full","aspectMode":"cover"},
            "body":{"type":"box","layout":"vertical","spacing":"sm","contents": body or [{"type":"text","text":" "}]}
        }
        if uri:
            bubble["footer"] = {"type":"box","layout":"vertical","spacing":"sm","contents":[
                {"type":"button","style":"primary","action":{"type":"uri","label": item.get("action_button_text") or "詳情","uri":uri}}
            ]}
        return bubble

    def _build_flex_from_campaign(self, payload: dict, campaign_id: int, line_uid: str) -> List[FlexSendMessage]:
        ttype = (payload.get("template_type") or "").lower()
        title = payload.get("title") or payload.get("name") or "活動通知"
        preview_text = payload.get("preview_text")
        messages = []

        # 準備 items
        if payload.get("carousel_items"):
            items = sorted(payload["carousel_items"], key=lambda x: x.get("sort_order") or 0)
        else:
            items = [{
                "image_base64": payload.get("image_base64"),
                "image_path": payload.get("image_path"),
                "title": payload.get("title"),
                "description": payload.get("notification_text"),
                "price": payload.get("price"),
                "action_url": payload.get("url"),
                "interaction_tag": payload.get("interaction_tag"),
                "action_button_enabled": True if (payload.get("interaction_type") or "").lower() == "open_url" else False,
                "action_button_text": payload.get("action_button_text") or "查看詳情",
                "action_button_interaction_type": payload.get("interaction_type") or "open_url",
                "sort_order": 0
            }]

        def tracked_uri(item) -> Optional[str]:
            btn_enabled = item.get("action_button_enabled")
            btn_type = (item.get("action_button_interaction_type") or "").lower()
            target_url = item.get("action_url")
            if btn_enabled and btn_type == "open_url" and target_url:
                return target_url   # 你若要走 /api/track 再自行換
            return None

        bubbles=[]
        for it in items:
            uri = tracked_uri(it)
            if ttype in ("image_click", "carousel") or not ttype:
                bubbles.append(self._bubble_image_click(it.get("title") or title, it.get("description") or "", self._image_url_from_item(it), uri))
            elif ttype == "image_card":
                bubbles.append(self._bubble_image_card(it, uri))
            elif ttype == "text_button":
                txt = payload.get("notification_text") or it.get("description") or title
                act_type = (it.get("action_button_interaction_type") or "").lower()
                bubble = {
                    "type":"bubble",
                    "body":{"type":"box","layout":"vertical","contents":[{"type":"text","text":txt,"wrap":True}]}
                }
                if it.get("action_button_enabled"):
                    action = {"type":"uri","label": it.get("action_button_text") or "前往", "uri": uri} if (act_type=="open_url" and uri) \
                             else {"type":"postback","label": it.get("action_button_text") or "選擇", "data": f"tag={it.get('interaction_tag','yes')}"}
                    bubble["footer"] = {"type":"box","layout":"vertical","contents":[{"type":"button","style":"primary","action":action}]}
                bubbles.append(bubble)
            else:
                bubbles.append(self._bubble_image_card(it, uri))

        flex = {
            "type": "carousel" if len(bubbles) > 1 or ttype == "carousel" else "bubble",
            "contents": bubbles if (len(bubbles) > 1 or ttype == "carousel") else bubbles[0]
        }

        if preview_text:
            messages.append(TextSendMessage(text=preview_text))
        messages.append(FlexSendMessage(alt_text=title, contents=flex))
        return messages

    # ---------- Campaign ----------
    def _create_campaign_row(self, payload: dict) -> int:
        with self.engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO campaigns
                    (title, template_id, target_audience, trigger_condition,
                     interaction_tag, scheduled_at, sent_at, status,
                     sent_count, opened_count, clicked_count, created_at, updated_at)
                VALUES
                    (:title, :tid, :aud, NULL, :itag, :sat, :now, :status, 0, 0, 0, :now, :now)
            """), {
                "title": payload.get("title") or payload.get("name") or "未命名活動",
                "tid": payload.get("template_id"),
                "aud": payload.get("target_audience") or "all",
                "itag": payload.get("interaction_tag"),
                "sat": utcnow(),
                "now": utcnow(),
                "status": "sent" if (payload.get("schedule_type") or "immediate")=="immediate" else "scheduled",
            })
            rid = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        return int(rid)

    def _select_all_recipients(self) -> Dict[str,int]:
        rs = self._fetchall("SELECT id, line_uid FROM members WHERE line_uid IS NOT NULL AND line_uid<>''")
        return {r["line_uid"]: r["id"] for r in rs}

    def _add_campaign_recipients(self, campaign_id: int, mids: List[int]):
        if not mids: return
        with self.engine.begin() as conn:
            for mid in mids:
                conn.execute(text("""
                    INSERT INTO campaign_recipients (campaign_id, member_id, sent_at, status, created_at, updated_at)
                    VALUES (:cid,:mid,:now,'sent',:now,:now)
                """), {"cid": campaign_id, "mid": mid, "now": utcnow()})
            conn.execute(text("UPDATE campaigns SET sent_count = sent_count + :n WHERE id=:cid"),
                         {"n": len(mids), "cid": campaign_id})

    def push_campaign(self, payload: dict) -> Dict[str, Any]:
        cid = self._create_campaign_row(payload)
        recipients = self._select_all_recipients()
        if not recipients:
            return {"ok": False, "campaign_id": cid, "sent": 0, "error": "no recipients"}

        # 建立互動標籤（若有）
        itag = (payload.get("interaction_tag") or "").strip()
        if itag and self._table_has("interaction_tags","name"):
            with self.engine.begin() as conn:
                conn.execute(text("""
                    INSERT INTO interaction_tags (name, type, campaign_id, description, trigger_count, created_at, updated_at)
                    VALUES (:n,'interaction',:cid,NULL,0,:now,:now)
                    ON DUPLICATE KEY UPDATE campaign_id=VALUES(campaign_id), updated_at=VALUES(updated_at)
                """), {"n": itag, "cid": cid, "now": utcnow()})

        sent = 0
        for uid, mid in recipients.items():
            try:
                msgs = self._build_flex_from_campaign(payload, cid, uid)
                self.line_bot_api.push_message(uid, msgs)
                sent += 1
                self.insert_message(mid, "outgoing", "campaign", {"campaign_id": cid, "payload": payload}, campaign_id=cid)
            except Exception as e:
                logger.exception(f"[push campaign] uid={uid} failed: {e}")

        self._add_campaign_recipients(cid, list(recipients.values()))
        return {"ok": True, "campaign_id": cid, "sent": sent}

    # ---------- 問卷（只做 inline 逐題；不使用外部表單） ----------
    def _create_survey_template_and_questions(self, payload: dict) -> int:
        # survey_templates + survey_questions
        with self.engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO survey_templates
                    (name, description, created_at, updated_at)
                VALUES (:n, :d, :now, :now)
            """), {
                "n": payload.get("name") or "未命名問卷",
                "d": payload.get("description"),
                "now": utcnow()
            })
            tid = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()

            order_items = sorted(payload.get("questions", []), key=lambda x: x.get("order") or 0)
            for q in order_items:
                conn.execute(text("""
                    INSERT INTO survey_questions
                        (template_id, question_type, question_text, options_json, is_required, display_order, created_at, updated_at)
                    VALUES
                        (:tid, :qt, :qx, :opt, :req, :ord, :now, :now)
                """), {
                    "tid": tid,
                    "qt": q.get("question_type"),
                    "qx": q.get("question_text"),
                    "opt": jdump(q.get("options") or []),
                    "req": 1 if q.get("is_required") else 0,
                    "ord": q.get("order") or 0,
                    "now": utcnow()
                })
        return int(tid)

    def _create_survey_row(self, template_id: int, audience: str) -> int:
        with self.engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO surveys
                    (template_id, target_audience, status, created_at, updated_at)
                VALUES (:tid, :aud, 'sent', :now, :now)
            """), {"tid": template_id, "aud": audience, "now": utcnow()})
            sid = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        return int(sid)

    def _get_questions_by_template(self, template_id: int) -> List[dict]:
        return self._fetchall("""
            SELECT id, question_type, question_text, options_json, is_required, display_order
            FROM survey_questions
            WHERE template_id=:tid
            ORDER BY display_order ASC, id ASC
        """, {"tid": template_id})

    def _push_question(self, uid: str, q: dict):
        qtype = (q["question_type"] or "").lower()
        text = q["question_text"] or "請作答"

        # 簡化：全部用純文字訊息詢問（LINE Flex/QuickReply 可再擴充）
        self.line_bot_api.push_message(uid, TextSendMessage(text=text))

    def _save_response(self, survey_id: int, member_id: int, question_id: int, answer: str):
        with self.engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO survey_responses
                    (survey_id, member_id, question_id, answer_text, created_at, updated_at)
                VALUES
                    (:sid, :mid, :qid, :ans, :now, :now)
            """), {"sid": survey_id, "mid": member_id, "qid": question_id, "ans": answer, "now": utcnow()})

    def create_and_send_survey_inline(self, payload: dict) -> Dict[str, Any]:
        # 建模板 + 題目
        tid = self._create_survey_template_and_questions(payload)
        # 建 survey
        sid = self._create_survey_row(tid, payload.get("target_audience") or "all")

        # 對象（簡化：all）
        recipients = self._select_all_recipients()
        qs = self._get_questions_by_template(tid)

        for uid, mid in recipients.items():
            try:
                self.line_bot_api.push_message(uid, TextSendMessage(text=f"📋 {payload.get('name') or '問卷'}"))
                for q in qs:
                    self._push_question(uid, q)
                # 提示：請逐題回覆（此示範未做狀態機；你可自行以 messages 表記錄進度）
                self.insert_message(mid, "outgoing", "survey", {"survey_id": sid, "template_id": tid})
            except Exception as e:
                logger.exception(f"[survey push] uid={uid} failed: {e}")

        return {"ok": True, "survey_id": sid, "template_id": tid, "questions": len(qs)}

    # ---------- Chatbot ----------
    def _ask_gpt(self, messages):
        if not self.oai:
            return "（目前無法連線語言模型，請稍後再試或改用電話服務：07-xxx-xxxx）"
        try:
            resp = self.oai.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.6,
                max_tokens=500,
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception as e:
            return f"（抱歉，系統忙線中）\nError: {e}"

    def _build_messages(self, user_key: str, user_text: str):
        msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
        for role, content in self.memory[user_key]:
            msgs.append({"role": role, "content": content})
        msgs.append({"role": "user", "content": user_text})
        return msgs

    # ---------- 標籤追蹤 ----------
    def track_user_interaction(self, member_id: int, tag_name: str, campaign_id: int = 0, src: str = "postback"):
        with self.engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO tag_trigger_logs
                    (member_id, tag_id, campaign_id, trigger_source, triggered_at, created_at, updated_at)
                VALUES
                    (:mid, NULL, :cid, :src, :now, :now, :now)
            """), {"mid": member_id, "cid": campaign_id, "src": src, "now": utcnow()})

    # ---------- LINE 事件綁定 ----------
    def _bind_handlers(self):
        @self.handler.add(FollowEvent)
        def on_follow(event: FollowEvent):
            uid = event.source.user_id
            try:
                prof = self.line_bot_api.get_profile(uid)
                mid = self.upsert_member(uid, prof.display_name, prof.picture_url)
                self.insert_message(mid, "incoming", "follow", {"text": "follow"})
                self.line_bot_api.reply_message(event.reply_token, TextSendMessage(text="歡迎光臨思偉達飯店，很高興為您服務！"))
            except Exception as e:
                logger.exception(e)

        @self.handler.add(PostbackEvent)
        def on_postback(event: PostbackEvent):
            uid = event.source.user_id
            data = event.postback.data or ""
            params = {}
            for kv in data.split("&"):
                if "=" in kv:
                    k, v = kv.split("=", 1); params[k] = v
            try:
                prof = self.line_bot_api.get_profile(uid)
                mid = self.upsert_member(uid, prof.display_name, prof.picture_url)
                self.insert_message(mid, "incoming", "postback", {"data": data})
                tag = params.get("tag")
                if tag:
                    self.track_user_interaction(mid, tag, 0, "postback")
                self.line_bot_api.reply_message(event.reply_token, TextSendMessage(text="已收到您的選擇"))
            except Exception as e:
                logger.exception(e)

        @self.handler.add(MessageEvent, message=TextMessage)
        def on_text(event: MessageEvent):
            uid = event.source.user_id
            text_in = (event.message.text or "").strip()
            try:
                prof = self.line_bot_api.get_profile(uid)
                mid = self.upsert_member(uid, prof.display_name, prof.picture_url)
                self.insert_message(mid, "incoming", "text", {"text": text_in})

                # 簡單 FAQ
                if any(k in text_in for k in self.PRICE_TRIGGERS):
                    reply = "💰 房價\n" + "\n".join([f"• {r}：{p:,} {self.PRICE_UNIT}" for r,p in self.PRICE_TABLE.items()]) \
                            + f"\n\n🔗 預約：{self.BOOK_URL}\n\n※ {self.PRICE_NOTES}"
                    self.line_bot_api.reply_message(event.reply_token, TextSendMessage(text=reply))
                    self.insert_message(mid, "outgoing", "text", {"text": reply})
                    return
                if any(k in text_in for k in self.AMENITY_TRIGGERS):
                    reply = "🏨 飯店設施\n" + "\n".join([f"• {x}" for x in self.AMENITIES])
                    self.line_bot_api.reply_message(event.reply_token, TextSendMessage(text=reply))
                    self.insert_message(mid, "outgoing", "text", {"text": reply})
                    return

                # 其他 → GPT
                msgs = self._build_messages(uid, text_in)
                ans = self._ask_gpt(msgs)
                self.memory[uid].append(("user", text_in))
                self.memory[uid].append(("assistant", ans))
                self.line_bot_api.reply_message(event.reply_token, TextSendMessage(text=ans[:5000]))
                self.insert_message(mid, "outgoing", "text", {"text": ans})
            except Exception as e:
                logger.exception(e)

    # ---------- 對外函式（給你後端直接呼叫也行） ----------
    def send_campaign(self, payload: dict) -> Dict[str, Any]:
        """後端直接呼叫：HotelBot().send_campaign(payload)"""
        return self.push_campaign(payload)

    def send_survey_inline(self, payload: dict) -> Dict[str, Any]:
        """後端直接呼叫：HotelBot().send_survey_inline(payload)"""
        return self.create_and_send_survey_inline(payload)

# ---------------- Flask 路由 ----------------
bot = HotelBot()

@app.get("/")
def health():
    return "OK", 200

@app.post("/callback")
def callback():
    signature = request.headers.get("X-Line-Signature", "")
    body = request.get_data(as_text=True)
    try:
        bot.handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)
    return "OK"

# ---------------- 啟動 ----------------
if __name__ == "__main__":
    # 背景啟動靜態圖伺服（8081）
    Thread(target=start_static_server, daemon=True).start()
    # 主 Flask（3001）
    app.run(host="0.0.0.0", port=3001, debug=True)
