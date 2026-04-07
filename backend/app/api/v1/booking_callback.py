"""
外部訂房系統付款完成 Callback API

閎運付款完成後打此端點 → 查 LINE 會員 → 發送訂房確認 Flex Message
"""
import logging
from datetime import datetime, date
from typing import List, Optional
from zoneinfo import ZoneInfo

from pathlib import Path

from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

import httpx

from app.config import settings
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends

import secrets
import time

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Booking Token Store (line_uid ↔ token, 1 小時有效, 用完即棄)
# ---------------------------------------------------------------------------
_TOKEN_STORE: dict = {}  # {token: {"line_uid": str, "ts": float}}
_TOKEN_TTL = 3600  # 1 hour


def _generate_booking_token(line_uid: str, booking_data: Optional[dict] = None) -> str:
    """生成短效 token 對應 line_uid + 訂房資料"""
    now = time.time()
    expired = [k for k, v in _TOKEN_STORE.items() if now - v["ts"] > _TOKEN_TTL]
    for k in expired:
        del _TOKEN_STORE[k]

    token = secrets.token_urlsafe(24)
    _TOKEN_STORE[token] = {"line_uid": line_uid, "ts": now, "data": booking_data or {}}
    return token


def _resolve_booking_token(token: str, consume: bool = True) -> Optional[dict]:
    """用 token 取回完整資料 {line_uid, data}。consume=True 時用完即刪"""
    if consume:
        entry = _TOKEN_STORE.pop(token, None)
    else:
        entry = _TOKEN_STORE.get(token)
    if not entry:
        return None
    if time.time() - entry["ts"] > _TOKEN_TTL:
        if token in _TOKEN_STORE:
            del _TOKEN_STORE[token]
        return None
    return entry

# ---------------------------------------------------------------------------
# 房型代碼 → 中文名稱對照表
# ---------------------------------------------------------------------------
ROOMTYPE_NAME = {
    "V7": "琴香古韻", "V6": "天地流動", "V5": "白色戀人",
    "V3": "竹影清境", "V2": "酥金迷霧", "V1": "特色家庭房玻光幻影",
    "WS": "森森系雙人房", "GS": "望空間尊親房", "V8": "銀河星語",
}

# ---------------------------------------------------------------------------
# Request Schema
# ---------------------------------------------------------------------------

class CallbackRoom(BaseModel):
    roomtype: str
    quantity: int = 1

class BookingCallbackRequest(BaseModel):
    order_id: str
    status: str  # "paid"
    name: str
    line_uid: str
    checkindate: str  # YYYY-MM-DD
    rooms: List[CallbackRoom]

# ---------------------------------------------------------------------------
# LINE Push Flex Message
# ---------------------------------------------------------------------------

def _weekday_zh(d: date) -> str:
    """日期 → 中文星期"""
    names = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]
    return names[d.weekday()]


def _build_booking_confirm_flex(data: BookingCallbackRequest) -> dict:
    """根據 callback 資料建構訂房確認 Flex Message"""
    checkin = date.fromisoformat(data.checkindate)
    checkin_str = f"{checkin.year}/{checkin.month}/{checkin.day}, {_weekday_zh(checkin)}"

    # 房型列表
    room_contents = []
    for r in data.rooms:
        room_name = ROOMTYPE_NAME.get(r.roomtype, r.roomtype)
        room_contents.append({
            "type": "text",
            "text": f"．{room_name} x {r.quantity}",
            "size": "sm", "color": "#111111", "wrap": True,
        })

    return {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
            "size": "full", "aspectRatio": "20:13", "aspectMode": "cover",
        },
        "body": {
            "type": "box", "layout": "vertical", "paddingBottom": "xl",
            "contents": [
                {"type": "text", "text": "訂房確認", "weight": "bold", "size": "xl", "margin": "md"},
                {
                    "type": "text", "wrap": True, "size": "md", "margin": "lg",
                    "color": "#444444", "lineSpacing": "4px",
                    "text": f"{data.name}您好，\n您的訂房已完成付款。\n系統已為您保留房源，期待您的光臨。如需取消或更改，請聯絡客服。",
                },
                {
                    "type": "box", "layout": "vertical", "margin": "xxl", "spacing": "sm",
                    "contents": [
                        {"type": "text", "text": "知達飯店", "weight": "bold", "size": "md", "color": "#111111"},
                        # 訂單編號
                        {"type": "box", "layout": "horizontal", "margin": "md", "contents": [
                            {"type": "text", "text": "訂單編號", "size": "sm", "color": "#888888", "flex": 2},
                            {"type": "text", "text": data.order_id, "size": "sm", "color": "#111111", "flex": 4, "weight": "bold"},
                        ]},
                        # 入住日期
                        {"type": "box", "layout": "horizontal", "contents": [
                            {"type": "text", "text": "入住日期", "size": "sm", "color": "#888888", "flex": 2},
                            {"type": "text", "text": checkin_str, "size": "sm", "color": "#111111", "flex": 4},
                        ]},
                        # 最晚進房
                        {"type": "box", "layout": "horizontal", "contents": [
                            {"type": "text", "text": "最晚進房", "size": "sm", "color": "#888888", "flex": 2},
                            {"type": "text", "text": "15:00", "size": "sm", "color": "#111111", "flex": 4},
                        ]},
                        # 入住房型
                        {"type": "box", "layout": "horizontal", "margin": "sm", "contents": [
                            {"type": "text", "text": "入住房型", "size": "sm", "color": "#888888", "flex": 2},
                            {"type": "box", "layout": "vertical", "flex": 4, "spacing": "xs", "contents": room_contents},
                        ]},
                        # 注意事項
                        {"type": "box", "layout": "horizontal", "margin": "sm", "contents": [
                            {"type": "text", "text": "注意事項", "size": "sm", "color": "#888888", "flex": 2},
                            {"type": "text", "text": "如有疑問請聯繫飯店", "size": "sm", "color": "#111111", "flex": 4, "wrap": True},
                        ]},
                    ],
                },
            ],
        },
    }


def _push_line_flex(line_uid: str, flex_dict: dict, alt_text: str = "訂房確認通知") -> bool:
    """用 LINE Push Message API 發送 Flex Message"""
    token = settings.LINE_CHANNEL_ACCESS_TOKEN
    if not token:
        logger.error("[BookingCallback] LINE_CHANNEL_ACCESS_TOKEN not configured")
        return False

    resp = httpx.post(
        "https://api.line.me/v2/bot/message/push",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        json={
            "to": line_uid,
            "messages": [{
                "type": "flex",
                "altText": alt_text,
                "contents": flex_dict,
            }],
        },
        timeout=10,
    )
    if resp.status_code == 200:
        logger.info(f"[BookingCallback] Flex pushed to {line_uid}")
        return True
    else:
        logger.error(f"[BookingCallback] LINE push failed: {resp.status_code} {resp.text[:200]}")
        return False


def _build_booking_failed_flex(data: BookingCallbackRequest) -> dict:
    """付款失敗 Flex Message"""
    return {
        "type": "bubble",
        "body": {
            "type": "box", "layout": "vertical", "paddingAll": "xl",
            "contents": [
                {"type": "text", "text": "⚠ 付款未完成", "weight": "bold", "size": "xl", "color": "#FF3B30"},
                {
                    "type": "text", "wrap": True, "size": "md", "margin": "lg",
                    "color": "#444444", "lineSpacing": "4px",
                    "text": f"{data.name}您好，\n您的訂房付款未完成，訂單已自動取消。\n如需重新訂房，請再次告訴我，我會重新為您查詢房況。",
                },
                {
                    "type": "box", "layout": "vertical", "margin": "xxl", "spacing": "sm",
                    "contents": [
                        {"type": "box", "layout": "horizontal", "contents": [
                            {"type": "text", "text": "訂單編號", "size": "sm", "color": "#888888", "flex": 2},
                            {"type": "text", "text": data.order_id, "size": "sm", "color": "#111111", "flex": 4},
                        ]},
                        {"type": "box", "layout": "horizontal", "contents": [
                            {"type": "text", "text": "狀態", "size": "sm", "color": "#888888", "flex": 2},
                            {"type": "text", "text": "已取消", "size": "sm", "color": "#FF3B30", "flex": 4, "weight": "bold"},
                        ]},
                    ],
                },
            ],
        },
    }


# ---------------------------------------------------------------------------
# Callback Endpoint
# ---------------------------------------------------------------------------

@router.post("/callback")
async def booking_callback(
    data: BookingCallbackRequest,
    api_key: Optional[str] = Header(None, alias="Api-Key"),
):
    """
    閎運付款完成後呼叫此端點。
    1. 驗證 Api-Key
    2. 用 phone 找到 LINE 會員
    3. 發送訂房確認 Flex Message
    4. 更新訂單狀態
    """
    # 1. 驗證 API Key（callback 專用 key，與訂房 API key 分開）
    expected_key = settings.BOOKING_CALLBACK_API_KEY
    if expected_key and api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid Api-Key")

    # 2. 檢查 status
    if data.status not in ("paid", "failed"):
        return {"ok": True, "message": f"status={data.status}, skipped"}

    # 3. 發送 LINE Flex
    line_uid = data.line_uid
    line_sent = False
    if line_uid:
        if data.status == "paid":
            flex_dict = _build_booking_confirm_flex(data)
            alt_text = "訂房確認通知"
        else:
            flex_dict = _build_booking_failed_flex(data)
            alt_text = "付款未完成通知"
        line_sent = _push_line_flex(line_uid, flex_dict, alt_text=alt_text)
    else:
        logger.warning(f"[BookingCallback] No line_uid provided, cannot push")

    logger.info(
        f"[BookingCallback] order_id={data.order_id}, name={data.name}, "
        f"line_uid={line_uid}, line_sent={line_sent}"
    )

    return {
        "ok": True,
        "message": "received",
        "line_sent": line_sent,
        "line_uid": line_uid,
    }


# ---------------------------------------------------------------------------
# Submit Endpoint (LIFF 表單 → 打閎運訂房 API → 回傳付款 URL)
# ---------------------------------------------------------------------------

class SubmitRoom(BaseModel):
    room_type_code: str
    room_count: int = 1
    room_type_name: str = ""

class BookingSubmitRequest(BaseModel):
    token: str  # 短效 token，對應 line_uid
    checkin_date: str
    checkout_date: str
    rooms: List[SubmitRoom]
    name: str
    phone: str
    email: str = ""


class GenerateTokenRequest(BaseModel):
    line_uid: str
    rooms: list = []
    checkin: str = ""
    checkout: str = ""

@router.get("/form")
async def booking_form_page():
    """Serve 訂房表單 HTML"""
    form_path = Path(__file__).resolve().parent.parent.parent.parent / "public" / "uploads" / "booking_form.html"
    if not form_path.exists():
        raise HTTPException(status_code=404, detail="booking form not found")
    return HTMLResponse(content=form_path.read_text(encoding="utf-8"))


@router.post("/generate-token")
async def generate_token(data: GenerateTokenRequest, db: AsyncSession = Depends(get_db)):
    """LINE app 呼叫：為 line_uid 生成短效 booking token，同時存房型資料"""
    if not data.line_uid:
        raise HTTPException(status_code=422, detail="line_uid required")

    # 查會員已存的聯絡資訊，帶入 token 供表單預填
    member_info = {}
    try:
        from app.models.member import Member
        result = await db.execute(select(Member).where(Member.line_uid == data.line_uid))
        member = result.scalar_one_or_none()
        if member:
            member_info = {
                "name": member.name or "",
                "phone": member.phone or "",
                "email": member.email or "",
            }
    except Exception:
        logger.exception("[generate-token] Failed to load member info")

    booking_data = {
        "rooms": data.rooms,
        "checkin": data.checkin,
        "checkout": data.checkout,
        "member": member_info,
    }
    token = _generate_booking_token(data.line_uid, booking_data)
    return {"ok": True, "token": token}

@router.get("/token-data")
async def get_token_data(token: str = ""):
    """表單頁面呼叫：用 token 取回房型資料（不消耗 token）"""
    if not token:
        return {"ok": False, "message": "missing token"}
    entry = _resolve_booking_token(token, consume=False)
    if not entry:
        return {"ok": False, "message": "expired"}
    return {"ok": True, "data": entry["data"]}


@router.post("/submit")
async def booking_submit(data: BookingSubmitRequest):
    """
    訂房表單提交。
    驗證 token → 打閎運訂房 API → 取得付款 URL → 回傳給前端跳轉。
    同時將姓名/電話/email 存到會員資料，下次訂房自動帶入。
    """
    import requests as _requests

    # 用 token 取回 line_uid（consume=True，用完即棄）
    entry = _resolve_booking_token(data.token, consume=True)
    if not entry:
        return {"ok": False, "message": "連結已過期，請重新從 LINE 開啟訂房"}
    line_uid = entry["line_uid"]

    # 存會員聯絡資訊（用 raw SQL 確保寫入）
    try:
        from app.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("UPDATE members SET name=:name, phone=:phone, email=:email WHERE line_uid=:uid"),
                {"name": data.name or None, "phone": data.phone or None, "email": data.email or None, "uid": line_uid},
            )
            await db.commit()
            logger.info(f"[BookingSubmit] raw SQL rowcount={result.rowcount}, line_uid={line_uid}, name={data.name}")
    except Exception:
        logger.exception("[BookingSubmit] Failed to save member info")

    api_url = settings.BOOKING_API_URL
    api_key = settings.BOOKING_API_KEY
    hotel_code = settings.BOOKING_HOTEL_CODE
    hotel_id = settings.BOOKING_HOTEL_ID

    if not api_url or not api_key:
        raise HTTPException(status_code=500, detail="訂房 API 未設定")

    if not data.rooms:
        raise HTTPException(status_code=422, detail="請至少選擇一間房型")
    if not data.name:
        raise HTTPException(status_code=422, detail="請輸入姓名")
    if not data.phone:
        raise HTTPException(status_code=422, detail="請輸入電話")

    payload = {
        "hotel": hotel_code,
        "hid": hotel_id,
        "rooms": [
            {
                "roomtype": r.room_type_code,
                "quantity": max(1, r.room_count),
                "checkindate": data.checkin_date,
                "checkoutdate": data.checkout_date,
            }
            for r in data.rooms
        ],
        "name": data.name,
        "phone": data.phone,
        "email": data.email,
        "comments": f"line_uid:{line_uid}",
    }

    try:
        resp = _requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json", "Api-Key": api_key},
            allow_redirects=False,
            timeout=15,
        )

        if resp.status_code == 302:
            payment_url = resp.headers.get("Location")
            if payment_url:
                logger.info(f"[BookingSubmit] Payment URL: {payment_url}")
                return {"ok": True, "payment_url": payment_url}

        logger.warning(f"[BookingSubmit] Unexpected: {resp.status_code} {resp.text[:200]}")
        return {"ok": False, "message": "訂房系統回應異常，請稍後再試"}

    except Exception as e:
        logger.error(f"[BookingSubmit] Failed: {e}")
        return {"ok": False, "message": "訂房系統連線失敗，請稍後再試"}
