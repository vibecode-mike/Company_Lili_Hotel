"""
追蹤 API
職責：HTTP 請求處理、參數驗證、回應格式化
業務邏輯委託給 TrackingService
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.tracking import (
    TrackInteractionRequest,
    TrackInteractionResponse,
    CampaignStatisticsResponse,
)
from app.services.tracking_service import tracking_service
from typing import Optional
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================
# API 路由：僅處理 HTTP 請求，業務邏輯委託給 Service 層
# ============================================================


@router.post("/interactions", response_model=dict)
async def track_interaction(
    request: TrackInteractionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    記錄用戶互動

    業務邏輯委託給 TrackingService，此路由僅負責：
    - 參數驗證（由 Pydantic 自動處理）
    - 調用服務層
    - 格式化回應
    """
    try:
        interaction_log = await tracking_service.track_interaction(
            db=db,
            line_uid=request.line_uid,
            campaign_id=request.campaign_id,
            interaction_type=request.interaction_type,
            template_id=request.template_id,
            carousel_item_id=request.carousel_item_id,
            component_slot=request.component_slot,
            interaction_tag_id=request.interaction_tag_id,
            interaction_value=request.interaction_value,
            line_event_type=request.line_event_type,
            user_agent=request.user_agent,
        )

        return {
            "code": 200,
            "message": "記錄成功",
            "data": {
                "id": interaction_log.id,
                "line_id": interaction_log.line_id,
                "campaign_id": interaction_log.campaign_id,
                "interaction_type": interaction_log.interaction_type.value,
                "triggered_at": interaction_log.triggered_at.isoformat(),
            },
        }
    except ValueError as e:
        logger.error(f"❌ Invalid tracking request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to track interaction: {e}")
        raise HTTPException(status_code=500, detail=f"記錄互動失敗: {str(e)}")


@router.get("/campaigns/{campaign_id}/statistics")
async def get_campaign_statistics(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    獲取活動統計數據

    業務邏輯委託給 TrackingService
    """
    try:
        stats = await tracking_service.get_campaign_statistics(db, campaign_id)

        return {
            "code": 200,
            "message": "查詢成功",
            "data": stats,
        }
    except ValueError as e:
        logger.error(f"❌ Campaign not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to get statistics: {e}")
        raise HTTPException(status_code=500, detail=f"查詢統計失敗: {str(e)}")


@router.get("/campaigns/{campaign_id}/interactions")
async def get_campaign_interactions(
    campaign_id: int,
    template_id: Optional[int] = None,
    carousel_item_id: Optional[int] = None,
    component_slot: Optional[str] = None,
    interaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    獲取活動互動記錄列表

    業務邏輯委託給 TrackingService
    """
    try:
        result = await tracking_service.get_campaign_interactions(
            db=db,
            campaign_id=campaign_id,
            template_id=template_id,
            carousel_item_id=carousel_item_id,
            component_slot=component_slot,
            interaction_type=interaction_type,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset,
        )

        interactions = result.get("items", [])
        total = result.get("total", 0)

        return {
            "code": 200,
            "message": "查詢成功",
            "data": {
                "total": total,
                "items": [
                    {
                        "id": log.id,
                        "line_id": log.line_id,
                        "campaign_id": log.campaign_id,
                        "template_id": log.template_id,
                        "carousel_item_id": log.carousel_item_id,
                        "carousel_item_title": log.carousel_item.title if log.carousel_item else None,
                        "component_slot": log.component_slot,
                        "interaction_tag_id": log.interaction_tag_id,
                        "interaction_tag_name": log.interaction_tag.name if log.interaction_tag else None,
                        "interaction_type": log.interaction_type.value,
                        "interaction_value": log.interaction_value,
                        "triggered_at": log.triggered_at.isoformat(),
                        "line_event_type": log.line_event_type,
                    }
                    for log in interactions
                ],
            },
        }
    except ValueError as e:
        logger.error(f"❌ Invalid interaction query: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to get interactions: {e}")
        raise HTTPException(status_code=500, detail=f"查詢互動記錄失敗: {str(e)}")
