"""
群发消息服务
负责消息的数据管理和业务逻辑
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, cast, String, text
from sqlalchemy.orm import selectinload
from datetime import datetime
import logging
import json
import os

from app.models.message import Message
from app.models.template import MessageTemplate
from app.models.tracking import ComponentInteractionLog, InteractionType
from app.adapters.line_app_adapter import LineAppAdapter
from app.clients.line_app_client import LineAppClient
from app.core.pagination import PageResponse
from app.schemas.message import MessageListItem, CreatorInfo

logger = logging.getLogger(__name__)


class MessageService:
    """群发消息服务

    负责群发消息的创建、更新、发送和配额管理
    """

    @staticmethod
    def _is_scheduled(message: Message) -> bool:
        return (
            message is not None
            and message.send_status == "已排程"
            and bool(message.scheduled_datetime_utc)
        )

    @staticmethod
    def _transform_fb_message_to_api_format(message: Message) -> dict:
        """
        將 Flex Message 格式轉換為外部 FB API 格式

        Flex Message (前端儲存格式，與 LINE 相同):
        {
          "type": "carousel",
          "contents": [
            {
              "type": "bubble",
              "hero": { "url": "..." },
              "body": { "contents": [...] },
              "footer": { "contents": [...] }
            }
          ]
        }

        External API (輸出):
        {
          "channel": "FB",
          "target_type": "all | tagged",
          "tag_include": ["#tag1", ...],
          "tag_exclude": ["#tag2", ...],
          "element": [...]
        }
        """
        flex_json = json.loads(message.fb_message_json)

        # 取得 bubbles 列表
        if flex_json.get("type") == "carousel":
            bubbles = flex_json.get("contents", [])
        elif flex_json.get("type") == "bubble":
            bubbles = [flex_json]
        else:
            bubbles = []

        # 轉換每個 bubble 為 FB element
        api_elements = []
        for bubble in bubbles:
            element = {}

            # 提取標題 (body 中 size="xl" 或 weight="bold" 的文字)
            body_contents = bubble.get("body", {}).get("contents", [])
            for item in body_contents:
                if item.get("type") == "text":
                    if item.get("size") == "xl" or item.get("weight") == "bold":
                        element["title"] = (item.get("text") or "").strip()
                        break

            if not element.get("title"):
                element["title"] = "訊息"  # FB 要求 title 必填

            # 提取副標題 (body 中 size="sm" 的文字)
            for item in body_contents:
                if item.get("type") == "text" and item.get("size") == "sm":
                    subtitle = (item.get("text") or "").strip()
                    if subtitle:
                        element["subtitle"] = subtitle
                    break

            # 提取圖片
            hero = bubble.get("hero", {})
            image_url = (hero.get("url") or "").strip()
            if image_url:
                element["image_url"] = image_url

            # 提取按鈕 (最多 3 個)
            footer_contents = bubble.get("footer", {}).get("contents", [])
            buttons = []
            for item in footer_contents:
                if item.get("type") == "button" and len(buttons) < 3:
                    action = item.get("action", {})
                    btn_title = (action.get("label") or "按鈕").strip()

                    if action.get("type") == "uri":
                        url = (action.get("uri") or "").strip()
                        if url:
                            buttons.append({
                                "type": "web_url",
                                "title": btn_title,
                                "url": url
                            })
                    else:
                        payload = (action.get("data") or "").strip()
                        if payload:
                            buttons.append({
                                "type": "postback",
                                "title": btn_title,
                                "payload": payload
                            })

            if buttons:
                element["buttons"] = buttons

            api_elements.append(element)

        # 轉換 target_type 和標籤
        if message.target_type == "all_friends":
            target_type = "all"
            tag_include = []
            tag_exclude = []
        else:
            target_type = "tagged"
            target_filter = message.target_filter or {}
            tag_include = target_filter.get("include", [])
            tag_exclude = target_filter.get("exclude", [])

        # 組裝 API payload
        payload = {
            "channel": "FB",
            "target_type": target_type,
            "tag_include": tag_include,
            "tag_exclude": tag_exclude,
            "element": api_elements
        }

        # 加入 message_title（用於通知/預覽標題）
        if message.message_title:
            payload["title"] = message.message_title

        return payload

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
        draft_id: Optional[int] = None,
        platform: Optional[str] = "LINE",
        fb_message_json: Optional[str] = None,
        estimated_send_count: Optional[int] = None
    ) -> Message:
        """创建群发消息

        Args:
            db: 数据库 session
            flex_message_json: LINE Flex Message JSON 字符串
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
            platform: 发送平台 ("LINE" | "Facebook" | "Instagram")
            fb_message_json: Facebook Messenger JSON 字符串（可选）
            estimated_send_count: 預計發送人數（可选，FB 渠道由前端傳入）

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
                platform=platform,
                fb_message_json=fb_message_json,
                estimated_send_count=estimated_send_count,
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
            platform=platform or "LINE",  # 發送平台
            flex_message_json=flex_message_json,  # LINE Flex Message JSON
            fb_message_json=fb_message_json,  # Facebook Messenger JSON
            message_title=message_title or notification_message or thumbnail,  # 优先使用前端传入的 message_title（訊息標題）
            notification_message=notification_message,  # 保存通知推播文字
            thumbnail=thumbnail,
            interaction_tags=normalized_tags,
            # created_by=admin_id  # 如果 Message 模型有此字段
        )
        if scheduled_at:
            message.scheduled_datetime_utc = scheduled_at

        # 計算預計發送人數
        # FB 渠道：使用前端傳入的值（來自外部 FB API）
        # LINE 渠道：使用本地計算
        if estimated_send_count and estimated_send_count > 0:
            # 前端已傳入預計人數（FB 渠道）
            estimated_count = estimated_send_count
            logger.info(f"📊 使用前端傳入的預計發送人數: {estimated_count} (platform={platform})")
        else:
            # 本地計算（LINE 渠道）
            try:
                estimated_count = await self._calculate_target_count(
                    db,
                    target_type,
                    target_filter or {},
                )
                logger.info(f"📊 本地計算預計發送人數: {estimated_count} (platform={platform})")
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

        await self._sync_scheduler_job(message)

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

        was_scheduled = self._is_scheduled(message)

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

        await self._sync_scheduler_job(message, was_scheduled)

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
        platform: Optional[str] = None,
        fb_message_json: Optional[str] = None,
        estimated_send_count: Optional[int] = None,
    ) -> Message:
        """从草稿发布 - 复制成新记录，原草稿保留

        Args:
            db: 数据库 session
            draft_id: 来源草稿 ID
            flex_message_json: LINE Flex Message JSON（可覆盖草稿内容）
            target_type: 发送对象类型
            schedule_type: 发送方式 ("immediate" | "scheduled")
            target_filter: 筛选条件
            scheduled_at: 排程时间
            notification_message: 推送通知文字
            thumbnail: 缩略图 URL
            interaction_tags: 互动标签列表
            message_title: 消息标题
            platform: 发送平台
            fb_message_json: Facebook Messenger JSON（可覆盖草稿内容）
            estimated_send_count: 預計發送人數（可选，FB 渠道由前端傳入）

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
            platform=platform or draft.platform or "LINE",  # 發送平台
            flex_message_json=flex_message_json or draft.flex_message_json,
            fb_message_json=fb_message_json or draft.fb_message_json,  # Facebook JSON
            message_title=message_title or draft.message_title,
            notification_message=notification_message or draft.notification_message,
            thumbnail=thumbnail or draft.thumbnail,
            interaction_tags=normalized_tags,
            source_draft_id=draft_id,  # 记录来源草稿
        )

        if scheduled_at and schedule_type == "scheduled":
            new_message.scheduled_datetime_utc = scheduled_at

        # 5. 计算预计发送人数
        # FB 渠道：使用前端傳入的值（來自外部 FB API）
        # LINE 渠道：使用本地計算
        actual_platform = new_message.platform or "LINE"
        if estimated_send_count and estimated_send_count > 0:
            # 前端已傳入預計人數（FB 渠道）
            estimated_count = estimated_send_count
            logger.info(f"📊 使用前端傳入的預計發送人數: {estimated_count} (platform={actual_platform})")
        else:
            # 本地計算（LINE 渠道）
            try:
                estimated_count = await self._calculate_target_count(
                    db,
                    new_message.target_type,
                    new_message.target_filter or {},
                )
                logger.info(f"📊 本地計算預計發送人數: {estimated_count} (platform={actual_platform})")
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

        await self._sync_scheduler_job(new_message)

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
        base_query = select(Message).options(
            selectinload(Message.template),
            selectinload(Message.creator),
        )
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

        # 為每條訊息計算 click_count（依規格：從 component_interaction_logs 動態統計）
        message_items = []
        click_counts_by_message_id = await self.get_messages_click_counts(
            db,
            [int(m.id) for m in messages if m and m.id is not None],
        )
        for message in messages:
            item = MessageListItem.model_validate(message)
            item.click_count = int(click_counts_by_message_id.get(int(message.id), 0))
            # 設定創建者資訊（發送人員）
            if message.creator:
                item.created_by = CreatorInfo.model_validate(message.creator)
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
        try:
            estimated_count = await self._calculate_target_count(db, target_type, target_filter)
        except Exception as e:
            # 容错：若目标人数统计失败（例如资料表尚未建立），仍回传配额资讯避免前端卡在「载入中」
            logger.error(f"❌ 预计发送人数统计失败: {e}", exc_info=True)
            estimated_count = 0

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
        """计算符合条件的會員數量（使用 members 表，配合 is_following、member_tags 和 member_interaction_tags）

        Args:
            db: 数据库 session
            target_type: 发送对象类型
            target_filter: 筛选条件 {"include": [...], "exclude": [...]}

        Returns:
            符合条件的會員數量
        """
        # 容错处理：filtered 但没有 filter 时，视为 all_friends
        if target_type == "filtered":
            if not target_filter or (
                not target_filter.get("include") and
                not target_filter.get("exclude")
            ):
                target_type = "all_friends"

        if target_type == "all_friends":
            # 查询所有正在关注的會員
            result = await db.execute(
                text("""
                    SELECT COUNT(*)
                    FROM members
                    WHERE line_uid IS NOT NULL
                      AND line_uid != ''
                      AND is_following = 1
                """)
            )
            count = result.scalar() or 0
            logger.debug(f"📊 所有正在關注的會員數量: {count}")
            return count

        elif target_type == "filtered" and target_filter:
            # 根据标签筛选會員（同時查詢 member_tags 和 member_interaction_tags）
            include_tags = target_filter.get("include", [])
            exclude_tags = target_filter.get("exclude", [])

            if include_tags:
                # 包含指定标签的會員（查詢會員標籤和互動標籤兩個表）
                tag_placeholders = ", ".join([f":tag{i}" for i in range(len(include_tags))])
                tag_params = {f"tag{i}": tag for i, tag in enumerate(include_tags)}

                query_str = f"""
                    SELECT COUNT(DISTINCT m.id)
                    FROM members m
                    WHERE m.line_uid IS NOT NULL
                      AND m.line_uid != ''
                      AND m.is_following = 1
                      AND (
                          m.id IN (
                              SELECT member_id FROM member_tags
                              WHERE tag_name IN ({tag_placeholders})
                          )
                          OR
                          m.id IN (
                              SELECT member_id FROM member_interaction_tags
                              WHERE tag_name IN ({tag_placeholders})
                          )
                      )
                """

                # 如果同時有排除标签，添加排除条件（同時排除兩個表的標籤）
                if exclude_tags:
                    exclude_placeholders = ", ".join([f":exclude_tag{i}" for i in range(len(exclude_tags))])
                    exclude_params = {f"exclude_tag{i}": tag for i, tag in enumerate(exclude_tags)}
                    tag_params.update(exclude_params)

                    query_str += f"""
                      AND m.id NOT IN (
                          SELECT member_id FROM member_tags
                          WHERE tag_name IN ({exclude_placeholders})
                      )
                      AND m.id NOT IN (
                          SELECT member_id FROM member_interaction_tags
                          WHERE tag_name IN ({exclude_placeholders})
                      )
                    """

                result = await db.execute(text(query_str), tag_params)
                count = result.scalar() or 0
                logger.debug(f"📊 篩選後的會員數量: {count}, filter={target_filter}")
                return count

            elif exclude_tags:
                # 只有排除标签的情况（同時排除兩個表的標籤）
                exclude_placeholders = ", ".join([f":exclude_tag{i}" for i in range(len(exclude_tags))])
                exclude_params = {f"exclude_tag{i}": tag for i, tag in enumerate(exclude_tags)}

                query_str = f"""
                    SELECT COUNT(DISTINCT m.id)
                    FROM members m
                    WHERE m.line_uid IS NOT NULL
                      AND m.line_uid != ''
                      AND m.is_following = 1
                      AND m.id NOT IN (
                          SELECT member_id FROM member_tags
                          WHERE tag_name IN ({exclude_placeholders})
                      )
                      AND m.id NOT IN (
                          SELECT member_id FROM member_interaction_tags
                          WHERE tag_name IN ({exclude_placeholders})
                      )
                """

                result = await db.execute(text(query_str), exclude_params)
                count = result.scalar() or 0
                logger.debug(f"📊 排除標籤後的會員數量: {count}, filter={target_filter}")
                return count

        return 0

    async def _sync_scheduler_job(self, message: Optional[Message], was_scheduled: bool = False) -> None:
        if not message or not message.id:
            return

        is_scheduled_now = self._is_scheduled(message)
        if is_scheduled_now:
            await self._schedule_message_job(message.id, message.scheduled_datetime_utc)
        elif was_scheduled:
            await self._cancel_message_job(message.id)

    async def _schedule_message_job(self, message_id: int, scheduled_at: Optional[datetime]) -> None:
        if not scheduled_at:
            logger.warning(
                "⚠️ Tried to schedule message %s without scheduled_at", message_id
            )
            return

        try:
            from app.services.scheduler import scheduler  # 動態導入避免循環依賴
        except Exception as exc:
            logger.error(f"❌ Scheduler import failed: {exc}")
            return

        success = await scheduler.schedule_campaign(message_id, scheduled_at)
        if success:
            logger.info(
                "📅 Message %s scheduled for %s", message_id, scheduled_at
            )
        else:
            logger.error(
                "❌ Failed to register scheduler job for message %s", message_id
            )

    async def _cancel_message_job(self, message_id: int) -> None:
        try:
            from app.services.scheduler import scheduler  # 動態導入避免循環依賴
        except Exception as exc:
            logger.error(f"❌ Scheduler import failed when canceling job: {exc}")
            return

        canceled = await scheduler.cancel_campaign(message_id)
        if canceled:
            logger.info(f"🗑️  Removed scheduled job for message {message_id}")

    async def send_message(
        self,
        db: AsyncSession,
        message_id: int,
        channel_id: Optional[str] = None,
        jwt_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """发送群发消息

        Args:
            db: 数据库 session
            message_id: 消息 ID
            channel_id: LINE 频道 ID
            jwt_token: FB 渠道需要的 JWT token

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

        # 2. 根據平台路由發送
        platform = message.platform or "LINE"
        logger.info(f"📤 准备发送消息: ID={message_id}, Platform={platform}")

        if platform == "Facebook":
            # Facebook 發送
            if not message.fb_message_json:
                raise ValueError("消息缺少 Facebook Messenger JSON 内容")

            if not jwt_token:
                raise ValueError("Facebook 發送需要 jwt_token")

            # 轉換格式
            payload = self._transform_fb_message_to_api_format(message)
            logger.info(f"📦 FB API payload: {payload}")

            # 發送到外部 API
            from app.clients.fb_message_client import FbMessageClient
            fb_client = FbMessageClient()
            result = await fb_client.send_broadcast_message(
                payload=payload,
                jwt_token=jwt_token
            )
            logger.info(f"📬 FB API result: {result}")

            # 更新消息狀態
            if result.get("ok"):
                message.send_status = "已發送"
                message.send_time = datetime.now()
                # 彈性解析回應欄位 (sent_count 或 sent)
                sent_count = result.get("sent_count") or result.get("sent") or 0
                failed_count = result.get("failed_count") or result.get("failed") or 0
                # 更新發送人數統計（用於前端表格顯示）
                message.send_count = sent_count
            else:
                message.send_status = "發送失敗"
                message.failure_reason = result.get("error", "未知錯誤")
                sent_count = 0
                failed_count = message.estimated_send_count or 0

            await db.commit()

            return {
                "ok": result.get("ok", False),
                "sent": sent_count,
                "failed": failed_count,
                "errors": [result.get("error")] if result.get("error") else None
            }

        elif platform == "Instagram":
            # Instagram 發送（預留結構）
            raise NotImplementedError("Instagram 發送功能開發中")

        else:
            # LINE 發送（現有邏輯）
            if not message.flex_message_json:
                raise ValueError(f"消息缺少 Flex Message JSON 内容")

            if self._is_scheduled(message):
                await self._cancel_message_job(message_id)
                message.scheduled_datetime_utc = None
                logger.info(f"⏹️  Cleared scheduler job before sending message {message_id}")

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
        """获取消息的点击次数（依規格：從 ComponentInteractionLog 統計）

        Args:
            db: 数据库 session
            message_id: 消息 ID

        Returns:
            點擊次數（不重複 line_id，僅計算 interaction_type='button_url'）
        """
        counts = await self.get_messages_click_counts(db, [int(message_id)])
        return int(counts.get(int(message_id), 0))

    async def get_messages_click_counts(
        self,
        db: AsyncSession,
        message_ids: List[int],
    ) -> Dict[int, int]:
        """批量获取消息点击次数（依規格：從 ComponentInteractionLog 統計）"""
        normalized_ids = [int(mid) for mid in message_ids if mid is not None]
        if not normalized_ids:
            return {}

        stmt = (
            select(
                ComponentInteractionLog.message_id.label("message_id"),
                func.count(func.distinct(ComponentInteractionLog.line_id)).label(
                    "unique_clicks"
                ),
            )
            .where(
                ComponentInteractionLog.message_id.in_(normalized_ids),
                ComponentInteractionLog.interaction_type == InteractionType.BUTTON_URL,
            )
            .group_by(ComponentInteractionLog.message_id)
        )

        result = await db.execute(stmt)
        counts: Dict[int, int] = {int(row.message_id): int(row.unique_clicks or 0) for row in result.all()}
        for mid in normalized_ids:
            counts.setdefault(int(mid), 0)
        return counts

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

        if self._is_scheduled(message):
            await self._cancel_message_job(message.id)

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
