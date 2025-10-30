"""
活动推播业务逻辑层
职责：处理活动相关的业务逻辑，与数据库和外部服务交互
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging

from app.models.campaign import Campaign, CampaignStatus, CampaignRecipient
from app.models.template import MessageTemplate, TemplateCarouselItem, TemplateType
from app.models.tracking import RyanClickDemo
from app.schemas.campaign import CampaignCreate, CampaignUpdate
from app.services.scheduler import scheduler

logger = logging.getLogger(__name__)


class CampaignService:
    """活动推播服务"""

    async def create_campaign(
        self,
        db: AsyncSession,
        campaign_data: CampaignCreate
    ) -> Campaign:
        """
        创建活动推播

        Args:
            db: 数据库 session
            campaign_data: 活动创建数据

        Returns:
            创建的活动对象
        """
        # 1. 创建消息模板
        template = await self._create_template(db, campaign_data)

        # 2. 创建轮播项目
        if campaign_data.carousel_items:
            await self._create_carousel_items(db, template, campaign_data.carousel_items)

        # 3. 構建 trigger_condition（僅使用請求提供的資料）
        trigger_condition = None
        trigger_condition_data = getattr(campaign_data, "trigger_condition", None)
        if trigger_condition_data:
            if isinstance(trigger_condition_data, dict):
                trigger_condition = dict(trigger_condition_data)
            else:
                trigger_condition = getattr(trigger_condition_data, "model_dump", lambda: None)() or getattr(
                    trigger_condition_data, "dict", lambda: None
                )()
                if not trigger_condition:
                    try:
                        trigger_condition = dict(trigger_condition_data)
                    except TypeError:
                        logger.warning(
                            "⚠️ Unsupported trigger_condition type: %s",
                            type(trigger_condition_data),
                        )
                        trigger_condition = None

        # 4. 構建 target_audience（兼容字串與物件兩種格式）
        raw_target_audience = campaign_data.target_audience
        if isinstance(raw_target_audience, dict):
            target_audience = {
                "type": raw_target_audience.get("type", "all"),
                "condition": raw_target_audience.get("condition", "include"),
                "tags": raw_target_audience.get("tags") or [],
            }
        else:
            target_audience = {
                "type": raw_target_audience or "all",
                "condition": campaign_data.target_condition or "include",
                "tags": campaign_data.target_tags or [],
            }

        # 5. 根据 schedule_type 决定状态
        scheduled_at = campaign_data.scheduled_at
        if campaign_data.schedule_type == "draft":
            status = CampaignStatus.DRAFT
        elif campaign_data.schedule_type == "immediate":
            # 立即發佈在實際送出前維持為草稿，送出後再更新狀態
            status = CampaignStatus.DRAFT
        elif campaign_data.schedule_type == "scheduled":
            if scheduled_at and scheduled_at > datetime.now():
                status = CampaignStatus.SCHEDULED
            else:
                status = CampaignStatus.SENT
        else:
            status = CampaignStatus.DRAFT

        # 6. 创建活动
        campaign = Campaign(
            title=campaign_data.title or "未命名活动",
            template_id=template.id,
            target_audience=target_audience,
            trigger_condition=trigger_condition,
            interaction_tags=campaign_data.interaction_tags or [],  # 多标签数组
            scheduled_at=scheduled_at,
            status=status,
        )
        db.add(campaign)
        await db.flush()
        await db.refresh(campaign)
        await db.commit()  # 提交以確保 campaign.id 可用

        # 7. 如果是立即發送，調用 LINE Bot 服務
        if campaign_data.schedule_type == "immediate":
            from app.services.linebot_service import LineBotService
            linebot_service = LineBotService()
            result = await linebot_service.send_campaign(campaign.id)

            # 更新發送結果
            sent_count = result.get("sent", 0) if isinstance(result, dict) else 0
            ok = bool(result.get("ok")) and sent_count > 0 if isinstance(result, dict) else False

            campaign.sent_count = sent_count
            if ok:
                campaign.status = CampaignStatus.SENT
                campaign.sent_at = datetime.now()
            else:
                campaign.status = CampaignStatus.FAILED
            await db.commit()
            await db.refresh(campaign)

            logger.info(f"📤 Campaign {campaign.id} sent to {result.get('sent', 0)} users")

        # 8. 如果有排程时间，添加排程任务
        if campaign_data.scheduled_at:
            await self._schedule_campaign(campaign)

        logger.info(f"✅ Created campaign: {campaign.title} (ID: {campaign.id})")
        return campaign

    async def get_campaign_by_id(
        self,
        db: AsyncSession,
        campaign_id: int
    ) -> Optional[Campaign]:
        """
        获取活动详情

        Args:
            db: 数据库 session
            campaign_id: 活动 ID

        Returns:
            活动对象或 None
        """
        query = (
            select(Campaign)
            .options(
                selectinload(Campaign.template).selectinload(MessageTemplate.carousel_items)
            )
            .where(Campaign.id == campaign_id)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def list_campaigns(
        self,
        db: AsyncSession,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Campaign], int]:
        """
        获取活动列表

        Args:
            db: 数据库 session
            status_filter: 状态筛选
            search: 搜索关键词（标题或标签模糊搜索）
            page: 页码
            limit: 每页数量

        Returns:
            (活动列表, 总数)
        """
        from sqlalchemy import or_, func, cast, String

        query = select(Campaign).options(selectinload(Campaign.template))

        # 状态筛选
        if status_filter:
            try:
                campaign_status = CampaignStatus(status_filter)
                query = query.where(Campaign.status == campaign_status)
            except ValueError:
                pass

        # 搜索功能：标题或标签模糊搜索
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Campaign.title.like(search_term),
                    # JSON 数组搜索：检查 interaction_tags 是否包含搜索关键词
                    cast(Campaign.interaction_tags, String).like(search_term)
                )
            )

        # 排序和分页
        query = query.order_by(Campaign.created_at.desc())

        # 获取总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 分页
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        campaigns = result.scalars().all()

        return campaigns, total

    async def get_click_counts_from_ryan_demo(
        self,
        db: AsyncSession,
        campaign_ids: Optional[List[int]] = None
    ) -> Dict[int, int]:
        """
        从 ryan_click_demo 表获取各活动的点击计数

        Args:
            db: 数据库 session
            campaign_ids: 活动 ID 列表（可选，不提供则查询所有）

        Returns:
            字典：campaign_id -> 点击总数
        """
        from sqlalchemy import func

        # 构建查询：按 source_campaign_id 分组，SUM total_clicks
        query = select(
            RyanClickDemo.source_campaign_id,
            func.sum(RyanClickDemo.total_clicks).label('click_count')
        ).group_by(RyanClickDemo.source_campaign_id)

        # 如果提供了campaign_ids，只查询这些活动
        if campaign_ids:
            query = query.where(RyanClickDemo.source_campaign_id.in_(campaign_ids))

        result = await db.execute(query)
        rows = result.all()

        # 转换为字典：campaign_id -> click_count
        click_counts = {
            row.source_campaign_id: int(row.click_count or 0)
            for row in rows
        }

        return click_counts

    async def send_campaign(
        self,
        db: AsyncSession,
        campaign_id: int
    ) -> Dict[str, Any]:
        """
        立即发送活动

        Args:
            db: 数据库 session
            campaign_id: 活动 ID

        Returns:
            发送结果
        """
        # 读取活动
        campaign = await self.get_campaign_by_id(db, campaign_id)
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")

        # 检查状态
        if campaign.status == CampaignStatus.SENT:
            raise ValueError("Campaign already sent")

        # 调用 LINE Bot 服务发送
        from app.services.linebot_service import LineBotService
        linebot_service = LineBotService()
        result = await linebot_service.send_campaign(campaign_id)

        sent_count = 0
        failed_count = 0
        ok = False
        if isinstance(result, dict):
            sent_count = result.get("sent", 0) or 0
            failed_count = result.get("failed", 0) or 0
            ok = bool(result.get("ok")) and sent_count > 0

        campaign.sent_count = sent_count

        if ok:
            campaign.status = CampaignStatus.SENT
            campaign.sent_at = datetime.now()
        else:
            campaign.status = CampaignStatus.FAILED

        await db.commit()
        await db.refresh(campaign)

        if ok:
            if failed_count:
                logger.warning(
                    "⚠️ Campaign %s sent to %s users with %s failures",
                    campaign_id,
                    sent_count,
                    failed_count,
                )
            else:
                logger.info("✅ Campaign %s sent to %s users", campaign_id, sent_count)
        else:
            logger.warning("⚠️ Campaign %s failed to send", campaign_id)
        return result

    async def delete_campaign(
        self,
        db: AsyncSession,
        campaign_id: int
    ) -> bool:
        """
        删除活动（仅草稿可删除）

        Args:
            db: 数据库 session
            campaign_id: 活动 ID

        Returns:
            是否删除成功
        """
        campaign = await self.get_campaign_by_id(db, campaign_id)
        if not campaign:
            return False

        if campaign.status != CampaignStatus.DRAFT:
            raise ValueError("Only draft campaigns can be deleted")

        await db.delete(campaign)
        await db.commit()

        logger.info(f"✅ Deleted campaign {campaign_id}")
        return True

    # ========== 私有辅助方法 ==========

    async def _create_template(
        self,
        db: AsyncSession,
        campaign_data: CampaignCreate
    ) -> MessageTemplate:
        """创建消息模板"""
        template = MessageTemplate(
            type=TemplateType(campaign_data.template_type),
            name=campaign_data.title or "未命名模板",
            content=campaign_data.notification_text,
            notification_text=campaign_data.notification_text,
            preview_text=campaign_data.preview_text,
        )
        db.add(template)
        await db.flush()
        return template

    async def _create_carousel_items(
        self,
        db: AsyncSession,
        template: MessageTemplate,
        items_data: List[Dict],
    ):
        """创建轮播项目"""
        for idx, item in enumerate(items_data):
            def _get(value_key, default=None):
                if isinstance(item, dict):
                    return item.get(value_key, default)
                return getattr(item, value_key, default)

            carousel_item = TemplateCarouselItem(
                template_id=template.id,
                image_url=_get("image_url")
                or "https://dummyimage.com/1200x800/eeeeee/333333&text=No+Image",
                title=_get("title"),
                description=_get("description"),
                price=_get("price"),
                action_url=_get("action_url"),
                action_button_enabled=_get("action_button_enabled", False) or False,
                action_button_text=_get("action_button_text") or "查看詳情",
                action_button_interaction_type=_get("action_button_interaction_type") or "none",
                action_button_url=_get("action_button_url"),
                action_button_trigger_message=_get("action_button_trigger_message"),
                action_button_trigger_image_url=_get("action_button_trigger_image_url"),
                image_aspect_ratio=_get("image_aspect_ratio") or "1:1",
                image_click_action_type=_get("image_click_action_type") or "open_image",
                image_click_action_value=_get("image_click_action_value"),
                sort_order=idx,
            )
            db.add(carousel_item)

    async def _schedule_campaign(self, campaign: Campaign):
        """排程活动发送"""
        if campaign.scheduled_at:
            success = await scheduler.schedule_campaign(
                campaign.id,
                campaign.scheduled_at
            )
            if success:
                campaign.status = CampaignStatus.SCHEDULED
                logger.info(f"📅 Scheduled campaign {campaign.id} for {campaign.scheduled_at}")


# 全局服务实例
campaign_service = CampaignService()
