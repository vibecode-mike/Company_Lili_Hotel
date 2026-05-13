"""
Website chatbot booking API.
"""

from __future__ import annotations

import asyncio
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.chatbot import (
    BookingSaveInSchema,
    BookingSaveOutSchema,
    ChatbotMessageInSchema,
    ChatbotMessageOutSchema,
    ChatbotRoomsOutSchema,
    ConfirmRoomInSchema,
    ConfirmRoomOutSchema,
    SessionResetInSchema,
    SessionResetOutSchema,
    TrackClickInSchema,
    TrackClickOutSchema,
)
import logging

from app.models.chatbot_booking import FaqPmsConnection
from app.services.chatbot_service import (
    chatbot_service,
    init_pms_from_db, set_pms_enabled,
)
from app.services.pms_chatbot_client import pms_enabled as pms_configured, query_pms, query_pms_all_roomtypes
from sqlalchemy import select

logger = logging.getLogger(__name__)

router = APIRouter()

# ---- PMS helpers ----

_BOOKING_FAQ_CATEGORY_NAME = "訂房"  # FAQ 大分類名稱


async def _get_or_create_pms_conn(db: AsyncSession) -> FaqPmsConnection:
    """取得唯一的 PMS 連線設定記錄，不存在則建立。"""
    # 先查詢是否已有 pms_connection 記錄
    result = await db.execute(select(FaqPmsConnection).limit(1))
    conn = result.scalar_one_or_none()
    if conn is not None:
        return conn

    # 動態查找「訂房」分類 ID，避免寫死
    from app.models.faq import FaqCategory
    cat_result = await db.execute(
        select(FaqCategory).where(FaqCategory.name == _BOOKING_FAQ_CATEGORY_NAME)
    )
    category = cat_result.scalar_one_or_none()
    if category is None:
        raise HTTPException(
            status_code=500,
            detail=f"找不到 FAQ 分類「{_BOOKING_FAQ_CATEGORY_NAME}」，請先建立",
        )

    conn = FaqPmsConnection(
        faq_category_id=category.id,
        api_endpoint="",
        api_key_encrypted="",
        auth_type="api_key",
        status="disabled",
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return conn


@router.get("/pms-status")
async def get_pms_status(db: AsyncSession = Depends(get_db)):
    """取得 PMS 串接啟用狀態（從 DB 讀取）"""
    conn = await _get_or_create_pms_conn(db)
    init_pms_from_db(conn.status)
    return {
        "enabled": conn.status == "enabled",
        "configured": pms_configured(),
        "last_synced_at": conn.last_synced_at.strftime("%Y-%m-%d %H:%M") if conn.last_synced_at else None,
    }


@router.put("/pms-status")
async def update_pms_status(body: dict, db: AsyncSession = Depends(get_db)):
    """切換 PMS 串接啟用狀態（寫入 DB）"""
    enabled = body.get("enabled")
    if enabled is None:
        raise HTTPException(status_code=422, detail="需提供 enabled 欄位")

    conn = await _get_or_create_pms_conn(db)
    new_status = "enabled" if enabled else "disabled"
    conn.status = new_status
    await db.commit()

    set_pms_enabled(bool(enabled))
    return {"enabled": conn.status == "enabled"}


@router.get("/pms-rooms")
async def get_pms_rooms():
    """取得 PMS 即時房型列表（供管理後台顯示）"""
    from app.services.chatbot_service import ROOMTYPE_NAME, ROOMTYPE_MAX_OCCUPANCY
    from datetime import date, timedelta

    if not pms_configured():
        return {"rooms": [], "error": "PMS 未串接"}
    try:
        today = date.today()
        tomorrow = today + timedelta(days=1)
        result = await asyncio.get_event_loop().run_in_executor(
            None, lambda: query_pms_all_roomtypes(today.isoformat(), tomorrow.isoformat())
        )
        rooms = []
        for room in result.get("room", []):
            code = room.get("roomtype", "")
            data = room.get("data", [])
            first = data[0] if data else {}
            price_str = str(first.get("price", "0")).rstrip(";").strip()
            remain_str = str(first.get("remain", "0")).strip()
            remaining = int(remain_str) if remain_str.isdigit() else 0
            # 剩餘 0 間的房型（閎運有登記代碼但今天沒放庫存）不顯示
            if remaining <= 0:
                continue
            rooms.append({
                "room_type_code": code,
                "room_type_name": ROOMTYPE_NAME.get(code, code),
                "price": int(price_str) if price_str.isdigit() else 0,
                "max_occupancy": ROOMTYPE_MAX_OCCUPANCY.get(code, 2),
                "remaining": remaining,
                "image": str(room.get("image") or "").strip() or None,
            })
        return {"rooms": rooms}
    except Exception as e:
        logger.warning(f"PMS rooms fetch failed: {e}")
        return {"rooms": [], "error": str(e)}


@router.post("/pms-validate-room")
async def validate_pms_room_code(body: dict):
    """檢核房型代碼在 PMS 中是否仍有效"""
    room_code = body.get("room_code", "")
    if not room_code:
        raise HTTPException(status_code=422, detail="需提供 room_code")
    if not pms_configured():
        # PMS 未串接，跳過檢核
        return {"valid": True, "message": "PMS 未串接，略過檢核"}
    try:
        result = await asyncio.get_event_loop().run_in_executor(
            None, lambda: query_pms("2026-01-01", "2026-01-02")
        )
        pms_codes = {r["roomtype"] for r in result.get("room", [])}
        if room_code in pms_codes:
            return {"valid": True, "message": f"房型代碼 {room_code} 有效"}
        return {
            "valid": False,
            "message": f"此房型代碼在 PMS 中已不存在，請確認後再儲存",
            "available_codes": sorted(pms_codes),
        }
    except Exception as e:
        logger.warning(f"PMS room code validation failed: {e}")
        # PMS 連線失敗時不擋儲存，只回傳警告
        return {"valid": True, "message": f"PMS 連線異常，無法驗證：{e}"}


def _validate_date_range(checkin_date: str, checkout_date: str) -> None:
    try:
        checkin = datetime.strptime(checkin_date, "%Y-%m-%d").date()
        checkout = datetime.strptime(checkout_date, "%Y-%m-%d").date()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="checkin_date/checkout_date 格式需為 YYYY-MM-DD") from exc

    if checkout <= checkin:
        raise HTTPException(status_code=422, detail="checkout_date 必須晚於 checkin_date")


@router.post("/message", response_model=ChatbotMessageOutSchema)
async def chatbot_message(
    payload: ChatbotMessageInSchema,
    db: AsyncSession = Depends(get_db),
) -> ChatbotMessageOutSchema:
    try:
        return await chatbot_service.handle_message(
            browser_key=payload.browser_key,
            message=payload.message,
            hotel_id=payload.hotel_id,
            db=db,
            test_mode=payload.test_mode,
            site_id=payload.site_id,
            site_name=payload.site_name,
            admin_test=payload.admin_test,
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"PMS 查詢失敗：{exc}") from exc


@router.get("/rooms", response_model=ChatbotRoomsOutSchema)
async def chatbot_rooms(
    browser_key: str = Query(...),
    checkin_date: str = Query(...),
    checkout_date: str = Query(...),
    adults: int = Query(..., ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> ChatbotRoomsOutSchema:
    _validate_date_range(checkin_date, checkout_date)
    try:
        return await chatbot_service.get_rooms(
            browser_key=browser_key,
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            adults=adults,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"PMS 查詢失敗：{exc}") from exc


@router.post("/confirm-room", response_model=ConfirmRoomOutSchema)
async def chatbot_confirm_room(payload: ConfirmRoomInSchema) -> ConfirmRoomOutSchema:
    # Build rooms list from either new rooms[] or legacy single-room fields
    if payload.rooms is not None:
        rooms = [
            {
                "room_type_code": r.room_type_code,
                "room_count": max(1, r.room_count),  # coerce 0 → 1
                "room_type_name": r.room_type_name,
                "source": r.source or "pms",
            }
            for r in payload.rooms
        ]
    elif payload.room_type_code:
        rooms = [{
            "room_type_code": payload.room_type_code,
            "room_count": max(1, payload.room_count or 1),
            "room_type_name": payload.room_type_name,
            "source": payload.source or "pms",
        }]
    else:
        rooms = []

    if not rooms:
        raise HTTPException(
            status_code=422,
            detail={"error_code": "NO_ROOMS_SELECTED", "message": "請至少選擇一個房型與間數"},
        )

    return chatbot_service.confirm_rooms(
        browser_key=payload.browser_key,
        rooms=rooms,
    )


@router.post("/session/reset", response_model=SessionResetOutSchema)
async def chatbot_session_reset(payload: SessionResetInSchema) -> SessionResetOutSchema:
    return chatbot_service.reset(payload.browser_key)


@router.post("/booking-save", response_model=BookingSaveOutSchema)
async def chatbot_booking_save(payload: BookingSaveInSchema) -> BookingSaveOutSchema:
    """POST /chatbot/booking-save — validate + persist booking."""
    return chatbot_service.booking_save(
        browser_key=payload.browser_key,
        member_name=payload.member_name,
        member_phone=payload.member_phone,
        member_email=payload.member_email,
        checkin_date=payload.checkin_date,
        checkout_date=payload.checkout_date,
    )


@router.post("/track-click", response_model=TrackClickOutSchema)
async def chatbot_track_click(
    payload: TrackClickInSchema,
    db: AsyncSession = Depends(get_db),
) -> TrackClickOutSchema:
    """Widget 點擊事件追蹤 → 寫互動標籤（tag_source='auto_click'）。

    - 對等 LINE 的 /__track 端點
    - 房卡 +、確認選房按鈕、未來的 suggestion / 圖片放大都打這支
    - 訪客還沒透過 /message 建立 Member 時靜默忽略（tagged=False）
    - fire-and-forget — 任何失敗都不影響主流程
    """
    try:
        tagged = await chatbot_service.track_widget_click(
            db=db,
            browser_key=payload.browser_key,
            event_type=payload.event_type,
            category_name=payload.category_name,
            rule_id=payload.rule_id,
            room_type_code=payload.room_type_code,
        )
        return TrackClickOutSchema(ok=True, tagged=tagged)
    except Exception as exc:
        # 點擊追蹤失敗絕對不能擋住使用者 → 吞例外、記 log
        logger.warning(f"[track-click] failed: {exc}")
        return TrackClickOutSchema(ok=True, tagged=False)
