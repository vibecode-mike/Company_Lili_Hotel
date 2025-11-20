"""
LINE 頻道設定 API
用於基本設定頁面的頻道參數管理
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import logging

from app.database import get_db
from app.models.line_channel import LineChannel
from app.schemas.line_channel import (
    LineChannelCreate,
    LineChannelUpdate,
    LineChannelResponse,
    LineChannelStatusResponse,
)
from app.schemas.common import SuccessResponse

router = APIRouter()
logger = logging.getLogger(__name__)


REQUIRED_FIELDS = (
    "channel_id",
    "channel_secret",
    "channel_access_token",
    "login_channel_id",
    "login_channel_secret",
)


def _has_value(value: Optional[str]) -> bool:
    return bool(value and value.strip())


def _collect_missing_fields(channel: LineChannel) -> List[str]:
    """檢查頻道設定缺少哪些必填欄位"""

    missing: List[str] = []

    if not _has_value(channel.channel_id):
        missing.append("channel_id")
    if not _has_value(channel.channel_secret):
        missing.append("channel_secret")
    if not _has_value(channel.channel_access_token):
        missing.append("channel_access_token")
    if not _has_value(channel.login_channel_id):
        missing.append("login_channel_id")
    if not _has_value(channel.login_channel_secret):
        missing.append("login_channel_secret")

    return missing


@router.get("/current", response_model=Optional[LineChannelResponse])
async def get_current_channel(db: AsyncSession = Depends(get_db)):
    """
    取得當前 LINE 頻道設定（單一頻道模式）

    Returns:
        LineChannelResponse: 頻道設定，若無設定則返回 null
    """
    try:
        # 查詢第一筆啟用的設定
        stmt = select(LineChannel).where(LineChannel.is_active == True).limit(1)
        result = await db.execute(stmt)
        channel = result.scalar_one_or_none()

        if not channel:
            logger.info("❌ 尚未設定 LINE 頻道")
            return None

        logger.info(f"✅ 取得 LINE 頻道設定: ID={channel.id}")
        return channel

    except Exception as e:
        logger.error(f"❌ 取得 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"取得設定失敗: {str(e)}")


@router.get("/status", response_model=LineChannelStatusResponse)
async def get_channel_status(db: AsyncSession = Depends(get_db)):
    """取得 LINE 頻道設定狀態與缺漏欄位"""

    try:
        stmt = select(LineChannel).where(LineChannel.is_active == True).limit(1)
        result = await db.execute(stmt)
        channel = result.scalar_one_or_none()

        if not channel:
            logger.info("ℹ️ 尚未建立任何 LINE 頻道設定")
            return LineChannelStatusResponse(
                has_active_channel=False,
                is_configured=False,
                missing_fields=list(REQUIRED_FIELDS),
                channel_db_id=None,
            )

        missing_fields = _collect_missing_fields(channel)
        is_configured = len(missing_fields) == 0

        if is_configured:
            logger.info("✅ LINE 頻道設定已通過驗證")
        else:
            logger.warning(
                "⚠️ LINE 頻道設定缺少欄位", extra={"missing_fields": missing_fields}
            )

        return LineChannelStatusResponse(
            has_active_channel=True,
            is_configured=is_configured,
            missing_fields=missing_fields,
            channel_db_id=channel.id,
        )

    except Exception as e:
        logger.error(f"❌ 檢查 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"取得設定狀態失敗: {str(e)}")


@router.post("", response_model=LineChannelResponse, status_code=201)
async def create_channel(
    data: LineChannelCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    創建 LINE 頻道設定

    Args:
        data: 頻道設定資料

    Returns:
        LineChannelResponse: 創建的頻道設定
    """
    try:
        # 檢查是否已有設定
        stmt = select(LineChannel).where(LineChannel.is_active == True).limit(1)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="已存在 LINE 頻道設定，請使用更新功能"
            )

        # 創建新設定
        channel = LineChannel(**data.model_dump())
        db.add(channel)
        await db.commit()
        await db.refresh(channel)

        logger.info(f"✅ 創建 LINE 頻道設定: ID={channel.id}")
        return channel

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 創建 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"創建設定失敗: {str(e)}")


@router.patch("/{channel_id}", response_model=LineChannelResponse)
async def update_channel(
    channel_id: int,
    data: LineChannelUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    更新 LINE 頻道設定（支援部分更新）

    Args:
        channel_id: 頻道 ID
        data: 要更新的欄位

    Returns:
        LineChannelResponse: 更新後的頻道設定
    """
    try:
        # 查詢頻道
        channel = await db.get(LineChannel, channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="頻道設定不存在")

        # 更新欄位（只更新提供的欄位）
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(channel, field, value)

        await db.commit()
        await db.refresh(channel)

        logger.info(f"✅ 更新 LINE 頻道設定: ID={channel_id}, 更新欄位={list(update_data.keys())}")
        return channel

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 更新 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"更新設定失敗: {str(e)}")


@router.delete("/{channel_id}", response_model=SuccessResponse)
async def delete_channel(
    channel_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    刪除 LINE 頻道設定（重置功能）

    Args:
        channel_id: 頻道 ID

    Returns:
        SuccessResponse: 刪除成功訊息
    """
    try:
        # 查詢頻道
        channel = await db.get(LineChannel, channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="頻道設定不存在")

        # 刪除設定
        await db.delete(channel)
        await db.commit()

        logger.info(f"✅ 刪除 LINE 頻道設定: ID={channel_id}")
        return SuccessResponse(message="頻道設定已重置")

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 刪除 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"刪除設定失敗: {str(e)}")
