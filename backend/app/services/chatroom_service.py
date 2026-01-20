import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import pytz
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.member import Member
from app.models.conversation import ConversationThread, ConversationMessage
from app.models.user import User

logger = logging.getLogger(__name__)

# 台北時區
TAIPEI_TZ = pytz.timezone('Asia/Taipei')


def format_chat_time(dt: Optional[datetime]) -> str:
    """格式化為 '時段 HH:mm' 格式，例如 '下午 03:30'"""
    if not dt:
        return ""

    # 統一處理：假設 naive datetime 是 UTC 時間，然後轉換為台北時間顯示
    if dt.tzinfo is None:
        # naive datetime 視為 UTC
        utc_dt = dt.replace(tzinfo=timezone.utc)
        local_dt = utc_dt.astimezone(TAIPEI_TZ)
    else:
        local_dt = dt.astimezone(TAIPEI_TZ)
    hour = local_dt.hour
    minute = local_dt.minute

    # 判斷時段 (台灣時間)
    if 0 <= hour < 6:
        period = "凌晨"
        display_hour = hour if hour > 0 else 12
    elif 6 <= hour < 12:
        period = "上午"
        display_hour = hour
    elif 12 <= hour < 14:
        period = "中午"
        display_hour = 12 if hour == 12 else hour - 12
    elif 14 <= hour < 18:
        period = "下午"
        display_hour = hour - 12
    else:  # 18-23
        period = "晚上"
        display_hour = hour - 12

    return f"{period} {display_hour:02d}:{minute:02d}"


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
            thread.last_message_at = thread.last_message_at or datetime.now(timezone.utc)
        else:
            thread = ConversationThread(
                id=thread_id,
                member_id=member.id,
                platform=platform,
                platform_uid=platform_uid,
                last_message_at=datetime.now(timezone.utc),
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
        sender_id: Optional[int] = None,
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
            sent_by=sender_id,
            created_at=datetime.now(timezone.utc),
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
            # 過濾群發訊息（NULL 視為非群發）
            or_(
                ConversationMessage.message_source != "broadcast",
                ConversationMessage.message_source.is_(None)
            ),
        )
        result = await self.db.execute(count_stmt)
        total = result.scalar() or 0

        offset = (page - 1) * page_size
        has_more = (offset + page_size) < total

        msg_stmt = (
            select(ConversationMessage)
            .options(selectinload(ConversationMessage.sender))
            .where(
                ConversationMessage.thread_id == thread_id,
                ConversationMessage.platform == platform,
                # 過濾群發訊息（NULL 視為非群發）
                or_(
                    ConversationMessage.message_source != "broadcast",
                    ConversationMessage.message_source.is_(None)
                ),
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
            if record.created_at:
                # 假設 naive datetime 是台灣本地時間
                if record.created_at.tzinfo is None:
                    created_at_local = TAIPEI_TZ.localize(record.created_at)
                else:
                    created_at_local = record.created_at.astimezone(TAIPEI_TZ)
                timestamp_str = created_at_local.isoformat()
            else:
                timestamp_str = None

            # 計算 senderName：manual 訊息顯示發送人員名稱，其他顯示「系統」
            sender_name = None
            if msg_type == "official":
                if record.message_source == "manual" and record.sender:
                    sender_name = record.sender.username
                else:
                    sender_name = "系統"

            messages.append(
                {
                    "id": record.id,
                    "type": msg_type,
                    "text": record.question if record.direction == "incoming" else record.response,
                    "time": format_chat_time(record.created_at),  # 格式化為 "下午 03:30"
                    "timestamp": timestamp_str,
                    "isRead": record.status == "read" if hasattr(record, "status") else False,
                    "source": record.message_source,
                    "senderName": sender_name,
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
            ("Facebook", member.fb_customer_id),
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
            if not member.fb_customer_id:
                raise ValueError("會員未綁定 Facebook 帳號")
            return member.fb_customer_id
        if platform == "Webchat":
            if not member.webchat_uid:
                raise ValueError("會員未綁定 Webchat")
            return member.webchat_uid
        raise ValueError("不支援的渠道平台")
