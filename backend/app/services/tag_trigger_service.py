"""
標籤觸發事件統一記錄器
每次會員被貼標 / 既有標籤被重新觸發時呼叫 record_tag_trigger()，
寫入 tag_trigger_logs 表供時段洞察等統計使用。
"""
from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag_trigger_log import TagTriggerLog, TagType, TriggerSource


async def record_tag_trigger(
    db: AsyncSession,
    *,
    member_id: int,
    tag_name: str,
    tag_type: TagType,
    source: TriggerSource,
    tag_id: Optional[int] = None,
    message_id: Optional[int] = None,
    campaign_id: Optional[int] = None,
    platform: Optional[str] = None,
    channel_id: Optional[str] = None,
) -> None:
    """
    寫一筆 tag_trigger_logs。呼叫端不需要 commit，由外層 session 統一處理。
    失敗時靜默吞例外（統計失敗不該阻斷業務邏輯）。

    Args:
        member_id: 被打標的會員 ID（必填）
        tag_name: 標籤名稱（必填，用於快照）
        tag_type: member 或 interaction
        source: click / interaction / manual
        tag_id: 對應 interaction_tags.id（member 標籤可留空）
        message_id / campaign_id: 若來源於群發則填入
        platform / channel_id: 標籤所屬平台與頻道，給 channel 隔離統計用；
            呼叫端未帶時嘗試從 member 推導，多平台會員可能留 NULL
    """
    try:
        # 若呼叫端沒帶 platform/channel_id，嘗試從 member 推導
        if platform is None or channel_id is None:
            from app.services.platform_channel_resolver import resolve_for_member
            from app.models.member import Member
            from sqlalchemy import select
            mem = (await db.execute(select(Member).where(Member.id == member_id))).scalar_one_or_none()
            resolved_platform, resolved_channel = resolve_for_member(mem)
            platform = platform or resolved_platform
            channel_id = channel_id or resolved_channel

        log = TagTriggerLog(
            member_id=member_id,
            tag_id=tag_id,
            tag_type=tag_type,
            tag_name=(tag_name or "")[:100],
            message_id=message_id,
            campaign_id=campaign_id,
            trigger_source=source,
            triggered_at=datetime.now(ZoneInfo("Asia/Taipei")).replace(tzinfo=None),
            platform=platform,
            channel_id=channel_id,
        )
        db.add(log)
        await db.flush()
    except Exception:
        import logging
        logging.exception("[tag_trigger] failed to write log")
