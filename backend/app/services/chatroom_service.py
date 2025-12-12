import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.member import Member
from app.models.conversation import ConversationThread, ConversationMessage

logger = logging.getLogger(__name__)


class ChatroomService:
    """
    多渠道聊天室服務
    - 使用 conversation_threads / conversation_messages 表
    - thread_id 格式：{platform}:{platform_uid}
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_thread(self, member: Member, platform: str) -> ConversationThread:
        platform_uid = self._get_platform_uid(member, platform)
        # thread_id 直接用 platform_uid，透過 platform 欄位區分渠道
        thread_id = platform_uid

        result = await self.db.execute(
            select(ConversationThread).where(ConversationThread.id == thread_id)
        )
        thread = result.scalar_one_or_none()

        if thread:
            thread.member_id = member.id
            thread.platform = platform
            thread.platform_uid = platform_uid
            thread.last_message_at = thread.last_message_at or datetime.utcnow()
        else:
            thread = ConversationThread(
                id=thread_id,
                member_id=member.id,
                platform=platform,
                platform_uid=platform_uid,
                last_message_at=datetime.utcnow(),
            )
            self.db.add(thread)
        await self.db.flush()
        return thread

    async def append_message(
        self,
        member: Member,
        platform: str,
        direction: str,
        content: str,
        message_source: Optional[str] = None,
    ) -> ConversationMessage:
        thread = await self.upsert_thread(member, platform)
        message_id = str(uuid.uuid4())
        msg = ConversationMessage(
            id=message_id,
            thread_id=thread.id,
            platform=platform,
            direction=direction,
            question=content if direction == "incoming" else None,
            response=content if direction == "outgoing" else None,
            message_source=message_source,
            created_at=datetime.utcnow(),
        )
        self.db.add(msg)
        thread.last_message_at = msg.created_at
        await self.db.flush()
        return msg

    async def get_messages(
        self,
        member: Member,
        platform: str,
        page: int,
        page_size: int,
    ) -> Dict[str, Any]:
        platform_uid = self._get_platform_uid(member, platform)
        # thread_id 直接用 platform_uid，透過 platform 欄位區分渠道
        thread_id = platform_uid

        count_stmt = select(func.count()).select_from(ConversationMessage).where(
            ConversationMessage.thread_id == thread_id,
            ConversationMessage.platform == platform,
        )
        result = await self.db.execute(count_stmt)
        total = result.scalar() or 0

        offset = (page - 1) * page_size
        has_more = (offset + page_size) < total

        msg_stmt = (
            select(ConversationMessage)
            .where(
                ConversationMessage.thread_id == thread_id,
                ConversationMessage.platform == platform,
            )
            .order_by(ConversationMessage.created_at.desc())
            .limit(page_size)
            .offset(offset)
        )
        result = await self.db.execute(msg_stmt)
        records = list(reversed(result.scalars().all()))

        messages = []
        for record in records:
            msg_type = "user" if record.direction == "incoming" else "official"
            timestamp_str = record.created_at.isoformat() if record.created_at else None
            messages.append(
                {
                    "id": record.id,
                    "type": msg_type,
                    "text": record.question if record.direction == "incoming" else record.response,
                    "time": "",  # 已有 timestamp，前端可自行格式化
                    "timestamp": timestamp_str,
                    "isRead": record.status == "read" if hasattr(record, "status") else False,
                    "source": record.message_source,
                }
            )

        return {
            "messages": messages,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": has_more,
        }

    async def open_session(self, member: Member) -> Dict[str, Any]:
        platforms = []
        latest_platform = None
        latest_time = None

        for plat, uid in [
            ("LINE", member.line_uid),
            ("Facebook", member.fb_uid),
            ("Webchat", member.webchat_uid),
        ]:
            if not uid:
                continue
            thread = await self.upsert_thread(member, plat)
            platforms.append(plat)
            if thread.last_message_at and (latest_time is None or thread.last_message_at > latest_time):
                latest_time = thread.last_message_at
                latest_platform = plat

        return {
            "available_platforms": platforms,
            "default_platform": latest_platform or (platforms[0] if platforms else None),
            "threads": {plat: self._get_platform_uid(member, plat) for plat in platforms},
        }

    def _get_platform_uid(self, member: Member, platform: str) -> str:
        if platform == "LINE":
            if not member.line_uid:
                raise ValueError("會員未綁定 LINE 帳號")
            return member.line_uid
        if platform == "Facebook":
            if not member.fb_uid:
                raise ValueError("會員未綁定 Facebook 帳號")
            return member.fb_uid
        if platform == "Webchat":
            if not member.webchat_uid:
                raise ValueError("會員未綁定 Webchat")
            return member.webchat_uid
        raise ValueError("不支援的渠道平台")
