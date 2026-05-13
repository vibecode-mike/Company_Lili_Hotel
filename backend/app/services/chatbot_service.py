"""
Chatbot booking flow service — LLM-driven with PMS tool calling.
Spec: 01/spec/features/website_chatbot_booking.feature
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import date, datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from threading import Lock
from typing import Any, Dict, List, Literal, Optional, Tuple
from uuid import uuid4

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.conversation import ConversationMessage, ConversationThread
from app.models.faq import AiTokenUsage, FaqRule, FaqCategory, FaqRuleTag, Industry
from app.models.member import Member
from app.models.tag import MemberTag, MemberInteractionTag
from sqlalchemy import func as sa_func
from app.schemas.chatbot import (
    BookingContextSchema,
    ChatbotMessageOutSchema,
    ChatbotRoomsOutSchema,
    ConfirmRoomOutSchema,
    MemberFormDefinitionSchema,
    MemberFormFieldSchema,
    ReplyType,
    RoomCardSchema,
    SessionResetOutSchema,
)
from app.services.pms_chatbot_client import (
    build_booking_url,
    pms_enabled,
    query_pms,
    query_pms_all_roomtypes,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# External Booking API (閎運訂房系統)
# ---------------------------------------------------------------------------

def _call_booking_api(
    rooms: List[Dict[str, Any]],
    checkin: str,
    checkout: str,
    name: str,
    phone: str,
    email: str,
    line_uid: str = "",
) -> Optional[str]:
    """呼叫外部訂房 API，回傳付款頁面 URL（從 302 Location header 取得）"""
    import requests as _requests

    api_url = settings.BOOKING_API_URL
    api_key = settings.BOOKING_API_KEY
    hotel_code = settings.BOOKING_HOTEL_CODE
    hotel_id = settings.BOOKING_HOTEL_ID

    if not api_url or not api_key:
        logger.warning("[BookingAPI] BOOKING_API_URL or BOOKING_API_KEY not configured")
        return None

    import uuid as _uuid
    order_id = str(_uuid.uuid4()).replace("-", "")[:20]

    payload = {
        "hotel": hotel_code,
        "hid": hotel_id,
        "order_id": order_id,
        "line_uid": line_uid,
        "rooms": [
            {
                "roomtype": room.get("room_type_code", ""),
                "quantity": max(1, int(room.get("room_count") or 1)),
                "checkindate": checkin,
                "checkoutdate": checkout,
            }
            for room in rooms
        ],
        "name": name,
        "phone": phone,
        "email": email,
        "comments": f"line_uid:{line_uid}" if line_uid else "AI chatbot 訂房",
    }

    resp = _requests.post(
        api_url,
        json=payload,
        headers={"Content-Type": "application/json", "Api-Key": api_key},
        allow_redirects=False,
        timeout=15,
    )

    if resp.status_code == 302:
        location = resp.headers.get("Location")
        if location:
            logger.info(f"[BookingAPI] Got payment URL: {location}")
            return location

    logger.warning(f"[BookingAPI] Unexpected response: {resp.status_code} {resp.text[:200]}")
    return None


# ---------------------------------------------------------------------------
# Static hotel data
# ---------------------------------------------------------------------------

ROOMTYPE_NAME = {
    "V7": "琴香古韻",
    "V6": "天地流動",
    "V5": "白色戀人",
    "V3": "竹影清境",
    "V2": "酥金迷霧",
    "V1": "特色家庭房玻光幻影",
    "WS": "森森系雙人房",
    "GS": "望空間尊親房",
    "V8": "銀河星語",
    "TT": "1元測試房",
    "KK": "KK房",
}

ROOMTYPE_MAX_OCCUPANCY = {
    "V7": 2, "V6": 2, "V5": 2, "V3": 2, "V2": 2,
    "V1": 4, "WS": 2, "GS": 2, "V8": 2,
    "TT": 2, "KK": 2,
}


# 測試房型設定：TEST_ROOM_TT_ENABLED=1 時會補上這些房型的假庫存（remain=010, price=1;）
# 只覆蓋閎運真的開的「1 元測試房」— TT / KK，其他房型完全跟閎運拿真實資料。
# 閎運對 TT / KK 雖然列了代碼，但 availability API data 空的，所以我們補假庫存讓 bot 能顯示。
_TEST_INJECT_ROOMTYPES = ("TT", "KK")


def _inject_tt_test_inventory(raw: Dict[str, Any], startdate: str, enddate: str) -> None:
    """
    測試用：當 settings.TEST_ROOM_TT_ENABLED=1 時，為 raw PMS 回應補上 _TEST_INJECT_ROOMTYPES 的假庫存資料，
    讓聊天機器人房卡可以顯示測試房型。測完把 .env 的 flag 拿掉或改 0 即可恢復正常。
    """
    if settings.TEST_ROOM_TT_ENABLED != "1":
        return
    # 閎運 5 月份會回 {"raw_text": " Session halted."} 沒 room 欄位；
    # 仍強制建出一個 room 列表並注入測試房型
    rooms = raw.get("room")
    if not isinstance(rooms, list):
        rooms = []
        raw["room"] = rooms
    try:
        start_d = date.fromisoformat(startdate)
        end_d = date.fromisoformat(enddate)
    except Exception:
        return
    fake_data = []
    cursor = start_d
    while cursor < end_d:
        fake_data.append({
            "odate": cursor.isoformat(),
            "remain": "010",  # 與閎運實際開的測試房間數對齊，允許加到 10 間
            "price": "1;",
        })
        cursor += timedelta(days=1)

    # 閎運對 TT / KK 的圖片 URL（如 10_101thumb.jpg）實際是 404，
    # 清空讓下游 _enrich_cards_with_kb 的通用 fallback 接手（→ DEFAULT_ROOM_IMAGE_URL）
    for code in _TEST_INJECT_ROOMTYPES:
        entry = next((r for r in rooms if r.get("roomtype") == code), None)
        if entry is not None:
            if not entry.get("data"):
                entry["data"] = fake_data
            entry["image"] = ""  # 清掉壞連結
        else:
            rooms.append({
                "roomtype": code,
                "housingcnt": "2",
                "image": "",
                "data": fake_data,
            })

# ---------------------------------------------------------------------------
# FAQ KB fallback — read room data from DB instead of hardcoded list
# ---------------------------------------------------------------------------

async def _kb_fallback_rooms(
    db: Optional[AsyncSession], adults: Optional[int] = None,
) -> List[RoomCardSchema]:
    """查詢 FAQ KB 取得靜態房型資料，回傳 RoomCardSchema 清單（source=faq_kb）。

    Spec: 查詢空房型.feature — PMS 未啟用或異常時降級至 FAQ_KB，
    呼叫 _kb_search("booking_billing", query) 取得靜態房型資料。

    adults=None：未指定人數，依 max_occupancy 由小到大排序，不過濾。
    adults=整數：過濾 max_occupancy >= adults，再依匹配度與價格排序。
    """
    if db is None:
        return []
    result = await _kb_search(db, "booking_billing", "", top_k=20)
    items = result.get("items") or []
    cards: List[RoomCardSchema] = []
    for item in items:
        name = str(item.get("房型名稱") or "").strip()
        if not name:
            continue
        # Try to resolve room_type_code from name
        code = ""
        for c, n in ROOMTYPE_NAME.items():
            if n == name:
                code = c
                break
        price_raw = item.get("房價") or item.get("price") or 0
        price = _to_int(str(price_raw).replace(",", "").replace("元", "").split("~")[0].split("-")[0])
        max_occ = _to_int(item.get("人數") or item.get("max_occupancy"), ROOMTYPE_MAX_OCCUPANCY.get(code, 2))
        room_count = _to_int(item.get("間數") or item.get("available_count"), None)
        features = str(item.get("房型特色") or "")
        raw_image = str(item.get("image_url") or item.get("url") or "").strip()
        image_url = raw_image if raw_image else (settings.DEFAULT_ROOM_IMAGE_URL or None)
        cards.append(RoomCardSchema(
            room_type_code=code or name,
            room_type_name=name,
            price=price,
            price_label="參考房價",
            available_count=room_count,
            max_occupancy=max_occ,
            image_url=image_url,
            features=features,
            source="faq_kb",
        ))
    # 未指定人數：依人數由小到大排序，相同人數價格低者優先
    if adults is None:
        cards.sort(key=lambda c: ((c.max_occupancy or 2), c.price if c.price > 0 else 10**12))
        return cards
    # 指定人數：過濾可住人數 >= 查詢人數，照匹配度排序（最接近的排前面）
    filtered = [c for c in cards if (c.max_occupancy or 2) >= adults]
    result = filtered if filtered else cards
    result.sort(key=lambda c: (abs((c.max_occupancy or 2) - adults), c.price if c.price > 0 else 10**12))
    return result


async def _enrich_cards_with_kb(
    cards: List[RoomCardSchema], db: Optional[AsyncSession]
) -> List[RoomCardSchema]:
    """Spec: PMS 資料為主，FAQ_KB 資料補充房型圖片與特色描述。
    圖片優先序：PMS image > KB image > settings.DEFAULT_ROOM_IMAGE_URL。
    最後若仍空，則不補（由下游 line_app 的 dummyimage 接手）。
    """
    if not cards:
        return cards
    kb_by_name: Dict[str, dict] = {}
    if db is not None:
        result = await _kb_search(db, "booking_billing", "", top_k=20)
        items = result.get("items") or []
        for item in items:
            name = str(item.get("房型名稱") or "").strip()
            if name:
                kb_by_name[name] = item

    default_image = settings.DEFAULT_ROOM_IMAGE_URL or None
    enriched: List[RoomCardSchema] = []
    for card in cards:
        update: dict = {}
        kb = kb_by_name.get(card.room_type_name)
        if kb:
            features = str(kb.get("房型特色") or "")
            if features and not card.features:
                update["features"] = features
            if not card.image_url:
                raw_image = str(kb.get("image_url") or kb.get("url") or "").strip()
                if raw_image:
                    update["image_url"] = raw_image
        # 通用 fallback：任何房型只要到這裡還沒 image（PMS 空 + KB 也沒補）→ 用預設圖
        final_image = update.get("image_url") or card.image_url
        if not final_image and default_image:
            update["image_url"] = default_image
        if update:
            card = card.model_copy(update=update)
        enriched.append(card)
    return enriched

# ---------------------------------------------------------------------------
# Module-level helpers
# ---------------------------------------------------------------------------

def _room_display_name(code: str) -> str:
    return ROOMTYPE_NAME.get(code, code)


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(str(value).strip())
    except Exception:
        return default


def _clean_price(value: Any) -> int:
    return _to_int(str(value).replace(";", "").strip())


# ---------------------------------------------------------------------------
# Knowledge base (KB) — read directly from DB
# ---------------------------------------------------------------------------

_CATEGORY_NAME_MAP = {
    "facilities": "設施",
    "booking_billing": "訂房",
}
_FACILITY_FIELDS = ["設施名稱", "位置", "費用", "開放時間", "說明", "url"]
_ROOM_FIELDS = ["房型名稱", "房型特色", "房價", "人數", "間數", "url"]


async def _kb_search(
    db: AsyncSession, category: str, query: str, top_k: int = 6,
    test_mode: bool = False,
) -> dict:
    from app.models.faq import FaqCategory, FaqRule

    cat_name = _CATEGORY_NAME_MAP.get(category)
    if not cat_name:
        return {"ok": False, "error": "unknown category", "items": []}

    # PMS 啟用時，訂房類別由 PMS 提供，FAQ 不回傳避免資料衝突
    if category == "booking_billing" and is_pms_enabled():
        return {"ok": True, "category": category, "query": query, "items": []}

    # 查詢啟用中的分類
    cat_result = await db.execute(
        select(FaqCategory).where(FaqCategory.name == cat_name, FaqCategory.is_active == True)  # noqa: E712
    )
    cat = cat_result.scalar_one_or_none()
    if not cat:
        return {"ok": True, "category": category, "query": query, "items": []}

    # 測試模式：讀 draft + active；正式模式：只讀 active
    allowed_statuses = ["draft", "active"] if test_mode else ["active"]

    rule_result = await db.execute(
        select(FaqRule)
        .where(
            FaqRule.category_id == cat.id,
            FaqRule.status.in_(allowed_statuses),
            FaqRule.is_enabled_filter(),
        )
        .options(selectinload(FaqRule.tags))
        .order_by(FaqRule.created_at)
    )
    rules = rule_result.scalars().all()

    rows = []
    for rule in rules:
            c = rule.content_json
            if isinstance(c, str):
                try:
                    c = json.loads(c)
                except Exception:
                    c = {}
            row = dict(c or {})
            row["tags"] = [t.tag_name for t in (rule.tags or [])]
            row["_rule_id"] = rule.id
            rows.append(row)

    fields = _FACILITY_FIELDS if category == "facilities" else _ROOM_FIELDS
    q = (query or "").strip().lower()

    def _result(items):
        rule_ids = [r["_rule_id"] for r in items if "_rule_id" in r]
        return {"ok": True, "category": category, "query": query, "items": items, "rule_ids": rule_ids}

    if not q:
        return _result(rows[:top_k])

    tokens = [t for t in re.split(r"\s+", q) if t]
    scored = []
    for row in rows:
        text_blob = " ".join(str(row.get(f, "")) for f in fields).lower()
        score = sum(2 for t in tokens if t in text_blob) + (3 if q in text_blob else 0)
        if score > 0:
            scored.append((score, row))
    scored.sort(key=lambda x: x[0], reverse=True)
    # 沒命中就回空陣列（不再 fallback 回前 6 筆，避免誤貼不相關標籤）
    # AI 看到空 items 會依系統提示詞回「沒有相關資料」並呼叫 mark_unanswerable
    result_items = [r for _, r in scored[:top_k]]
    return _result(result_items)


# ---------------------------------------------------------------------------
# Mixed-room availability helpers (adapted from zhida)
# ---------------------------------------------------------------------------

def _required_room_count(adults: int, max_occupancy: int) -> int:
    party_size = max(1, _to_int(adults, 1))
    per_room = max(1, _to_int(max_occupancy, 1))
    return max(1, (party_size + per_room - 1) // per_room)


def _inventory_cards_from_pms_raw(
    raw: Dict[str, Any],
    checkin_date: str,
    enddate: str,
    occupancy_fallback: int = 2,
) -> List[Dict[str, Any]]:
    cards: List[Dict[str, Any]] = []
    room_list = raw.get("room", []) if isinstance(raw, dict) else []
    if not isinstance(room_list, list):
        return cards

    for room in room_list:
        room_type_code = str(room.get("roomtype") or "").strip()
        if not room_type_code:
            continue
        room_type_name = ROOMTYPE_NAME.get(room_type_code, room_type_code)
        data_rows = room.get("data", []) or []
        if not data_rows:
            continue

        filtered = [
            d for d in data_rows
            if checkin_date <= str(d.get("odate") or "") < enddate
        ] if checkin_date and enddate else data_rows

        if not filtered:
            filtered = data_rows

        remains = [_to_int(d.get("remain"), 0) for d in filtered]
        if not remains or min(remains) <= 0:
            continue

        nightly_price = _clean_price(filtered[0].get("price", 0))
        max_occupancy = ROOMTYPE_MAX_OCCUPANCY.get(room_type_code, occupancy_fallback)
        pms_image = str(room.get("image") or "").strip() or None
        cards.append({
            "room_type_code": room_type_code,
            "room_type_name": room_type_name,
            "available_count": min(remains),
            "max_occupancy": max_occupancy,
            "price": nightly_price,
            "image_url": pms_image,
            "source": "pms_inventory",
        })
    return cards


def _merge_room_inventory(cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    merged: Dict[str, Dict[str, Any]] = {}
    for c in cards:
        code = str(c.get("room_type_code") or "").strip()
        if not code:
            continue
        prev = merged.get(code)
        if not prev:
            merged[code] = dict(c)
            continue
        prev["available_count"] = max(_to_int(prev.get("available_count"), 0), _to_int(c.get("available_count"), 0))
        prev["max_occupancy"] = max(_to_int(prev.get("max_occupancy"), 1), _to_int(c.get("max_occupancy"), 1))
        pp, np_ = _to_int(prev.get("price"), 0), _to_int(c.get("price"), 0)
        if pp <= 0:
            prev["price"] = np_
        elif np_ > 0:
            prev["price"] = min(pp, np_)
    return sorted(merged.values(), key=lambda x: (_to_int(x.get("price"), 0) or 10**12, x.get("room_type_name", "")))


def _normalize_mixed_requests(requests: Any) -> List[Dict[str, Any]]:
    if not isinstance(requests, list):
        return []
    normalized = []
    for r in requests:
        if not isinstance(r, dict):
            continue
        occ_raw = _to_int(r.get("occupancy"), 0)
        code = str(r.get("room_type_code") or "").strip().upper() or None
        name = str(r.get("room_type_name") or "").strip() or None
        if not occ_raw and not code and not name:
            continue
        normalized.append({
            "room_count": max(1, _to_int(r.get("room_count"), 1)),
            "occupancy": occ_raw if occ_raw > 0 else None,
            "room_type_code": code,
            "room_type_name": name,
        })
    return normalized


def _find_candidate_rooms(req: Dict[str, Any], inventory: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    code = str(req.get("room_type_code") or "").strip().upper()
    name = str(req.get("room_type_name") or "").strip().lower()
    occupancy = _to_int(req.get("occupancy"), 0)

    if code:
        return [c for c in inventory if str(c.get("room_type_code") or "").strip().upper() == code]
    if name:
        matched = [c for c in inventory if name in str(c.get("room_type_name") or "").strip().lower()]
        if matched:
            return matched
    if occupancy > 0:
        exact = [c for c in inventory if _to_int(c.get("max_occupancy"), 0) == occupancy]
        if exact:
            return exact
        return [c for c in inventory if _to_int(c.get("max_occupancy"), 0) >= occupancy]
    return inventory


# ---------------------------------------------------------------------------
# Static member form definition — fields never change at runtime
_MEMBER_FORM = MemberFormDefinitionSchema(
    fields=[
        MemberFormFieldSchema(
            field_name="guest_name", label="姓名", is_required=True,
            input_type="text", validation_pattern=None, error_message=None,
        ),
        MemberFormFieldSchema(
            field_name="guest_phone", label="聯絡電話", is_required=True,
            input_type="tel", validation_pattern=r"^\d{10}$",
            error_message="哎呀，電話格式似乎不太對，請確認是 10 位數號碼喔！",
        ),
        MemberFormFieldSchema(
            field_name="guest_email", label="Email", is_required=True,
            input_type="email", validation_pattern=r".+@.+",
            error_message="Email 格式錯誤",
        ),
    ],
    privacy_note="您的個資僅用於本次訂房聯繫與 CRM 會員服務，請安心填寫。",
)

# ---------------------------------------------------------------------------
# OpenAI tools
# ---------------------------------------------------------------------------

_PMS_TOOL = {
    "type": "function",
    "function": {
        "name": "query_pms_availability",
        "description": (
            "查詢即時房況。只要知道入住日就立刻呼叫，不要追問客人確認。"
            "客人沒說退房日就填入住日+1天；不需要追問人數，未提供時省略 housingcnt 即可，"
            "系統會回傳所有可用房型依人數由小到大排序。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "startdate": {"type": "string", "description": "入住日期 YYYY-MM-DD"},
                "enddate": {"type": "string", "description": "退房日期 YYYY-MM-DD（未提供則填入住日+1天）"},
                "housingcnt": {
                    "type": "integer",
                    "description": "每間房入住人數（選填）。僅當客人主動指定房型才帶入（雙人房=2、四人房=4）；未指定則省略。",
                },
                "roomtype": {
                    "type": "string",
                    "description": "指定房型代碼（可選，例如 V2、GS）",
                },
            },
            "required": ["startdate", "enddate"],
        },
    },
}

_CONFIRM_ROOM_TOOL = {
    "type": "function",
    "function": {
        "name": "confirm_room_selection",
        "description": (
            "當旅客明確選定某一房型時，立刻呼叫此工具記錄選房，以便系統顯示聯絡資訊表單。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "room_type_code": {"type": "string", "description": "房型代碼，例如 WS、V7、GS"},
                "room_type_name": {"type": "string", "description": "房型名稱"},
                "room_count": {"type": "integer", "description": "訂房間數，預設 1"},
            },
            "required": ["room_type_code"],
        },
    },
}

_SAVE_MEMBER_TOOL = {
    "type": "function",
    "function": {
        "name": "save_member_info",
        "description": (
            "當旅客提供姓名、電話（必要）與 email 時，立刻呼叫此工具儲存，"
            "以便系統產生訂房連結。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "旅客姓名"},
                "phone": {"type": "string", "description": "聯絡電話"},
                "email": {"type": "string", "description": "電子郵件（選填）"},
            },
            "required": ["name", "phone"],
        },
    },
}

_KB_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "kb_search",
        "description": (
            "查詢飯店知識庫（設施資訊 或 訂房帳務資訊）。"
            "客人詢問設施（位置、費用、開放時間）或訂房帳務（房型特色、付款/取消規則）時，先呼叫此工具。"
            "回傳 items 後，依 items 內容回答；若 items 為空，誠實說明無資料。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["facilities", "booking_billing"],
                    "description": "知識庫分類：facilities=設施；booking_billing=訂房和帳務",
                },
                "query": {
                    "type": "string",
                    "description": "搜尋關鍵字（可空字串取得全部）",
                },
            },
            "required": ["category", "query"],
        },
    },
}

_MIXED_AVAIL_TOOL = {
    "type": "function",
    "function": {
        "name": "query_pms_mixed_availability",
        "description": (
            "查詢混搭房型是否可用，例如「四人房 1 間 + 雙人房 3 間」。"
            "客人指定多種房型組合需求時使用此工具。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "startdate": {"type": "string", "description": "入住日期 YYYY-MM-DD"},
                "enddate": {"type": "string", "description": "退房日期 YYYY-MM-DD"},
                "requests": {
                    "type": "array",
                    "description": "房型需求清單",
                    "items": {
                        "type": "object",
                        "properties": {
                            "room_count": {"type": "integer", "description": "需求間數"},
                            "occupancy": {"type": ["integer", "null"], "description": "每間人數，例如 2=雙人房"},
                            "room_type_code": {"type": ["string", "null"], "description": "指定房型代碼（可選）"},
                            "room_type_name": {"type": ["string", "null"], "description": "指定房型名稱（可選）"},
                        },
                        "required": ["room_count"],
                    },
                },
            },
            "required": ["startdate", "enddate", "requests"],
        },
    },
}

# PMS config check — env vars must be present to allow enabling
_PMS_CONFIGURED: bool = pms_enabled()
# Runtime toggle — loaded from DB on first access, defaults to False (disabled)
_pms_runtime_enabled: Optional[bool] = None  # None = not yet loaded from DB

_MARK_UNANSWERABLE_TOOL = {
    "type": "function",
    "function": {
        "name": "mark_unanswerable",
        "description": (
            "當你無法回答使用者的問題時呼叫此工具。"
            "適用情境：問題超出你的知識範圍、資料庫沒有相關資訊、需要人工客服判斷、"
            "或者你只能誠實告知對方「不知道」「沒辦法解答」時。"
            "呼叫此工具後，請繼續用文字回覆使用者說明你無法解答並建議聯繫客服。"
            "注意：對於訂房相關問題（房況、房價、訂房流程）有對應的工具可查，不要呼叫此工具；"
            "對於你能正常回答的問題也不要呼叫。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "無法回答的原因（內部標記用，例如：超出知識範圍、需人工判斷）",
                },
            },
            "required": ["reason"],
        },
    },
}

_TOOLS_WITH_PMS = [_KB_SEARCH_TOOL, _PMS_TOOL, _MIXED_AVAIL_TOOL, _CONFIRM_ROOM_TOOL, _SAVE_MEMBER_TOOL, _MARK_UNANSWERABLE_TOOL]
_TOOLS_WITHOUT_PMS = [_KB_SEARCH_TOOL, _PMS_TOOL, _CONFIRM_ROOM_TOOL, _SAVE_MEMBER_TOOL, _MARK_UNANSWERABLE_TOOL]

# 保險網：AI 回覆含以下任一字串時，即使沒呼叫 mark_unanswerable 也視為答不出
# 這些是「契約化措辭」——對應 system prompt「無法回答的情境」要求 AI 必須輸出的固定句
# 提示詞要求 AI 無法回答時必須使用這些詞彙，因此命中率接近 100%
# 維護原則：改這裡也要同步改 system prompt 的固定句清單
_UNANSWERABLE_PHRASES = (
    "沒有相關資料",
    "無法提供",
    "無法協助",
    "無法回答",
    "無法回應",
    "超出我的範圍",
    "建議您聯繫客服",
)


def _contains_unanswerable_phrase(reply: str) -> bool:
    if not reply:
        return False
    return any(kw in reply for kw in _UNANSWERABLE_PHRASES)


def is_pms_enabled() -> bool:
    """Runtime check: PMS configured AND toggled on."""
    if _pms_runtime_enabled is None:
        return False  # not yet loaded from DB
    return _PMS_CONFIGURED and _pms_runtime_enabled


def set_pms_enabled(value: bool) -> None:
    """Update in-memory flag (caller is responsible for DB persistence)."""
    global _pms_runtime_enabled
    _pms_runtime_enabled = value if _PMS_CONFIGURED else False
    _prompt_cache.clear()


def init_pms_from_db(status: str) -> None:
    """Called once at startup or on first API request to sync from DB."""
    global _pms_runtime_enabled
    _pms_runtime_enabled = (status == "enabled") and _PMS_CONFIGURED
    _prompt_cache.clear()


def _get_tools() -> list:
    return _TOOLS_WITH_PMS if is_pms_enabled() else _TOOLS_WITHOUT_PMS

# System prompt cached by date — regenerated only at midnight
_prompt_cache: Dict[date, str] = {}


def _build_system_prompt() -> str:
    today = datetime.now(ZoneInfo("Asia/Taipei")).date()
    if today not in _prompt_cache:
        _prompt_cache.clear()  # at most 1 entry
        _prompt_cache[today] = _build_system_prompt_for(today)
    return _prompt_cache[today]


def _build_system_prompt_for(today: date) -> str:
    today_str = today.strftime("%Y-%m-%d")
    if is_pms_enabled():
        pms_rule = (
            "- 能推斷出入住日與住幾晚就可以呼叫 query_pms_availability（不需要人數，系統會回傳所有房型依人數由小到大排序）\n"
            "- 若入住日期嚴格早於今天（不含今天），不要查詢房況，直接提醒旅客「您提供的日期已過，請重新提供入住日期」；今天當天是有效入住日\n"
            "- 工具回傳後，不要在文字中列出房型清單，系統會自動顯示房卡，你只需簡短回覆一句話\n"
            "- 若查無房型，告知並詢問是否調整日期\n"
            "- PMS 失敗時，改用靜態房型資料告知旅客（標明為「一般參考房價」）"
        )
    else:
        pms_rule = (
            "- 目前無即時房況系統，但仍需呼叫 query_pms_availability 取得靜態參考房價\n"
            "- 能推斷出入住日與住幾晚就可以呼叫 query_pms_availability（不需要人數，系統會回傳所有房型依人數由小到大排序）\n"
            "- 若入住日期嚴格早於今天（不含今天），不要查詢房況，直接提醒旅客「您提供的日期已過，請重新提供入住日期」；今天當天是有效入住日\n"
            "- 工具回傳後，不要在文字中列出房型清單，系統會自動顯示房卡，你只需簡短回覆一句話並標明為「一般參考房價」"
        )

    return f"""今天日期：{today_str}
你是飯店親切的客服機器人，個性熱情有趣，協助旅客查詢房況與訂房。

你會收到整段對話紀錄（包含先前訊息），請務必綜合上下文，不要重複追問已提供的資訊。

核心行為規則（最高優先，嚴格遵守，違反視為錯誤）：
- 必須收齊以下兩項資訊才能呼叫 query_pms_availability：(1) 入住日期 (2) 住幾晚
- 絕對不要追問「幾人房」「幾人入住」「要幾人的房型」，系統會直接回傳所有房型（依人數由小到大排序）供客人挑選
- 兩項齊全時，「必須」在本次回覆中呼叫 query_pms_availability tool，絕對不可以只回文字而不呼叫 tool
- 嚴禁回覆「幫您查詢」「請稍等」之類的話而不實際呼叫 tool
- 嚴禁在未呼叫 query_pms_availability（本輪或先前輪次的 tool 結果）的情況下，宣稱「沒有 X 房型」「今天沒房」「X 日期無房」「X 房型已售完」等任何房況結論；即便客人用疑問句詢問（例如「今天沒有四人房了嗎？」），也不得把疑問當作事實，務必先查或追問缺少的資訊
- 當資訊不齊（例如只有日期缺住幾晚）時，只能追問缺少的項目，絕不自行編造查詢結果或建議「改其他日期」
- 缺少任何一項時，只追問缺少的項目，不要重複追問已知的資訊
- 追問順序：入住日期 → 住幾晚
- 不需要追問「幾間」，間數在選房後再確認即可
- 客人只提供月/日時，直接當作今年，不要反問年份
- 「今天入住」→ startdate={today_str}
- 今天（含）及未來日期都是有效入住日，只有嚴格早於今天的日期才算「已過期」
- 若客人一次給齊所有資訊（例如「4/11入住一晚」），直接呼叫 tool 不要追問
- 若客人主動提及房型（例如「雙人房」「四人房」），仍不必追問人數，直接查詢即可，房卡會依人數由小到大顯示所有房型

知識庫查詢規則：
- 客人詢問設施（游泳池、停車場、餐廳位置、費用、開放時間等）時，先呼叫 kb_search(category="facilities")
- 客人詢問訂房帳務（房型特色、付款方式、取消規則等）時，先呼叫 kb_search(category="booking_billing")
- 若 kb_search 回傳 items 為空，誠實說明沒有相關資料

訂房引導語規則（非訂房問題回覆後）：
- 附加引導語的條件（擇一成立）：
  (A) 問題可能與訂房相關（設施、交通、餐廳、房型介紹、周邊景點）
  (B) 無法排除訂房意圖（問題模糊、首次互動、住宿周邊話題）
- 不附加引導語的條件：問題明確與訂房無關（純投訴、問辦公時間、詢問聯絡電話）
- 引導語範例：「需要幫您查詢房況嗎？」「您有興趣預訂嗎？我可以幫您查指定日期的空房！」
- 引導語要自然、不生硬，每次措辭略有變化
- 若客人明確表示不需要訂房，則不再追加引導語

訂房引導規則：
- 兩項資訊（入住日期、住幾晚）齊全時，必須在本次回覆中呼叫 query_pms_availability tool，嚴禁只回文字不呼叫 tool，嚴禁再追問確認
- 範例：「3/18入住一晚」→ 兩項齊全 → startdate=今年3/18, enddate=今年3/19 → 直接查（不用問人數）
- 範例：「4/11」→ 只有入住日期，缺住幾晚 → 追問「請問住幾晚呢？」
- 範例：「4/11 一晚」→ 兩項齊全 → 直接查（不用問房型或人數）
- 範例：「雙人房」→ 只有房型但缺日期 → 追問「請問您預計什麼時候入住？住幾晚呢？」

房況查詢規則：
{pms_rule}
- 呼叫 query_pms_availability 時，roomtype 參數只在客人指定了「確切房型名稱」（例如「森森系雙人房」「琴香古韻」）時才傳；若客人只說「雙人房」「四人房」等通稱，不要傳 roomtype，讓系統回傳所有適合的房型供客人選擇
- 只有客人同時指定「兩種以上不同房型」（例如「四人房 1 間 + 雙人房 3 間」）時，才呼叫 query_pms_mixed_availability
- 單一房型多間（例如「2間雙人房」「3間四人房」）時，用 query_pms_availability 即可，不要用 mixed
- 依 all_available 與 items 回答是否可行；可行時回覆每種房型間數

選房與聯絡資訊規則：
- 旅客明確選定房型後（例如「我要森森系雙人房」、「選第一個」），立刻呼叫 confirm_room_selection，並詢問聯絡資訊
- 請求聯絡資訊時，說明需要「姓名、電話、Email」以完成訂房
- 旅客提供姓名、電話後（email 若無可省略），立刻呼叫 save_member_info

回覆風格：
- 純文字回覆，嚴禁使用任何 Markdown 語法（禁止 **粗體**、*斜體*、# 標題、![圖片](url)、[連結](url)、``` 程式碼區塊等）
- 回覆盡量簡短，一兩句話就好，不要長篇大論
- 語氣親切有溫度，適時加入輕鬆的語氣詞
- 不要瞎編；不知道就說不知道
- 若對方使用中文，一律使用台灣繁體中文回覆，嚴禁出現簡體中文字

無法回答的情境（強制規則，違反視為錯誤）：
- 定義：「無法回答」= 你沒有真正解決使用者問的問題。包含以下所有情境（不限於此）：
  (A) 不知道答案（超出知識範圍、沒有資料、細節不清楚）
  (B) 拒絕回答（不當請求、違法話題、非業務範圍、道德上不協助）
  (C) 系統性失敗（工具回傳空結果但使用者還繼續追問）
  (D) 需要人工判斷（客訴、情緒訴求、個案協商）
  (E) 飯店沒有該設施／服務（kb_search 查無 → 推論飯店未提供）
- 觸發時：必須在同一輪同時呼叫 mark_unanswerable 工具（parallel tool call），再輸出文字回覆。
- 文字回覆「必須」包含以下任一固定句（用詞要原封不動，不要改成同義詞）：
  - 「沒有相關資料」      ← 用於 (A)(C)(E)：知識庫查無 / 飯店沒有該設施
  - 「無法提供」          ← 用於 (A)(B)：超出業務範圍、不該回答的話題
  - 「無法協助」          ← 用於 (B)(D)：拒絕協助、需要人工
- 不觸發時機：訂房相關問題（日期、房況、房型、訂房流程）—這些先呼叫 query_pms_availability 或 kb_search，有回答到就不要標；設施/帳務類問題被 kb_search 查到資料也不要標
- 範例：
  (A) 使用者問「你知道今天台積電股價嗎」→ 呼叫 mark_unanswerable + 文字回「抱歉，這部分我沒有相關資料，建議查詢金融網站喔」
  (B) 使用者問「能跟我去搶銀行嗎」→ 呼叫 mark_unanswerable + 文字回「抱歉，我無法協助進行此類活動，建議遵守法律喔」
  (C) 使用者問「飯店 CEO 是誰」→ 呼叫 mark_unanswerable + 文字回「這部分我無法提供，建議聯繫官方客服」
  (E) 使用者問「你們有高爾夫球場嗎」（kb_search 查無）→ 呼叫 mark_unanswerable + 文字回「我這邊沒有相關資料，看來飯店並未提供此項設施喔」

查到房型後的回覆規則（最高優先）：
- 呼叫 query_pms_availability 取得房型資料後，你的回覆只能是簡短一句話（例如「幫您查到囉，請參考以下房型！」）
- 絕對不可以在文字中列出任何房型名稱、價格、間數、編號清單，系統會自動用房卡呈現這些資訊
- 違反範例（禁止）：「森森系雙人房 NT$2600」「1. 琴香古韻 - $3800」「以下是可用的房型：...」
- 正確範例：「有多種雙人房可選，請參考以下房型！」「幫您查到了，請看看哪間喜歡！」
- 嚴禁提及「房卡」「下方房卡」這類系統術語"""


# ---------------------------------------------------------------------------
# Session TTL constants
# ---------------------------------------------------------------------------

_SESSION_TTL = 60 * 20        # 20 minutes
_EVICT_INTERVAL = 60 * 10     # check every 10 minutes


# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

@dataclass
class ChatbotSessionState:
    browser_key: str
    session_id: str = field(default_factory=lambda: str(uuid4()))
    hotel_id: Optional[int] = None
    intent_state: Literal["detecting", "confirmed", "none"] = "detecting"
    turn_count: int = 0
    booking_rooms: int = 1          # 間數 (spec: booking_rooms)
    booking_adults: Optional[int] = None  # 每間人數
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None
    room_plan_requests: List[Dict[str, int]] = field(default_factory=list)
    selected_rooms: List[Dict[str, Any]] = field(default_factory=list)
    selected_room_type: Optional[str] = None
    selected_room_count: Optional[int] = None
    selected_room_name: Optional[str] = None
    selected_room_source: Optional[str] = None
    member_name: Optional[str] = None
    member_phone: Optional[str] = None
    member_email: Optional[str] = None
    crm_member_id: Optional[int] = None
    history: deque = field(default_factory=lambda: deque(maxlen=10))
    last_room_cards: List[RoomCardSchema] = field(default_factory=list)
    ts: float = field(default_factory=time.time)

    @property
    def checkin_date_obj(self) -> Optional[date]:
        if not self.checkin_date:
            return None
        return datetime.strptime(self.checkin_date, "%Y-%m-%d").date()

    @property
    def checkout_date_obj(self) -> Optional[date]:
        if not self.checkout_date:
            return None
        return datetime.strptime(self.checkout_date, "%Y-%m-%d").date()


# ---------------------------------------------------------------------------
# Tool calling context (shared between website chatbot & member chat)
# ---------------------------------------------------------------------------

@dataclass
class ToolCallingContext:
    """Tool calling 共用上下文，與 session 儲存方式解耦"""
    db: Optional[AsyncSession] = None
    test_mode: bool = False
    collect_rule_ids: bool = False
    # 訂房狀態（PMS tool 會修改）
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None
    booking_adults: Optional[int] = None
    # 輸出
    room_cards: List[RoomCardSchema] = field(default_factory=list)
    referenced_rule_ids: set = field(default_factory=set)
    total_tokens_used: int = 0
    pms_called: bool = False
    unanswered: bool = False
    unanswered_reason: Optional[str] = None
    # 官網 session 參照（僅官網 chatbot 使用）
    _session: Optional[ChatbotSessionState] = field(default=None, repr=False)


# ---------------------------------------------------------------------------
# ChatbotService
# ---------------------------------------------------------------------------

class ChatbotService:
    def __init__(self) -> None:
        self._sessions: Dict[str, ChatbotSessionState] = {}
        self._lock = Lock()
        self._max_turns = 5
        self._openai: Optional[AsyncOpenAI] = None
        self._last_evict: float = time.time()

    def _get_openai(self) -> AsyncOpenAI:
        if self._openai is None:
            self._openai = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )
        return self._openai

    # ------------------------------------------------------------------
    # Session management
    # ------------------------------------------------------------------

    def _evict_stale_sessions(self) -> None:
        """Evict sessions idle longer than _SESSION_TTL. Call inside self._lock."""
        now = time.time()
        if now - self._last_evict < _EVICT_INTERVAL:
            return
        cutoff = now - _SESSION_TTL
        stale = [k for k, v in self._sessions.items() if v.ts < cutoff]
        for k in stale:
            del self._sessions[k]
        self._last_evict = now

    def get_or_create_session(
        self,
        browser_key: str,
        hotel_id: Optional[int] = None,
    ) -> ChatbotSessionState:
        with self._lock:
            self._evict_stale_sessions()
            session = self._sessions.get(browser_key)
            if not session:
                session = ChatbotSessionState(browser_key=browser_key, hotel_id=hotel_id)
                self._sessions[browser_key] = session
            elif hotel_id is not None:
                session.hotel_id = hotel_id
            session.ts = time.time()
            return session

    def reset_session(self, browser_key: str) -> ChatbotSessionState:
        with self._lock:
            session = ChatbotSessionState(browser_key=browser_key)
            self._sessions[browser_key] = session
            return session

    # ------------------------------------------------------------------
    # Main message handler (LLM-driven, spec 3.1–3.2)
    # ------------------------------------------------------------------

    async def handle_message(
        self,
        *,
        browser_key: str,
        message: str,
        hotel_id: Optional[int] = None,
        db: Optional[AsyncSession] = None,
        test_mode: bool = False,
        site_id: Optional[str] = None,
        site_name: Optional[str] = None,
    ) -> ChatbotMessageOutSchema:
        session = self.get_or_create_session(browser_key, hotel_id)

        # Spec 3.2: reset after 5 turns
        if session.turn_count >= self._max_turns:
            session = self.reset_session(browser_key)
            if hotel_id is not None:
                session.hotel_id = hotel_id

        session.turn_count += 1
        session.history.append({"role": "user", "content": message})

        # Spec: 訊息含明確訂房信號時立即標記 intent_state = confirmed
        if session.intent_state == "detecting" and self._has_booking_intent(message):
            session.intent_state = "confirmed"

        # Deterministic extraction: room plan requests
        room_plan = self._extract_room_plan(message)
        if room_plan:
            session.room_plan_requests = [room_plan]
            session.booking_adults = room_plan["room_count"] * room_plan["adults_per_room"]

        # Deterministic extraction: dates (with past-date guard)
        past_date_warning: Optional[str] = None
        try:
            dates = self._extract_dates(message)
        except Exception as e:
            logger.warning(f"Date extraction failed: {e}")
            dates = None
        if dates:
            checkin_str, checkout_str = dates
            checkin_obj = date.fromisoformat(checkin_str)
            today = datetime.now(ZoneInfo("Asia/Taipei")).date()
            if checkin_obj < today:
                past_date_warning = "您輸入的日期已過，請重新提供入住與退房日期。"
            else:
                session.checkin_date = checkin_str
                session.checkout_date = checkout_str

        # Build unified tool calling context
        # collect_rule_ids=True 讓 _unified_tool_loop 在 kb_search 時記下引用到的 FAQ rule，
        # 後續才能依規則標籤自動為（訪客 / 已加入會員的）webchat 使用者打標。
        ctx = ToolCallingContext(
            db=db, test_mode=test_mode,
            collect_rule_ids=True,
            checkin_date=session.checkin_date,
            checkout_date=session.checkout_date,
            booking_adults=session.booking_adults,
            _session=session,
        )

        # Call LLM with tool calling (if no deterministic reply needed)
        if past_date_warning:
            reply = past_date_warning
            room_cards: List[RoomCardSchema] = []
        else:
            # 組裝 system prompt，附加已知的訂房狀態讓 AI 不重複追問
            sys_prompt = _build_system_prompt()
            known_parts = []
            missing_parts = []
            if session.checkin_date:
                known_parts.append(f"入住日期：{session.checkin_date}")
            else:
                missing_parts.append("入住日期")
            if session.checkout_date:
                known_parts.append(f"退房日期：{session.checkout_date}")
            else:
                missing_parts.append("住幾晚")
            # 人數／房型屬於選填，僅在使用者主動提供時列入 known_parts，不加入 missing_parts
            if session.booking_adults:
                known_parts.append(f"人數：{session.booking_adults}")
            if session.room_plan_requests:
                rp = session.room_plan_requests[0] if session.room_plan_requests else {}
                known_parts.append(f"房型需求：{rp.get('room_count', 1)}間{rp.get('adults_per_room', 2)}人房")

            if known_parts:
                sys_prompt += "\n\n目前已收集到的訂房資訊（不需要再追問這些）：\n" + "、".join(known_parts)
            if missing_parts:
                sys_prompt += "\n尚缺：" + "、".join(missing_parts) + " → 請追問這些資訊"
            elif session.checkin_date and session.checkout_date:
                sys_prompt += "\n→ 兩項資訊已齊全，你必須在本次回覆中呼叫 query_pms_availability，不可只回文字，嚴禁追問人數或房型。"

            messages: List[Dict[str, Any]] = [
                {"role": "system", "content": sys_prompt},
                *session.history,
            ]
            reply = await self._unified_tool_loop(messages, ctx)
            room_cards = ctx.room_cards
            # 同步 ctx 狀態回 session
            if ctx.checkin_date is not None:
                session.checkin_date = ctx.checkin_date
            if ctx.checkout_date is not None:
                session.checkout_date = ctx.checkout_date
            if ctx.booking_adults is not None:
                session.booking_adults = ctx.booking_adults
            # token 扣除
            if db is not None and ctx.total_tokens_used > 0:
                await self._deduct_tokens(db, ctx.total_tokens_used)

        # 先保存 booking_context（房卡產生後會清掉 session 日期）
        booking_ctx = self._booking_context(session)

        if room_cards:
            session.last_room_cards = room_cards
            # 房卡已出現：清 history 和 intent（避免下次查詢被舊對話誤導）
            # 但保留日期和人數（booking-save 還需要用）
            session.room_plan_requests = []
            session.history = []
            session.intent_state = "idle"

        session.history.append({"role": "assistant", "content": reply})
        reply_type = self._determine_reply_type(session, room_cards)
        session.ts = time.time()

        # 把 widget 對話寫入 conversation_threads / conversation_messages
        # 不論是否已加入會員都記錄；非會員會建一筆 is_guest=1 的 Member
        # 失敗不阻擋使用者收訊（log warning 即可）
        # 註：widget 預設帶 test_mode=true（用於跳過 token 扣減），但對話保存與 test_mode 無關
        widget_member: Optional[Member] = None
        if db is not None:
            try:
                widget_member = await self._persist_widget_conversation(
                    db=db,
                    browser_key=browser_key,
                    user_message=message,
                    bot_reply=reply,
                    room_cards=room_cards,
                    site_id=site_id,
                    site_name=site_name,
                )
            except Exception as exc:
                logger.warning(f"[chatbot] persist widget conversation failed: {exc}")

        # 自動為 widget 使用者貼 FAQ 規則標籤（與 LINE/會員聊天室一致）
        if db is not None and widget_member is not None and ctx.referenced_rule_ids:
            try:
                await self._auto_tag_member(
                    db,
                    line_uid=None,
                    referenced_rule_ids=list(ctx.referenced_rule_ids),
                    member=widget_member,
                )
                await db.commit()
            except Exception as exc:
                logger.warning(f"[chatbot] auto-tag widget user failed: {exc}")

        return ChatbotMessageOutSchema(
            session_id=session.session_id,
            intent_state=session.intent_state,
            reply_type=reply_type,
            reply=reply,
            room_cards=room_cards,
            missing_fields=self._compute_missing_fields(session),
            turn_count=session.turn_count,
            booking_context=booking_ctx,
            tokens_used=ctx.total_tokens_used,
            unanswered=ctx.unanswered,
        )

    async def _persist_widget_conversation(
        self,
        *,
        db: AsyncSession,
        browser_key: str,
        user_message: str,
        bot_reply: str,
        room_cards: List[RoomCardSchema],
        site_id: Optional[str] = None,
        site_name: Optional[str] = None,
    ) -> Member:
        """把 widget 一輪對話（user + bot）寫入 conversation_threads / messages，回傳對應的 Member。

        - 第一次收到該 browser_key：建一筆 is_guest=1 的 Member（webchat_uid=browser_key）
        - 已存在（不論已成會員或仍是訪客）：直接附加訊息
        - thread_id 直接用 browser_key（與 ChatroomService 慣例一致）
        - 房卡訊息：以 message_type='room_cards' 額外存一筆，方便 CSV 匯出時可讀
        - site_id / site_name：widget 嵌入站點識別。新訪客直接寫入；既有訪客若為空會補上
        """
        # 規範化 site 欄位（過濾空字串、限長度，避免攻擊面擴大）
        site_id = (site_id or "").strip()[:50] or None
        site_name = (site_name or "").strip()[:100] or None

        # 1. upsert Member by webchat_uid=browser_key
        result = await db.execute(
            select(Member).where(Member.webchat_uid == browser_key)
        )
        member = result.scalar_one_or_none()
        if member is None:
            # 取下一個訪客流水號（低流量足夠；未來流量大可改 SELECT ... FOR UPDATE）
            seq_result = await db.execute(
                select(sa_func.coalesce(sa_func.max(Member.guest_seq), 0))
            )
            next_seq = (seq_result.scalar() or 0) + 1
            member = Member(
                webchat_uid=browser_key,
                webchat_name=f"訪客{next_seq:06d}",
                name=f"訪客{next_seq:06d}",
                join_source="Webchat",
                is_guest=True,
                guest_seq=next_seq,
                last_interaction_at=datetime.now(),
                webchat_site_id=site_id,
                webchat_site_name=site_name,
            )
            db.add(member)
            await db.flush()  # 取得 member.id
        else:
            member.last_interaction_at = datetime.now()
            # 既有訪客若沒有 site 資訊就補上（不覆蓋已存在的，避免訪客在不同站之間切換時亂跳）
            if site_id and not member.webchat_site_id:
                member.webchat_site_id = site_id
            if site_name and not member.webchat_site_name:
                member.webchat_site_name = site_name

        # 2. upsert ConversationThread (id = browser_key)
        thread_result = await db.execute(
            select(ConversationThread).where(ConversationThread.id == browser_key)
        )
        thread = thread_result.scalar_one_or_none()
        now = datetime.now()
        if thread is None:
            thread = ConversationThread(
                id=browser_key,
                member_id=member.id,
                platform="Webchat",
                platform_uid=browser_key,
                last_message_at=now,
            )
            db.add(thread)
            await db.flush()
        else:
            thread.member_id = member.id
            thread.platform = "Webchat"
            thread.platform_uid = browser_key
            thread.last_message_at = now

        # 3. 寫入使用者訊息
        # 三筆訊息（user / bot 文字 / room_cards）原本共用同一個 now，
        # MySQL 同 timestamp 排序非決定性 → 畫面順序會亂跳。
        # 解法：三筆各偏移毫秒，保證 user → bot → room_cards 嚴格遞增。
        db.add(ConversationMessage(
            id=str(uuid4()),
            thread_id=thread.id,
            platform="Webchat",
            direction="incoming",
            role="user",
            content=user_message,
            message_source="webhook",
            created_at=now,
        ))

        # 4. 寫入 bot 回覆（純文字）— +1ms 確保排在使用者訊息後
        if bot_reply:
            db.add(ConversationMessage(
                id=str(uuid4()),
                thread_id=thread.id,
                platform="Webchat",
                direction="outgoing",
                role="assistant",
                content=bot_reply,
                message_source="gpt",
                created_at=now + timedelta(milliseconds=1),
            ))

        # 5. 房卡（如有）：另存一筆 message_type='room_cards'，+2ms 排在文字回覆後
        if room_cards:
            try:
                room_cards_payload = json.dumps(
                    {"room_cards": [rc.model_dump() if hasattr(rc, "model_dump") else dict(rc) for rc in room_cards]},
                    ensure_ascii=False,
                    default=str,
                )
                db.add(ConversationMessage(
                    id=str(uuid4()),
                    thread_id=thread.id,
                    platform="Webchat",
                    direction="outgoing",
                    role="assistant",
                    message_type="room_cards",
                    content=room_cards_payload,
                    message_source="gpt",
                    created_at=now + timedelta(milliseconds=2),
                ))
            except Exception as exc:
                logger.warning(f"[chatbot] serialize room_cards failed: {exc}")

        await db.commit()
        return member

    async def _deduct_tokens(self, db: AsyncSession, tokens_used: int) -> None:
        """扣除 AiTokenUsage 額度"""
        ind_result = await db.execute(
            select(Industry).where(Industry.is_active == True).limit(1)  # noqa: E712
        )
        industry = ind_result.scalar_one_or_none()
        if not industry:
            return

        usage_result = await db.execute(
            select(AiTokenUsage).where(AiTokenUsage.industry_id == industry.id)
        )
        token_usage = usage_result.scalar_one_or_none()
        if token_usage:
            token_usage.used_amount += tokens_used
            await db.flush()

    # ------------------------------------------------------------------
    # Unified tool calling (shared by website chatbot & member chat)
    # ------------------------------------------------------------------

    async def _unified_tool_loop(
        self, messages: List[Dict[str, Any]], ctx: ToolCallingContext
    ) -> str:
        """單一 tool calling 迴圈，官網 & 會員聊天室共用"""
        client = self._get_openai()

        for _ in range(5):
            pms_called = False
            resp = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                tools=_get_tools(),
                tool_choice="auto",
                timeout=30,
            )
            if resp.usage:
                ctx.total_tokens_used += resp.usage.total_tokens
            msg = resp.choices[0].message

            if not msg.tool_calls:
                reply = msg.content or ""
                # 保險網：AI 沒呼叫 mark_unanswerable 但回覆含明確答不出字樣 → 補標
                if not ctx.unanswered and _contains_unanswerable_phrase(reply):
                    ctx.unanswered = True
                    logger.info(f"[unanswered-fallback] caught by keyword: {reply[:80]}")
                return reply

            messages.append(msg)
            tool_names = [tc.function.name for tc in msg.tool_calls]
            logger.info(f"[tool_loop] AI called tools: {tool_names}")
            for tc in msg.tool_calls:
                fn_name = tc.function.name
                args = json.loads(tc.function.arguments)

                if fn_name == "query_pms_availability" and pms_called:
                    result: Any = {"error": "duplicate pms call suppressed"}
                else:
                    if fn_name == "query_pms_availability":
                        pms_called = True
                    result = await self._execute_tool(ctx, fn_name, args)

                llm_result = self._clean_for_llm(result, fn_name, ctx.collect_rule_ids)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(llm_result, ensure_ascii=False),
                })

        # 超過 5 輪迴圈仍未完成 → 視為系統性答不出
        ctx.unanswered = True
        return "很抱歉，系統暫時無法回應，請稍後再試。"

    async def _execute_tool(
        self, ctx: ToolCallingContext, fn_name: str, args: Dict[str, Any]
    ) -> Any:
        """統一 tool executor，官網 & 會員聊天室共用"""
        if fn_name == "kb_search":
            if ctx.db is not None:
                result = await _kb_search(
                    ctx.db, args.get("category", ""), args.get("query", ""),
                    test_mode=ctx.test_mode,
                )
            else:
                result = {"ok": False, "error": "database session not available", "items": []}
            if ctx.collect_rule_ids and isinstance(result, dict):
                ctx.referenced_rule_ids.update(result.get("rule_ids", []))
            return result
        elif fn_name == "query_pms_availability":
            ctx.pms_called = True
            result, cards = await self._run_pms_tool(args, ctx)
            if cards:
                ctx.room_cards = cards
            return result
        elif fn_name == "query_pms_mixed_availability":
            result = await self._run_mixed_avail_tool(args, ctx)
            if ctx.room_cards:
                pass  # cards already set by _run_mixed_avail_tool
            return result
        elif fn_name == "confirm_room_selection":
            if ctx._session is not None:
                return self._run_confirm_room_tool(args, ctx._session)
            return {"info": "此功能僅在網站訂房時可用，請前往官網完成訂房。"}
        elif fn_name == "save_member_info":
            if ctx._session is not None:
                return self._run_save_member_tool(args, ctx._session)
            return {"info": "此功能僅在網站訂房時可用，請前往官網完成訂房。"}
        elif fn_name == "mark_unanswerable":
            # AI 自主判斷無法回答 → 設定旗標，讓上層存進 conversation_messages.unanswered
            ctx.unanswered = True
            ctx.unanswered_reason = args.get("reason") or ""
            logger.info(f"[mark_unanswerable] reason={ctx.unanswered_reason}")
            return {"ok": True, "acknowledged": True}
        else:
            return {"error": f"unknown tool {fn_name}"}

    @staticmethod
    def _clean_for_llm(result: Any, fn_name: str, collect_rule_ids: bool) -> Any:
        """清理內部欄位（rule_ids, _rule_id）不讓 LLM 看到"""
        if not (collect_rule_ids and fn_name == "kb_search" and isinstance(result, dict)):
            return result
        cleaned = {k: v for k, v in result.items() if k != "rule_ids"}
        cleaned["items"] = [
            {k: v for k, v in item.items() if k != "_rule_id"}
            for item in cleaned.get("items", [])
        ]
        return cleaned

    # ------------------------------------------------------------------
    # PMS tool
    # ------------------------------------------------------------------

    async def _run_pms_tool(
        self,
        args: Dict[str, Any],
        ctx: ToolCallingContext,
    ) -> tuple[Dict[str, Any], List[RoomCardSchema]]:
        """Execute PMS availability query. Falls back to FAQ KB on error.

        Spec: 查詢空房型.feature
        - PMS 正常 → PMS 資料為主，FAQ_KB 補充圖片與特色
        - PMS 未啟用/異常 → _kb_search("booking_billing") 降級
        """
        startdate = str(args.get("startdate", ""))
        enddate = str(args.get("enddate", ""))
        # housingcnt 為選填：客人未指定時為 None，此時回傳所有房型依人數由小到大排序
        housingcnt_raw = args.get("housingcnt")
        housingcnt_specified = housingcnt_raw is not None and str(housingcnt_raw).strip() != ""
        housingcnt = int(housingcnt_raw) if housingcnt_specified else 2
        roomtype = args.get("roomtype") or None
        logger.info(
            f"[PMS] tool args: startdate={startdate}, enddate={enddate}, "
            f"housingcnt={housingcnt if housingcnt_specified else 'unspecified'}, roomtype={roomtype}"
        )

        # Auto-fill enddate if missing (default: checkin + 1 night)
        if startdate and not enddate:
            try:
                enddate = (date.fromisoformat(startdate) + timedelta(days=1)).isoformat()
            except ValueError:
                pass

        if startdate:
            ctx.checkin_date = startdate
        if enddate:
            ctx.checkout_date = enddate
        # 僅在使用者明確指定人數時才寫入 booking_adults，未指定保持 None
        if housingcnt_specified and housingcnt > 0:
            ctx.booking_adults = housingcnt

        db = ctx.db

        # 未指定人數時傳 None 給 _availability_to_room_cards，讓其以人數由小到大排序不過濾
        sort_housingcnt: Optional[int] = housingcnt if housingcnt_specified else None

        # PMS disabled → FAQ KB fallback (spec: _kb_search("booking_billing"))
        if not is_pms_enabled():
            cards = await _kb_fallback_rooms(db, housingcnt if housingcnt_specified else None)
            if not cards:
                return {
                    "source": "no_data",
                    "note": "抱歉，我暫時沒辦法解答這個問題。建議您直接聯繫客服，讓我們的人員為您詳細說明。",
                    "available": [],
                }, []
            return {
                "source": "faq_kb",
                "note": "以下為一般參考房價（非即時房況），實際房況請致電確認",
                "available": [
                    {
                        "room_type_code": c.room_type_code,
                        "room_type_name": c.room_type_name,
                        "price": c.price,
                        "available_count": c.available_count,
                        "max_occupancy": c.max_occupancy,
                        "features": c.features,
                    }
                    for c in cards
                ],
            }, cards

        try:
            # 未指定人數且未指定房型 → 用 query_pms_all_roomtypes（housingcnt 空字串）取全部房型；
            # 否則用 query_pms（會依 housingcnt 過濾）
            if not housingcnt_specified and not roomtype:
                raw = await asyncio.to_thread(query_pms_all_roomtypes, startdate, enddate)
                logger.info(
                    f"[PMS] all-roomtypes query: {len(raw.get('room', []))} room types, "
                    f"startdate={startdate}, enddate={enddate}"
                )
            else:
                raw = await asyncio.to_thread(query_pms, startdate, enddate, roomtype, housingcnt)
                logger.info(
                    f"[PMS] query result: {len(raw.get('room', []))} room types, "
                    f"startdate={startdate}, enddate={enddate}, housingcnt={housingcnt}"
                )
            _inject_tt_test_inventory(raw, startdate, enddate)
            availability = self._extract_availability(raw, startdate, enddate)
            cards = self._availability_to_room_cards(availability, sort_housingcnt)
            logger.info(f"[PMS] after extraction: {len(cards)} cards")

            # Spec: 僅在客人明確指定 housingcnt=1 且查無房時自動以 housingcnt=2 重查
            fallback_housingcnt = None
            if housingcnt_specified and not cards and housingcnt == 1:
                logger.info("[PMS] housingcnt=1 returned empty, retrying with housingcnt=2")
                raw2 = await asyncio.to_thread(query_pms, startdate, enddate, roomtype, 2)
                _inject_tt_test_inventory(raw2, startdate, enddate)
                availability = self._extract_availability(raw2, startdate, enddate)
                cards = self._availability_to_room_cards(availability, 2)
                if cards:
                    fallback_housingcnt = 1

            if not cards:
                # PMS returned empty → FAQ KB fallback
                cards = await _kb_fallback_rooms(db, housingcnt if housingcnt_specified else None)
                source_note = "faq_kb"
            else:
                # Spec: PMS 資料為主，FAQ_KB 資料補充房型圖片與特色描述
                cards = await _enrich_cards_with_kb(cards, db)
                source_note = "pms"

            result_dict: Dict[str, Any] = {
                "source": source_note,
                "available": [
                    {
                        "room_type_code": c.room_type_code,
                        "room_type_name": c.room_type_name,
                        "price": c.price,
                        "available_count": c.available_count,
                        "max_occupancy": c.max_occupancy,
                        "features": c.features,
                    }
                    for c in cards
                ],
            }
            # 僅在使用者明確指定人數時才加「沒有符合人數」的 note，未指定一律靜默
            if housingcnt_specified:
                if fallback_housingcnt is not None:
                    result_dict["note"] = "沒有符合人數的房型，以下是其他可參考的房型"
                elif cards and not any(c.max_occupancy == housingcnt for c in cards):
                    result_dict["note"] = f"目前沒有剛好 {housingcnt} 人的房型有空房，以下是其他可入住的房型供您參考"
            return result_dict, cards

        except Exception as exc:
            cards = await _kb_fallback_rooms(db, housingcnt if housingcnt_specified else None)
            if not cards:
                return {
                    "source": "no_data",
                    "note": "抱歉，我暫時沒辦法解答這個問題。建議您直接聯繫客服，讓我們的人員為您詳細說明。",
                    "available": [],
                }, []
            return {
                "source": "faq_kb",
                "note": "PMS 暫時無法連線，以下為參考房價（非即時房況）",
                "available": [
                    {
                        "room_type_code": c.room_type_code,
                        "room_type_name": c.room_type_name,
                        "price": c.price,
                        "available_count": c.available_count,
                        "max_occupancy": c.max_occupancy,
                        "features": c.features,
                    }
                    for c in cards
                ],
            }, cards

    def _run_confirm_room_tool(
        self,
        args: Dict[str, Any],
        session: ChatbotSessionState,
    ) -> Dict[str, Any]:
        """Record room selection from LLM tool call."""
        code = str(args.get("room_type_code", "")).strip()
        name = str(args.get("room_type_name") or _room_display_name(code))
        count = int(args.get("room_count") or 1)
        self._apply_room_to_session(session, code, name, count, source="pms")
        return {"ok": True, "selected": code, "name": name, "count": count}

    def _run_save_member_tool(
        self,
        args: Dict[str, Any],
        session: ChatbotSessionState,
    ) -> Dict[str, Any]:
        """Save member contact info from LLM tool call."""
        name = str(args.get("name", "")).strip()
        phone = str(args.get("phone", "")).strip()
        email = str(args.get("email") or "").strip()
        self._apply_member_to_session(session, name, phone, email)
        return {"ok": True, "name": name, "phone": phone, "email": email}

    async def _run_mixed_avail_tool(self, args: Dict[str, Any], ctx: Optional[ToolCallingContext] = None) -> Dict[str, Any]:
        """Execute mixed-room availability check (adapted from zhida)."""
        startdate = str(args.get("startdate", ""))
        enddate = str(args.get("enddate", ""))
        requests = _normalize_mixed_requests(args.get("requests") or [])
        if not requests:
            return {"ok": False, "error": "requests 至少需一筆有效需求", "all_available": False, "items": []}

        # Collect inventory for all needed occupancies
        candidates_occ = {1, 2}
        for r in requests:
            occ = _to_int(r.get("occupancy"), 0)
            if occ > 0:
                candidates_occ.add(occ)

        inventory_cards: List[Dict[str, Any]] = []
        for housingcnt in sorted(candidates_occ):
            try:
                raw = await asyncio.to_thread(query_pms, startdate, enddate, None, housingcnt)
                inventory_cards.extend(
                    _inventory_cards_from_pms_raw(raw, startdate, enddate, occupancy_fallback=housingcnt)
                )
            except Exception:
                continue
        inventory = _merge_room_inventory(inventory_cards)

        remaining = {
            str(c.get("room_type_code") or "").strip(): _to_int(c.get("available_count"), 0)
            for c in inventory if str(c.get("room_type_code") or "").strip()
        }

        item_results: List[Dict[str, Any]] = []
        all_available = True
        for req in requests:
            req_count = max(1, _to_int(req.get("room_count"), 1))
            candidates = _find_candidate_rooms(req, inventory)
            candidates = sorted(
                candidates,
                key=lambda c: (
                    abs(_to_int(c.get("max_occupancy"), 0) - _to_int(req.get("occupancy"), 0))
                    if _to_int(req.get("occupancy"), 0) > 0 else 0,
                    _to_int(c.get("price"), 0) or 10**12,
                    -_to_int(c.get("available_count"), 0),
                ),
            )
            chosen = next(
                (c for c in candidates if remaining.get(str(c.get("room_type_code") or "").strip(), 0) >= req_count),
                None,
            )
            if not chosen:
                all_available = False
                sample = candidates[0] if candidates else None
                item_results.append({
                    "request": req, "matched": False,
                    "room_type_code": sample.get("room_type_code") if sample else None,
                    "room_type_name": sample.get("room_type_name") if sample else None,
                    "requested_count": req_count,
                    "available_count": _to_int(sample.get("available_count"), 0) if sample else 0,
                    "reason": "INSUFFICIENT_INVENTORY_OR_NOT_FOUND",
                })
                continue

            code = str(chosen.get("room_type_code") or "").strip()
            remaining[code] = max(0, remaining.get(code, 0) - req_count)
            chosen_price = _to_int(chosen.get("price"), 0)
            item_results.append({
                "request": req, "matched": True,
                "room_type_code": chosen.get("room_type_code"),
                "room_type_name": chosen.get("room_type_name"),
                "requested_count": req_count,
                "available_count": _to_int(chosen.get("available_count"), 0),
                "max_occupancy": _to_int(chosen.get("max_occupancy"), 0),
                "price": chosen_price,
                "subtotal_price": chosen_price * req_count if chosen_price > 0 else 0,
            })

        # 產生 room_cards 讓前端顯示房卡 carousel
        if ctx is not None and inventory:
            cards = self._availability_to_room_cards(
                {"ok": True, "available": inventory},
                max((r.get("occupancy") or 2) for r in requests),
            )
            if cards:
                db = ctx.db
                cards = await _enrich_cards_with_kb(cards, db)
                ctx.room_cards = cards
            if startdate:
                ctx.checkin_date = startdate
            if enddate:
                ctx.checkout_date = enddate

        return {"ok": True, "all_available": all_available, "items": item_results}

    # _filter_faq_static removed — replaced by _kb_fallback_rooms (reads from DB)

    # ------------------------------------------------------------------
    # Shared session mutation helpers
    # ------------------------------------------------------------------

    def _apply_room_to_session(
        self,
        session: ChatbotSessionState,
        room_type_code: str,
        room_type_name: Optional[str],
        room_count: int,
        source: str = "pms",
    ) -> None:
        session.selected_room_type = room_type_code
        session.selected_room_name = room_type_name or _room_display_name(room_type_code)
        session.selected_room_count = max(1, room_count)
        session.selected_room_source = source
        session.intent_state = "confirmed"

    def _apply_member_to_session(
        self,
        session: ChatbotSessionState,
        name: str,
        phone: str,
        email: str,
    ) -> None:
        session.member_name = name
        session.member_phone = phone
        session.member_email = email

    # ------------------------------------------------------------------
    # Rooms API (GET /chatbot/rooms)
    # ------------------------------------------------------------------

    async def get_rooms(
        self,
        *,
        browser_key: str,
        checkin_date: str,
        checkout_date: str,
        adults: int,
        db: Optional[AsyncSession] = None,
    ) -> ChatbotRoomsOutSchema:
        session = self.get_or_create_session(browser_key)
        session.checkin_date = checkin_date
        session.checkout_date = checkout_date
        session.booking_adults = adults

        try:
            raw = await asyncio.to_thread(query_pms, checkin_date, checkout_date, None, adults)
            availability = self._extract_availability(raw, checkin_date, checkout_date)
            cards = self._availability_to_room_cards(availability, adults)
            if cards:
                # Spec: PMS 資料為主，FAQ_KB 補充圖片與特色
                cards = await _enrich_cards_with_kb(cards, db)
                source: str = "pms"
            else:
                cards = await _kb_fallback_rooms(db, adults)
                source = "faq_kb"
        except Exception:
            cards = await _kb_fallback_rooms(db, adults)
            source = "faq_kb"

        session.last_room_cards = cards
        return ChatbotRoomsOutSchema(source=source, rooms=cards)

    # ------------------------------------------------------------------
    # Confirm room (POST /chatbot/confirm-room) — spec 3.4
    # ------------------------------------------------------------------

    def confirm_room(
        self,
        *,
        browser_key: str,
        room_type_code: str,
        room_count: int,
        room_type_name: Optional[str] = None,
        source: Optional[str] = None,
    ) -> ConfirmRoomOutSchema:
        """Legacy single-room confirm (backward compat)."""
        return self.confirm_rooms(
            browser_key=browser_key,
            rooms=[{
                "room_type_code": room_type_code,
                "room_count": max(1, room_count),
                "room_type_name": room_type_name,
                "source": source or "pms",
            }],
        )

    def confirm_rooms(
        self,
        *,
        browser_key: str,
        rooms: List[Dict[str, Any]],
    ) -> ConfirmRoomOutSchema:
        """Multi-room confirm — spec v0.6+."""
        session = self.get_or_create_session(browser_key)
        # Store all selected rooms
        session.selected_rooms = rooms
        # Also apply first room for backward compatibility
        first = rooms[0]
        self._apply_room_to_session(
            session,
            first["room_type_code"],
            first.get("room_type_name"),
            max(1, first.get("room_count", 1)),
            source=first.get("source", "pms"),
        )
        from app.schemas.chatbot import MemberPrefillSchema
        prefill = MemberPrefillSchema(
            guest_name=session.member_name or "",
            guest_phone=session.member_phone or "",
            guest_email=session.member_email or "",
        ) if (session.member_name or session.member_phone or session.member_email) else None

        return ConfirmRoomOutSchema(
            session_id=session.session_id,
            selected_room_type=session.selected_room_type or first["room_type_code"],
            selected_room_count=session.selected_room_count or 1,
            member_form=_MEMBER_FORM,
            member_prefill=prefill,
        )

    # ------------------------------------------------------------------
    # Booking save (spec: POST /chatbot/booking-save)
    # ------------------------------------------------------------------

    def booking_save(
        self,
        *,
        browser_key: str,
        member_name: Optional[str] = None,
        member_phone: Optional[str] = None,
        member_email: Optional[str] = None,
        checkin_date: Optional[str] = None,
        checkout_date: Optional[str] = None,
    ):
        """Validate and save booking. Returns BookingSaveOutSchema-compatible dict."""
        from app.schemas.chatbot import BookingSaveOutSchema, BookingSavedDetailSchema

        session = self.get_or_create_session(browser_key)

        # Merge: payload overrides session values
        name = member_name or session.member_name or ""
        phone = member_phone or session.member_phone or ""
        email = member_email or session.member_email or ""
        checkin = checkin_date or session.checkin_date or ""
        checkout = checkout_date or session.checkout_date or ""

        # --- Validation ---
        # 1. Incomplete context check
        missing: List[str] = []
        if not checkin:
            missing.append("checkin_date")
        if not checkout:
            missing.append("checkout_date")
        if not session.selected_rooms and not session.selected_room_type:
            missing.append("selected_rooms")
        if not name:
            missing.append("member_name")
        if missing:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail={"error_code": "INCOMPLETE_BOOKING_CONTEXT", "message": f"缺少必要欄位：{missing}"},
            )

        # 2. Phone format (10 digits)
        if not str(phone).isdigit() or len(str(phone)) != 10:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail={"error_code": "INVALID_PHONE", "message": "電話格式錯誤，請輸入 10 位數號碼"},
            )

        # 2.5 Email format (must contain @)
        if email and "@" not in email:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail={"error_code": "INVALID_EMAIL", "message": "Email 格式錯誤"},
            )

        # 3. Date range
        try:
            checkin_obj = datetime.strptime(checkin, "%Y-%m-%d").date()
            checkout_obj = datetime.strptime(checkout, "%Y-%m-%d").date()
            if checkout_obj <= checkin_obj:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=422,
                    detail={"error_code": "INVALID_DATE_RANGE", "message": "退房日期必須晚於入住日期"},
                )
        except ValueError:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail={"error_code": "INVALID_DATE_RANGE", "message": "日期格式錯誤"},
            )

        # --- Compose selected_rooms snapshot ---
        selected_rooms = list(session.selected_rooms) if session.selected_rooms else []
        if not selected_rooms and session.selected_room_type:
            selected_rooms = [{
                "room_type_code": session.selected_room_type,
                "room_count": session.selected_room_count or 1,
                "room_type_name": session.selected_room_name or session.selected_room_type,
                "source": session.selected_room_source or "pms",
            }]

        first_room = selected_rooms[0] if selected_rooms else {}
        session.member_name = name
        session.member_phone = phone
        session.member_email = email
        session.checkin_date = checkin
        session.checkout_date = checkout
        session.selected_rooms = selected_rooms
        if first_room:
            self._apply_room_to_session(
                session,
                first_room.get("room_type_code", ""),
                first_room.get("room_type_name"),
                first_room.get("room_count", 1),
                source=first_room.get("source", "pms"),
            )

        cart_url: Optional[str] = None
        # 呼叫外部訂房 API 取得付款 URL
        try:
            cart_url = _call_booking_api(
                rooms=selected_rooms,
                checkin=checkin,
                checkout=checkout,
                name=name,
                phone=phone,
                email=email,
                line_uid=browser_key if browser_key.startswith("U") else f"web_{browser_key[:16]}",
            )
        except Exception as e:
            logger.warning(f"[booking_save] External booking API failed: {e}")
            cart_url = None

        # --- Generate reservation_id ---
        reservation_id = str(uuid4())

        # --- Try DB save (if available) ---
        crm_member_id = None
        db_saved = False
        try:
            from app.config import settings as _s
            if getattr(_s, "ENABLE_DB", True):
                from sqlalchemy.orm import Session as DbSession
                from app.database import SessionLocal
                from app.models.chatbot_booking import BookingRecord, ChatbotSession as ChatbotSessionModel
                from app.models.member import Member

                db: DbSession = SessionLocal()
                try:
                    # Upsert member：優先找 widget 對話建立的 guest Member（webchat_uid=browser_key），
                    # 把它「升級」為正式會員以保留對話歷史；否則 fallback 到 phone+email 查詢
                    existing_member = db.query(Member).filter(
                        Member.webchat_uid == browser_key
                    ).first()
                    if existing_member is None:
                        existing_member = db.query(Member).filter(
                            Member.phone == phone,
                            Member.email == email,
                        ).first()
                    if existing_member:
                        existing_member.name = name
                        existing_member.phone = phone
                        existing_member.email = email
                        existing_member.last_interaction_at = datetime.now()
                        # 從訪客升級為正式會員
                        if getattr(existing_member, "is_guest", False):
                            existing_member.is_guest = False
                        crm_member_id = existing_member.id
                    else:
                        new_member = Member(
                            name=name,
                            phone=phone,
                            email=email,
                            webchat_uid=browser_key,
                            join_source="Webchat",
                            gpt_enabled=True,
                            is_guest=False,
                            last_interaction_at=datetime.now(),
                        )
                        db.add(new_member)
                        db.flush()
                        crm_member_id = new_member.id

                    # Upsert chatbot session
                    chatbot_session_rec = db.query(ChatbotSessionModel).filter_by(
                        id=session.session_id
                    ).first()
                    if not chatbot_session_rec:
                        chatbot_session_rec = ChatbotSessionModel(id=session.session_id)
                        db.add(chatbot_session_rec)
                    chatbot_session_rec.browser_key = browser_key
                    chatbot_session_rec.hotel_id = session.hotel_id
                    chatbot_session_rec.intent_state = session.intent_state
                    chatbot_session_rec.turn_count = session.turn_count
                    chatbot_session_rec.booking_adults = session.booking_adults
                    chatbot_session_rec.checkin_date = checkin_obj if checkin else None
                    chatbot_session_rec.checkout_date = checkout_obj if checkout else None
                    chatbot_session_rec.room_plan_requests = list(session.room_plan_requests)
                    chatbot_session_rec.selected_rooms = selected_rooms
                    chatbot_session_rec.selected_room_type = first_room.get("room_type_code")
                    chatbot_session_rec.selected_room_count = first_room.get("room_count", 1)
                    chatbot_session_rec.member_name = name
                    chatbot_session_rec.member_phone = phone
                    chatbot_session_rec.member_email = email
                    chatbot_session_rec.crm_member_id = crm_member_id
                    chatbot_session_rec.needs_human_followup = session.needs_human_followup

                    # Insert booking record
                    booking_rec = BookingRecord(
                        id=reservation_id,
                        session_id=session.session_id,
                        crm_member_id=crm_member_id,
                        selected_rooms=selected_rooms,
                        room_type_code=first_room.get("room_type_code", ""),
                        room_type_name=first_room.get("room_type_name", ""),
                        room_count=first_room.get("room_count", 1),
                        checkin_date=checkin_obj,
                        checkout_date=checkout_obj,
                        adults=session.booking_adults or 2,
                        member_name=name,
                        member_phone=phone,
                        member_email=email,
                        cart_url=cart_url,
                        session_log=list(session.history),
                        data_source=first_room.get("source", "pms"),
                        db_saved=True,
                        source="Webchat",
                    )
                    db.add(booking_rec)
                    db.commit()
                    db_saved = True
                except Exception:
                    db.rollback()
                finally:
                    db.close()
        except Exception:
            pass  # DB unavailable → JSON fallback

        # --- 寫轉單互動標籤（booking_conversion，對齊 LINE booking_callback）---
        # 訂單實際成立才寫；DB 儲存失敗就跳過。每個 selected_room 對應一筆，
        # tag_name=房型名稱、tag_source='booking_conversion'，落在會員管理「轉單」tab
        if db_saved and crm_member_id and selected_rooms:
            try:
                from app.database import SessionLocal
                from sqlalchemy import text as _text
                conv_db = SessionLocal()
                try:
                    now_dt = datetime.now()
                    for room in selected_rooms:
                        raw_name = (room.get("room_type_name") or room.get("room_type_code") or "").strip()
                        if not raw_name:
                            continue
                        tag_name = raw_name[:20]  # 與 LINE booking_callback 對齊（截 20）
                        room_qty = max(1, int(room.get("room_count") or 1))

                        # tag_trigger_logs：每次訂單都新增一筆 CONVERSION
                        conv_db.execute(
                            _text("""
                                INSERT INTO tag_trigger_logs
                                    (member_id, tag_id, tag_type, tag_name,
                                     trigger_source, triggered_at, created_at)
                                VALUES
                                    (:mid, NULL, 'interaction', :tag_name,
                                     'CONVERSION', :triggered_at, NOW())
                            """),
                            {"mid": crm_member_id, "tag_name": tag_name, "triggered_at": now_dt},
                        )

                        # member_interaction_tags：upsert 同 (member, tag_name, tag_source='booking_conversion')
                        existing_row = conv_db.execute(
                            _text("""
                                SELECT id FROM member_interaction_tags
                                WHERE member_id = :mid
                                  AND tag_name = :tag_name
                                  AND tag_source = 'booking_conversion'
                                LIMIT 1
                            """),
                            {"mid": crm_member_id, "tag_name": tag_name},
                        ).first()
                        if existing_row:
                            conv_db.execute(
                                _text("""
                                    UPDATE member_interaction_tags
                                    SET click_count = click_count + :qty,
                                        last_triggered_at = :triggered_at
                                    WHERE id = :eid
                                """),
                                {"qty": room_qty, "triggered_at": now_dt, "eid": existing_row.id},
                            )
                        else:
                            conv_db.execute(
                                _text("""
                                    INSERT INTO member_interaction_tags
                                        (member_id, tag_name, tag_source, click_count,
                                         last_triggered_at, message_id, tagged_at, created_at)
                                    VALUES
                                        (:mid, :tag_name, 'booking_conversion', :qty,
                                         :triggered_at, NULL, :triggered_at, NOW())
                                """),
                                {"mid": crm_member_id, "tag_name": tag_name,
                                 "qty": room_qty, "triggered_at": now_dt},
                            )
                    conv_db.commit()
                    logger.info(
                        f"[booking_conversion] member_id={crm_member_id} "
                        f"rooms={[r.get('room_type_name') for r in selected_rooms]}"
                    )
                except Exception:
                    conv_db.rollback()
                    logger.exception("[booking_conversion] write failed (booking still saved)")
                finally:
                    conv_db.close()
            except Exception:
                logger.exception("[booking_conversion] outer failure")

        # 訂房完成，清掉訂房狀態（下次對話重新收集）
        session.checkin_date = None
        session.checkout_date = None
        session.booking_adults = None
        session.selected_rooms = []
        session.selected_room_type = None
        session.selected_room_count = None

        return BookingSaveOutSchema(
            ok=True,
            reservation_id=reservation_id,
            cart_url=cart_url,
            saved=BookingSavedDetailSchema(
                crm_member_id=crm_member_id,
                selected_rooms=selected_rooms,
                room_type_code=first_room.get("room_type_code"),
                db_saved=db_saved,
            ),
        )

    # ------------------------------------------------------------------
    # Session reset
    # ------------------------------------------------------------------

    def reset(self, browser_key: str) -> SessionResetOutSchema:
        session = self.reset_session(browser_key)
        return SessionResetOutSchema(ok=True, session_id=session.session_id)

    # ------------------------------------------------------------------
    # PMS response parsing helpers
    # ------------------------------------------------------------------

    def _extract_availability(self, result: dict, startdate: str, enddate: str) -> dict:
        if not isinstance(result, dict) or "room" not in result:
            return {"ok": False, "available": []}

        # Use string comparison — ISO-8601 dates sort lexicographically
        has_range = bool(startdate and enddate)

        available = []
        for room in result.get("room", []) or []:
            room_type = str(room.get("roomtype") or "").strip()
            data_rows = room.get("data", []) or []
            if not room_type or not data_rows:
                continue

            if has_range:
                filtered = [
                    row for row in data_rows
                    if startdate <= str(row.get("odate") or "") < enddate
                ]
            else:
                filtered = data_rows

            if not filtered:
                filtered = data_rows

            remains = [_to_int(item.get("remain"), 0) for item in filtered]
            if not remains:
                continue
            min_remain = min(remains)
            if min_remain <= 0:
                continue

            available.append({
                "roomtype": room_type,
                "name": _room_display_name(room_type),
                "nightly_price": _clean_price(filtered[0].get("price", 0)),
                "min_remain": min_remain,
                "image": str(room.get("image") or "").strip() or None,
            })

        return {"ok": True, "available": available}

    def _availability_to_room_cards(
        self, availability: dict, housingcnt: Optional[int] = None,
    ) -> List[RoomCardSchema]:
        """將 PMS 可用房型轉為房卡。

        housingcnt=None：未指定人數，依 max_occupancy 由小到大排序，不過濾。
        housingcnt=整數：過濾 max_occupancy >= housingcnt，再依「匹配度、價格」排序。
        """
        cards = [
            RoomCardSchema(
                room_type_code=item["roomtype"],
                room_type_name=item["name"],
                price=item["nightly_price"],
                price_label=f"NT${item['nightly_price']:,}/晚",
                available_count=item["min_remain"],
                max_occupancy=ROOMTYPE_MAX_OCCUPANCY.get(item["roomtype"], 2),
                image_url=item.get("image"),
                features="",
                source="pms",
            )
            for item in availability.get("available", [])
        ]
        if housingcnt is None:
            # 未指定人數：依人數由小到大排序，相同人數則價格低者優先
            cards.sort(key=lambda c: ((c.max_occupancy or 2), c.price if c.price > 0 else 10**12))
            return cards
        # 指定人數：過濾後依匹配度排序
        filtered = [c for c in cards if (c.max_occupancy or 2) >= housingcnt]
        result = filtered if filtered else cards
        result.sort(key=lambda c: (abs((c.max_occupancy or 2) - housingcnt), c.price if c.price > 0 else 10**12))
        return result

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _booking_context(self, session: ChatbotSessionState) -> BookingContextSchema:
        return BookingContextSchema(
            checkin_date=session.checkin_date,
            checkout_date=session.checkout_date,
            adults=session.booking_adults,
            room_plan_requests=list(session.room_plan_requests),
        )

    def _compute_missing_fields(self, session: ChatbotSessionState) -> List[str]:
        """訂房 context 齊全條件 → 入住日與退房日都有才算齊全（人數／房型已改為選填）。"""
        missing: List[str] = []
        if not session.checkin_date:
            missing.append("checkin_date")
        if not session.checkout_date:
            missing.append("checkout_date")
        return missing

    def _determine_reply_type(
        self, session: ChatbotSessionState, room_cards: List[RoomCardSchema],
    ) -> ReplyType:
        """Determine reply_type and clear stale room selection when new cards arrive."""
        if room_cards:
            session.intent_state = "confirmed"
            session.selected_room_type = None
            session.selected_room_count = None
            session.selected_room_name = None
            session.selected_room_source = None
            session.selected_rooms = []
            return "room_cards"
        elif self._has_selected_room(session) and self._has_member_profile(session):
            return "booking_confirm"
        elif self._has_selected_room(session):
            return "member_form"
        return "text"

    async def _pms_fallback(
        self, session: ChatbotSessionState, ctx: ToolCallingContext,
        room_cards: List[RoomCardSchema],
    ) -> List[RoomCardSchema]:
        """Query PMS if LLM didn't call the tool but we have enough info."""
        if room_cards or ctx.pms_called or not session.checkin_date or not session.checkout_date:
            return room_cards
        adults = 2
        if session.room_plan_requests:
            adults = session.room_plan_requests[0].get("adults_per_room", 2)
        try:
            ctx.checkin_date = session.checkin_date
            ctx.checkout_date = session.checkout_date
            ctx.booking_adults = adults
            _, fallback_cards = await self._run_pms_tool(
                {"startdate": session.checkin_date, "enddate": session.checkout_date, "housingcnt": adults},
                ctx,
            )
            if fallback_cards:
                return fallback_cards
        except Exception as e:
            logger.warning(f"[PMS fallback] query error: {e}")
        return room_cards

    # ------------------------------------------------------------------
    # Deterministic extraction helpers
    # ------------------------------------------------------------------

    def _extract_room_plan(self, message: str) -> Optional[Dict[str, int]]:
        """Spec: '我要X間Y人房' → {room_count, adults_per_room}。不調用 LLM。"""
        cn_num = {"一": 1, "二": 2, "兩": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}
        # Pattern: [X間][Y人房 | 雙人房 | 單人房 | ...]
        room_count_match = re.search(r"(\d+)\s*間", message)
        if room_count_match:
            room_count = int(room_count_match.group(1))
        else:
            cn_match = re.search(r"([一二兩三四五六七八九十])\s*間", message)
            room_count = cn_num.get(cn_match.group(1), 1) if cn_match else None

        # Named room type → people count
        named = {"雙人房": 2, "單人房": 1, "家庭房": 4, "四人房": 4, "三人房": 3}
        for name, people in named.items():
            if name in message:
                return {"room_count": room_count or 1, "adults_per_room": people}

        # Numeric: X人房
        numeric_match = re.search(r"(\d+)\s*人\s*房", message)
        if numeric_match:
            return {"room_count": room_count or 1, "adults_per_room": int(numeric_match.group(1))}

        # 只說了「X間」但沒說房型 → 不算齊全
        return None

    def _extract_dates(self, message: str) -> Optional[Tuple[str, str]]:
        """從使用者訊息中提取入住/退房日期，支援多種常見格式。"""
        today = datetime.now(ZoneInfo("Asia/Taipei")).date()
        current_year = today.year

        cn_digits = {"一": 1, "二": 2, "兩": 2, "三": 3, "四": 4, "五": 5,
                     "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
                     "〇": 0, "零": 0}

        def _cn_to_int(s: str) -> Optional[int]:
            """中文數字轉 int：十八→18, 二十→20, 三→3"""
            s = s.strip()
            if not s:
                return None
            # 純阿拉伯數字
            if s.isdigit():
                return int(s)
            result = 0
            current = 0
            for ch in s:
                if ch == "十":
                    result += (current or 1) * 10
                    current = 0
                elif ch in cn_digits:
                    current = cn_digits[ch]
                else:
                    return None
            return result + current if (result + current) > 0 else None

        def _extract_nights(msg: str) -> Optional[int]:
            m_night = re.search(r"(\d+)\s*晚", msg)
            if m_night:
                return int(m_night.group(1))
            m_night_cn = re.search(r"([一二兩三四五六七八九十]+)\s*晚", msg)
            if m_night_cn:
                return _cn_to_int(m_night_cn.group(1)) or 1
            return None

        nights = _extract_nights(message) or 1

        # --- 相對日期：今天、明天、後天、大後天 ---
        relative_map = {"今天": 0, "今晚": 0, "今日": 0,
                        "明天": 1, "明日": 1,
                        "後天": 2, "後天": 2,
                        "大後天": 3, "大後天": 3}
        for keyword, delta in relative_map.items():
            if keyword in message:
                checkin = today + timedelta(days=delta)
                checkout = checkin + timedelta(days=nights)
                return checkin.isoformat(), checkout.isoformat()

        # --- Pattern: M月D號到M月D號 ---
        m = re.search(
            r"(\d{1,2})月(\d{1,2})[號號日](?:.*?)(?:住到|退房|到|至|～|~)(?:(\d{1,2})月)?(\d{1,2})[號號日]",
            message,
        )
        if m:
            out_month = int(m.group(3)) if m.group(3) else int(m.group(1))
            checkin = date(current_year, int(m.group(1)), int(m.group(2)))
            checkout = date(current_year, out_month, int(m.group(4)))
            return checkin.isoformat(), checkout.isoformat()

        # --- Pattern: YYYY/M/D or YYYY-M-D or YYYY.M.D ---
        m_full = re.search(r"(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})", message)
        if m_full:
            checkin = date(int(m_full.group(1)), int(m_full.group(2)), int(m_full.group(3)))
            rest = message[m_full.end():]
            m_co = re.search(r"(?:到|至|～|~|—|-)\s*(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})", rest)
            if m_co:
                checkout = date(int(m_co.group(1)), int(m_co.group(2)), int(m_co.group(3)))
            else:
                m_co2 = re.search(r"(?:到|至|～|~|—|-)\s*(\d{1,2})[/\-.](\d{1,2})", rest)
                if m_co2:
                    checkout = date(current_year, int(m_co2.group(1)), int(m_co2.group(2)))
                else:
                    checkout = checkin + timedelta(days=nights)
            return checkin.isoformat(), checkout.isoformat()

        # --- Pattern: M/D到M/D or M.D到M.D ---
        m2 = re.search(r"(\d{1,2})[/\-.](\d{1,2}).*?(?:到|至|～|~).*?(\d{1,2})[/\-.](\d{1,2})", message)
        if m2:
            checkin = date(current_year, int(m2.group(1)), int(m2.group(2)))
            checkout = date(current_year, int(m2.group(3)), int(m2.group(4)))
            return checkin.isoformat(), checkout.isoformat()

        # --- Pattern: M/D or M.D or M-D（單一日期）---
        m3 = re.search(r"(\d{1,2})[/\-.](\d{1,2})", message)
        if m3:
            checkin = date(current_year, int(m3.group(1)), int(m3.group(2)))
            checkout = checkin + timedelta(days=nights)
            return checkin.isoformat(), checkout.isoformat()

        # --- Pattern: M月D號 or M月D日（單一日期）---
        m4 = re.search(r"(\d{1,2})月(\d{1,2})[號號日]?", message)
        if m4:
            checkin = date(current_year, int(m4.group(1)), int(m4.group(2)))
            checkout = checkin + timedelta(days=nights)
            return checkin.isoformat(), checkout.isoformat()

        # --- Pattern: 中文數字「三月十八」「三月十八號」---
        m5 = re.search(r"([一二三四五六七八九十]+)月([一二三四五六七八九十零〇]+)[號號日]?", message)
        if m5:
            month = _cn_to_int(m5.group(1))
            day = _cn_to_int(m5.group(2))
            if month and day:
                checkin = date(current_year, month, day)
                checkout = checkin + timedelta(days=nights)
                return checkin.isoformat(), checkout.isoformat()

        return None

    def _has_booking_intent(self, message: str) -> bool:
        """Spec: 訊息含明確訂房信號 → intent_state = confirmed.

        明確訂房信號（擇一即成立）：
        - 含「X間」（例：我要1間）
        - 含「X人房」（例：雙人房、4人房）
        - 含日期格式 M/D（例：3/7）
        - 含「空房」「有房嗎」「可以訂」等直接查詢
        """
        m = message
        if re.search(r"\d+\s*間", m):
            return True
        if re.search(r"\d+\s*人\s*房", m):
            return True
        if re.search(r"雙人房|單人房|家庭房|四人房|三人房", m):
            return True
        if re.search(r"\d+[/月]\d+", m):
            return True
        if any(kw in m for kw in ("空房", "有房嗎", "可以訂", "訂房", "預訂", "入住")):
            return True
        return False

    def _has_selected_room(self, session: ChatbotSessionState) -> bool:
        return bool(session.selected_room_type and session.selected_room_count)

    def _has_member_profile(self, session: ChatbotSessionState) -> bool:
        return bool(session.member_name and session.member_phone)


    # ------------------------------------------------------------------
    # LINE / 會員聊天室 AI 回覆
    # ------------------------------------------------------------------

    async def chat(
        self,
        db: AsyncSession,
        message: str,
        line_uid: Optional[str] = None,
        industry_id: Optional[int] = None,
    ) -> ChatbotMessageOutSchema:
        """
        會員聊天室 AI 入口（LINE / Facebook / Webchat）

        與 handle_message() 共用 _unified_tool_loop + _execute_tool + 訂房流程。
        差異：
        - 對話歷史從 DB 讀取（保留原本 session 管理）
        - 自動貼標籤（根據 AI 引用的規則）
        - Token 耗盡時降級為自動回應
        - 用 line_uid 作為 session key 追蹤訂房狀態
        """
        # 1. Token 額度檢查（保留）
        token_usage = await self._get_token_usage(db, industry_id)
        if token_usage is None:
            return self._chat_error("系統尚未設定產業資料")
        if isinstance(token_usage, ChatbotMessageOutSchema):
            return token_usage  # exhausted error

        # 2. Booking session — 用 line_uid 追蹤訂房狀態（不影響對話歷史）
        session_key = line_uid or f"anon-{uuid4()}"
        session = self.get_or_create_session(session_key)

        # 2.1 Turn count（同 handle_message — 5 輪後 reset）
        if session.turn_count >= self._max_turns:
            session = self.reset_session(session_key)
        session.turn_count += 1

        # 3. 對話歷史用記憶體 session（與 handle_message 統一，不從 DB 讀）
        session.history.append({"role": "user", "content": message})
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": _build_system_prompt()},
            *session.history,
        ]

        # 4. Intent detection（同 handle_message）
        if session.intent_state == "detecting" and self._has_booking_intent(message):
            session.intent_state = "confirmed"

        # 5. 確定性日期/房型提取 → 同步到 session
        past_date_warning: Optional[str] = None
        try:
            dates = self._extract_dates(message)
            if dates:
                checkin_obj = date.fromisoformat(dates[0])
                today = datetime.now(ZoneInfo("Asia/Taipei")).date()
                if checkin_obj < today:
                    past_date_warning = "您輸入的日期已過，請重新提供入住與退房日期。"
                else:
                    session.checkin_date = dates[0]
                    session.checkout_date = dates[1]
        except Exception as e:
            logger.warning(f"Date extraction failed: {e}")
        room_plan = self._extract_room_plan(message)
        if room_plan:
            session.room_plan_requests = [room_plan]
            session.booking_adults = room_plan["room_count"] * room_plan["adults_per_room"]

        # 6. 建 ToolCallingContext — 帶 _session 解鎖 confirm_room + save_member_info
        ctx = ToolCallingContext(
            db=db,
            collect_rule_ids=True,
            _session=session,
            checkin_date=session.checkin_date,
            checkout_date=session.checkout_date,
            booking_adults=session.booking_adults,
        )

        # 7. 附加已知訂房狀態到 system prompt
        known_parts = []
        missing_parts = []
        if session.checkin_date:
            known_parts.append(f"入住日期：{session.checkin_date}")
        else:
            missing_parts.append("入住日期")
        if session.checkout_date:
            known_parts.append(f"退房日期：{session.checkout_date}")
        else:
            missing_parts.append("住幾晚")
        # 人數／房型屬於選填，僅在使用者主動提供時列入 known_parts
        if session.booking_adults:
            known_parts.append(f"人數：{session.booking_adults}")
        if session.room_plan_requests:
            rp = session.room_plan_requests[0] if session.room_plan_requests else {}
            known_parts.append(f"房型需求：{rp.get('room_count', 1)}間{rp.get('adults_per_room', 2)}人房")

        if known_parts:
            messages[0]["content"] += "\n\n目前已收集到的訂房資訊（不需要再追問這些）：\n" + "、".join(known_parts)
        if missing_parts:
            messages[0]["content"] += "\n尚缺：" + "、".join(missing_parts) + " → 請追問這些資訊"
        elif session.checkin_date and session.checkout_date:
            messages[0]["content"] += "\n→ 兩項資訊已齊全，你必須在本次回覆中呼叫 query_pms_availability，不可只回文字，嚴禁追問人數或房型。"

        # 統一 Tool Calling 迴圈
        if past_date_warning:
            reply = past_date_warning
            room_cards: List[RoomCardSchema] = []
        else:
            reply = await self._unified_tool_loop(messages, ctx)
            room_cards = ctx.room_cards
            # Context sync-back（同 handle_message）
            if ctx.checkin_date is not None:
                session.checkin_date = ctx.checkin_date
            if ctx.checkout_date is not None:
                session.checkout_date = ctx.checkout_date
            if ctx.booking_adults is not None:
                session.booking_adults = ctx.booking_adults

        # 先保存 booking_context（房卡產生後會清掉 session 日期）
        booking_ctx = self._booking_context(session)

        if room_cards:
            session.last_room_cards = room_cards
            # 房卡已出現：清 history 和 intent（避免下次查詢被舊對話誤導）
            # 但保留日期和人數（booking-save 還需要用）
            session.room_plan_requests = []
            session.history = []
            session.intent_state = "idle"

        session.history.append({"role": "assistant", "content": reply})
        reply_type = self._determine_reply_type(session, room_cards)

        # Token deduction
        if token_usage and ctx.total_tokens_used > 0:
            token_usage.used_amount += ctx.total_tokens_used
            await db.flush()

        # 11. Auto-tagging（保留）
        referenced_rule_ids = list(ctx.referenced_rule_ids)
        auto_tags = await self._auto_tag_member(db, line_uid, referenced_rule_ids)

        # 12. 更新 session 時間戳
        session.ts = time.time()

        return ChatbotMessageOutSchema(
            session_id=session.session_id,
            intent_state=session.intent_state,
            reply_type=reply_type,
            reply=reply,
            room_cards=room_cards,
            missing_fields=self._compute_missing_fields(session),
            turn_count=session.turn_count,
            booking_context=booking_ctx,
            member_form=_MEMBER_FORM if reply_type == "member_form" else None,
            tokens_used=ctx.total_tokens_used,
            referenced_rules=[{"rule_id": rid} for rid in referenced_rule_ids],
            auto_tags=auto_tags,
            token_exhausted=False,
            unanswered=ctx.unanswered,
        )

    async def test_chat(
        self,
        db: AsyncSession,
        message: str,
    ) -> Dict[str, Any]:
        """測試聊天（讀 draft + active，扣 token，不貼 tag）"""
        token_usage = await self._get_token_usage(db, check_exhausted=False)

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": _build_system_prompt()},
            {"role": "user", "content": message},
        ]

        ctx = ToolCallingContext(db=db, test_mode=True, collect_rule_ids=True)
        reply = await self._unified_tool_loop(messages, ctx)

        if token_usage and not isinstance(token_usage, ChatbotMessageOutSchema) and ctx.total_tokens_used > 0:
            token_usage.used_amount += ctx.total_tokens_used
            await db.flush()

        return {
            "reply": reply,
            "tokens_used": ctx.total_tokens_used,
            "referenced_rules": [],
            "auto_tags": [],
        }

    async def _get_token_usage(
        self, db: AsyncSession, industry_id: Optional[int] = None, check_exhausted: bool = True,
    ) -> Any:
        """取得 token 額度。回傳 AiTokenUsage | None（無產業）| dict（額度用完 error）"""
        if not industry_id:
            ind_result = await db.execute(
                select(Industry).where(Industry.is_active == True).limit(1)  # noqa: E712
            )
            industry = ind_result.scalar_one_or_none()
            if not industry:
                return None
            industry_id = industry.id

        usage_result = await db.execute(
            select(AiTokenUsage).where(AiTokenUsage.industry_id == industry_id)
        )
        token_usage = usage_result.scalar_one_or_none()

        if check_exhausted and token_usage and token_usage.total_quota > 0:
            if token_usage.used_amount >= token_usage.total_quota:
                return self._chat_error(
                    "AI Token 額度已用完，系統已降級至關鍵字回覆模式。",
                    token_exhausted=True,
                )

        return token_usage

    async def _get_conversation_history(
        self, db: AsyncSession, line_uid: str, limit: int = 10
    ) -> List[Dict[str, str]]:
        """從 conversation_messages 取得近 N 輪對話歷史"""
        stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.thread_id == line_uid)
            .order_by(ConversationMessage.created_at.desc())
            .limit(limit * 2 + 1)
        )
        result = await db.execute(stmt)
        msgs = result.scalars().all()

        if not msgs:
            return []

        # 排除最新一筆 incoming（LINE App 在呼叫 AI 前已存入 DB）
        if msgs[0].role == "user":
            msgs = msgs[1:]

        return [
            {"role": m.role, "content": m.content}
            for m in reversed(msgs) if m.content
        ]

    async def _auto_tag_member(
        self,
        db: AsyncSession,
        line_uid: Optional[str],
        referenced_rule_ids: List[int],
        member: Optional[Member] = None,
    ) -> List[str]:
        """自動為會員貼標籤（只貼 AI 當次引用的規則標籤）。

        member 直接傳入（widget 訪客流程）時優先使用；
        否則用 line_uid 查（既有 LINE/會員聊天室流程）。
        """
        if not referenced_rule_ids:
            return []
        if member is None:
            if not line_uid:
                return []
            member_result = await db.execute(
                select(Member).where(Member.line_uid == line_uid)
            )
            member = member_result.scalar_one_or_none()
        if not member:
            return []

        # 1) 會員標籤：依 FaqRuleTag.tag_name 寫入
        tag_result = await db.execute(
            select(FaqRuleTag.tag_name)
            .where(FaqRuleTag.rule_id.in_(referenced_rule_ids))
            .distinct()
        )
        tag_names = {t for (t,) in tag_result.all()}

        existing_result = await db.execute(
            select(MemberTag.tag_name).where(
                MemberTag.member_id == member.id,
                MemberTag.tag_name.in_(tag_names) if tag_names else MemberTag.tag_name == "",
                MemberTag.message_id == None,  # noqa: E711
            )
        )
        existing_tags = {t for (t,) in existing_result.all()}

        from app.services.platform_channel_resolver import resolve_for_member
        platform, channel_id = resolve_for_member(member)

        tagged: List[str] = []
        for tag_name in tag_names - existing_tags:
            db.add(MemberTag(
                member_id=member.id,
                tag_name=tag_name,
                tag_source="AI_chatbot",
                platform=platform,
                channel_id=channel_id,
            ))
            tagged.append(tag_name)
        if tagged:
            await db.flush()

        # 2) 互動標籤：純聊天**不寫**互動標籤
        #    語意校正：互動標籤＝點擊行為（房卡 +、選圖片、確認房型）才產生
        #    純聊天命中 FAQ 只寫會員標籤；互動標籤交由 track_widget_click + LINE 點擊事件獨佔

        # 寫 tag_trigger_logs（供時段洞察 heatmap 使用）— 只記會員標籤觸發
        from app.services.tag_trigger_service import record_tag_trigger
        from app.models.tag_trigger_log import TagType, TriggerSource
        for tag_name in tag_names:
            await record_tag_trigger(
                db,
                member_id=member.id,
                tag_name=tag_name,
                tag_type=TagType.MEMBER,
                source=TriggerSource.INTERACTION,
                platform=platform,
                channel_id=channel_id,
            )
        return tagged

    async def track_widget_click(
        self,
        *,
        db: AsyncSession,
        browser_key: str,
        event_type: str,
        category_name: Optional[str] = None,
        rule_id: Optional[int] = None,
        room_type_code: Optional[str] = None,
    ) -> bool:
        """處理 widget 點擊事件 → 寫互動標籤。

        - tag_source 依 event_type 切換，與 LINE 對齊：
            * room_select（房卡按 +）→ 'room_card_click'
            * 其餘事件（FAQ 規則、未來的 suggestion / image 點擊）→ 'auto_click'
        - 找 Member by webchat_uid=browser_key，找不到視為訪客還沒講過話 → 直接 return False
        - rule_id 優先：對應 FaqRule.category_id 的 FaqCategory.name 即互動標籤
        - 無 rule_id 才用 category_name（房卡情境傳房型名稱，FAQ 情境傳分類名稱）
        """
        from app.services.tag_trigger_service import record_tag_trigger
        from app.models.tag_trigger_log import TagType, TriggerSource

        result = await db.execute(
            select(Member).where(Member.webchat_uid == browser_key)
        )
        member = result.scalar_one_or_none()
        if member is None:
            return False

        # 推導要寫的 category 名稱
        target_category: Optional[str] = None
        if rule_id is not None:
            cat_result = await db.execute(
                select(FaqCategory.name)
                .join(FaqRule, FaqRule.category_id == FaqCategory.id)
                .where(FaqRule.id == rule_id)
            )
            row = cat_result.first()
            if row and row[0]:
                target_category = row[0]
        if target_category is None and category_name:
            target_category = category_name.strip() or None
        if not target_category:
            return False

        # 對齊 LINE：房卡 + 點擊用 room_card_click，其他事件維持 auto_click
        tag_source = "room_card_click" if event_type == "room_select" else "auto_click"

        # upsert MemberInteractionTag（同 tag_source + tag_name + message_id IS NULL 視為同一筆彙總）
        existing_result = await db.execute(
            select(MemberInteractionTag).where(
                MemberInteractionTag.member_id == member.id,
                MemberInteractionTag.tag_name == target_category,
                MemberInteractionTag.tag_source == tag_source,
                MemberInteractionTag.message_id.is_(None),
            )
        )
        existing = existing_result.scalar_one_or_none()
        now = datetime.now()
        # widget 流程 = Webchat 平台
        webchat_channel = member.webchat_site_id
        if existing:
            existing.click_count = (existing.click_count or 1) + 1
            existing.last_triggered_at = now
            # 補上既有列遺漏的平台/channel（idempotent）
            if existing.platform is None:
                existing.platform = "Webchat"
            if existing.channel_id is None:
                existing.channel_id = webchat_channel
        else:
            db.add(MemberInteractionTag(
                member_id=member.id,
                tag_name=target_category,
                tag_source=tag_source,
                click_count=1,
                last_triggered_at=now,
                platform="Webchat",
                channel_id=webchat_channel,
            ))

        # 同步更新 last_interaction_at（避免訪客在 7 天 retention 期間被誤刪）
        member.last_interaction_at = now

        # 寫 tag_trigger_logs 供時段熱圖使用
        # room_select 屬於按鈕點擊事件 → CLICK（與 LINE 房卡點擊一致，落在「互動」tab）
        # 其他事件視為對話衍生標籤 → INTERACTION
        trigger_source = TriggerSource.CLICK if event_type == "room_select" else TriggerSource.INTERACTION
        await record_tag_trigger(
            db,
            member_id=member.id,
            tag_name=target_category,
            tag_type=TagType.INTERACTION,
            source=trigger_source,
            platform="Webchat",
            channel_id=webchat_channel,
        )

        await db.commit()
        logger.info(
            f"[widget_click] member_id={member.id} event={event_type} "
            f"tag={target_category} room={room_type_code}"
        )
        return True

    @staticmethod
    def _chat_error(message: str, token_exhausted: bool = False) -> ChatbotMessageOutSchema:
        return ChatbotMessageOutSchema(
            session_id="",
            intent_state="none",
            reply_type="text",
            reply=message,
            token_exhausted=token_exhausted,
        )


chatbot_service = ChatbotService()
