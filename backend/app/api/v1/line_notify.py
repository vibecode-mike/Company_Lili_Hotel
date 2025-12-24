"""
LINE 訊息通知 API
接收來自 line_app 的新訊息通知,透過 WebSocket 推送給前端
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.websocket_manager import manager
from app.database import get_db
from app.models.member import Member
from app.services.chatroom_service import ChatroomService

logger = logging.getLogger(__name__)
router = APIRouter()


class MessageNotification(BaseModel):
    """LINE 訊息通知資料結構"""
    line_uid: str
    message_text: str
    timestamp: int  # Unix timestamp (milliseconds)
    message_id: str
    direction: str = "incoming"  # incoming=用戶訊息, outgoing=自動回應
    source: str | None = None    # gpt/keyword/always/manual (僅 outgoing 有值)


@router.post("/line/message-notify")
async def notify_new_message(
    notification: MessageNotification,
    db: AsyncSession = Depends(get_db)
):
    """
    接收 LINE App 的新訊息通知

    當使用者在 LINE 發送訊息時,line_app 會呼叫此 API
    此 API 會透過 WebSocket 即時推送訊息給正在查看聊天室的前端

    Args:
        notification: 訊息通知資料
    """
    try:
        # 1. 根據 line_uid 找到對應的 member
        stmt = select(Member).where(Member.line_uid == notification.line_uid)
        result = await db.execute(stmt)
        member = result.scalar_one_or_none()

        if not member:
            logger.warning(f"Member not found for LINE UID: {notification.line_uid}")
            # 不算錯誤,可能是新用戶或尚未同步
            return {"status": "ok", "message": "Member not found, skipped"}

        # 2. 轉換時間格式 (使用中文上午/下午)
        # notification.timestamp: Unix timestamp (milliseconds)
        message_time = datetime.fromtimestamp(notification.timestamp / 1000, tz=timezone.utc).astimezone(ZoneInfo("Asia/Taipei"))
        hour = message_time.hour
        minute = message_time.minute
        period = "上午" if hour < 12 else "下午"
        hour_12 = hour if hour <= 12 else hour - 12
        if hour_12 == 0:
            hour_12 = 12
        time_str = f"{period} {hour_12:02d}:{minute:02d}"

        # 3. 構建前端訊息格式
        # 根據 direction 判斷訊息類型: outgoing=官方回應, incoming=用戶訊息
        msg_type = "official" if notification.direction == "outgoing" else "user"

        message_data = {
            "id": notification.message_id,
            "type": msg_type,
            "text": notification.message_text,
            "time": time_str,
            "isRead": False,
            "source": notification.source  # 傳遞來源 (gpt/keyword/always)
        }

        # 4. 更新 conversation_messages 並透過 WebSocket 推送給前端 (thread_id = LINE:{uid})
        chatroom_service = ChatroomService(db)
        msg = await chatroom_service.append_message(member, "LINE", "incoming", notification.message_text, message_source=notification.source)

        await manager.send_new_message(msg.thread_id, {
            **message_data,
            "thread_id": msg.thread_id,
            "timestamp": msg.created_at.replace(tzinfo=timezone.utc).isoformat() if msg.created_at else None
        })

        logger.info(f"✅ Notified frontend about new message on thread {msg.thread_id}")
        return {
            "status": "ok",
            "member_id": member.id,
            "thread_id": msg.thread_id,
            "notified": manager.get_connection_count(msg.thread_id) > 0
        }

    except Exception as e:
        logger.error(f"❌ Failed to notify new message: {e}")
        raise HTTPException(status_code=500, detail=str(e))
