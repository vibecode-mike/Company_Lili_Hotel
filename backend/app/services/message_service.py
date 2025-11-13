"""
群发消息服务
负责消息的数据管理和业务逻辑
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, not_
from sqlalchemy.orm import selectinload
from datetime import datetime
import logging
import json

from app.models.campaign import Message, MessageRecipient
from app.models.template import MessageTemplate
from app.models.member import Member
from app.models.tag import MemberTag
from app.adapters.line_app_adapter import LineAppAdapter

logger = logging.getLogger(__name__)


class MessageService:
    """群发消息服务

    负责群发消息的创建、更新、发送和配额管理
    """

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
        notification_text: Optional[str] = None,
        thumbnail: Optional[str] = None,
        admin_id: Optional[int] = None
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
            notification_text: 推送通知文字（可选）
            thumbnail: 缩略图 URL（可选）
            admin_id: 创建者 ID（可选）

        Returns:
            创建的消息对象
        """
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
            send_status = "排程发送"
        else:  # immediate
            send_status = "待发送"

        # 拆分 scheduled_at 为 scheduled_date 和 scheduled_time
        sched_date = None
        sched_time = None
        if scheduled_at:
            sched_date = scheduled_at.date()
            sched_time = scheduled_at.time()

        message = Message(
            template_id=template.id,
            target_type=target_type,
            target_filter=target_filter or {},
            scheduled_date=sched_date,
            scheduled_time=sched_time,
            send_status=send_status,
            campaign_id=campaign_id,
            flex_message_json=flex_message_json,  # 直接存储 Flex Message JSON
            message_content=notification_text or thumbnail,  # 使用 notification_text 作为摘要
            thumbnail=thumbnail,
            # created_by=admin_id  # 如果 Message 模型有此字段
        )
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

        # 更新字段（flex_message_json 直接存储在 Message 对象中）
        for key, value in kwargs.items():
            if hasattr(message, key):
                setattr(message, key, value)

        await db.commit()

        # 重新加载 message 及其 template 关系（避免 lazy loading 错误）
        stmt = select(Message).where(Message.id == message_id).options(
            selectinload(Message.template)
        )
        result = await db.execute(stmt)
        message = result.scalar_one()

        logger.info(f"✅ 更新消息: ID={message_id}")

        return message

    async def get_quota_status(
        self,
        db: AsyncSession,
        target_type: str,
        target_filter: Optional[Dict] = None,
        line_channel_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取配额状态（真实数据）

        Args:
            db: 数据库 session
            target_type: 发送对象类型
            target_filter: 筛选条件
            line_channel_id: LINE 频道 ID

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
            quota_info = await LineAppAdapter.get_quota(line_channel_id)
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
        """计算符合条件的会员数量

        Args:
            db: 数据库 session
            target_type: 发送对象类型
            target_filter: 筛选条件 {"include": [...], "exclude": [...]}

        Returns:
            符合条件的会员数量
        """
        if target_type == "all_friends":
            # 查询所有会员
            result = await db.execute(
                select(func.count(Member.id))
            )
            count = result.scalar() or 0
            logger.debug(f"📊 所有好友数量: {count}")
            return count

        elif target_type == "filtered" and target_filter:
            # 根据标签筛选
            # 基础查询
            query = select(func.count(Member.id.distinct()))

            # 包含条件（AND）- 会员必须拥有所有指定的标签
            if include_tags := target_filter.get("include"):
                # 使用 JOIN 确保会员拥有这些标签
                for tag_name in include_tags:
                    query = query.join(
                        MemberTag,
                        and_(
                            MemberTag.member_id == Member.id,
                            MemberTag.tag_name == tag_name
                        )
                    )

            # 排除条件（AND NOT）- 会员不能拥有任何排除的标签
            if exclude_tags := target_filter.get("exclude"):
                # 子查询：拥有排除标签的会员 ID
                subq = select(Member.id).join(Member.member_tags).where(
                    MemberTag.tag_name.in_(exclude_tags)
                )
                query = query.where(~Member.id.in_(subq))

            result = await db.execute(query)
            count = result.scalar() or 0
            logger.debug(f"📊 筛选后的会员数量: {count}, filter={target_filter}")
            return count

        return 0

    async def send_message(
        self,
        db: AsyncSession,
        message_id: int,
        line_channel_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """发送群发消息

        Args:
            db: 数据库 session
            message_id: 消息 ID
            line_channel_id: LINE 频道 ID

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

        logger.info(f"📤 准备发送消息: ID={message_id}")

        # 2. 解析 Flex Message JSON（从 Message 对象获取）
        try:
            flex_message_json = json.loads(message.flex_message_json)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Flex Message JSON 格式错误: {e}")
            raise ValueError(f"Flex Message JSON 格式错误: {e}")

        # 3. 构建 line_app payload
        payload = {
            "campaign_id": message_id,
            "line_channel_id": line_channel_id,
            "flex_message_json": flex_message_json,  # 前端生成的 JSON
            "alt_text": message.notification_text or "您收到一则新消息"
        }

        # 设置目标受众
        if message.target_type == "all_friends":
            payload["target_audience"] = "all"
        else:  # filtered
            payload["target_audience"] = "tags"
            # 提取包含的标签作为 target_tags
            if message.target_filter and "include" in message.target_filter:
                payload["target_tags"] = message.target_filter["include"]

        logger.debug(f"📤 发送 payload: {payload}")

        # 4. 预检配额
        try:
            preflight = await LineAppAdapter.preflight_check(payload)
            logger.info(f"✅ 预检结果: {preflight}")

            if not preflight.get("ok"):
                raise ValueError(
                    f"配额不足: 剩余 {preflight.get('remaining', 0)}, "
                    f"需要 {preflight.get('needed', 0)}, "
                    f"不足 {preflight.get('deficit', 0)}"
                )
        except Exception as e:
            logger.error(f"❌ 预检失败: {e}")
            raise

        # 5. 调用 line_app 发送
        try:
            result = await LineAppAdapter.send_campaign(payload)
            logger.info(
                f"✅ 发送完成: 成功 {result.get('sent', 0)}, "
                f"失败 {result.get('failed', 0)}"
            )
        except Exception as e:
            logger.error(f"❌ 发送失败: {e}")
            # 更新状态为发送失败
            message.send_status = "发送失败"
            await db.commit()
            raise

        # 6. 更新消息状态
        message.send_status = "已发送" if result.get("ok") else "发送失败"
        message.send_count = result.get("sent", 0)
        message.sent_at = datetime.now()

        await db.commit()

        return result

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
