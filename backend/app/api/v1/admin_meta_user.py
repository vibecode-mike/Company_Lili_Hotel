"""
Meta User admin endpoints - 會員資訊管理
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.member import Member
from app.models.tag import MemberTag, MemberInteractionTag
from app.models.fb_channel import FbChannel
from app.models.line_channel import LineChannel
from app.schemas.common import SuccessResponse

router = APIRouter()


async def _get_fb_source_name(db: AsyncSession) -> str:
    """取得 Facebook 粉專名稱"""
    result = await db.execute(
        select(FbChannel.channel_name)
        .where(FbChannel.is_active == True)
        .limit(1)
    )
    return result.scalar_one_or_none() or ""


async def _get_line_source_name(db: AsyncSession) -> str:
    """取得 LINE 官方帳號名稱"""
    result = await db.execute(
        select(LineChannel.channel_name)
        .where(LineChannel.is_active == True)
        .limit(1)
    )
    return result.scalar_one_or_none() or ""


def _build_channel_info(
    member: Member,
    channel_type: str,
    source_name: str,
) -> dict:
    """建立渠道資訊物件"""
    if channel_type == "Facebook":
        return {
            "customer_id": member.id,
            "channel": "Facebook",
            "channel_name": member.fb_customer_name or "",
            "channel_avatar": member.fb_avatar or "",
            "source_name": source_name,
        }
    if channel_type == "LINE":
        return {
            "customer_id": member.id,
            "channel": "LINE",
            "channel_name": member.line_display_name or "",
            "channel_avatar": member.line_avatar or "",
            "source_name": source_name,
        }
    # Webchat
    return {
        "customer_id": member.id,
        "channel": "Webchat",
        "channel_name": member.webchat_name or "",
        "channel_avatar": member.webchat_avatar or "",
        "source_name": "Webchat",
    }


@router.get("/profile", response_model=SuccessResponse)
async def get_meta_user_profile(
    customer_id: int = Query(..., description="會員 ID"),
    channel: str = Query(None, description="渠道：LINE/Facebook/Webchat，決定顯示哪個來源"),
    db: AsyncSession = Depends(get_db),
):
    """
    取得會員資訊 (用於會員管理 > 會員資訊頁)

    Args:
        customer_id: 會員 ID
        channel: 指定渠道 (LINE/Facebook/Webchat)，決定顯示哪個來源的 logo 和名稱

    Returns:
        完整會員資料，包含所有渠道資訊和標籤 (tag_type: 1=會員標籤, 2=互動標籤)
    """
    # 1. 查詢會員
    result = await db.execute(
        select(Member).where(Member.id == customer_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 2. 根據指定的 channel 參數決定顯示哪個來源
    channel_info = None
    channel_normalized = channel.strip().lower() if channel else None

    # 判斷要使用的渠道類型
    selected_channel = None
    if channel_normalized == "facebook" and member.fb_customer_id:
        selected_channel = "Facebook"
    elif channel_normalized == "line" and member.line_uid:
        selected_channel = "LINE"
    elif channel_normalized == "webchat" and member.webchat_uid:
        selected_channel = "Webchat"
    elif member.fb_customer_id:
        selected_channel = "Facebook"
    elif member.line_uid:
        selected_channel = "LINE"
    elif member.webchat_uid:
        selected_channel = "Webchat"

    # 根據選定的渠道建立 channel_info
    if selected_channel == "Facebook":
        source_name = await _get_fb_source_name(db)
        channel_info = _build_channel_info(member, "Facebook", source_name)
    elif selected_channel == "LINE":
        source_name = await _get_line_source_name(db)
        channel_info = _build_channel_info(member, "LINE", source_name)
    elif selected_channel == "Webchat":
        channel_info = _build_channel_info(member, "Webchat", "Webchat")

    # 3. 查詢標籤 (使用 tag_type 格式)
    tags = []

    # 會員標籤 (tag_type: 1)
    member_tags_result = await db.execute(
        select(MemberTag).where(MemberTag.member_id == member.id)
    )
    for tag in member_tags_result.scalars():
        tags.append({
            "id": tag.id,
            "name": tag.tag_name,
            "tag": tag.tag_name,
            "tag_type": 1  # 會員標籤
        })

    # 互動標籤 (tag_type: 2)
    interaction_tags_result = await db.execute(
        select(MemberInteractionTag).where(MemberInteractionTag.member_id == member.id)
    )
    for tag in interaction_tags_result.scalars():
        tags.append({
            "id": tag.id,
            "name": tag.tag_name,
            "tag": tag.tag_name,
            "tag_type": 2  # 互動標籤
        })

    # 4. 返回完整會員資料（與 /api/v1/members/{id} 格式相容）
    return SuccessResponse(data={
        # 基本資訊
        "id": member.id,
        "name": member.name or "",
        "email": member.email or "",
        "phone": member.phone or "",
        "gender": member.gender or "",
        "birthday": member.birthday or "",
        "created_at": member.created_at.isoformat() if member.created_at else None,
        "last_interaction_at": member.updated_at.isoformat() if member.updated_at else None,
        # LINE 渠道
        "line_uid": member.line_uid or "",
        "line_display_name": member.line_display_name or "",
        "line_avatar": member.line_avatar or "",
        "channel_id": member.channel_id or "",
        # Facebook 渠道
        "fb_customer_id": member.fb_customer_id or "",
        "fb_customer_name": member.fb_customer_name or "",
        "fb_avatar": member.fb_avatar or "",
        # Webchat 渠道
        "webchat_uid": member.webchat_uid or "",
        "webchat_name": member.webchat_name or "",
        "webchat_avatar": member.webchat_avatar or "",
        # 其他
        "join_source": member.join_source or "",
        "id_number": member.id_number or "",
        "residence": member.residence or "",
        "passport_number": member.passport_number or "",
        "internal_note": member.internal_note or "",
        "gpt_enabled": member.gpt_enabled if member.gpt_enabled is not None else True,
        # 當前選擇的渠道資訊
        "channel": channel_info,
        # 標籤 (tag_type 格式)
        "tags": tags
    })
