# app.py — LINE Bot + LIFF 後端（MySQL：只寫 members / messages；忽略 campaign_events）
# - members：使用 birthday (DATE)；不可改 schema 的情況下自動補 created_at / updated_at
# - messages：寫入 incoming/outgoing/profile/event(不使用)；同樣自動補 created_at
# - /api/track 與 /api/track-liff-open：僅做追蹤轉跳/回應，不寫 DB（依你的 B 選項）

import os
import json
import datetime
import urllib.parse
from collections import defaultdict, deque

from dotenv import load_dotenv
from flask import Flask, request, abort, jsonify, render_template_string, redirect

# LINE SDK
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage, FollowEvent, PostbackEvent

# OpenAI
from openai import OpenAI

# SQLAlchemy Core（走方言 mysql+pymysql，盡量 schema 無感）
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# ----------------------------
# 環境變數
# ----------------------------
load_dotenv()

LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET")
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

PUBLIC_BASE = (os.getenv("PUBLIC_BASE") or "").rstrip("/")
LIFF_ID_FORM = os.getenv("LIFF_ID", "").strip()      # 表單 LIFF
LIFF_ID_OPEN = os.getenv("LIFF_ID_OPEN", "").strip() # 追蹤 LIFF（本版不寫 DB）

# DB 連線（你提供的預設，可用環境變數覆蓋）
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASS = os.getenv("MYSQL_PASS", "123456")
MYSQL_HOST = os.getenv("MYSQL_HOST", "192.168.50.123")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DB   = os.getenv("MYSQL_DB", "lili_hotel")

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASS}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"

MEMORY_TURNS = int(os.getenv("MEMORY_TURNS", "3"))
PROMPT_FILE = os.getenv("PROMPT_FILE", "").strip()
SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT",
    "你是思偉達飯店的智能管家，只會回答所有飯店相關的訊息，請用專業且親切的語氣回復。"
    "請務必只回答有關思偉達飯店的相關問題，例如房價、優惠、設施、服務，附近周遭景點、餐廳、或服務也算相關問題，其他延伸或無關的問題一律用婉拒方式A處理。"
    "請判斷使用者問題是否超出一個飯店管家接待客服能回答的問題，即便對方加上特定關鍵字如思偉達飯店、房價、設施、優惠之類的，如果判斷問題非一般接待員能回的問題，請用婉拒方式A回答，婉拒方式A:很抱歉，我無法回答您這個問題，歡迎致電讓我們為您服務：電話：07-xxx-xxxx。"
    "飯店地址為台北市中正區博愛路80號，如果使用者詢問附近景點或餐廳或相關問題，請以這個地區(西門町)附近搜尋相關回答。"
    "回答請簡潔講重點即可。"
)

# ----------------------------
# 必要檢查
# ----------------------------
if not LINE_CHANNEL_SECRET or not LINE_CHANNEL_ACCESS_TOKEN:
    raise RuntimeError("請在 .env 設定 LINE_CHANNEL_SECRET 與 LINE_CHANNEL_ACCESS_TOKEN")
if not OPENAI_API_KEY:
    raise RuntimeError("請在 .env 設定 OPENAI_API_KEY")
if not PUBLIC_BASE:
    raise RuntimeError("請在 .env 設定 PUBLIC_BASE（例如 https://linebot.star-bit.io）")
if not LIFF_ID_FORM:
    raise RuntimeError("請在 .env 設定 LIFF_ID（表單用 LIFF）")
if not LIFF_ID_OPEN:
    raise RuntimeError("請在 .env 設定 LIFF_ID_OPEN（追蹤用 LIFF）")

# ----------------------------
# 初始化
# ----------------------------
app = Flask(__name__)
line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)
oai = OpenAI(api_key=OPENAI_API_KEY)

engine: Engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    future=True,
)

def utcnow():
    return datetime.datetime.utcnow()

# ----------------------------
# DB helper（不動 schema、自動補必要欄位）
# ----------------------------
def _col_meta(table: str, col: str):
    """回傳欄位是否必填且無預設值（避免 NOT NULL 無 default）"""
    with engine.begin() as conn:
        r = conn.execute(text("""
            SELECT IS_NULLABLE, COLUMN_DEFAULT
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA=:db AND TABLE_NAME=:t AND COLUMN_NAME=:c
        """), {"db": MYSQL_DB, "t": table, "c": col}).mappings().first()
    if not r:
        return {"required": False}
    return {
        "required": (r["IS_NULLABLE"] == "NO" and r["COLUMN_DEFAULT"] is None)
    }

def _table_has_col(table: str, col: str) -> bool:
    with engine.begin() as conn:
        r = conn.execute(text("""
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA=:db AND TABLE_NAME=:t AND COLUMN_NAME=:c
        """), {"db": MYSQL_DB, "t": table, "c": col}).scalar()
    return bool(r)

def upsert_member(line_uid: str, display_name: str | None = None,
                  gender: str | None = None, birthday_date: str | None = None) -> int:
    """
    INSERT ... ON DUPLICATE KEY UPDATE
    - 只寫 members 有的欄位
    - created_at / updated_at 必要時補上（UTC）
    回傳 member_id
    """
    fields = ["line_uid"]
    ph = [":uid"]
    params = {"uid": line_uid}

    if _table_has_col("members", "line_display_name") and display_name:
        fields += ["line_display_name"]; ph += [":dn"]; params["dn"] = display_name
    if _table_has_col("members", "gender") and gender:
        fields += ["gender"]; ph += [":g"]; params["g"] = gender
    if _table_has_col("members", "birthday") and birthday_date:
        fields += ["birthday"]; ph += [":bd"]; params["bd"] = birthday_date
    if _table_has_col("members", "source"):
        fields += ["source"]; ph += [":src"]; params["src"] = "LINE"

    if _col_meta("members", "created_at")["required"]:
        fields += ["created_at"]; ph += [":cat"]; params["cat"] = utcnow()
    if _table_has_col("members", "updated_at"):
        # 即使允許 NULL，也盡量更新 updated_at
        fields += ["updated_at"]; ph += [":uat"]; params["uat"] = utcnow()

    # 生成 ON DUPLICATE KEY UPDATE 片段（只更新安全欄位）
    set_parts = []
    for k in ("line_display_name", "gender", "birthday", "source"):
        if _table_has_col("members", k):
            set_parts.append(f"{k}=VALUES({k})")
    if _table_has_col("members", "updated_at"):
        set_parts.append("updated_at=VALUES(updated_at)")
    if _table_has_col("members", "last_interaction_at"):
        # 初次 upsert 也順帶更新互動時間
        set_parts.append("last_interaction_at=NOW()")

    sql = text(f"""
        INSERT INTO members ({', '.join(fields)})
        VALUES ({', '.join(ph)})
        ON DUPLICATE KEY UPDATE {', '.join(set_parts)};
    """)
    with engine.begin() as conn:
        conn.execute(sql, params)
        member_id = conn.execute(text("SELECT id FROM members WHERE line_uid=:u"),
                                 {"u": line_uid}).scalar()
    return int(member_id)

def update_member_profile(line_uid: str, gender: str | None, birth_year: int | None, area: str | None = None):
    """
    從 LIFF 表單而來：只有 birthday（用年份→YYYY-01-01）。DB 沒有 area，所以忽略。
    """
    birthday_date = None
    if birth_year:
        try:
            y = int(birth_year)
            # 只有年 → 存 1/1；若未來你改表單輸入完整年月日，可直接改這行
            birthday_date = f"{y:04d}-01-01"
        except Exception:
            birthday_date = None

    # upsert + 更新 last_interaction_at
    member_id = upsert_member(line_uid, None, gender, birthday_date)
    with engine.begin() as conn:
        sets = []
        p = {"id": member_id}
        if _table_has_col("members", "last_interaction_at"):
            sets.append("last_interaction_at=NOW()")
        if _table_has_col("members", "updated_at"):
            sets.append("updated_at=NOW()")
        if sets:
            conn.execute(text(f"UPDATE members SET {', '.join(sets)} WHERE id=:id"), p)
    return member_id

def insert_message_by_uid(line_uid: str, direction: str, message_type: str,
                          content: str, display_name: str | None = None):
    # 先拿 member_id（若不存在會 upsert 一筆只含 line_uid）
    mid = upsert_member(line_uid, display_name, None, None)

    fields = ["member_id", "direction", "message_type", "content"]
    ph = [":mid", ":dir", ":mt", ":ct"]
    params = {"mid": mid, "dir": direction, "mt": message_type, "ct": content}

    if _table_has_col("messages", "display_name") and display_name:
        fields.append("display_name"); ph.append(":dn"); params["dn"] = display_name
    if _col_meta("messages", "created_at")["required"]:
        fields.append("created_at"); ph.append(":cat"); params["cat"] = utcnow()

    with engine.begin() as conn:
        conn.execute(text(f"INSERT INTO messages ({', '.join(fields)}) VALUES ({', '.join(ph)})"), params)

# ----------------------------
# 簡易對話記憶 + GPT
# ----------------------------
user_memory = defaultdict(lambda: deque(maxlen=MEMORY_TURNS * 2))

def _load_prompt():
    global SYSTEM_PROMPT
    if PROMPT_FILE and os.path.exists(PROMPT_FILE):
        try:
            with open(PROMPT_FILE, "r", encoding="utf-8") as f:
                SYSTEM_PROMPT = f.read().strip()
        except Exception:
            pass

def _build_messages(user_key: str, user_text: str):
    _load_prompt()
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    for role, content in user_memory[user_key]:
        msgs.append({"role": role, "content": content})
    msgs.append({"role": "user", "content": user_text})
    return msgs

def _ask_gpt(messages):
    try:
        resp = oai.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=0.6,
            max_tokens=500,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"（抱歉，目前服務忙線中，請稍後再試）\n\nError: {e}"

# ----------------------------
# FAQ 與判斷
# ----------------------------
FAQ = {
    "聯絡資訊": "☎️ 電話：07-xxx-xxxx｜Email：hotel@example.com｜櫃檯 24 小時服務",
    "住宿": "🏨 入住 15:00、退房 11:00。可行李寄放／嬰兒床／加床（需預約）。\n🔗 預約：https://your-hotel.com/booking",
    "餐飲": "🍽 早餐 06:30–10:00（2F 自助），晚餐 17:30–21:30，提供素食（請提前告知）。",
    "停車場": "🅿️ 住客免費，B2–B4，高度限 2.0m，電動車位 12 格（需登記）。",
}
PRICE_TABLE = {
    "標準雙人房": 2800, "豪華雙人房": 3500, "家庭四人房": 4800, "行政套房": 6800,
}
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

# ----------------------------
# LIFF：表單（使用 birthday）
# ----------------------------
FORM_HTML = """
<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>完成基本資料</title>
<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:16px;background:#fafafa}
  .card{max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;padding:16px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.06)}
  label{display:block;margin-top:12px}
  input,select{width:100%;padding:10px;border:1px solid #ddd;border-radius:8px}
  button{margin-top:16px;padding:12px 16px;border:0;border-radius:10px;background:#06c755;color:#fff;font-weight:700;width:100%}
  .muted{color:#666;font-size:12px;margin-top:8px}
</style>
</head><body>
<div class="card">
  <h2>完成基本資料</h2>
  <p>填完即可收到個人化服務與優惠。</p>
  <form id="f">
    <input type="hidden" name="lineUserId" id="lineUserId" />
    <label>性別
      <select name="gender" required>
        <option value="">請選擇</option>
        <option value="MALE">男</option>
        <option value="FEMALE">女</option>
        <option value="UNKNOWN">未設定/不透露</option>
      </select>
    </label>
    <label>出生年
      <input type="number" name="birthYear" min="1930" max="2020" required placeholder="例如 1995">
    </label>
    <button type="submit">送出</button>
    <div class="muted">送出代表你同意我們的隱私權政策。</div>
  </form>
</div>
<script>
(async ()=>{
  await liff.init({ liffId: "{{ liff_id_form }}" });
  const ctx = liff.getContext();
  if (!ctx || !ctx.userId) { alert("請從官方帳號聊天室開啟此頁"); return; }
  document.getElementById("lineUserId").value = ctx.userId;

  document.getElementById("f").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/collect-profile", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (j.ok) {
      alert("完成！已更新你的會員資料（生日：" + j.birthday + "）");
      if (liff.isInClient()) liff.closeWindow();
    } else {
      alert("提交失敗："+(j.error||"未知錯誤"));
    }
  });
})();
</script>
</body></html>
"""

@app.get("/liff/profile")
def liff_profile_page():
    return render_template_string(FORM_HTML, liff_id_form=LIFF_ID_FORM)

# ----------------------------
# LIFF：open（僅傳遞與 redirect；不寫 DB）
# ----------------------------
OPEN_HTML = """
<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>opening…</title>
<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
</head><body style="margin:0;font-family:system-ui,-apple-system,sans-serif">
<div id="msg" style="padding:16px;color:#666">opening…</div>
<script>
(async ()=>{
  try{
    await liff.init({ liffId: "{{ liff_id_open }}" });
    const u   = new URL(location.href);
    const to  = u.searchParams.get("to");
    if (to) { location.replace(to); }
    else if (liff.isInClient()) { liff.closeWindow(); }
    else { document.getElementById("msg").innerText = "已開啟。"; }
  }catch(e){
    document.getElementById("msg").innerText = "初始化失敗："+ e;
  }
})();
</script>
</body></html>
"""

@app.get("/liff/open")
def liff_open_page():
    return render_template_string(OPEN_HTML, liff_id_open=LIFF_ID_OPEN)

# ----------------------------
# API：收表單（寫 members + messages.profile）
# ----------------------------
@app.post("/api/collect-profile")
def api_collect_profile():
    data = request.get_json(force=True)
    line_user_id = (data.get("lineUserId") or "").strip()
    gender = (data.get("gender") or "UNKNOWN").upper()
    birth_year = data.get("birthYear")

    if not line_user_id or not birth_year:
        return jsonify({"ok": False, "error": "MISSING_FIELDS"}), 400

    try:
        by = int(birth_year)
        birthday = f"{by:04d}-01-01"
    except Exception:
        return jsonify({"ok": False, "error": "INVALID_BIRTH_YEAR"}), 400

    # 寫 members
    update_member_profile(line_user_id, gender, by)

    # messages 記一筆 profile JSON
    payload = {"gender": gender, "birthday": birthday}
    try:
        insert_message_by_uid(line_user_id, "incoming", "profile",
                              json.dumps(payload, ensure_ascii=False))
    except Exception:
        pass

    return jsonify({"ok": True, "birthday": birthday})

# ----------------------------
# API：/api/track（僅轉跳，不寫 DB）
# ----------------------------
@app.get("/api/track")
def api_track():
    target = request.args.get("target")
    if not target:
        return "bad request", 400
    return redirect(target, code=302)

# ----------------------------
# API：/api/track-liff-open（不寫 DB）
# ----------------------------
@app.get("/api/track-liff-open")
def api_track_liff_open():
    return jsonify(ok=True)

# ----------------------------
# Webhook
# ----------------------------
@app.route("/callback", methods=["POST"])
def callback():
    signature = request.headers.get("X-Line-Signature", "")
    body = request.get_data(as_text=True)
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
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
def on_follow(event):
    welcome = "歡迎光臨思偉達飯店，很高興為您服務！輸入「會員設定」即可完成基本資料。"
    line_bot_api.reply_message(event.reply_token, TextSendMessage(text=welcome))
    if getattr(event.source, "user_id", None):
        try:
            insert_message_by_uid(event.source.user_id, "outgoing", "text", welcome)
        except Exception:
            pass

@handler.add(PostbackEvent)
def on_postback(event: PostbackEvent):
    user_id = getattr(event.source, "user_id", None)
    data = event.postback.data or ""
    if user_id:
        try:
            insert_message_by_uid(user_id, "incoming", "postback", data)
        except Exception:
            pass

# ---- FAQ / GPT ----
def _is_price_query(t:str)->bool: return any(k in t for k in PRICE_TRIGGERS)
def _is_amenity_query(t:str)->bool: return any(k in t for k in AMENITY_TRIGGERS)

@handler.add(MessageEvent, message=TextMessage)
def on_text_message(event: MessageEvent):
    user_key = _source_key(event.source)
    user_text = event.message.text.strip()

    display_name = None
    if getattr(event.source, "user_id", None):
        try:
            profile = line_bot_api.get_profile(event.source.user_id)
            display_name = profile.display_name
        except Exception:
            pass

    # 記錄 incoming
    if getattr(event.source, "user_id", None):
        try:
            insert_message_by_uid(event.source.user_id, "incoming", "text", user_text, display_name)
        except Exception:
            pass

    # 會員設定入口
    if user_text in ("會員設定", "完成基本資料", "設定", "綁定會員"):
        liff_url = f"https://liff.line.me/{LIFF_ID_FORM}"
        reply = f"請點此完成會員資料設定：{liff_url}"
        line_bot_api.reply_message(event.reply_token, TextSendMessage(text=reply))
        user_memory[user_key].append(("user", user_text))
        user_memory[user_key].append(("assistant", reply))
        if getattr(event.source, "user_id", None):
            try:
                insert_message_by_uid(event.source.user_id, "outgoing", "text", reply, display_name)
            except Exception:
                pass
        return

    # 房價
    if _is_price_query(user_text):
        msg = build_price_text()
        line_bot_api.reply_message(event.reply_token, TextSendMessage(text=msg))
        user_memory[user_key].append(("user", user_text))
        user_memory[user_key].append(("assistant", msg))
        if getattr(event.source, "user_id", None):
            try:
                insert_message_by_uid(event.source.user_id, "outgoing", "text", msg, display_name)
            except Exception:
                pass
        return

    # 設施
    if _is_amenity_query(user_text):
        msg = build_amenities_text()
        line_bot_api.reply_message(event.reply_token, TextSendMessage(text=msg))
        user_memory[user_key].append(("user", user_text))
        user_memory[user_key].append(("assistant", msg))
        if getattr(event.source, "user_id", None):
            try:
                insert_message_by_uid(event.source.user_id, "outgoing", "text", msg, display_name)
            except Exception:
                pass
        return

    # FAQ 精準詞
    if user_text in FAQ:
        reply = FAQ[user_text]
        line_bot_api.reply_message(event.reply_token, TextSendMessage(text=reply))
        user_memory[user_key].append(("user", user_text))
        user_memory[user_key].append(("assistant", reply))
        if getattr(event.source, "user_id", None):
            try:
                insert_message_by_uid(event.source.user_id, "outgoing", "text", reply, display_name)
            except Exception:
                pass
        return

    # 其他 → GPT
    msgs = _build_messages(user_key or "anonymous", user_text)
    answer = _ask_gpt(msgs)
    line_bot_api.reply_message(event.reply_token, TextSendMessage(text=answer[:5000]))
    if getattr(event.source, "user_id", None):
        user_memory[user_key].append(("user", user_text))
        user_memory[user_key].append(("assistant", answer))
        try:
            insert_message_by_uid(event.source.user_id, "outgoing", "text", answer, display_name)
        except Exception:
            pass

# ----------------------------
# Health
# ----------------------------
@app.get("/")
def root_ok():
    return "OK"

# ----------------------------
# Dev run（正式用 gunicorn）
# ----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001, debug=True)
