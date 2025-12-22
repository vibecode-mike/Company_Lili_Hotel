"""
Facebook 頻道設定 API
用於基本設定頁面的 Facebook 粉絲專頁連結與驗證
"""

from __future__ import annotations

from datetime import datetime
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.integrations.facebook_api import verify_page_access_token
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

REQUIRED_FIELDS = ("page_id", "page_access_token")


def _has_value(value: Optional[str]) -> bool:
    return bool(value and value.strip())


def _collect_missing_fields(channel: FbChannel) -> List[str]:
    missing: List[str] = []
    if not _has_value(channel.page_id):
        missing.append("page_id")
    if not _has_value(channel.page_access_token):
        missing.append("page_access_token")
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


@router.post("", response_model=FbChannelResponse, status_code=201)
async def create_or_update_channel(data: FbChannelCreate, db: AsyncSession = Depends(get_db)):
    """
    創建 Facebook 粉絲專頁頻道設定（若 page_id 已存在則更新 token）
    """
    if not _has_value(data.page_id):
        raise HTTPException(status_code=422, detail="page_id 為必填")

    page_id = data.page_id.strip()
    page_access_token = data.page_access_token.strip()

    verify = verify_page_access_token(page_id, page_access_token)
    if not verify.is_valid:
        status = "expired" if verify.error_code == 190 else "disconnected"
        raise HTTPException(status_code=400, detail=f"{verify.error_message or 'Token 驗證失敗'}（{status}）")

    stmt = select(FbChannel).where(FbChannel.page_id == page_id).limit(1)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    now = datetime.utcnow()
    if existing:
        existing.page_access_token = page_access_token
        existing.page_id = page_id
        existing.channel_name = (data.channel_name or verify.page_name or existing.channel_name)
        existing.is_active = True if data.is_active is None else bool(data.is_active)
        existing.connection_status = "connected"
        existing.last_verified_at = now
        await db.commit()
        await db.refresh(existing)
        return existing

    channel = FbChannel(
        page_id=page_id,
        page_access_token=page_access_token,
        channel_name=(data.channel_name or verify.page_name),
        is_active=True if data.is_active is None else bool(data.is_active),
        connection_status="connected",
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

    next_page_id = update_data.get("page_id", channel.page_id)
    next_token = update_data.get("page_access_token", channel.page_access_token)

    if "page_id" in update_data or "page_access_token" in update_data:
        if not _has_value(next_page_id) or not _has_value(next_token):
            raise HTTPException(status_code=422, detail="page_id 與 page_access_token 皆為必填")

        verify = verify_page_access_token(str(next_page_id).strip(), str(next_token).strip())
        if not verify.is_valid:
            status = "expired" if verify.error_code == 190 else "disconnected"
            raise HTTPException(status_code=400, detail=f"{verify.error_message or 'Token 驗證失敗'}（{status}）")

        update_data["connection_status"] = "connected"
        update_data["last_verified_at"] = datetime.utcnow()
        if "channel_name" not in update_data and verify.page_name:
            update_data["channel_name"] = verify.page_name

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
