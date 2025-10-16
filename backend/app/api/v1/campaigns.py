"""
活動推播 API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.template import MessageTemplate, TemplateType
from app.schemas.campaign import CampaignCreate
from typing import List
from datetime import datetime

router = APIRouter()


@router.post("", response_model=dict)
async def create_campaign(
    campaign_data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
):
    """創建活動推播"""
    try:
        # 1. 創建消息模板
        template = MessageTemplate(
            type=TemplateType(campaign_data.template_type),
            name=campaign_data.title or "未命名模板",
            content=campaign_data.notification_text,
            notification_text=campaign_data.notification_text,
            preview_text=campaign_data.preview_text,
        )
        db.add(template)
        await db.flush()  # 獲取 template.id

        # 1.1 處理輪播項目
        if campaign_data.carousel_items:
            from app.models.template import TemplateCarouselItem

            for item in campaign_data.carousel_items:
                carousel_item = TemplateCarouselItem(
                    template_id=template.id,
                    image_url=item.image_path,
                    title=item.title,
                    description=item.description,
                    price=item.price,
                    action_url=item.action_url,
                    sort_order=item.sort_order,
                )
                db.add(carousel_item)

        # 2. 構建 trigger_condition JSON
        trigger_condition = None
        if campaign_data.interaction_type:
            trigger_condition = {
                "type": campaign_data.interaction_type,
                "value": None
            }

            if campaign_data.interaction_type == "open_url":
                trigger_condition["value"] = campaign_data.url
            elif campaign_data.interaction_type == "trigger_message":
                trigger_condition["value"] = campaign_data.trigger_message
            elif campaign_data.interaction_type == "trigger_image":
                trigger_condition["value"] = campaign_data.trigger_image_path

        # 3. 構建 target_audience JSON
        target_audience = {"type": campaign_data.target_audience}
        if campaign_data.target_tags:
            target_audience["tags"] = campaign_data.target_tags

        # 4. 確定活動狀態和發送時間
        now = datetime.now()
        status = CampaignStatus.DRAFT
        sent_at = None

        if campaign_data.schedule_type == "draft":
            status = CampaignStatus.DRAFT
        elif campaign_data.schedule_type == "immediate":
            status = CampaignStatus.SENT
            sent_at = now
        elif campaign_data.schedule_type == "scheduled":
            if campaign_data.scheduled_at:
                # 比較排程時間與當前時間
                scheduled_time = campaign_data.scheduled_at
                if scheduled_time <= now:
                    status = CampaignStatus.SENT
                    sent_at = now
                else:
                    status = CampaignStatus.SCHEDULED
            else:
                status = CampaignStatus.SCHEDULED

        # 5. 創建活動
        campaign = Campaign(
            title=campaign_data.title or "未命名活動",
            template_id=template.id,
            target_audience=target_audience,
            trigger_condition=trigger_condition,
            interaction_tag=campaign_data.interaction_tag,
            scheduled_at=campaign_data.scheduled_at,
            status=status,
            sent_at=sent_at,
        )
        db.add(campaign)
        await db.commit()
        await db.refresh(campaign)

        return {
            "id": campaign.id,
            "title": campaign.title,
            "status": campaign.status.value,
            "message": "活動創建成功"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"創建活動失敗: {str(e)}")


@router.get("", response_model=List[dict])
async def get_campaigns(
    db: AsyncSession = Depends(get_db),
):
    """獲取活動列表"""
    query = select(Campaign).order_by(Campaign.created_at.desc())
    result = await db.execute(query)
    campaigns = result.scalars().all()

    # 標籤名稱映射
    tag_name_map = {
        "potential": "開發潛在客戶",
        "vip": "VIP 客戶",
        "new": "新會員",
    }

    # 轉換為字典格式
    return [
        {
            "id": c.id,
            "title": c.title,
            "status": c.status.value.lower() if hasattr(c.status, 'value') else str(c.status).lower(),
            "target_count": c.sent_count,
            "open_count": c.opened_count,
            "click_count": c.clicked_count,
            "sent_at": c.sent_at.strftime("%Y-%m-%d %H:%M") if c.sent_at else None,
            "scheduled_at": c.scheduled_at.strftime("%Y-%m-%d %H:%M") if c.scheduled_at else None,
            "tags": [tag_name_map.get(c.interaction_tag, c.interaction_tag)] if c.interaction_tag else [],
        }
        for c in campaigns
    ]
