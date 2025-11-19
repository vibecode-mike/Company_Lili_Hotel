"""
元件互動追蹤服務層
職責：處理追蹤相關的業務邏輯，記錄用戶互動並更新統計數據
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
import logging

from app.models.tracking import ComponentInteractionLog, InteractionType
from app.models.message import Message
from app.models.template import MessageTemplate, TemplateCarouselItem
from app.models.tag import InteractionTag

logger = logging.getLogger(__name__)


class TrackingService:
    """元件互動追蹤服務"""

    async def track_interaction(
        self,
        db: AsyncSession,
        line_uid: str,
        campaign_id: int,
        interaction_type: str,
        template_id: Optional[int] = None,
        carousel_item_id: Optional[int] = None,
        component_slot: Optional[str] = None,
        interaction_tag_id: Optional[int] = None,
        interaction_value: Optional[str] = None,
        line_event_type: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> ComponentInteractionLog:
        """
        記錄用戶互動

        Args:
            db: 資料庫 session
            line_uid: LINE 用戶 UID
            campaign_id: 活動 ID
            interaction_type: 互動類型
            template_id: 模板 ID（可選）
            carousel_item_id: 輪播圖卡片 ID（可選）
            component_slot: 模板元件槽位（可選）
            interaction_tag_id: 互動標籤 ID（可選）
            interaction_value: 互動值（如 URL、訊息內容等）
            line_event_type: LINE 事件類型
            user_agent: 用戶代理

        Returns:
            互動記錄對象
        """
        try:
            try:
                interaction_type_enum = InteractionType(interaction_type)
            except ValueError as exc:
                raise ValueError(f"Unsupported interaction type: {interaction_type}") from exc

            # 1. 創建互動記錄
            interaction_log = ComponentInteractionLog(
                line_id=line_uid,
                campaign_id=campaign_id,
                template_id=template_id,
                carousel_item_id=carousel_item_id,
                component_slot=component_slot,
                interaction_tag_id=interaction_tag_id,
                interaction_type=interaction_type_enum,
                interaction_value=interaction_value,
                triggered_at=datetime.utcnow(),
                line_event_type=line_event_type,
                user_agent=user_agent,
            )
            db.add(interaction_log)
            await db.flush()

            # 2. 更新輪播圖卡片統計（如果有）
            if carousel_item_id:
                await self._update_carousel_item_stats(
                    db, carousel_item_id
                )

            # 3. 更新互動標籤統計（如果有）
            if interaction_tag_id:
                await self._update_interaction_tag_stats(
                    db, interaction_tag_id
                )

            # 5. 提交事務
            await db.commit()
            await db.refresh(interaction_log)

            logger.info(
                f"✅ Tracked interaction: line_uid={line_uid}, "
                f"campaign={campaign_id}, type={interaction_type}"
            )
            return interaction_log

        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to track interaction: {e}")
            raise

    async def _update_carousel_item_stats(
        self,
        db: AsyncSession,
        carousel_item_id: int,
    ):
        """更新輪播圖卡片統計"""
        total_count_stmt = (
            select(func.count())
            .where(ComponentInteractionLog.carousel_item_id == carousel_item_id)
        )
        total_count_result = await db.execute(total_count_stmt)
        total_count = total_count_result.scalar() or 0

        unique_count_stmt = (
            select(func.count(func.distinct(ComponentInteractionLog.line_id)))
            .where(ComponentInteractionLog.carousel_item_id == carousel_item_id)
        )
        unique_count_result = await db.execute(unique_count_stmt)
        unique_count = unique_count_result.scalar() or 0

        await db.execute(
            update(TemplateCarouselItem)
            .where(TemplateCarouselItem.id == carousel_item_id)
            .values(
                click_count=total_count,
                unique_click_count=unique_count,
                last_clicked_at=datetime.utcnow(),
            )
        )

        logger.info(
            f"📊 Updated carousel item {carousel_item_id} stats. "
            f"click_count={total_count}, unique_click_count={unique_count}"
        )

    async def _update_interaction_tag_stats(
        self,
        db: AsyncSession,
        interaction_tag_id: int,
    ):
        """更新互動標籤統計"""
        # 查詢該標籤是否存在
        stmt = select(InteractionTag).where(InteractionTag.id == interaction_tag_id)
        result = await db.execute(stmt)
        tag = result.scalar_one_or_none()

        if not tag:
            logger.warning(f"⚠️ Interaction tag not found: {interaction_tag_id}")
            return

        total_count_stmt = (
            select(func.count())
            .where(ComponentInteractionLog.interaction_tag_id == interaction_tag_id)
        )
        total_count_result = await db.execute(total_count_stmt)
        total_count = total_count_result.scalar() or 0

        unique_member_stmt = (
            select(func.count(func.distinct(ComponentInteractionLog.line_id)))
            .where(ComponentInteractionLog.interaction_tag_id == interaction_tag_id)
        )
        unique_member_result = await db.execute(unique_member_stmt)
        unique_members = unique_member_result.scalar() or 0

        await db.execute(
            update(InteractionTag)
            .where(InteractionTag.id == interaction_tag_id)
            .values(
                trigger_count=total_count,
                member_count=unique_members,
                last_triggered_at=datetime.utcnow(),
            )
        )

        logger.info(
            f"📊 Updated interaction tag {interaction_tag_id} stats: "
            f"trigger_count={total_count}, members={unique_members}"
        )

    async def get_campaign_statistics(
        self,
        db: AsyncSession,
        campaign_id: int,
    ) -> Dict[str, Any]:
        """
        獲取活動統計數據

        Args:
            db: 資料庫 session
            campaign_id: 活動 ID

        Returns:
            統計數據字典
        """
        # 查詢活動
        campaign_stmt = (
            select(Message)
            .where(Message.id == campaign_id)
            .options(
                selectinload(Message.template).selectinload(
                    MessageTemplate.carousel_items
                )
            )
        )
        campaign_result = await db.execute(campaign_stmt)
        campaign = campaign_result.scalar_one_or_none()

        if not campaign:
            raise ValueError(f"Campaign not found: {campaign_id}")

        # 統計總互動次數
        total_interactions_stmt = (
            select(func.count())
            .select_from(ComponentInteractionLog)
            .where(ComponentInteractionLog.campaign_id == campaign_id)
        )
        total_result = await db.execute(total_interactions_stmt)
        total_interactions = total_result.scalar()

        # 統計唯一互動用戶數
        unique_members_stmt = (
            select(func.count(func.distinct(ComponentInteractionLog.line_id)))
            .select_from(ComponentInteractionLog)
            .where(ComponentInteractionLog.campaign_id == campaign_id)
        )
        unique_result = await db.execute(unique_members_stmt)
        unique_members = unique_result.scalar()

        # 按互動類型統計
        interaction_by_type_stmt = (
            select(
                ComponentInteractionLog.interaction_type,
                func.count().label("count"),
            )
            .where(ComponentInteractionLog.campaign_id == campaign_id)
            .group_by(ComponentInteractionLog.interaction_type)
        )
        type_result = await db.execute(interaction_by_type_stmt)
        interactions_by_type = {row[0].value: row[1] for row in type_result}

        # 準備輪播項目映射（供 component stats 使用）
        carousel_title_map = {}
        if campaign.template and campaign.template.carousel_items:
            for item in campaign.template.carousel_items:
                carousel_title_map[item.id] = item.title

            carousel_stats = [
                {
                    "carousel_item_id": item.id,
                    "title": item.title,
                    "click_count": item.click_count or 0,
                    "unique_click_count": item.unique_click_count or 0,
                    "last_clicked_at": item.last_clicked_at,
                }
                for item in campaign.template.carousel_items
            ]
        else:
            carousel_stats = []

        # 元件槽位統計
        component_stats_stmt = (
            select(
                ComponentInteractionLog.template_id,
                ComponentInteractionLog.carousel_item_id,
                ComponentInteractionLog.component_slot,
                func.count(ComponentInteractionLog.id).label("click_count"),
                func.count(
                    func.distinct(ComponentInteractionLog.line_id)
                ).label("unique_click_count"),
            )
            .where(ComponentInteractionLog.campaign_id == campaign_id)
            .group_by(
                ComponentInteractionLog.template_id,
                ComponentInteractionLog.carousel_item_id,
                ComponentInteractionLog.component_slot,
            )
        )
        component_stats_result = await db.execute(component_stats_stmt)
        component_stats = [
            {
                "template_id": row.template_id,
                "carousel_item_id": row.carousel_item_id,
                "component_slot": row.component_slot,
                "click_count": row.click_count,
                "unique_click_count": row.unique_click_count,
                "carousel_item_title": carousel_title_map.get(row.carousel_item_id),
            }
            for row in component_stats_result
        ]

        return {
            "campaign_id": campaign_id,
            "total_interactions": total_interactions,
            "unique_members": unique_members,
            "interactions_by_type": interactions_by_type,
            "carousel_stats": carousel_stats,
            "component_stats": component_stats,
            "generated_at": datetime.utcnow(),
        }

    async def get_campaign_interactions(
        self,
        db: AsyncSession,
        campaign_id: int,
        template_id: Optional[int] = None,
        carousel_item_id: Optional[int] = None,
        component_slot: Optional[str] = None,
        interaction_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        獲取活動互動記錄列表

        Args:
            db: 資料庫 session
            campaign_id: 活動 ID
            limit: 限制數量
            offset: 偏移量

        Returns:
            Dict 包含 total 與 items
        """
        filters = [ComponentInteractionLog.campaign_id == campaign_id]

        if template_id:
            filters.append(ComponentInteractionLog.template_id == template_id)
        if carousel_item_id:
            filters.append(ComponentInteractionLog.carousel_item_id == carousel_item_id)
        if component_slot:
            filters.append(ComponentInteractionLog.component_slot == component_slot)
        if interaction_type:
            try:
                interaction_type_enum = InteractionType(interaction_type)
            except ValueError as exc:
                raise ValueError(f"Unsupported interaction type: {interaction_type}") from exc
            filters.append(ComponentInteractionLog.interaction_type == interaction_type_enum)
        if start_date:
            filters.append(ComponentInteractionLog.triggered_at >= start_date)
        if end_date:
            filters.append(ComponentInteractionLog.triggered_at <= end_date)

        total_stmt = select(func.count()).where(*filters)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar() or 0

        stmt = (
            select(ComponentInteractionLog)
            .where(*filters)
            .options(
                selectinload(ComponentInteractionLog.carousel_item),
                selectinload(ComponentInteractionLog.interaction_tag),
            )
            .order_by(ComponentInteractionLog.triggered_at.desc())
            .limit(limit)
            .offset(offset)
        )

        result = await db.execute(stmt)
        interactions = result.scalars().all()

        logger.info(
            f"📋 Retrieved {len(interactions)} interactions for campaign {campaign_id} (total={total})"
        )
        return {
            "total": total,
            "items": interactions,
        }


# 創建全域服務實例
tracking_service = TrackingService()
