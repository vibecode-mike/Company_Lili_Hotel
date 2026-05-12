"""
模板庫服務
負責模板庫的管理和複製功能
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging

from app.models.template import MessageTemplate

logger = logging.getLogger(__name__)


class TemplateService:
    """模板庫服務

    負責模板庫的瀏覽、複製和管理功能
    """

    async def list_library_templates(
        self,
        db: AsyncSession,
        sort_by: str = "usage_count"
    ) -> List[MessageTemplate]:
        """瀏覽模板庫中的模板

        Args:
            db: 數據庫 session
            sort_by: 排序方式 ("usage_count" | "created_at")

        Returns:
            模板列表
        """
        # 構建查詢：is_in_library=True 的模板
        query = select(MessageTemplate).where(
            MessageTemplate.is_in_library == True
        )

        # 根據排序方式排序
        if sort_by == "usage_count":
            query = query.order_by(MessageTemplate.usage_count.desc())
        elif sort_by == "created_at":
            query = query.order_by(MessageTemplate.created_at.desc())
        else:
            # 默認按使用次數降序
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
        """複製模板（用于創建新消息）

        從模板庫複製模板，記錄來源並增加使用次數

        Args:
            db: 數據庫 session
            template_id: 源模板 ID

        Returns:
            新創建的模板副本

        Raises:
            ValueError: 模板不存在
        """
        # 1. 獲取源模板
        source_template = await db.get(MessageTemplate, template_id)
        if not source_template:
            raise ValueError(f"模板不存在: ID={template_id}")

        logger.debug(f"Copying template ID: {template_id}, Name: {source_template.name}")

        # 2. 創建副本（複製所有字段，但不包括 id 和系統字段）
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
            # 模板庫管理字段
            is_in_library=False,  # 副本默認不在庫中
            source_template_id=template_id,  # 記錄來源
            usage_count=0,  # 新副本使用次數爲 0
            storage_type=source_template.storage_type,
            flex_message_url=source_template.flex_message_url,
        )

        db.add(new_template)

        # 3. 增加源模板的使用次數
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
        """添加或移除模板庫中的模板

        Args:
            db: 數據庫 session
            template_id: 模板 ID
            add: True=添加到庫, False=從庫中移除

        Returns:
            更新後的模板對象

        Raises:
            ValueError: 模板不存在
        """
        # 1. 獲取模板
        template = await db.get(MessageTemplate, template_id)
        if not template:
            raise ValueError(f"模板不存在: ID={template_id}")

        # 2. 更新 is_in_library 標志
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
        """獲取模板詳情

        Args:
            db: 數據庫 session
            template_id: 模板 ID

        Returns:
            模板對象或 None
        """
        # 使用 selectinload 預加載關聯關系（如 carousel_items）
        stmt = select(MessageTemplate).where(
            MessageTemplate.id == template_id
        ).options(
            selectinload(MessageTemplate.carousel_items)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
