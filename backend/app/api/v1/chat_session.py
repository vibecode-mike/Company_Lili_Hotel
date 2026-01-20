"""
聊天 Session API
提供可用渠道、預設渠道與 thread_id 映射，供前端聊天室切換渠道使用
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.database import get_db
from app.models.member import Member
from app.schemas.common import SuccessResponse
from app.services.chatroom_service import ChatroomService

router = APIRouter()
logger = logging.getLogger(__name__)


def _resolve_platform(request_platform: Optional[str]) -> Optional[str]:
    if request_platform is None:
        return None
    normalized = request_platform.strip()
    allowed = {"LINE", "Facebook", "Webchat"}
    if normalized not in allowed:
        raise HTTPException(status_code=400, detail="不支援的渠道平台")
    return normalized


def _parse_fb_customer_id(member_id: str) -> str:
    """Extract fb_customer_id from 'fb-123' or '123' format."""
    return member_id.removeprefix("fb-")


async def _resolve_member_by_platform(
    db: AsyncSession,
    member_id: str,
    platform: Optional[str],
) -> Optional[Member]:
    if platform == "Facebook":
        fb_customer_id = _parse_fb_customer_id(member_id)
        result = await db.execute(select(Member).where(Member.fb_customer_id == fb_customer_id))
        member = result.scalar_one_or_none()
        if member:
            return member

    try:
        internal_id = int(_parse_fb_customer_id(member_id))
    except ValueError:
        return None
    result = await db.execute(select(Member).where(Member.id == internal_id))
    return result.scalar_one_or_none()


@router.get("/members/{member_id}/chat-session", response_model=SuccessResponse)
async def get_chat_session(
    member_id: str,
    platform: Optional[str] = Query(None, description="渠道：LINE/Facebook/Webchat"),
    db: AsyncSession = Depends(get_db),
):
    """取得會員聊天室 session 資訊：可用渠道、預設渠道、thread 映射"""
    resolved_platform = _resolve_platform(platform)
    member = await _resolve_member_by_platform(db, member_id, resolved_platform)
    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    chatroom_service = ChatroomService(db)
    try:
        session_info = await chatroom_service.open_session(member)
    except Exception as e:
        logger.error("取得聊天室 session 失敗", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

    return SuccessResponse(data=session_info)
