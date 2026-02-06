"""
模板库服务
负责模板库的管理和复制功能
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging

from app.models.template import MessageTemplate

logger = logging.getLogger(__name__)


class TemplateService:
    """模板库服务

    负责模板库的浏览、复制和管理功能
    """

    async def list_library_templates(
        self,
        db: AsyncSession,
        sort_by: str = "usage_count"
    ) -> List[MessageTemplate]:
        """浏览模板库中的模板

        Args:
            db: 数据库 session
            sort_by: 排序方式 ("usage_count" | "created_at")

        Returns:
            模板列表
        """
        # 构建查询：is_in_library=True 的模板
        query = select(MessageTemplate).where(
            MessageTemplate.is_in_library == True
        )

        # 根据排序方式排序
        if sort_by == "usage_count":
            query = query.order_by(MessageTemplate.usage_count.desc())
        elif sort_by == "created_at":
            query = query.order_by(MessageTemplate.created_at.desc())
        else:
            # 默认按使用次数降序
            query = query.order_by(MessageTemplate.usage_count.desc())

        result = await db.execute(query)
        templates = result.scalars().all()

        logger.debug(f"Browse template library: found {len(templates)} templates, sort_by={sort_by}")

        return list(templates)

    async def copy_template(
        self,
        db: AsyncSession,
        template_id: int
    ) -> MessageTemplate:
        """复制模板（用于创建新消息）

        从模板库复制模板，记录来源并增加使用次数

        Args:
            db: 数据库 session
            template_id: 源模板 ID

        Returns:
            新创建的模板副本

        Raises:
            ValueError: 模板不存在
        """
        # 1. 获取源模板
        source_template = await db.get(MessageTemplate, template_id)
        if not source_template:
            raise ValueError(f"模板不存在: ID={template_id}")

        logger.debug(f"Copying template ID: {template_id}, Name: {source_template.name}")

        # 2. 创建副本（复制所有字段，但不包括 id 和系统字段）
        new_template = MessageTemplate(
            name=f"{source_template.name} (副本)",
            template_type=source_template.template_type,
            text_content=source_template.text_content,
            image_url=source_template.image_url,
            title=source_template.title,
            description=source_template.description,
            amount=source_template.amount,
            button_text=source_template.button_text,
            button_count=source_template.button_count,
            buttons=source_template.buttons,
            interaction_tag=source_template.interaction_tag,
            interaction_tag_id=source_template.interaction_tag_id,
            interaction_result=source_template.interaction_result,
            action_type=source_template.action_type,
            action_url=source_template.action_url,
            action_text=source_template.action_text,
            action_image=source_template.action_image,
            notification_message=source_template.notification_message,
            carousel_count=source_template.carousel_count,
            # 模板库管理字段
            is_in_library=False,  # 副本默认不在库中
            source_template_id=template_id,  # 记录来源
            usage_count=0,  # 新副本使用次数为 0
            storage_type=source_template.storage_type,
            flex_message_url=source_template.flex_message_url,
        )

        db.add(new_template)

        # 3. 增加源模板的使用次数
        source_template.usage_count = (source_template.usage_count or 0) + 1

        await db.commit()
        await db.refresh(new_template)

        logger.info(f"Copied template ID: {template_id} -> new ID: {new_template.id}, source usage_count: {source_template.usage_count}")

        return new_template

    async def add_to_library(
        self,
        db: AsyncSession,
        template_id: int,
        add: bool = True
    ) -> MessageTemplate:
        """添加或移除模板库中的模板

        Args:
            db: 数据库 session
            template_id: 模板 ID
            add: True=添加到库, False=从库中移除

        Returns:
            更新后的模板对象

        Raises:
            ValueError: 模板不存在
        """
        # 1. 获取模板
        template = await db.get(MessageTemplate, template_id)
        if not template:
            raise ValueError(f"模板不存在: ID={template_id}")

        # 2. 更新 is_in_library 标志
        template.is_in_library = add

        await db.commit()
        await db.refresh(template)

        action = "Added to" if add else "Removed from"
        logger.info(f"{action} template library ID: {template_id}")

        return template

    async def get_template(
        self,
        db: AsyncSession,
        template_id: int
    ) -> Optional[MessageTemplate]:
        """获取模板详情

        Args:
            db: 数据库 session
            template_id: 模板 ID

        Returns:
            模板对象或 None
        """
        # 使用 selectinload 预加载关联关系（如 carousel_items）
        stmt = select(MessageTemplate).where(
            MessageTemplate.id == template_id
        ).options(
            selectinload(MessageTemplate.carousel_items)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
