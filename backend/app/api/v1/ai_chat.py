"""
AI 聊天 API — 會員聊天室用（LINE / Facebook / Webchat）

與官網 chatbot 共用完整訂房流程：
  chat → confirm-room → booking-save
差異：session key 用 line_uid（非 browser_key）
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.faq import AiChatRequestSchema
from app.schemas.chatbot import (
    ConfirmRoomOutSchema,
    SessionResetOutSchema,
    BookingSaveOutSchema,
    RoomSelectionSchema,
)
from app.services.chatbot_service import chatbot_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request schemas (mirror chatbot schemas but use line_uid instead of browser_key)
# ---------------------------------------------------------------------------

class AiConfirmRoomRequest(BaseModel):
    line_uid: str
    rooms: List[RoomSelectionSchema]


class AiBookingSaveRequest(BaseModel):
    line_uid: str
    member_name: Optional[str] = None
    member_phone: Optional[str] = None
    member_email: Optional[str] = None
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None


class AiSessionResetRequest(BaseModel):
    line_uid: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=dict)
async def ai_chat(
    data: AiChatRequestSchema,
    db: AsyncSession = Depends(get_db),
):
    """
    統一 AI 聊天入口

    此端點供 LINE webhook / Facebook / Webchat 呼叫，
    不需要 CRM 後台登入，但需要提供 line_uid。
    """
    try:
        result = await chatbot_service.chat(
            db=db,
            message=data.message,
            line_uid=data.line_uid,
        )
        return {
            "code": 200,
            "message": "回覆成功",
            "data": result.model_dump(),
        }
    except Exception as e:
        logger.error(f"AI chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="AI 聊天服務暫時無法使用")


@router.post("/confirm-room", response_model=ConfirmRoomOutSchema)
async def ai_confirm_room(payload: AiConfirmRoomRequest):
    """確認選房 — 用 line_uid 作為 session key"""
    rooms = [
        {
            "room_type_code": r.room_type_code,
            "room_count": max(1, r.room_count),
            "room_type_name": r.room_type_name,
            "source": r.source or "pms",
        }
        for r in payload.rooms
    ]
    if not rooms:
        raise HTTPException(
            status_code=422,
            detail={"error_code": "NO_ROOMS_SELECTED", "message": "請至少選擇一個房型與間數"},
        )
    return chatbot_service.confirm_rooms(
        browser_key=payload.line_uid,
        rooms=rooms,
    )


@router.post("/booking-save", response_model=BookingSaveOutSchema)
async def ai_booking_save(payload: AiBookingSaveRequest):
    """儲存訂房 — 用 line_uid 作為 session key"""
    return chatbot_service.booking_save(
        browser_key=payload.line_uid,
        member_name=payload.member_name,
        member_phone=payload.member_phone,
        member_email=payload.member_email,
        checkin_date=payload.checkin_date,
        checkout_date=payload.checkout_date,
    )


@router.post("/session/reset", response_model=SessionResetOutSchema)
async def ai_session_reset(payload: AiSessionResetRequest):
    """重置 session — 用 line_uid 作為 session key"""
    return chatbot_service.reset(payload.line_uid)
