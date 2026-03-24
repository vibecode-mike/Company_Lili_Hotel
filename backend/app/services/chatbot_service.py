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
from app.models.conversation import ConversationMessage
from app.models.faq import AiTokenUsage, FaqRuleTag, Industry
from app.models.member import Member
from app.models.tag import MemberTag
from app.schemas.chatbot import (
    BookingContextSchema,
    ChatbotMessageOutSchema,
    ChatbotRoomsOutSchema,
    ConfirmRoomOutSchema,
    MemberFormDefinitionSchema,
    MemberFormFieldSchema,
    RoomCardSchema,
    SessionResetOutSchema,
)
from app.services.pms_chatbot_client import (
    build_booking_url,
    pms_enabled,
    query_pms,
)

logger = logging.getLogger(__name__)


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
}

ROOMTYPE_MAX_OCCUPANCY = {
    "V7": 2, "V6": 2, "V5": 2, "V3": 2, "V2": 2,
    "V1": 6, "WS": 2, "GS": 4, "V8": 2,
}

# ---------------------------------------------------------------------------
# FAQ KB fallback — read room data from DB instead of hardcoded list
# ---------------------------------------------------------------------------

async def _kb_fallback_rooms(db: Optional[AsyncSession], adults: int = 1) -> List[RoomCardSchema]:
    """Query FAQ KB for room data. Returns RoomCardSchema list (source=faq_kb).

    Spec: 查詢空房型.feature — PMS 未啟用或異常時降級至 FAQ_KB，
    呼叫 _kb_search("booking_billing", query) 取得靜態房型資料。
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
    # Filter by occupancy, sort by match (closest first), then price
    filtered = [c for c in cards if c.max_occupancy >= adults]
    result = filtered if filtered else cards
    result.sort(key=lambda c: (abs((c.max_occupancy or 2) - adults), c.price if c.price > 0 else 10**12))
    return result


async def _enrich_cards_with_kb(
    cards: List[RoomCardSchema], db: Optional[AsyncSession]
) -> List[RoomCardSchema]:
    """Spec: PMS 資料為主，FAQ_KB 資料補充房型圖片與特色描述。"""
    if db is None or not cards:
        return cards
    result = await _kb_search(db, "booking_billing", "", top_k=20)
    items = result.get("items") or []
    # Build lookup by room name
    kb_by_name: Dict[str, dict] = {}
    for item in items:
        name = str(item.get("房型名稱") or "").strip()
        if name:
            kb_by_name[name] = item
    enriched: List[RoomCardSchema] = []
    for card in cards:
        kb = kb_by_name.get(card.room_type_name)
        if kb:
            raw_image = str(kb.get("image_url") or kb.get("url") or "").strip()
            image = raw_image if raw_image else (settings.DEFAULT_ROOM_IMAGE_URL or None)
            features = str(kb.get("房型特色") or "")
            card = card.model_copy(update={
                "image_url": image if image else card.image_url,
                "features": features if features else card.features,
            })
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
    result_items = [r for _, r in scored[:top_k]] if scored else rows[:top_k]
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
        cards.append({
            "room_type_code": room_type_code,
            "room_type_name": room_type_name,
            "available_count": min(remains),
            "max_occupancy": max_occupancy,
            "price": nightly_price,
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
            "客人沒說退房日就填入住日+1天；沒說人數就從房型推斷（雙人房填2、四人房填4）或預設填2。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "startdate": {"type": "string", "description": "入住日期 YYYY-MM-DD"},
                "enddate": {"type": "string", "description": "退房日期 YYYY-MM-DD（未提供則填入住日+1天）"},
                "housingcnt": {
                    "type": "integer",
                    "description": "每間房入住人數，雙人房=2、四人房=4、未知預設2",
                },
                "roomtype": {
                    "type": "string",
                    "description": "指定房型代碼（可選，例如 V2、GS）",
                },
            },
            "required": ["startdate", "enddate", "housingcnt"],
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

_TOOLS_WITH_PMS = [_KB_SEARCH_TOOL, _PMS_TOOL, _MIXED_AVAIL_TOOL, _CONFIRM_ROOM_TOOL, _SAVE_MEMBER_TOOL]
_TOOLS_WITHOUT_PMS = [_KB_SEARCH_TOOL, _PMS_TOOL, _CONFIRM_ROOM_TOOL, _SAVE_MEMBER_TOOL]


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
            "- 能推斷出入住日就可以呼叫 query_pms_availability（退房日預設入住日+1天，間數預設1間，人數從房型推斷）\n"
            "- 若入住日期嚴格早於今天（不含今天），不要查詢房況，直接提醒旅客「您提供的日期已過，請重新提供入住日期」；今天當天是有效入住日\n"
            "- 工具回傳後，不要在文字中列出房型清單，系統會自動顯示房卡，你只需簡短回覆一句話\n"
            "- 若查無房型，告知並詢問是否調整日期或人數\n"
            "- PMS 失敗時，改用靜態房型資料告知旅客（標明為「一般參考房價」）"
        )
    else:
        pms_rule = (
            "- 目前無即時房況系統，但仍需呼叫 query_pms_availability 取得靜態參考房價\n"
            "- 能推斷出入住日就可以呼叫 query_pms_availability（退房日預設入住日+1天，間數預設1間，人數從房型推斷）\n"
            "- 若入住日期嚴格早於今天（不含今天），不要查詢房況，直接提醒旅客「您提供的日期已過，請重新提供入住日期」；今天當天是有效入住日\n"
            "- 工具回傳後，不要在文字中列出房型清單，系統會自動顯示房卡，你只需簡短回覆一句話並標明為「一般參考房價」"
        )

    return f"""今天日期：{today_str}
你是飯店親切的客服機器人，個性熱情有趣，協助旅客查詢房況與訂房。

你會收到整段對話紀錄（包含先前訊息），請務必綜合上下文，不要重複追問已提供的資訊。

核心行為規則（最高優先，嚴格遵守）：
- 只要能推斷出入住日期，就立刻呼叫 query_pms_availability，不要追問任何確認
- 若無法推斷入住日期，必須先追問入住日期和住幾晚，絕對不可以沒有日期就查詢房況
- 預設值：退房日 = 入住日 + 1 天（住一晚）、間數 = 1 間、人數從房型推斷（雙人房=2、四人房=4）
- 客人只提供月/日時，直接當作今年，不要反問年份
- 「今天入住」→ startdate={today_str}、enddate 自動算明天
- 「還有X房嗎」「有沒有X房」→ 若已知入住日期則直接查詢，否則先追問入住日期和住幾晚
- 今天（含）及未來日期都是有效入住日，只有嚴格早於今天的日期才算「已過期」
- 嚴禁在沒有入住日期的情況下呼叫 query_pms_availability，必須先問「請問您預計什麼時候入住？住幾晚呢？」

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
- 若客人說「今天入住」且沒說退房日，預設住一晚（退房=明天）
- 若客人沒說幾間，預設 1 間
- 「雙人房」=2人房、「四人房」=4人房、「家庭房」=4人房、「單人房」=1人房，不需要再確認人數
- 「還有X房嗎」「有沒有X房」= 查詢房況，預設 1 間，直接查詢不要追問
- 資訊齊全時，立刻呼叫 query_pms_availability，嚴禁再追問確認
- 範例：「3/18入住一晚 一間雙人房」→ startdate=今年3/18, enddate=今年3/19, housingcnt=2 → 直接查
- 範例：「今天入住 還有雙人房嗎」→ startdate=今天, enddate=明天, housingcnt=2 → 直接查
- 無法推斷入住日期時，必須追問「請問您預計什麼時候入住？住幾晚呢？」，不可跳過

房況查詢規則：
{pms_rule}
- 呼叫 query_pms_availability 時，roomtype 參數只在客人指定了「確切房型名稱」（例如「森森系雙人房」「琴香古韻」）時才傳；若客人只說「雙人房」「四人房」等通稱，不要傳 roomtype，讓系統回傳所有適合的房型供客人選擇
- 客人指定多種房型組合（例如「四人房 1 間、雙人房 3 間」）時，呼叫 query_pms_mixed_availability
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
    booking_children: int = 0
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
    ) -> ChatbotMessageOutSchema:
        session = self.get_or_create_session(browser_key, hotel_id)

        # Spec 3.2: reset after 5 turns
        if session.turn_count >= self._max_turns:
            session = self.reset_session(browser_key)
            if hotel_id is not None:
                session.hotel_id = hotel_id

        session.turn_count += 1
        session.history.append({"role": "user", "content": message})
        session.ts = time.time()

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
        ctx = ToolCallingContext(
            db=db, test_mode=test_mode,
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
            messages: List[Dict[str, Any]] = [
                {"role": "system", "content": _build_system_prompt()},
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

        # Fallback: LLM didn't call PMS tool but we have enough info → query PMS ourselves
        if not room_cards and not ctx.pms_called and session.checkin_date and session.checkout_date:
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
                logger.info(f"[Fallback] PMS returned {len(fallback_cards)} cards")
                if fallback_cards:
                    room_cards = fallback_cards
            except Exception as e:
                logger.warning(f"[Fallback] PMS query error: {e}")

        if room_cards:
            session.last_room_cards = room_cards

        session.history.append({"role": "assistant", "content": reply})

        # Determine reply_type based on session state (spec 3.4–3.5)
        # If new room_cards arrived this turn, always treat as room_cards
        # (overrides stale selected_room from a previous booking)
        if room_cards:
            reply_type = "room_cards"
            session.intent_state = "confirmed"
            # Clear stale selected_room so fresh selection can proceed
            session.selected_room_type = None
            session.selected_room_count = None
            session.selected_room_name = None
            session.selected_room_source = None
            session.selected_rooms = []
        elif self._has_selected_room(session) and self._has_member_profile(session):
            reply_type = "booking_confirm"
        elif self._has_selected_room(session):
            reply_type = "member_form"
        else:
            reply_type = "text"

        return ChatbotMessageOutSchema(
            session_id=session.session_id,
            intent_state=session.intent_state,
            reply_type=reply_type,
            reply=reply,
            room_cards=room_cards,
            missing_fields=self._compute_missing_fields(session),
            turn_count=session.turn_count,
            booking_context=self._booking_context(session),
        )

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
                return msg.content or ""

            messages.append(msg)
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
            return await self._run_mixed_avail_tool(args)
        elif fn_name == "confirm_room_selection":
            if ctx._session is not None:
                return self._run_confirm_room_tool(args, ctx._session)
            return {"info": "此功能僅在網站訂房時可用，請前往官網完成訂房。"}
        elif fn_name == "save_member_info":
            if ctx._session is not None:
                return self._run_save_member_tool(args, ctx._session)
            return {"info": "此功能僅在網站訂房時可用，請前往官網完成訂房。"}
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
        housingcnt = int(args.get("housingcnt") or 2)
        roomtype = args.get("roomtype") or None

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
        if housingcnt > 0:
            ctx.booking_adults = housingcnt

        db = ctx.db

        # PMS disabled → FAQ KB fallback (spec: _kb_search("booking_billing"))
        if not is_pms_enabled():
            cards = await _kb_fallback_rooms(db, housingcnt)
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
            raw = await asyncio.to_thread(query_pms, startdate, enddate, roomtype, housingcnt)
            availability = self._extract_availability(raw, startdate, enddate)
            cards = self._availability_to_room_cards(availability, housingcnt)

            # Spec: housingcnt=1 查無房時自動以 housingcnt=2 重查
            fallback_housingcnt = None
            if not cards and housingcnt == 1:
                logger.info("[PMS] housingcnt=1 returned empty, retrying with housingcnt=2")
                raw2 = await asyncio.to_thread(query_pms, startdate, enddate, roomtype, 2)
                availability = self._extract_availability(raw2, startdate, enddate)
                cards = self._availability_to_room_cards(availability, 2)
                if cards:
                    fallback_housingcnt = 1

            if not cards:
                # PMS returned empty → FAQ KB fallback
                cards = await _kb_fallback_rooms(db, housingcnt)
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
            if fallback_housingcnt is not None:
                result_dict["note"] = "沒有符合人數的房型，以下是其他可參考的房型"
            return result_dict, cards

        except Exception as exc:
            cards = await _kb_fallback_rooms(db, housingcnt)
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

    async def _run_mixed_avail_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
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
        children: int = 0,
        db: Optional[AsyncSession] = None,
    ) -> ChatbotRoomsOutSchema:
        session = self.get_or_create_session(browser_key)
        session.checkin_date = checkin_date
        session.checkout_date = checkout_date
        session.booking_adults = adults
        session.booking_children = children

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
        return ConfirmRoomOutSchema(
            session_id=session.session_id,
            selected_room_type=session.selected_room_type or first["room_type_code"],
            selected_room_count=session.selected_room_count or 1,
            member_form=_MEMBER_FORM,
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
        room_codes = {
            str(room.get("room_type_code") or "").strip()
            for room in selected_rooms
            if str(room.get("room_type_code") or "").strip()
        }
        if len(room_codes) == 1 and first_room:
            room_type_code = next(iter(room_codes))
            room_count = sum(max(1, int(room.get("room_count") or 1)) for room in selected_rooms)
            try:
                cart_url = build_booking_url(
                    checkin=checkin,
                    checkout=checkout,
                    rooms=room_count,
                    adults=session.booking_adults or 1,
                    children=session.booking_children,
                    room_type=room_type_code,
                    guest_name=name,
                    phone=phone,
                    email=email,
                )
            except ValueError:
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
                    # Upsert member
                    existing_member = db.query(Member).filter(
                        Member.phone == phone,
                        Member.email == email,
                    ).first()
                    if existing_member:
                        existing_member.name = name
                        existing_member.phone = phone
                        existing_member.email = email
                        existing_member.last_interaction_at = datetime.now(timezone.utc)
                        crm_member_id = existing_member.id
                    else:
                        new_member = Member(
                            name=name,
                            phone=phone,
                            email=email,
                            join_source="Webchat",
                            gpt_enabled=True,
                            last_interaction_at=datetime.now(timezone.utc),
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
                    chatbot_session_rec.booking_children = session.booking_children
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
            })

        return {"ok": True, "available": available}

    def _availability_to_room_cards(self, availability: dict, housingcnt: int = 2) -> List[RoomCardSchema]:
        """Convert PMS availability to room cards, sorted by occupancy match then price."""
        cards = [
            RoomCardSchema(
                room_type_code=item["roomtype"],
                room_type_name=item["name"],
                price=item["nightly_price"],
                price_label="即時房價",
                available_count=item["min_remain"],
                max_occupancy=ROOMTYPE_MAX_OCCUPANCY.get(item["roomtype"], 2),
                image_url=None,
                features="",
                source="pms",
            )
            for item in availability.get("available", [])
        ]
        # Spec: 依入住人數匹配度排序（差距小的優先），同匹配度按價格
        cards.sort(key=lambda c: (abs((c.max_occupancy or 2) - housingcnt), c.price if c.price > 0 else 10**12))
        return cards

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
        """Spec: 訂房 context 齊全條件 → 日期 + 幾間幾人房都有才算齊全。"""
        missing: List[str] = []
        if not session.room_plan_requests:
            missing.append("room_plan")
        if not session.checkin_date:
            missing.append("checkin_date")
        if not session.checkout_date:
            missing.append("checkout_date")
        return missing

    # ------------------------------------------------------------------
    # Deterministic extraction helpers
    # ------------------------------------------------------------------

    def _extract_room_plan(self, message: str) -> Optional[Dict[str, int]]:
        """Spec: '我要X間Y人房' → {room_count, adults_per_room}。不調用 LLM。"""
        # Pattern: [X間][Y人房 | 雙人房 | 單人房 | ...]
        room_count_match = re.search(r"(\d+)\s*間", message)
        room_count = int(room_count_match.group(1)) if room_count_match else 1

        # Named room type → people count
        named = {"雙人房": 2, "單人房": 1, "家庭房": 4, "四人房": 4, "三人房": 3}
        for name, people in named.items():
            if name in message:
                return {"room_count": room_count, "adults_per_room": people}

        # Numeric: X人房
        numeric_match = re.search(r"(\d+)\s*人\s*房", message)
        if numeric_match:
            return {"room_count": room_count, "adults_per_room": int(numeric_match.group(1))}

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
                        "後天": 2, "后天": 2,
                        "大後天": 3, "大后天": 3}
        for keyword, delta in relative_map.items():
            if keyword in message:
                checkin = today + timedelta(days=delta)
                checkout = checkin + timedelta(days=nights)
                return checkin.isoformat(), checkout.isoformat()

        # --- Pattern: M月D號到M月D號 ---
        m = re.search(
            r"(\d{1,2})月(\d{1,2})[號号日](?:.*?)(?:住到|退房|到|至|～|~)(?:(\d{1,2})月)?(\d{1,2})[號号日]",
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
        m4 = re.search(r"(\d{1,2})月(\d{1,2})[號号日]?", message)
        if m4:
            checkin = date(current_year, int(m4.group(1)), int(m4.group(2)))
            checkout = checkin + timedelta(days=nights)
            return checkin.isoformat(), checkout.isoformat()

        # --- Pattern: 中文數字「三月十八」「三月十八號」---
        m5 = re.search(r"([一二三四五六七八九十]+)月([一二三四五六七八九十零〇]+)[號号日]?", message)
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
    ) -> Dict[str, Any]:
        """
        會員聊天室 AI 入口（LINE / Facebook / Webchat）

        與 handle_message() 共用 _unified_tool_loop + _execute_tool，差異：
        - 對話歷史從 DB 讀取（非記憶體 session）
        - 自動貼標籤（根據 AI 引用的規則）
        - Token 耗盡時降級為自動回應
        """
        # 1. Token 額度檢查
        token_usage = await self._get_token_usage(db, industry_id)
        if token_usage is None:
            return self._chat_error("系統尚未設定產業資料")
        if isinstance(token_usage, dict):
            return token_usage  # exhausted error

        # 2. 組裝 messages
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": _build_system_prompt()}
        ]
        if line_uid:
            history = await self._get_conversation_history(db, line_uid, limit=10)
            messages.extend(history)
        messages.append({"role": "user", "content": message})

        # 3. 建 ToolCallingContext（與官網一致的 tool 行為）
        ctx = ToolCallingContext(db=db, collect_rule_ids=True)

        # 確定性日期/房型提取（與官網一致）
        past_date_warning: Optional[str] = None
        try:
            dates = self._extract_dates(message)
            if dates:
                checkin_obj = date.fromisoformat(dates[0])
                today = datetime.now(ZoneInfo("Asia/Taipei")).date()
                if checkin_obj < today:
                    past_date_warning = "您輸入的日期已過，請重新提供入住與退房日期。"
                else:
                    ctx.checkin_date, ctx.checkout_date = dates
        except Exception:
            pass
        room_plan = self._extract_room_plan(message)
        if room_plan:
            ctx.booking_adults = room_plan["room_count"] * room_plan["adults_per_room"]

        # 4. 統一 Tool Calling 迴圈
        if past_date_warning:
            reply = past_date_warning
        else:
            reply = await self._unified_tool_loop(messages, ctx)

        # PMS fallback（與官網一致）— 只在 LLM 未呼叫 PMS 時才補查
        if not ctx.room_cards and not ctx.pms_called and ctx.checkin_date and ctx.checkout_date:
            try:
                await self._run_pms_tool(
                    {"startdate": ctx.checkin_date, "enddate": ctx.checkout_date,
                     "housingcnt": ctx.booking_adults or 2},
                    ctx,
                )
            except Exception as e:
                logger.warning(f"[Member chat] PMS fallback error: {e}")

        # 5. 扣除 token + 自動貼標籤
        if token_usage and ctx.total_tokens_used > 0:
            token_usage.used_amount += ctx.total_tokens_used
            await db.flush()

        referenced_rule_ids = list(ctx.referenced_rule_ids)
        auto_tags = await self._auto_tag_member(db, line_uid, referenced_rule_ids)

        return {
            "reply": reply,
            "room_cards": [card.model_dump() for card in ctx.room_cards] if ctx.room_cards else [],
            "tokens_used": ctx.total_tokens_used,
            "referenced_rules": [{"rule_id": rid} for rid in referenced_rule_ids],
            "auto_tags": auto_tags,
            "token_exhausted": False,
        }

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

        ctx = ToolCallingContext(db=db, test_mode=True)
        reply = await self._unified_tool_loop(messages, ctx)

        if token_usage and not isinstance(token_usage, dict) and ctx.total_tokens_used > 0:
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
        self, db: AsyncSession, line_uid: Optional[str], referenced_rule_ids: List[int],
    ) -> List[str]:
        """自動為會員貼標籤（只貼 AI 當次引用的規則標籤）"""
        if not line_uid or not referenced_rule_ids:
            return []

        member_result = await db.execute(
            select(Member).where(Member.line_uid == line_uid)
        )
        member = member_result.scalar_one_or_none()
        if not member:
            return []

        tag_result = await db.execute(
            select(FaqRuleTag.tag_name)
            .where(FaqRuleTag.rule_id.in_(referenced_rule_ids))
            .distinct()
        )
        tag_names = {t for (t,) in tag_result.all()}
        if not tag_names:
            return []

        existing_result = await db.execute(
            select(MemberTag.tag_name).where(
                MemberTag.member_id == member.id,
                MemberTag.tag_name.in_(tag_names),
                MemberTag.message_id == None,  # noqa: E711
            )
        )
        existing_tags = {t for (t,) in existing_result.all()}

        tagged: List[str] = []
        for tag_name in tag_names - existing_tags:
            db.add(MemberTag(member_id=member.id, tag_name=tag_name, tag_source="AI"))
            tagged.append(tag_name)
        if tagged:
            await db.flush()
        return tagged

    @staticmethod
    def _chat_error(message: str, token_exhausted: bool = False) -> Dict[str, Any]:
        return {
            "reply": message,
            "tokens_used": 0,
            "referenced_rules": [],
            "auto_tags": [],
            "token_exhausted": token_exhausted,
        }


chatbot_service = ChatbotService()
