"""
Facebook 頻道設定 API
用於基本設定頁面的 Facebook 粉絲專頁連結與驗證
"""

from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.clients.fb_message_client import FbMessageClient
from app.models.member import Member
from app.config import settings
from app.models.fb_channel import FbChannel
from app.schemas.common import SuccessResponse
from app.schemas.fb_channel import (
    FbChannelCreate,
    FbChannelUpdate,
    FbChannelResponse,
    FbChannelStatusResponse,
    FacebookSdkConfigResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

REQUIRED_FIELDS = ("page_id",)


def _has_value(value: Optional[str]) -> bool:
    return bool(value and value.strip())


def _collect_missing_fields(channel: FbChannel) -> List[str]:
    missing: List[str] = []
    if not _has_value(channel.page_id):
        missing.append("page_id")
    return missing


@router.get("", response_model=List[FbChannelResponse])
async def list_channels(db: AsyncSession = Depends(get_db)):
    """列出所有啟用中的 Facebook 粉絲專頁頻道設定"""
    stmt = select(FbChannel).where(FbChannel.is_active == True).order_by(FbChannel.id.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/status", response_model=FbChannelStatusResponse)
async def get_channel_status(db: AsyncSession = Depends(get_db)):
    """取得 Facebook 頻道設定狀態與缺漏欄位（單一頻道視角）"""
    stmt = select(FbChannel).where(FbChannel.is_active == True).order_by(FbChannel.id.desc()).limit(1)
    result = await db.execute(stmt)
    channel = result.scalar_one_or_none()

    if not channel:
        return FbChannelStatusResponse(
            has_active_channel=False,
            is_configured=False,
            missing_fields=list(REQUIRED_FIELDS),
            channel_db_id=None,
            connection_status="disconnected",
            last_verified_at=None,
        )

    missing_fields = _collect_missing_fields(channel)
    is_configured = len(missing_fields) == 0 and channel.connection_status == "connected"
    return FbChannelStatusResponse(
        has_active_channel=True,
        is_configured=is_configured,
        missing_fields=missing_fields,
        channel_db_id=channel.id,
        connection_status=channel.connection_status or "disconnected",
        last_verified_at=channel.last_verified_at,
    )


@router.get("/sdk_config", response_model=FacebookSdkConfigResponse)
async def get_facebook_sdk_config():
    """提供前端初始化 Facebook SDK 的必要設定（不包含 app secret）"""
    app_id = (settings.VITE_FACEBOOK_APP_ID or "").strip()
    if not app_id:
        raise HTTPException(status_code=500, detail="缺少 VITE_FACEBOOK_APP_ID")

    raw_version = (settings.FACEBOOK_GRAPH_API_VERSION or "v23.0").strip()
    version = raw_version
    if version and version[0] in {"V", "v"} and len(version) > 1:
        version = f"v{version[1:]}"
    if version and not version.startswith("v"):
        version = f"v{version}"

    return FacebookSdkConfigResponse(app_id=app_id, api_version=version or "v23.0")


@router.get("/message-list")
async def get_fb_message_list(
    jwt_token: str = Query(..., description="Meta JWT Token"),
):
    """
    取得 FB 訊息列表（用於會員管理頁合併顯示）

    透過外部 API 取得 FB 會員的訊息摘要資訊，包含：
    - customer_id, customer_name
    - last_message_time, unread 狀態
    - customer_tag 等
    """
    fb_client = FbMessageClient()
    result = await fb_client.list_messages(jwt_token)

    if not result.get("ok"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "取得 FB 訊息列表失敗")
        )

    return result


@router.post("", response_model=FbChannelResponse, status_code=201)
async def create_or_update_channel(data: FbChannelCreate, db: AsyncSession = Depends(get_db)):
    """
    創建 Facebook 粉絲專頁頻道設定（若 page_id 已存在則更新）
    """
    if not _has_value(data.page_id):
        raise HTTPException(status_code=422, detail="page_id 為必填")

    page_id = data.page_id.strip()

    stmt = select(FbChannel).where(FbChannel.page_id == page_id).limit(1)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if existing:
        existing.page_id = page_id
        existing.channel_name = data.channel_name or existing.channel_name
        existing.is_active = True if data.is_active is None else bool(data.is_active)
        existing.connection_status = data.connection_status or existing.connection_status
        existing.last_verified_at = now
        await db.commit()
        await db.refresh(existing)
        return existing

    channel = FbChannel(
        page_id=page_id,
        channel_name=data.channel_name,
        is_active=True if data.is_active is None else bool(data.is_active),
        connection_status=data.connection_status or "disconnected",
        last_verified_at=now,
    )

    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    return channel


@router.patch("/{channel_id}", response_model=FbChannelResponse)
async def update_channel(channel_id: int, data: FbChannelUpdate, db: AsyncSession = Depends(get_db)):
    """更新 Facebook 頻道設定（支援部分更新）"""
    channel = await db.get(FbChannel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="頻道設定不存在")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(channel, key, value)

    try:
        await db.commit()
        await db.refresh(channel)
        return channel
    except Exception as exc:
        await db.rollback()
        logger.error("更新 Facebook 頻道設定失敗: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="更新設定失敗")


@router.delete("/{channel_id}", response_model=SuccessResponse)
async def deactivate_channel(channel_id: int, db: AsyncSession = Depends(get_db)):
    """解除連結（停用）Facebook 頻道設定"""
    channel = await db.get(FbChannel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="頻道設定不存在")

    channel.is_active = False
    channel.connection_status = "disconnected"
    await db.commit()
    return SuccessResponse(data={"id": channel_id})


@router.post("/sync-members", response_model=SuccessResponse)
async def sync_facebook_members(
    jwt_token: str = Body(..., embed=True, description="Meta JWT Token"),
    db: AsyncSession = Depends(get_db),
):
    """
    同步 Facebook 會員列表到 members 表

    從 /meta_page/message/list API 獲取 FB 會員，根據 email 或 fb_customer_id 判斷是否為現有會員：
    1. 先用 email 查詢 → 若找到，綁定 fb_customer_id 到該會員（跨渠道合併）
    2. 再用 fb_customer_id 查詢 → 若找到，更新 fb_customer_name
    3. 都沒找到 → 新建會員
    """
    # 1. 從 message/list API 獲取會員列表
    fb_client = FbMessageClient()
    result = await fb_client.list_messages(jwt_token)

    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=f"獲取 FB 會員列表失敗: {result.get('error')}")

    fb_members = result.get("data", [])

    if not fb_members:
        return SuccessResponse(data={"synced": 0, "created": 0, "updated": 0, "merged": 0})

    created_count = 0
    updated_count = 0
    merged_count = 0

    # 2. 逐一處理會員
    for fb_member in fb_members:
        # message/list 使用 customer_id 和 customer_name
        fb_customer_id = str(fb_member.get("customer_id", ""))
        fb_customer_name = fb_member.get("customer_name", "")
        fb_email = (fb_member.get("email") or "").strip() or None

        if not fb_customer_id:
            continue

        member = None

        # 2a. 先用 email 查詢（若有提供）
        if fb_email:
            email_result = await db.execute(
                select(Member).where(Member.email == fb_email)
            )
            member = email_result.scalar_one_or_none()

        # 2b. 若 email 沒找到，再用 fb_customer_id 查詢
        if not member:
            uid_result = await db.execute(
                select(Member).where(Member.fb_customer_id == fb_customer_id)
            )
            member = uid_result.scalar_one_or_none()

        if member:
            # 更新現有會員：綁定 fb_customer_id 和 fb_customer_name
            was_merged = not member.fb_customer_id and fb_customer_id
            if not member.fb_customer_id:
                member.fb_customer_id = fb_customer_id
            member.fb_customer_name = fb_customer_name or member.fb_customer_name
            if fb_email and not member.email:
                member.email = fb_email
            if was_merged:
                merged_count += 1
            else:
                updated_count += 1
        else:
            # 新增會員
            member = Member(
                fb_customer_id=fb_customer_id,
                fb_customer_name=fb_customer_name,
                email=fb_email,
                name=fb_customer_name,  # 使用 fb_customer_name 作為預設名稱
                join_source="Facebook",
            )
            db.add(member)
            created_count += 1

    await db.commit()

    logger.info(f"FB members synced: {created_count} created, {updated_count} updated, {merged_count} merged")

    return SuccessResponse(
        data={
            "synced": len(fb_members),
            "created": created_count,
            "updated": updated_count,
            "merged": merged_count,
        }
    )
