"""
對話紀錄匯出 API
=============================
GET /conversations/export.csv
產出 UTF-8 BOM 編碼的 CSV，欄位：
  thread_id / 渠道 / 身份 / 名稱 / 時間 / 角色 / 內容
支援篩選：渠道、日期區間、會員/訪客、單一會員 ID。
"""
from __future__ import annotations

import csv
import io
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import pytz
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.conversation import ConversationMessage, ConversationThread
from app.models.member import Member

logger = logging.getLogger(__name__)
router = APIRouter()

TAIPEI_TZ = pytz.timezone("Asia/Taipei")

_VALID_CHANNELS = {"LINE", "Facebook", "Webchat"}
_VALID_MEMBER_TYPES = {"all", "member", "guest"}


def _parse_date(label: str, value: Optional[str]) -> Optional[datetime]:
    """解析 YYYY-MM-DD，回傳 naive datetime（台灣時間，與 DB 慣例一致）"""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"{label} 格式錯誤，請用 YYYY-MM-DD",
        ) from exc


def _format_role(direction: Optional[str], message_source: Optional[str]) -> str:
    """direction + message_source → 中文角色"""
    if direction == "incoming":
        return "user"
    # outgoing
    if message_source == "manual":
        return "staff"
    if message_source == "gpt":
        return "bot"
    if message_source == "broadcast":
        return "broadcast"
    return "bot"


def _identity_label(member: Optional[Member]) -> tuple[str, str]:
    """回傳 (身份, 名稱)：(會員/訪客, 名稱)"""
    if member is None:
        return ("匿名", "未知")
    if getattr(member, "is_guest", False):
        seq = member.guest_seq or 0
        return ("訪客", f"訪客{seq:06d}" if seq else (member.name or "訪客"))
    return ("會員", member.name or member.line_display_name or member.fb_customer_name or member.webchat_name or f"member#{member.id}")


@router.get("/conversations/export.csv")
async def export_conversations(
    channel: Optional[str] = Query(None, description="LINE / Facebook / Webchat（不填=全部）"),
    date_from: Optional[str] = Query(None, description="起始日期 YYYY-MM-DD（含）"),
    date_to: Optional[str] = Query(None, description="結束日期 YYYY-MM-DD（含）"),
    member_type: str = Query("all", pattern="^(all|member|guest)$"),
    member_id: Optional[int] = Query(None, description="僅匯出特定會員/訪客"),
    db: AsyncSession = Depends(get_db),
):
    """匯出對話紀錄為 CSV"""
    if channel and channel not in _VALID_CHANNELS:
        raise HTTPException(status_code=400, detail=f"渠道必須是 {_VALID_CHANNELS} 之一")

    df = _parse_date("date_from", date_from)
    dt = _parse_date("date_to", date_to)
    # date_to 含當日 → +1 天再用 < 比較
    dt_exclusive = dt + timedelta(days=1) if dt else None

    # 組查詢條件
    stmt = (
        select(ConversationMessage, ConversationThread, Member)
        .join(ConversationThread, ConversationMessage.thread_id == ConversationThread.id)
        .outerjoin(Member, ConversationThread.member_id == Member.id)
        .order_by(ConversationMessage.created_at.asc())
    )
    conds = []
    if channel:
        conds.append(ConversationMessage.platform == channel)
    if df:
        conds.append(ConversationMessage.created_at >= df)
    if dt_exclusive:
        conds.append(ConversationMessage.created_at < dt_exclusive)
    if member_type == "member":
        conds.append(and_(Member.id.isnot(None), Member.is_guest == False))  # noqa: E712
    elif member_type == "guest":
        conds.append(and_(Member.id.isnot(None), Member.is_guest == True))  # noqa: E712
    if member_id is not None:
        conds.append(Member.id == member_id)
    if conds:
        stmt = stmt.where(and_(*conds))

    # 排除群發
    stmt = stmt.where(or_(
        ConversationMessage.message_source != "broadcast",
        ConversationMessage.message_source.is_(None),
    ))

    result = await db.execute(stmt)
    rows = result.all()

    # 串流輸出 CSV
    def _iter_csv():
        buf = io.StringIO()
        # UTF-8 BOM 讓 Excel 正確解 UTF-8 中文
        buf.write("﻿")
        writer = csv.writer(buf)
        writer.writerow(["thread_id", "渠道", "身份", "名稱", "時間", "角色", "內容"])
        yield buf.getvalue()
        buf.seek(0); buf.truncate(0)

        for msg, thread, member in rows:
            identity, display_name = _identity_label(member)
            created = msg.created_at
            if created and created.tzinfo is None:
                # MySQL NOW() 已是台灣時間 → 直接標記 TAIPEI_TZ
                created = created.replace(tzinfo=TAIPEI_TZ)
            time_str = created.strftime("%Y-%m-%d %H:%M:%S") if created else ""
            role = _format_role(msg.direction, msg.message_source)
            content = msg.content or ""
            # 房卡訊息以 [房型卡片] 標示，避免 JSON 塞爆 Excel 一格
            if msg.message_type == "room_cards":
                content = "[房型卡片]"
            writer.writerow([
                thread.id,
                msg.platform or "",
                identity,
                display_name,
                time_str,
                role,
                content,
            ])
            yield buf.getvalue()
            buf.seek(0); buf.truncate(0)

    # 檔名帶時間戳，避免重複下載互蓋
    now_str = datetime.now(TAIPEI_TZ).strftime("%Y%m%d_%H%M%S")
    filename = f"conversations_{now_str}.csv"

    return StreamingResponse(
        _iter_csv(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
