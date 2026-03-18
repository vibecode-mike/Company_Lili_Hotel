"""
AI 聊天 API — 會員聊天室用（LINE / Facebook / Webchat）
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.faq import AiChatRequestSchema
from app.services.chatbot_service import chatbot_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


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
            "data": result,
        }
    except Exception as e:
        logger.error(f"AI chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="AI 聊天服務暫時無法使用")
