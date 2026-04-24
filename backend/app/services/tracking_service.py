"""
元件互動追蹤服務層
職責：處理追蹤相關的業務邏輯，記錄用戶互動並更新統計數據
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
import logging

from app.models.tracking import ComponentInteractionLog, InteractionType
from app.models.message import Message
from app.models.template import MessageTemplate, TemplateCarouselItem
from app.models.tag import InteractionTag, MemberInteractionTag
from app.models.member import Member

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
                triggered_at=datetime.now(),
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

            # 4. 寫入 member_interaction_tags（如果有互動標籤）
            #    以 campaign_id（訊息 ID）作為 instance 去重 key：同則訊息內重複點擊
            #    只保留 1 筆；跨訊息才會新增 row，對應 schema UniqueConstraint
            #    (member_id, tag_name, message_id)
            if interaction_tag_id:
                await self._upsert_member_interaction_tag(
                    db, line_uid, interaction_tag_id, message_id=campaign_id
                )

            # 5. 提交事務
            await db.commit()
            await db.refresh(interaction_log)

            logger.info(f"Tracked interaction: line_uid={line_uid}, campaign_id={campaign_id}, type={interaction_type}")
            return interaction_log

        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to track interaction: {e}", exc_info=True)
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
                last_clicked_at=datetime.now(),
            )
        )

        logger.debug(f"Updated carousel item {carousel_item_id} stats: click_count={total_count}, unique_click_count={unique_count}")

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
            logger.warning(f"Interaction tag not found: {interaction_tag_id}")
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
                last_triggered_at=datetime.now(),
            )
        )

        logger.debug(f"Updated interaction tag {interaction_tag_id} stats: trigger_count={total_count}, members={unique_members}")

    async def _resolve_member_from_line_id(
        self,
        db: AsyncSession,
        line_id: str,
    ) -> Optional[int]:
        """
        從 line_id 解析 member_id

        Args:
            db: 資料庫 session
            line_id: LINE 用戶 UID

        Returns:
            member_id 或 None（若會員不存在）
        """
        stmt = select(Member.id).where(Member.line_uid == line_id)
        result = await db.execute(stmt)
        member_id = result.scalar_one_or_none()
        return member_id

    async def _upsert_member_interaction_tag(
        self,
        db: AsyncSession,
        line_uid: str,
        interaction_tag_id: int,
        message_id: Optional[int] = None,
    ):
        """
        建立或更新 member_interaction_tag 記錄（per-instance 去重）

        行為規則（對齊 schema UniqueConstraint (member_id, tag_name, message_id)）：
        - 同一則訊息內重複點擊同一標籤 → 只保留 1 筆，click_count 固定 1、不累加
        - 跨不同訊息點擊同一標籤 → 另開一筆 row（message_id 不同）
        - 會員詳情顯示時，由 tag_name 聚合（同名標籤只出現一個 chip）

        Args:
            db: 資料庫 session
            line_uid: LINE 用戶 UID
            interaction_tag_id: 互動標籤 ID
            message_id: 觸發來源訊息 ID，作為 per-instance 去重 key（通常是 campaign_id）
        """
        # 1. 解析 member_id
        member_id = await self._resolve_member_from_line_id(db, line_uid)
        if not member_id:
            logger.debug(f"Skipping member_interaction_tag: member not found for line_uid={line_uid}")
            return

        # 2. 獲取互動標籤資訊
        stmt = select(InteractionTag).where(InteractionTag.id == interaction_tag_id)
        result = await db.execute(stmt)
        tag = result.scalar_one_or_none()

        if not tag:
            logger.warning(f"InteractionTag not found: {interaction_tag_id}")
            return

        # 3. 依 (member_id, tag_name, message_id) 三元組查重
        existing_stmt = select(MemberInteractionTag).where(
            MemberInteractionTag.member_id == member_id,
            MemberInteractionTag.tag_name == tag.tag_name,
            MemberInteractionTag.message_id == message_id,
        )
        existing_result = await db.execute(existing_stmt)
        existing_tag = existing_result.scalar_one_or_none()

        if existing_tag:
            # 同一訊息（instance）內再點擊：不累加 click_count，只更新 last_triggered_at
            existing_tag.last_triggered_at = datetime.now()
            logger.debug(
                f"Duplicate click within same message: member_id={member_id}, tag={tag.tag_name}, "
                f"message_id={message_id} → click_count stays at {existing_tag.click_count}"
            )
        else:
            # 新訊息或首次點擊 → 新 row
            new_tag = MemberInteractionTag(
                member_id=member_id,
                tag_name=tag.tag_name,
                tag_source=tag.tag_source,  # 保留原始來源（訊息模板/問券模板）
                click_count=1,
                last_triggered_at=datetime.now(),
                message_id=message_id,
            )
            db.add(new_tag)
            logger.info(
                f"Created member_interaction_tag: member_id={member_id}, tag={tag.tag_name}, "
                f"source={tag.tag_source}, message_id={message_id}"
            )

        # 寫 tag_trigger_logs（供時段洞察 heatmap 使用）— 新貼或重新觸發都記
        from app.services.tag_trigger_service import record_tag_trigger
        from app.models.tag_trigger_log import TagType, TriggerSource
        await record_tag_trigger(
            db,
            member_id=member_id,
            tag_name=tag.tag_name,
            tag_type=TagType.INTERACTION,
            source=TriggerSource.CLICK,
            tag_id=interaction_tag_id,
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
            "generated_at": datetime.now(),
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
