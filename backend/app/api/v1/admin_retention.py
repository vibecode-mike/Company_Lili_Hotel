"""
訪客資料保留任務（Webchat 7 天訊息粒度清理）
=============================
POST /admin/retention/run-guest-cleanup

語意：「**保留最近 GUEST_RETENTION_DAYS 天有過對話的訪客**」。

判定規則：
- 訪客在 7 天內有任何訊息 → 保留訪客 + 7 天內訊息（7 天前訊息仍會被刪）
- 訪客在 7 天內沒有任何訊息 → 訪客本身連同 thread 一併刪除

清理範圍與保險條件：
- 只動 platform='Webchat' 的 thread → 保險：避免誤殺 LINE/FB 訪客
- 只動 is_guest=1 的會員 → 保留實名會員資料

清理流程：
1. 刪 webchat 訪客 thread 中 created_at < cutoff 的 messages
2. 對殘存訊息的 thread：更新 last_message_at 為剩餘訊息最大時間
3. 對清空的 thread：連同 thread + member shell + 標籤一併刪除

驗證：X-Cron-Token header 必須等於 settings.CRON_TOKEN（若未設定則 fallback 到 SECRET_KEY）
排程：systemd timer (deploy/systemd/) 或 GCP Cloud Scheduler
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.conversation import ConversationMessage, ConversationThread
from app.models.member import Member
from app.models.tag import MemberInteractionTag, MemberTag

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
    """Webchat 訪客 7 天訊息粒度清理（見檔頭 docstring）"""
    _verify_token(x_cron_token)

    cutoff = datetime.now() - timedelta(days=settings.GUEST_RETENTION_DAYS)

    # 1. 找出 webchat 訪客名下的所有 thread
    threads_result = await db.execute(
        select(ConversationThread.id, ConversationThread.member_id)
        .join(Member, Member.id == ConversationThread.member_id)
        .where(
            Member.is_guest == True,  # noqa: E712
            ConversationThread.platform == "Webchat",
        )
    )
    thread_rows = threads_result.all()
    if not thread_rows:
        return {
            "deleted_messages": 0,
            "updated_threads": 0,
            "deleted_threads": 0,
            "deleted_members": 0,
            "cutoff": cutoff.isoformat(),
        }

    thread_ids = [r.id for r in thread_rows]
    member_ids_by_thread = {r.id: r.member_id for r in thread_rows}

    # 2. 刪過期 messages（只保留 created_at >= cutoff 的）
    msg_del = await db.execute(
        delete(ConversationMessage).where(
            ConversationMessage.thread_id.in_(thread_ids),
            ConversationMessage.created_at < cutoff,
        )
    )
    deleted_messages = msg_del.rowcount or 0

    # 3. 找出哪些 thread 還有殘存訊息 vs 哪些已清空
    remaining_thread_ids_q = await db.execute(
        select(ConversationMessage.thread_id)
        .where(ConversationMessage.thread_id.in_(thread_ids))
        .group_by(ConversationMessage.thread_id)
    )
    remaining_thread_ids = {r[0] for r in remaining_thread_ids_q.all()}
    empty_thread_ids = [tid for tid in thread_ids if tid not in remaining_thread_ids]

    # 4. 對殘存訊息的 thread：更新 last_message_at 為剩餘訊息最大時間
    updated_threads = 0
    surviving_thread_ids = [tid for tid in thread_ids if tid in remaining_thread_ids]
    if surviving_thread_ids:
        max_per_thread = await db.execute(
            select(
                ConversationMessage.thread_id,
                func.max(ConversationMessage.created_at).label("max_ts"),
            )
            .where(ConversationMessage.thread_id.in_(surviving_thread_ids))
            .group_by(ConversationMessage.thread_id)
        )
        for tid, max_ts in max_per_thread.all():
            await db.execute(
                update(ConversationThread)
                .where(ConversationThread.id == tid)
                .values(last_message_at=max_ts)
            )
            updated_threads += 1

    # 5. 對清空的 thread：刪 thread + member shell + 標籤
    deleted_threads = 0
    deleted_members = 0
    if empty_thread_ids:
        empty_member_ids = list({member_ids_by_thread[tid] for tid in empty_thread_ids})
        await db.execute(
            delete(ConversationThread).where(ConversationThread.id.in_(empty_thread_ids))
        )
        deleted_threads = len(empty_thread_ids)
        await db.execute(
            delete(MemberTag).where(MemberTag.member_id.in_(empty_member_ids))
        )
        await db.execute(
            delete(MemberInteractionTag).where(MemberInteractionTag.member_id.in_(empty_member_ids))
        )
        await db.execute(delete(Member).where(Member.id.in_(empty_member_ids)))
        deleted_members = len(empty_member_ids)

    await db.commit()

    logger.info(
        f"[guest_retention] cutoff={cutoff.isoformat()} "
        f"deleted_messages={deleted_messages} updated_threads={updated_threads} "
        f"deleted_threads={deleted_threads} deleted_members={deleted_members}"
    )
    return {
        "deleted_messages": deleted_messages,
        "updated_threads": updated_threads,
        "deleted_threads": deleted_threads,
        "deleted_members": deleted_members,
        "cutoff": cutoff.isoformat(),
    }
