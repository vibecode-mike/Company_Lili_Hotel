"""
活動管理 API（新語意）
職責：管理行銷活動，與群發訊息分離
注意：此 API 用於活動管理，群發訊息功能請使用 /campaigns API（向後兼容）
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.new_campaign import Campaign
from app.schemas.new_campaign import (
    CampaignCreateNew,
    CampaignUpdateNew,
    CampaignListItemNew,
    CampaignDetailNew,
    CampaignSearchParams as CampaignSearchParamsNew
)
from typing import List, Optional
from datetime import date
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=dict)
async def create_campaign(
    data: CampaignCreateNew,
    db: AsyncSession = Depends(get_db),
):
    """
    創建活動

    Args:
        data: 活動資料
        db: 資料庫 session

    Returns:
        創建的活動 ID
    """
    try:
        campaign = Campaign(**data.model_dump())
        db.add(campaign)
        await db.commit()
        await db.refresh(campaign)

        return {
            "code": 200,
            "message": "活動創建成功",
            "data": {"id": campaign.id, "campaign_name": campaign.campaign_name}
        }
    except Exception as e:
        logger.error(f"❌ Failed to create campaign: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"創建失敗: {str(e)}")


@router.get("", response_model=dict)
async def list_campaigns(
    campaign_tag: Optional[str] = Query(None, description="活動標籤篩選"),
    start_date: Optional[date] = Query(None, description="開始日期"),
    end_date: Optional[date] = Query(None, description="結束日期"),
    status: Optional[str] = Query(None, description="狀態篩選"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    獲取活動列表

    Args:
        campaign_tag: 活動標籤
        start_date: 開始日期
        end_date: 結束日期
        status: 活動狀態
        page: 頁碼
        page_size: 每頁數量
        db: 資料庫 session

    Returns:
        活動列表
    """
    try:
        # 構建查詢
        query = select(Campaign)

        if campaign_tag:
            query = query.where(Campaign.campaign_tag == campaign_tag)
        if start_date:
            query = query.where(Campaign.start_date >= start_date)
        if end_date:
            query = query.where(Campaign.end_date <= end_date)
        if status:
            query = query.where(Campaign.status == status)

        # 計算總數
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 分頁查詢
        query = query.order_by(Campaign.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        campaigns = result.scalars().all()

        return {
            "code": 200,
            "data": {
                "items": [
                    {
                        "id": c.id,
                        "campaign_name": c.campaign_name,
                        "campaign_tag": c.campaign_tag,
                        "campaign_date": c.campaign_date.isoformat() if c.campaign_date else None,
                        "start_date": c.start_date.isoformat() if c.start_date else None,
                        "end_date": c.end_date.isoformat() if c.end_date else None,
                        "status": c.status,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                    }
                    for c in campaigns
                ],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        }
    except Exception as e:
        logger.error(f"❌ Failed to list campaigns: {e}")
        raise HTTPException(status_code=500, detail=f"查詢失敗: {str(e)}")


@router.get("/{campaign_id}", response_model=dict)
async def get_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    獲取單個活動詳情

    Args:
        campaign_id: 活動 ID
        db: 資料庫 session

    Returns:
        活動詳情
    """
    query = select(Campaign).where(Campaign.id == campaign_id)
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(status_code=404, detail="活動不存在")

    return {
        "code": 200,
        "data": {
            "id": campaign.id,
            "campaign_name": campaign.campaign_name,
            "campaign_tag": campaign.campaign_tag,
            "campaign_date": campaign.campaign_date.isoformat() if campaign.campaign_date else None,
            "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
            "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
            "description": campaign.description,
            "status": campaign.status,
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
            "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None,
        }
    }


@router.put("/{campaign_id}", response_model=dict)
async def update_campaign(
    campaign_id: int,
    data: CampaignUpdateNew,
    db: AsyncSession = Depends(get_db),
):
    """
    更新活動

    Args:
        campaign_id: 活動 ID
        data: 更新資料
        db: 資料庫 session

    Returns:
        更新結果
    """
    query = select(Campaign).where(Campaign.id == campaign_id)
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(status_code=404, detail="活動不存在")

    try:
        # 更新字段
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(campaign, field, value)

        await db.commit()
        await db.refresh(campaign)

        return {
            "code": 200,
            "message": "更新成功",
            "data": {"id": campaign.id}
        }
    except Exception as e:
        logger.error(f"❌ Failed to update campaign: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"更新失敗: {str(e)}")


@router.delete("/{campaign_id}", response_model=dict)
async def delete_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    刪除活動

    Args:
        campaign_id: 活動 ID
        db: 資料庫 session

    Returns:
        刪除結果
    """
    query = select(Campaign).where(Campaign.id == campaign_id)
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(status_code=404, detail="活動不存在")

    try:
        await db.delete(campaign)
        await db.commit()

        return {
            "code": 200,
            "message": "刪除成功"
        }
    except Exception as e:
        logger.error(f"❌ Failed to delete campaign: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"刪除失敗: {str(e)}")
