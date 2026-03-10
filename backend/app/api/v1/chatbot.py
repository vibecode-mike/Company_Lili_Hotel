"""
Website chatbot booking API.
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.chatbot import (
    BookingSaveInSchema,
    BookingSaveOutSchema,
    BookingUrlInSchema,
    BookingUrlOutSchema,
    ChatbotMemberInSchema,
    ChatbotMemberOutSchema,
    ChatbotMessageInSchema,
    ChatbotMessageOutSchema,
    ChatbotRoomsOutSchema,
    ConfirmRoomInSchema,
    ConfirmRoomOutSchema,
    SessionResetInSchema,
    SessionResetOutSchema,
)
from app.services.chatbot_booking_service import ChatbotBookingService
from app.services.chatbot_service import ROOMTYPE_NAME, chatbot_service
from app.services.pms_chatbot_client import build_booking_url


router = APIRouter()
booking_service = ChatbotBookingService()


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
) -> ChatbotRoomsOutSchema:
    _validate_date_range(checkin_date, checkout_date)
    try:
        return await chatbot_service.get_rooms(
            browser_key=browser_key,
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            adults=adults,
            children=children,
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"PMS 查詢失敗：{exc}") from exc


@router.post("/confirm-room", response_model=ConfirmRoomOutSchema)
async def chatbot_confirm_room(payload: ConfirmRoomInSchema) -> ConfirmRoomOutSchema:
    from fastapi import HTTPException
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


@router.post("/booking-url", response_model=BookingUrlOutSchema)
async def chatbot_booking_url(
    payload: BookingUrlInSchema,
    db: AsyncSession = Depends(get_db),
) -> BookingUrlOutSchema:
    _validate_date_range(payload.checkin_date, payload.checkout_date)

    session = chatbot_service.apply_booking_payload(
        browser_key=payload.browser_key,
        room_type_code=payload.room_type_code,
        room_count=payload.room_count,
        checkin_date=payload.checkin_date,
        checkout_date=payload.checkout_date,
        adults=payload.adults,
        children=payload.children,
        guest_name=payload.guest_name,
        guest_phone=payload.guest_phone,
        guest_email=str(payload.guest_email),
    )

    try:
        booking_url = build_booking_url(
            checkin=payload.checkin_date,
            checkout=payload.checkout_date,
            rooms=payload.room_count,
            adults=payload.adults,
            children=payload.children,
            room_type=payload.room_type_code,
            guest_name=payload.guest_name,
            phone=payload.guest_phone,
            email=str(payload.guest_email),
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    member, _ = await booking_service.upsert_member(
        db,
        name=payload.guest_name,
        phone=payload.guest_phone,
        email=str(payload.guest_email).lower(),
    )
    session.crm_member_id = member.id
    await booking_service.upsert_chatbot_session(
        db,
        state=session,
        crm_member_id=member.id,
    )

    booking_record_id = str(uuid4())
    await booking_service.create_booking_record(
        db,
        record_id=booking_record_id,
        state=session,
        room_type_name=session.selected_room_name or ROOMTYPE_NAME.get(payload.room_type_code, payload.room_type_code),
        booking_url=booking_url,
        data_source=session.selected_room_source or "pms",
        crm_member_id=member.id,
    )
    return BookingUrlOutSchema(
        booking_url=booking_url,
        booking_record_id=booking_record_id,
        crm_member_id=member.id,
    )


@router.post("/member", response_model=ChatbotMemberOutSchema)
async def chatbot_member(
    payload: ChatbotMemberInSchema,
    db: AsyncSession = Depends(get_db),
) -> ChatbotMemberOutSchema:
    booking_record = await booking_service.get_booking_record(db, payload.booking_record_id)
    if not booking_record:
        raise HTTPException(status_code=404, detail="booking_record_id 不存在")

    member, is_new_member = await booking_service.upsert_member(
        db,
        name=payload.name,
        phone=payload.phone,
        email=str(payload.email).lower(),
    )
    await booking_service.link_booking_record_member(
        db,
        booking_record=booking_record,
        member_id=member.id,
    )

    session = chatbot_service.apply_member_profile(
        browser_key=payload.browser_key,
        name=payload.name,
        phone=payload.phone,
        email=str(payload.email).lower(),
    )
    session.crm_member_id = member.id
    await booking_service.upsert_chatbot_session(
        db,
        state=session,
        crm_member_id=member.id,
    )

    return ChatbotMemberOutSchema(
        member_id=member.id,
        is_new_member=is_new_member,
        tags_applied=[],
    )


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
