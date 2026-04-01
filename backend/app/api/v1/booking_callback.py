"""
外部訂房系統付款完成 Callback API

閎運付款完成後打此端點 → 查 LINE 會員 → 發送訂房確認 Flex Message
"""
import logging
from datetime import datetime, date
from typing import List, Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

import httpx

from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

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
