"""
LINE 訊息通知 API
接收來自 line_app 的新訊息通知，透過 SSE 推送給前端
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.conversation import ConversationMessage
from app.models.member import Member
from app.services.chatroom_service import ChatroomService
from app.utils.time_utils import TAIPEI_TZ, format_taipei_time
from app.websocket_manager import manager

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

    當使用者在 LINE 發送訊息時，line_app 會呼叫此 API，
    透過 SSE 即時推送訊息給正在查看聊天室的前端。
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

        # 2. 轉換時間格式 (使用中文時段)
        message_time = datetime.fromtimestamp(notification.timestamp / 1000, tz=TAIPEI_TZ)
        time_str = format_taipei_time(message_time)

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

        # 4. Upsert conversation_messages（避免 LINE App 與 Backend 重複寫入/造成聊天室缺訊）
        chatroom_service = ChatroomService(db)
        thread = await chatroom_service.upsert_thread(member, "LINE")

        direction = "outgoing" if notification.direction == "outgoing" else "incoming"
        role = "assistant" if direction == "outgoing" else "user"

        msg_result = await db.execute(select(ConversationMessage).where(ConversationMessage.id == notification.message_id))
        msg = msg_result.scalar_one_or_none()

        if msg:
            # 補齊/修正欄位（舊資料可能沒有 platform）
            msg.thread_id = thread.id
            msg.platform = "LINE"
            msg.role = role
            msg.direction = direction
            msg.message_source = notification.source or msg.message_source
            if direction == "outgoing":
                msg.response = notification.message_text
            else:
                msg.question = notification.message_text
        else:
            # 使用已解析的台北本地時間（去掉 tzinfo 以匹配 DB 存儲格式）
            created_at_local = message_time.replace(tzinfo=None)
            msg = ConversationMessage(
                id=notification.message_id,
                thread_id=thread.id,
                platform="LINE",
                role=role,
                direction=direction,
                question=notification.message_text if direction == "incoming" else None,
                response=notification.message_text if direction == "outgoing" else None,
                message_source=notification.source,
                status="received" if direction == "incoming" else "sent",
                created_at=created_at_local,
            )
            db.add(msg)

        thread.last_message_at = msg.created_at

        # 5. LINE 用戶發送新訊息 → 表示已打開對話 → 標記之前的 outgoing 訊息為「已讀」
        if direction == "incoming":
            mark_read_stmt = (
                update(ConversationMessage)
                .where(
                    ConversationMessage.thread_id == thread.id,
                    ConversationMessage.direction == "outgoing",
                    ConversationMessage.status != "read",
                )
                .values(status="read")
            )
            result = await db.execute(mark_read_stmt)
            if result.rowcount > 0:
                logger.info(f"📖 Marked {result.rowcount} outgoing messages as read for thread {thread.id}")

        # 手動發送訊息由 members.py 推送 SSE（包含 senderName），這裡跳過避免重複
        if notification.direction == "outgoing" and notification.source == "manual":
            logger.info(f"Skipping SSE push for manual outgoing message (handled by members.py)")
        else:
            sse_count = manager.get_connection_count(msg.thread_id)
            logger.info(f"SSE push: thread={msg.thread_id}, connections={sse_count}, direction={notification.direction}")
            await manager.send_new_message(msg.thread_id, {
                **message_data,
                "thread_id": msg.thread_id,
                "timestamp": message_time.isoformat(),
            })
            logger.info(f"Notified frontend via SSE on thread {msg.thread_id} (connections: {sse_count})")
        return {
            "status": "ok",
            "member_id": member.id,
            "thread_id": msg.thread_id,
            "notified": manager.get_connection_count(msg.thread_id) > 0
        }

    except Exception as e:
        logger.error(f"❌ Failed to notify new message: {e}")
        raise HTTPException(status_code=500, detail=str(e))
