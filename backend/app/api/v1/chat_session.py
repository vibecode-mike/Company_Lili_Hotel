"""
聊天 Session API
提供可用渠道、預設渠道與 thread_id 映射，供前端聊天室切換渠道使用
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.database import get_db
from app.models.member import Member
from app.schemas.common import SuccessResponse
from app.services.chatroom_service import ChatroomService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/members/{member_id}/chat-session", response_model=SuccessResponse)
async def get_chat_session(
    member_id: int,
    db: AsyncSession = Depends(get_db),
):
    """取得會員聊天室 session 資訊：可用渠道、預設渠道、thread 映射"""
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    chatroom_service = ChatroomService(db)
    try:
        session_info = await chatroom_service.open_session(member)
    except Exception as e:
        logger.error("取得聊天室 session 失敗", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

    return SuccessResponse(data=session_info)
