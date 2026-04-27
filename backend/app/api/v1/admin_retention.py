"""
訪客資料保留任務
=============================
POST /admin/retention/run-guest-cleanup
刪除最後一則訊息超過 GUEST_RETENTION_DAYS 天的訪客（is_guest=1），
連同 conversation_threads / conversation_messages / 標籤關聯一併移除。

驗證：X-Cron-Token header 必須等於 settings.CRON_TOKEN（若未設定則 fallback 到 SECRET_KEY）
排程：systemd timer (deploy/systemd/) 或 GCP Cloud Scheduler
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.conversation import ConversationMessage, ConversationThread
from app.models.member import Member
from app.models.tag import MemberTag, MemberInteractionTag

logger = logging.getLogger(__name__)
router = APIRouter()


def _expected_token() -> str:
    """正式 token：CRON_TOKEN 沒設定就 fallback SECRET_KEY，避免空字串繞過"""
    return (settings.CRON_TOKEN or settings.SECRET_KEY or "").strip()


def _verify_token(x_cron_token: str | None) -> None:
    expected = _expected_token()
    if not expected:
        raise HTTPException(status_code=500, detail="CRON_TOKEN 未設定")
    if not x_cron_token or x_cron_token.strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/run-guest-cleanup")
async def run_guest_cleanup(
    x_cron_token: str | None = Header(None, alias="X-Cron-Token"),
    db: AsyncSession = Depends(get_db),
):
    """清理超過保留天數沒講話的訪客 + 對話資料"""
    _verify_token(x_cron_token)

    cutoff = datetime.now() - timedelta(days=settings.GUEST_RETENTION_DAYS)

    # 找出符合條件的訪客 id：is_guest=1 且最後訊息時間 < cutoff
    # last_message_at 在 ConversationThread 上維護；若該訪客根本沒對話則用 created_at
    last_msg_subq = (
        select(
            ConversationThread.member_id.label("member_id"),
            func.max(ConversationThread.last_message_at).label("last_msg"),
        )
        .group_by(ConversationThread.member_id)
        .subquery()
    )

    target_stmt = (
        select(Member.id, Member.guest_seq, last_msg_subq.c.last_msg, Member.created_at)
        .outerjoin(last_msg_subq, Member.id == last_msg_subq.c.member_id)
        .where(Member.is_guest == True)  # noqa: E712
    )
    result = await db.execute(target_stmt)
    rows = result.all()

    target_ids: list[int] = []
    for member_id, _seq, last_msg, created_at in rows:
        # 用「最後訊息」優先；沒有訊息則用 Member.created_at
        ref_time = last_msg or created_at
        if ref_time and ref_time < cutoff:
            target_ids.append(member_id)

    if not target_ids:
        return {"deleted_count": 0, "cutoff": cutoff.isoformat()}

    # 找出這些 member 名下的 thread id（messages 將透過 thread cascade 處理；保險起見也手動清）
    thread_ids_result = await db.execute(
        select(ConversationThread.id).where(ConversationThread.member_id.in_(target_ids))
    )
    thread_ids = [row[0] for row in thread_ids_result.all()]

    # 1. 刪 messages（thread cascade 應該會處理，但手動清避免外鍵限制）
    if thread_ids:
        await db.execute(
            delete(ConversationMessage).where(ConversationMessage.thread_id.in_(thread_ids))
        )
    # 2. 刪 threads
    if thread_ids:
        await db.execute(
            delete(ConversationThread).where(ConversationThread.id.in_(thread_ids))
        )
    # 3. 刪標籤關聯（Member cascade 應已涵蓋，但手動清更明確）
    await db.execute(
        delete(MemberTag).where(MemberTag.member_id.in_(target_ids))
    )
    await db.execute(
        delete(MemberInteractionTag).where(MemberInteractionTag.member_id.in_(target_ids))
    )
    # 4. 最後刪 Member
    await db.execute(
        delete(Member).where(Member.id.in_(target_ids))
    )
    await db.commit()

    logger.info(
        f"[guest_retention] deleted {len(target_ids)} guest members (cutoff={cutoff.isoformat()})"
    )
    return {
        "deleted_count": len(target_ids),
        "deleted_member_ids": target_ids,
        "cutoff": cutoff.isoformat(),
    }
