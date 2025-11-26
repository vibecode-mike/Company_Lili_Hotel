"""
群发消息服务
负责消息的数据管理和业务逻辑
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, not_, or_, cast, String, text
from sqlalchemy.orm import selectinload
from datetime import datetime
import logging
import json
import os

from app.models.message import Message
from app.models.template import MessageTemplate
from app.models.member import Member
from app.models.tag import MemberTag, InteractionTag
from app.models.tracking import ComponentInteractionLog
from app.adapters.line_app_adapter import LineAppAdapter
from app.clients.line_app_client import LineAppClient
from app.core.pagination import PageResponse
from app.schemas.message import MessageListItem

logger = logging.getLogger(__name__)


class MessageService:
    """群发消息服务

    负责群发消息的创建、更新、发送和配额管理
    """

    # ============================================================
    # line_app 配置
    # ============================================================
    LINE_APP_URL = "http://localhost:3001"

    async def create_message(
        self,
        db: AsyncSession,
        flex_message_json: str,
        target_type: str,
        schedule_type: str,
        template_name: Optional[str] = None,
        target_filter: Optional[Dict] = None,
        scheduled_at: Optional[datetime] = None,
        campaign_id: Optional[int] = None,
        notification_message: Optional[str] = None,
        thumbnail: Optional[str] = None,
        interaction_tags: Optional[List[str]] = None,
        admin_id: Optional[int] = None,
        message_title: Optional[str] = None,
        draft_id: Optional[int] = None
    ) -> Message:
        """创建群发消息

        Args:
            db: 数据库 session
            flex_message_json: 前端生成的 Flex Message JSON 字符串
            target_type: 发送对象类型 ("all_friends" | "filtered")
            schedule_type: 发送方式 ("immediate" | "scheduled" | "draft")
            template_name: 模板名称（可选）
            target_filter: 筛选条件（可选）
            scheduled_at: 排程时间（可选）
            campaign_id: 关联活动 ID（可选）
            notification_message: 推送通知文字（可选）
            thumbnail: 缩略图 URL（可选）
            interaction_tags: 互动标签列表（可选）
            admin_id: 创建者 ID（可选）
            message_title: 消息标题（可选，用于列表显示）
            draft_id: 来源草稿 ID（可选，有值时复制草稿发布，原草稿保留）

        Returns:
            创建的消息对象
        """
        # 如果有 draft_id，使用复制草稿发布逻辑
        if draft_id:
            return await self._publish_from_draft(
                db=db,
                draft_id=draft_id,
                flex_message_json=flex_message_json,
                target_type=target_type,
                schedule_type=schedule_type,
                target_filter=target_filter,
                scheduled_at=scheduled_at,
                notification_message=notification_message,
                thumbnail=thumbnail,
                interaction_tags=interaction_tags,
                message_title=message_title,
            )

        # 1. 创建基础模板（仅用于关联，实际内容存储在 Message.flex_message_json）
        if not template_name:
            template_name = f"消息_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        template = MessageTemplate(
            name=template_name,
            template_type="FlexMessage",  # 标记为 Flex Message 类型
        )
        db.add(template)
        await db.flush()  # 获取 template.id

        logger.info(f"✅ 创建模板: ID={template.id}, Name={template_name}")

        # 2. 创建消息记录
        # 确定发送状态
        if schedule_type == "draft":
            send_status = "草稿"
        elif schedule_type == "scheduled":
            send_status = "已排程"
        else:  # immediate
            send_status = "待發送"

        normalized_tags = self._normalize_interaction_tags(interaction_tags)

        message = Message(
            template_id=template.id,
            target_type=target_type,
            target_filter=target_filter or {},
            send_status=send_status,
            campaign_id=campaign_id,
            flex_message_json=flex_message_json,  # 直接存储 Flex Message JSON
            message_title=message_title or notification_message or thumbnail,  # 优先使用前端传入的 message_title（訊息標題）
            notification_message=notification_message,  # 保存通知推播文字
            thumbnail=thumbnail,
            interaction_tags=normalized_tags,
            # created_by=admin_id  # 如果 Message 模型有此字段
        )
        if scheduled_at:
            message.scheduled_datetime_utc = scheduled_at

        try:
            estimated_count = await self._calculate_target_count(
                db,
                target_type,
                target_filter or {},
            )
        except Exception as e:
            logger.error(f"❌ 計算預計發送人數失敗: {e}")
            estimated_count = 0

        message.estimated_send_count = estimated_count
        db.add(message)
        await db.commit()

        # 重新加载 message 及其 template 关系（避免 lazy loading 错误）
        stmt = select(Message).where(Message.id == message.id).options(
            selectinload(Message.template)
        )
        result = await db.execute(stmt)
        message = result.scalar_one()

        logger.info(f"✅ 创建消息: ID={message.id}, Status={send_status}")

        return message

    async def update_message(
        self,
        db: AsyncSession,
        message_id: int,
        **kwargs
    ) -> Message:
        """更新消息（草稿编辑）

        Args:
            db: 数据库 session
            message_id: 消息 ID
            **kwargs: 要更新的字段

        Returns:
            更新后的消息对象
        """
        message = await db.get(Message, message_id)
        if not message:
            raise ValueError(f"消息不存在: ID={message_id}")

        if 'interaction_tags' in kwargs:
            kwargs['interaction_tags'] = self._normalize_interaction_tags(kwargs.get('interaction_tags'))

        # ✅ 添加：根據 scheduled_at 動態更新 send_status
        if 'scheduled_at' in kwargs:
            scheduled_at = kwargs.get('scheduled_at')
            if scheduled_at:
                # 有排程時間 → 已排程
                kwargs['send_status'] = '已排程'
                kwargs['scheduled_datetime_utc'] = scheduled_at
            else:
                # 沒有排程時間 → 草稿
                kwargs['send_status'] = '草稿'
                kwargs['scheduled_datetime_utc'] = None
            # ✅ 重要：移除 scheduled_at，避免嘗試設置 read-only 屬性
            del kwargs['scheduled_at']

        # 更新字段（flex_message_json 直接存储在 Message 对象中）
        for key, value in kwargs.items():
            if hasattr(message, key):
                setattr(message, key, value)

        # ✅ 添加：明確更新 updated_at
        from datetime import datetime
        message.updated_at = datetime.now()

        await db.commit()

        # 重新加载 message 及其 template 关系（避免 lazy loading 错误）
        stmt = select(Message).where(Message.id == message_id).options(
            selectinload(Message.template)
        )
        result = await db.execute(stmt)
        message = result.scalar_one()

        logger.info(f"✅ 更新消息: ID={message_id}")

        return message

    def _normalize_interaction_tags(
        self,
        tags: Optional[List[str]]
    ) -> Optional[List[str]]:
        """去除空值與重複的互動標籤"""
        if not tags:
            return None

        normalized: List[str] = []
        seen = set()
        for tag in tags:
            if tag is None:
                continue
            text = str(tag).strip()
            if not text or text in seen:
                continue
            seen.add(text)
            normalized.append(text)

        return normalized or None

    async def _publish_from_draft(
        self,
        db: AsyncSession,
        draft_id: int,
        flex_message_json: str,
        target_type: str,
        schedule_type: str,
        target_filter: Optional[Dict] = None,
        scheduled_at: Optional[datetime] = None,
        notification_message: Optional[str] = None,
        thumbnail: Optional[str] = None,
        interaction_tags: Optional[List[str]] = None,
        message_title: Optional[str] = None,
    ) -> Message:
        """从草稿发布 - 复制成新记录，原草稿保留

        Args:
            db: 数据库 session
            draft_id: 来源草稿 ID
            flex_message_json: Flex Message JSON（可覆盖草稿内容）
            target_type: 发送对象类型
            schedule_type: 发送方式 ("immediate" | "scheduled")
            target_filter: 筛选条件
            scheduled_at: 排程时间
            notification_message: 推送通知文字
            thumbnail: 缩略图 URL
            interaction_tags: 互动标签列表
            message_title: 消息标题

        Returns:
            新创建的消息对象（原草稿保持不变）
        """
        # 1. 取得原草稿
        draft = await db.get(Message, draft_id)
        if not draft:
            raise ValueError(f"草稿不存在: ID={draft_id}")
        if draft.send_status != '草稿':
            raise ValueError(f"只能从草稿状态发布，当前状态: {draft.send_status}")

        logger.info(f"📋 从草稿发布: draft_id={draft_id}")

        # 2. 创建新模板（复制草稿的模板信息）
        template_name = f"消息_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        template = MessageTemplate(
            name=template_name,
            template_type="FlexMessage",
        )
        db.add(template)
        await db.flush()

        # 3. 确定发送状态
        if schedule_type == "scheduled":
            send_status = "已排程"
        else:  # immediate
            send_status = "待發送"

        # 4. 复制草稿内容到新记录（使用传入参数覆盖，否则使用草稿原值）
        normalized_tags = self._normalize_interaction_tags(
            interaction_tags if interaction_tags is not None else draft.interaction_tags
        )

        new_message = Message(
            template_id=template.id,
            target_type=target_type or draft.target_type,
            target_filter=target_filter if target_filter is not None else draft.target_filter,
            send_status=send_status,
            campaign_id=draft.campaign_id,
            flex_message_json=flex_message_json or draft.flex_message_json,
            message_title=message_title or draft.message_title,
            notification_message=notification_message or draft.notification_message,
            thumbnail=thumbnail or draft.thumbnail,
            interaction_tags=normalized_tags,
            source_draft_id=draft_id,  # 记录来源草稿
        )

        if scheduled_at and schedule_type == "scheduled":
            new_message.scheduled_datetime_utc = scheduled_at

        # 5. 计算预计发送人数
        try:
            estimated_count = await self._calculate_target_count(
                db,
                new_message.target_type,
                new_message.target_filter or {},
            )
        except Exception as e:
            logger.error(f"❌ 計算預計發送人數失敗: {e}")
            estimated_count = 0

        new_message.estimated_send_count = estimated_count

        db.add(new_message)
        await db.commit()

        # 6. 重新加载 message 及其 template 关系
        stmt = select(Message).where(Message.id == new_message.id).options(
            selectinload(Message.template)
        )
        result = await db.execute(stmt)
        new_message = result.scalar_one()

        logger.info(
            f"✅ 从草稿发布成功: 新消息 ID={new_message.id}, "
            f"来源草稿 ID={draft_id}, 状态={send_status}"
        )

        return new_message

    async def list_messages(
        self,
        db: AsyncSession,
        send_status: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """獲取群發訊息列表"""

        def apply_filters(query):
            if filters:
                return query.where(and_(*filters))
            return query

        page = max(page, 1)
        page_size = max(page_size, 1)
        filters = []
        if search:
            search_value = search.strip()
            if search_value:
                search_pattern = f"%{search_value}%"
                filters.append(
                    or_(
                        Message.message_title.like(search_pattern),
                        cast(Message.interaction_tags, String).like(search_pattern),
                    )
                )

        if start_date:
            filters.append(Message.created_at >= start_date)

        if end_date:
            filters.append(Message.created_at <= end_date)

        # 狀態統計（不含 send_status 篩選，方便前端顯示各狀態總數）
        status_query = select(
            Message.send_status,
            func.count().label("count"),
        )
        status_query = apply_filters(status_query)
        status_query = status_query.group_by(Message.send_status)
        status_result = await db.execute(status_query)
        status_counts: Dict[str, int] = {}
        for row in status_result.all():
            status, count = row
            status_counts[str(status)] = int(count or 0)

        # 主查詢
        base_query = select(Message).options(selectinload(Message.template))
        base_query = apply_filters(base_query)

        if send_status:
            base_query = base_query.where(Message.send_status == send_status)

        # 統計總數
        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # 分頁
        offset = max(page - 1, 0) * page_size
        query = (
            base_query.order_by(Message.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await db.execute(query)
        messages = result.scalars().all()

        # 為每條訊息計算 click_count
        message_items = []
        for message in messages:
            item = MessageListItem.model_validate(message)
            # 計算該訊息的點擊次數（互動標籤 trigger_member_count 加總）
            click_count = await self.get_message_click_count(db, message.id)
            item.click_count = click_count
            message_items.append(item)

        page_response = PageResponse[MessageListItem].create(
            items=message_items,
            total=total,
            page=page,
            page_size=page_size,
        )

        data = page_response.model_dump()
        data["status_counts"] = status_counts
        return data

    async def get_quota_status(
        self,
        db: AsyncSession,
        target_type: str,
        target_filter: Optional[Dict] = None,
        channel_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取配额状态（真实数据）

        Args:
            db: 数据库 session
            target_type: 发送对象类型
            target_filter: 筛选条件
            channel_id: LINE 频道 ID

        Returns:
            {
                "estimated_send_count": int,    # 预计发送人数
                "available_quota": int,          # 可用配额
                "is_sufficient": bool,           # 配额是否充足
                "quota_type": str,               # 配额类型
                "monthly_limit": int,            # 月度限额
                "used": int                      # 已使用
            }
        """
        # 1. 计算预计发送人数
        estimated_count = await self._calculate_target_count(
            db, target_type, target_filter
        )

        logger.info(f"📊 预计发送人数: {estimated_count}")

        # 2. 调用 line_app 获取配额（真实数据）
        try:
            quota_info = await LineAppAdapter.get_quota(channel_id)
            logger.info(f"📊 配额信息: {quota_info}")
        except Exception as e:
            logger.error(f"❌ 获取配额失败: {e}")
            # 返回默认值，避免阻塞流程
            quota_info = {
                "type": "none",
                "monthly_limit": 0,
                "used": 0,
                "remaining": 0
            }

        available_quota = quota_info.get("remaining", 0) or 0
        monthly_limit = quota_info.get("monthly_limit", 0) or 0
        used = quota_info.get("used", 0) or 0
        is_sufficient = estimated_count <= available_quota

        return {
            "estimated_send_count": estimated_count,
            "available_quota": available_quota,
            "is_sufficient": is_sufficient,
            "quota_type": quota_info.get("type", "none"),
            "monthly_limit": monthly_limit,
            "used": used,
            "quota_consumption": estimated_count  # 本次将消耗的配额
        }

    async def _calculate_target_count(
        self,
        db: AsyncSession,
        target_type: str,
        target_filter: Optional[Dict] = None
    ) -> int:
        """计算符合条件的 LINE 好友数量（使用 line_friends 表）

        Args:
            db: 数据库 session
            target_type: 发送对象类型
            target_filter: 筛选条件 {"include": [...], "exclude": [...]}

        Returns:
            符合条件的 LINE 好友数量
        """
        # 容错处理：filtered 但没有 filter 时，视为 all_friends
        if target_type == "filtered":
            if not target_filter or (
                not target_filter.get("include") and
                not target_filter.get("exclude")
            ):
                target_type = "all_friends"

        if target_type == "all_friends":
            # 查询所有正在关注的 LINE 好友
            result = await db.execute(
                text("""
                    SELECT COUNT(*)
                    FROM line_friends
                    WHERE line_uid IS NOT NULL
                      AND line_uid != ''
                      AND is_following = 1
                """)
            )
            count = result.scalar() or 0
            logger.debug(f"📊 所有 LINE 好友数量: {count}")
            return count

        elif target_type == "filtered" and target_filter:
            # 根据标签筛选 LINE 好友（通过 member_id 关联）
            include_tags = target_filter.get("include", [])
            exclude_tags = target_filter.get("exclude", [])

            if include_tags:
                # 包含指定标签的 LINE 好友
                tag_placeholders = ", ".join([f":tag{i}" for i in range(len(include_tags))])
                tag_params = {f"tag{i}": tag for i, tag in enumerate(include_tags)}

                query_str = f"""
                    SELECT COUNT(DISTINCT lf.id)
                    FROM line_friends lf
                    LEFT JOIN members m ON lf.member_id = m.id
                    LEFT JOIN member_tags mt ON m.id = mt.member_id
                    WHERE lf.line_uid IS NOT NULL
                      AND lf.line_uid != ''
                      AND lf.is_following = 1
                      AND mt.tag_name IN ({tag_placeholders})
                """

                # 如果有排除标签，添加排除条件
                if exclude_tags:
                    exclude_placeholders = ", ".join([f":exclude_tag{i}" for i in range(len(exclude_tags))])
                    exclude_params = {f"exclude_tag{i}": tag for i, tag in enumerate(exclude_tags)}
                    tag_params.update(exclude_params)

                    query_str += f"""
                      AND lf.id NOT IN (
                          SELECT DISTINCT lf2.id
                          FROM line_friends lf2
                          LEFT JOIN members m2 ON lf2.member_id = m2.id
                          LEFT JOIN member_tags mt2 ON m2.id = mt2.member_id
                          WHERE mt2.tag_name IN ({exclude_placeholders})
                      )
                    """

                result = await db.execute(text(query_str), tag_params)
                count = result.scalar() or 0
                logger.debug(f"📊 筛选后的 LINE 好友数量: {count}, filter={target_filter}")
                return count

            elif exclude_tags:
                # 只有排除标签的情况
                exclude_placeholders = ", ".join([f":exclude_tag{i}" for i in range(len(exclude_tags))])
                exclude_params = {f"exclude_tag{i}": tag for i, tag in enumerate(exclude_tags)}

                query_str = f"""
                    SELECT COUNT(DISTINCT lf.id)
                    FROM line_friends lf
                    WHERE lf.line_uid IS NOT NULL
                      AND lf.line_uid != ''
                      AND lf.is_following = 1
                      AND lf.id NOT IN (
                          SELECT DISTINCT lf2.id
                          FROM line_friends lf2
                          LEFT JOIN members m ON lf2.member_id = m.id
                          LEFT JOIN member_tags mt ON m.id = mt.member_id
                          WHERE mt.tag_name IN ({exclude_placeholders})
                      )
                """

                result = await db.execute(text(query_str), exclude_params)
                count = result.scalar() or 0
                logger.debug(f"📊 排除标签后的 LINE 好友数量: {count}, filter={target_filter}")
                return count

        return 0

    async def send_message(
        self,
        db: AsyncSession,
        message_id: int,
        channel_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """发送群发消息

        Args:
            db: 数据库 session
            message_id: 消息 ID
            channel_id: LINE 频道 ID

        Returns:
            {
                "ok": bool,
                "sent": int,
                "failed": int,
                "errors": [...]
            }
        """
        # 1. 获取消息
        message = await db.get(Message, message_id)
        if not message:
            raise ValueError(f"消息不存在: ID={message_id}")

        if not message.flex_message_json:
            raise ValueError(f"消息缺少 Flex Message JSON 内容")

        # 2. 发送消息
        logger.info(f"📤 准备发送消息: ID={message_id}")
        return await self._send_via_http(db, message, channel_id)

    async def _send_via_http(
        self,
        db: AsyncSession,
        message: Message,
        channel_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """通过 HTTP 调用 line_app 发送消息

        Args:
            db: 数据库 session
            message: 消息对象
            channel_id: LINE 频道 ID

        Returns:
            {
                "ok": bool,
                "sent": int,
                "failed": int
            }
        """
        # 1. 解析 Flex Message JSON
        try:
            flex_message_json = json.loads(message.flex_message_json)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Flex Message JSON 格式错误: {e}")
            raise ValueError(f"Flex Message JSON 格式错误: {e}")

        # 2. 处理目标筛选
        target_audience = "all"
        include_tags = []
        exclude_tags = []

        if message.target_type == "filtered" and message.target_filter:
            target_audience = "filtered"
            include_tags = message.target_filter.get("include", [])
            exclude_tags = message.target_filter.get("exclude", [])

            logger.info(f"🏷️  Include tags: {include_tags}")
            logger.info(f"🚫 Exclude tags: {exclude_tags}")

        # 3. 创建 HTTP 客户端
        line_app_url = os.getenv("LINE_APP_URL", self.LINE_APP_URL)
        client = LineAppClient(base_url=line_app_url)

        # 4. 計算實際目標對象（依 line_friends 狀態）
        try:
            target_recipient_count = await self._calculate_target_count(
                db,
                message.target_type,
                message.target_filter,
            )
        except Exception as e:
            logger.error(f"❌ 計算目標受眾失敗，改用 line_app 結果: {e}")
            target_recipient_count = 0

        logger.info(
            f"🎯 將以 line_friends.is_following=1 做為發送人數基準: {target_recipient_count}"
        )

        # 5. 调用 line_app API
        try:
            result = await client.broadcast_message(
                flex_message_json=flex_message_json,
                target_audience=target_audience,
                include_tags=include_tags,
                exclude_tags=exclude_tags,
                alt_text=message.message_title or "新訊息",
                notification_message=message.notification_message,
                campaign_id=message.id,
                channel_id=channel_id
            )
            logger.info(
                f"✅ 发送完成: 成功 {result.get('sent', 0)}, "
                f"失败 {result.get('failed', 0)}"
            )
        except Exception as e:
            logger.error(f"❌ 发送失败: {e}")
            # 更新状态为发送失败
            message.send_status = "發送失敗"
            await db.commit()
            raise

        # 6. 更新消息状态與發送統計
        success = bool(result.get("ok"))
        actual_sent = result.get("sent", 0) or 0
        actual_failed = result.get("failed", 0) or 0

        message.send_status = "已發送" if success else "發送失敗"
        message.estimated_send_count = target_recipient_count

        if success:
            message.send_count = target_recipient_count
            message.send_time = datetime.now()
        else:
            # 保留實際失敗原因以便排查
            if result.get("errors"):
                message.failure_reason = "; ".join(result.get("errors"))

        await db.commit()

        # 7. 回傳以 line_friends 為基準的結果，並附帶實際 line_app 數據
        display_failed = max(target_recipient_count - actual_sent, 0)

        return {
            "ok": success,
            "campaign_id": result.get("campaign_id"),
            "sent": target_recipient_count,
            "failed": display_failed,
            "errors": result.get("errors"),
            "actual_sent": actual_sent,
            "actual_failed": actual_failed,
        }

    async def get_message(
        self,
        db: AsyncSession,
        message_id: int
    ) -> Optional[Message]:
        """获取消息详情

        Args:
            db: 数据库 session
            message_id: 消息 ID

        Returns:
            消息对象或 None
        """
        # 使用 selectinload 预加载 template 关系（避免 lazy loading 错误）
        stmt = select(Message).where(Message.id == message_id).options(
            selectinload(Message.template)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_message_click_count(
        self,
        db: AsyncSession,
        message_id: int
    ) -> int:
        """获取消息的点击次数（互動標籤的 trigger_member_count 加總）

        Args:
            db: 数据库 session
            message_id: 消息 ID

        Returns:
            点击次数总计（各互動標籤的 trigger_member_count 加總）
        """
        # 1. 先取得訊息的 interaction_tags
        msg_stmt = select(Message.interaction_tags).where(Message.id == message_id)
        msg_result = await db.execute(msg_stmt)
        interaction_tags_json = msg_result.scalar_one_or_none()

        if not interaction_tags_json:
            return 0

        # 2. 查詢這些標籤的 trigger_member_count 加總
        tag_names = interaction_tags_json  # JSON 已經是 list
        if not tag_names:
            return 0

        stmt = select(func.sum(InteractionTag.trigger_member_count)).where(
            InteractionTag.tag_name.in_(tag_names)
        )
        result = await db.execute(stmt)
        total = result.scalar() or 0

        logger.debug(f"📊 消息 ID={message_id} 點擊次數: {total} (來自標籤: {tag_names})")
        return total

    async def delete_message(
        self,
        db: AsyncSession,
        message_id: int
    ) -> bool:
        """刪除消息（僅限草稿和已排程狀態）

        Args:
            db: 数据库 session
            message_id: 消息 ID

        Returns:
            是否刪除成功

        Raises:
            ValueError: 消息不存在或狀態不允許刪除
        """
        # 1. 查詢消息
        stmt = select(Message).where(Message.id == message_id).options(
            selectinload(Message.template)
        )
        result = await db.execute(stmt)
        message = result.scalar_one_or_none()

        if not message:
            raise ValueError(f"消息不存在: ID={message_id}")

        # 2. 檢查狀態（僅允許刪除草稿和已排程）
        allowed_statuses = ["草稿", "已排程"]
        if message.send_status not in allowed_statuses:
            raise ValueError(f"無法刪除狀態為「{message.send_status}」的消息，僅可刪除草稿或已排程消息")

        logger.info(f"🗑️ 開始刪除消息: ID={message_id}, 狀態={message.send_status}")

        # 3. 刪除關聯的 template（如果存在）
        if message.template:
            template_id = message.template.id
            await db.delete(message.template)
            logger.debug(f"🗑️ 刪除關聯模板: ID={template_id}")

        # 4. 刪除消息本身
        await db.delete(message)
        await db.commit()

        logger.info(f"✅ 消息刪除成功: ID={message_id}")
        return True
