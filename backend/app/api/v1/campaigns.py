"""
活動推播 API
職責：HTTP 請求處理、參數驗證、回應格式化
業務邏輯委託給 CampaignService
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.campaign import CampaignCreate
from app.services.campaign_service import campaign_service
from typing import List, Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================
# API 路由：僅處理 HTTP 請求，業務邏輯委託給 Service 層
# ============================================================


@router.post("", response_model=dict)
async def create_campaign(
    campaign_data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    創建活動推播

    業務邏輯委託給 CampaignService，此路由僅負責：
    - 參數驗證（由 Pydantic 自動處理）
    - 調用服務層
    - 格式化回應
    """
    try:
        campaign = await campaign_service.create_campaign(db, campaign_data)

        return {
            "code": 200,
            "message": "活動創建成功",
            "data": {
                "id": campaign.id,
                "title": campaign.title,
                "status": campaign.status.value,
                "sent_count": campaign.sent_count or 0,
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to create campaign: {e}")
        raise HTTPException(status_code=500, detail=f"創建活動失敗: {str(e)}")


@router.get("", response_model=List[dict])
async def get_campaigns(
    status_filter: str = None,
    search: str = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """
    獲取活動列表

    支援功能：
    - 狀態篩選 (draft, scheduled, sent)
    - 搜索 (標題和標籤模糊搜索)
    - 分頁

    業務邏輯委託給 CampaignService
    """
    try:
        campaigns, total = await campaign_service.list_campaigns(
            db,
            status_filter=status_filter,
            search=search,
            page=page,
            limit=limit
        )

        return [
            {
                "id": c.id,
                "title": c.title,
                "status": c.status.value.lower() if hasattr(c.status, 'value') else str(c.status).lower(),
                "platform": "LINE",  # 目前固定為 LINE
                "interaction_tags": c.interaction_tags or [],  # 多標籤數組
                "target_count": c.sent_count,
                "open_count": c.opened_count,
                "click_count": c.clicked_count,
                "sent_at": c.sent_at.strftime("%Y-%m-%d %H:%M") if c.sent_at else None,
                "scheduled_at": c.scheduled_at.strftime("%Y-%m-%d %H:%M") if c.scheduled_at else None,
            }
            for c in campaigns
        ]
    except Exception as e:
        logger.error(f"❌ Failed to list campaigns: {e}")
        raise HTTPException(status_code=500, detail=f"獲取活動列表失敗: {str(e)}")


@router.get("/{campaign_id}", response_model=dict)
async def get_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    獲取單一活動詳情

    業務邏輯委託給 CampaignService
    """
    try:
        campaign = await campaign_service.get_campaign_by_id(db, campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail=f"活動 {campaign_id} 不存在")

        return {
            "code": 200,
            "data": {
                "id": campaign.id,
                "title": campaign.title,
                "status": campaign.status.value,
                "template": {
                    "id": campaign.template.id,
                    "type": campaign.template.type.value,
                    "notification_text": campaign.template.notification_text,
                    "preview_text": campaign.template.preview_text,
                },
                "target_audience": campaign.target_audience,
                "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
                "sent_at": campaign.sent_at.isoformat() if campaign.sent_at else None,
                "sent_count": campaign.sent_count,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get campaign: {e}")
        raise HTTPException(status_code=500, detail=f"獲取活動失敗: {str(e)}")


@router.post("/{campaign_id}/send", response_model=dict)
async def send_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    立即發送活動

    業務邏輯委託給 CampaignService
    """
    try:
        result = await campaign_service.send_campaign(db, campaign_id)
        return {
            "code": 200,
            "message": f"活動已發送給 {result.get('sent', 0)} 位用戶",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to send campaign: {e}")
        raise HTTPException(status_code=500, detail=f"發送活動失敗: {str(e)}")


@router.delete("/{campaign_id}", response_model=dict)
async def delete_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    刪除活動（僅草稿可刪除）

    業務邏輯委託給 CampaignService
    """
    try:
        success = await campaign_service.delete_campaign(db, campaign_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"活動 {campaign_id} 不存在")

        return {
            "code": 200,
            "message": "活動已刪除"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete campaign: {e}")
        raise HTTPException(status_code=500, detail=f"刪除活動失敗: {str(e)}")


@router.post("/estimate-recipients", response_model=dict)
async def estimate_recipients(
    request_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
):
    """
    預計發送好友人數計算

    根據篩選條件（target_audience）計算符合條件的會員數量

    Request Body:
    {
        "type": "all" | "filtered",
        "condition": "include" | "exclude",
        "tags": ["tag1", "tag2", ...]
    }

    Response:
    {
        "code": 200,
        "data": {
            "count": 123
        }
    }
    """
    try:
        from app.models.member import Member
        from app.models.tag import MemberTagRelation, TagType
        from sqlalchemy import select, func, and_, exists

        target_type = request_data.get("type", "all")
        condition = request_data.get("condition", "include")
        tags = request_data.get("tags", [])

        # 如果是所有好友，直接返回全部會員數量
        if target_type == "all":
            count_query = select(func.count()).select_from(Member)
            result = await db.execute(count_query)
            total_count = result.scalar() or 0

            return {
                "code": 200,
                "data": {
                    "count": total_count
                }
            }

        # 篩選目標對象
        if not tags:
            return {
                "code": 200,
                "data": {
                    "count": 0
                }
            }

        # 根據包含/排除條件計算
        if condition == "include":
            # 包含：擁有任一標籤的會員
            subquery = (
                select(MemberTagRelation.member_id)
                .where(
                    and_(
                        MemberTagRelation.tag_type == TagType.MEMBER,
                        MemberTagRelation.tag_id.in_(tags)
                    )
                )
                .distinct()
            )
            count_query = select(func.count()).select_from(
                select(Member.id).where(Member.id.in_(subquery)).subquery()
            )
        else:
            # 排除：不擁有任何指定標籤的會員
            subquery = (
                select(MemberTagRelation.member_id)
                .where(
                    and_(
                        MemberTagRelation.tag_type == TagType.MEMBER,
                        MemberTagRelation.tag_id.in_(tags)
                    )
                )
                .distinct()
            )
            count_query = select(func.count()).select_from(
                select(Member.id).where(~Member.id.in_(subquery)).subquery()
            )

        result = await db.execute(count_query)
        filtered_count = result.scalar() or 0

        return {
            "code": 200,
            "data": {
                "count": filtered_count
            }
        }

    except Exception as e:
        logger.error(f"❌ Failed to estimate recipients: {e}")
        raise HTTPException(status_code=500, detail=f"預計人數計算失敗: {str(e)}")
