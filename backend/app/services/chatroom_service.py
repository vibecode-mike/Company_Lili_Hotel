import json
import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.member import Member
from app.models.conversation import ConversationThread, ConversationMessage
from app.models.message import Message
from app.models.user import User
from app.core.timezone import to_utc_iso

logger = logging.getLogger(__name__)


class ChatroomService:
    """
    多渠道聊天室服務
    - 使用 conversation_threads / conversation_messages 表
    - thread_id 直接使用 platform_uid（無前綴），透過 platform 欄位區分渠道
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
            thread.last_message_at = thread.last_message_at or datetime.now()
        else:
            thread = ConversationThread(
                id=thread_id,
                member_id=member.id,
                platform=platform,
                platform_uid=platform_uid,
                last_message_at=datetime.now(),
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
            content=content,
            message_source=message_source,
            sent_by=sender_id,
            # status 不能留 NULL：已讀標記的 status != 'read' 條件會漏掉 NULL（SQL 三值邏輯）
            status="sent" if direction == "outgoing" else "received",
            created_at=datetime.now(),
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
            .options(selectinload(ConversationMessage.sender))
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

        # 群發訊息（message_type=flex）只存參照，這裡一次撈回本頁所有
        # broadcast_message_id 對應的 messages.flex_message_json，避免 N+1
        broadcast_ids = {
            r.broadcast_message_id
            for r in records
            if r.message_type == "flex" and r.broadcast_message_id
        }
        flex_map: Dict[int, Any] = {}
        if broadcast_ids:
            flex_result = await self.db.execute(
                select(Message.id, Message.flex_message_json).where(
                    Message.id.in_(broadcast_ids)
                )
            )
            for row in flex_result:
                if not row.flex_message_json:
                    continue
                try:
                    flex_map[row.id] = json.loads(row.flex_message_json)
                except (TypeError, ValueError):
                    # 非嚴格 JSON（歷史資料可能是 Python dict repr），交給前端 parser 正規化
                    flex_map[row.id] = row.flex_message_json

        messages = []
        for record in records:
            msg_type = "user" if record.direction == "incoming" else "official"
            # created_at 是 DB naive UTC，輸出 UTC aware ISO（+00:00），前端依觀看者時區格式化
            timestamp_str = to_utc_iso(record.created_at)

            # 計算 senderName：manual 訊息顯示發送人員名稱，其他顯示「系統」
            sender_name = None
            if msg_type == "official":
                if record.message_source == "manual" and record.sender:
                    sender_name = record.sender.username
                else:
                    sender_name = "系統"

            # 房卡訊息：解析 JSON 內容
            msg_dict: Dict[str, Any] = {
                "id": record.id,
                "type": msg_type,
                "text": record.content,
                "timestamp": timestamp_str,
                "isRead": record.status == "read",
                "source": record.message_source,
                "senderName": sender_name,
                "messageType": record.message_type,
            }
            if record.message_type == "room_cards" and record.content:
                try:
                    parsed = json.loads(record.content)
                    msg_dict["roomCards"] = parsed.get("room_cards", [])
                    msg_dict["text"] = ""
                except Exception:
                    logger.warning(f"Failed to parse room_cards content for message {record.id}")

            # 群發 Flex：帶出原始 flex 內容供前端還原卡片外觀；text 保留純文字備援
            if record.message_type == "flex" and record.broadcast_message_id in flex_map:
                msg_dict["flexMessage"] = flex_map[record.broadcast_message_id]

            messages.append(msg_dict)

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
