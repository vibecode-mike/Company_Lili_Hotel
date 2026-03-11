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
)
import logging

from app.models.chatbot_booking import FaqPmsConnection
from app.services.chatbot_service import (
    chatbot_service,
    init_pms_from_db, set_pms_enabled,
)
from app.services.pms_chatbot_client import pms_enabled as pms_configured, query_pms
from sqlalchemy import select

logger = logging.getLogger(__name__)

router = APIRouter()

# ---- PMS helpers ----

_BOOKING_FAQ_CATEGORY_ID = 1  # FAQ 大分類「訂房」

async def _get_or_create_pms_conn(db: AsyncSession) -> FaqPmsConnection:
    """取得唯一的 PMS 連線設定記錄，不存在則建立。"""
    result = await db.execute(
        select(FaqPmsConnection).where(
            FaqPmsConnection.faq_category_id == _BOOKING_FAQ_CATEGORY_ID
        )
    )
    conn = result.scalar_one_or_none()
    if conn is None:
        conn = FaqPmsConnection(
            faq_category_id=_BOOKING_FAQ_CATEGORY_ID,
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


@router.post("/pms-test")
async def test_pms_connection(db: AsyncSession = Depends(get_db)):
    """測試 PMS 連線 — 呼叫 query_pms 確認 API 可達"""
    if not pms_configured():
        raise HTTPException(status_code=400, detail="PMS 環境變數未設定（PMS_API_URL / PMS_ACCOUNT / PMS_SECRET / PMS_HOTELCODE）")
    try:
        result = await asyncio.get_event_loop().run_in_executor(
            None, lambda: query_pms("2026-01-01", "2026-01-02")
        )
        # 連線成功 → 更新 last_synced_at
        conn = await _get_or_create_pms_conn(db)
        conn.last_synced_at = datetime.utcnow()
        conn.error_message = None
        await db.commit()

        if "room" in result:
            return {"success": True, "message": f"連線成功，取得 {len(result['room'])} 種房型資料"}
        return {"success": True, "message": "連線成功", "raw": result}
    except Exception as e:
        logger.warning(f"PMS connection test failed: {e}")
        # 記錄錯誤到 DB
        conn = await _get_or_create_pms_conn(db)
        conn.error_message = str(e)[:500]
        await db.commit()

        msg = str(e)
        if "401" in msg or "Unauthorized" in msg:
            raise HTTPException(status_code=400, detail="連線失敗：API Key 無效（401 Unauthorized）")
        if "timeout" in msg.lower() or "timed out" in msg.lower():
            raise HTTPException(status_code=400, detail="連線失敗：連線逾時，請確認 PMS 端點是否正確")
        raise HTTPException(status_code=400, detail=f"連線失敗：{msg}")


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
    children: int = Query(0, ge=0, le=20),
    db: AsyncSession = Depends(get_db),
) -> ChatbotRoomsOutSchema:
    _validate_date_range(checkin_date, checkout_date)
    try:
        return await chatbot_service.get_rooms(
            browser_key=browser_key,
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            adults=adults,
            children=children,
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
