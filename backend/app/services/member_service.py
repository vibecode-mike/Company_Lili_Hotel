"""
会员管理业务逻辑层
职责：处理会员相关的业务逻辑，与数据库交互
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
import logging

from app.models.member import Member, MemberSource
from app.models.tag import MemberTag, InteractionTag, MemberTagRelation, TagType
from app.schemas.member import MemberCreate, MemberUpdate, MemberSearchParams

logger = logging.getLogger(__name__)


class MemberService:
    """会员服务"""

    async def create_member(
        self,
        db: AsyncSession,
        member_data: MemberCreate
    ) -> Member:
        """
        创建会员

        Args:
            db: 数据库 session
            member_data: 会员创建数据

        Returns:
            创建的会员对象
        """
        # 检查 email/phone/id_number 是否已存在
        if member_data.email:
            existing = await self._get_member_by_email(db, member_data.email)
            if existing:
                raise ValueError(f"Email {member_data.email} already exists")

        if member_data.phone:
            existing = await self._get_member_by_phone(db, member_data.phone)
            if existing:
                raise ValueError(f"Phone {member_data.phone} already exists")

        if member_data.id_number:
            existing = await self._get_member_by_id_number(db, member_data.id_number)
            if existing:
                raise ValueError(f"ID number {member_data.id_number} already exists")

        # 创建会员
        member = Member(
            line_uid=member_data.line_uid,
            line_display_name=member_data.line_display_name,
            line_picture_url=member_data.line_picture_url,
            first_name=member_data.first_name,
            last_name=member_data.last_name,
            gender=member_data.gender,
            birthday=member_data.birthday,
            email=member_data.email,
            phone=member_data.phone,
            id_number=member_data.id_number,
            source=member_data.source or MemberSource.SYSTEM,
            accept_marketing=member_data.accept_marketing,
            notes=member_data.notes,
        )
        db.add(member)
        await db.flush()
        await db.refresh(member)

        logger.info(f"Created member ID: {member.id}, source: {member.source}")
        logger.debug(f"Member details - Name: {member.first_name} {member.last_name}, Email: {member.email}")
        return member

    async def get_member_by_id(
        self,
        db: AsyncSession,
        member_id: int,
        include_tags: bool = True
    ) -> Optional[Member]:
        """
        获取会员详情

        Args:
            db: 数据库 session
            member_id: 会员 ID
            include_tags: 是否包含标签信息

        Returns:
            会员对象或 None
        """
        query = select(Member).where(Member.id == member_id)

        if include_tags:
            query = query.options(selectinload(Member.tag_relations))

        result = await db.execute(query)
        member = result.scalar_one_or_none()

        if member and include_tags:
            # 获取标签详情
            member.tags = await self._get_member_tags(db, member.id)

        return member

    async def list_members(
        self,
        db: AsyncSession,
        search_params: MemberSearchParams,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Member], int]:
        """
        获取会员列表

        Args:
            db: 数据库 session
            search_params: 搜索参数
            page: 页码
            limit: 每页数量

        Returns:
            (会员列表, 总数)
        """
        query = select(Member)

        # 搜索条件
        if search_params.search:
            search_pattern = f"%{search_params.search}%"
            query = query.where(
                or_(
                    Member.first_name.like(search_pattern),
                    Member.last_name.like(search_pattern),
                    Member.email.like(search_pattern),
                    Member.phone.like(search_pattern),
                    Member.line_display_name.like(search_pattern),
                )
            )

        # 来源筛选
        if search_params.source:
            query = query.where(Member.source == search_params.source)

        # 标签筛选
        if search_params.tags:
            tag_ids = [int(tid) for tid in search_params.tags.split(",")]
            query = query.join(MemberTagRelation).where(
                MemberTagRelation.tag_id.in_(tag_ids)
            )

        # 排序
        if search_params.sort_by == "last_interaction_at":
            if search_params.order == "desc":
                query = query.order_by(Member.last_interaction_at.desc())
            else:
                query = query.order_by(Member.last_interaction_at.asc())
        else:
            if search_params.order == "desc":
                query = query.order_by(Member.created_at.desc())
            else:
                query = query.order_by(Member.created_at.asc())

        # 获取总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 分页
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        members = result.scalars().all()

        # 获取标签信息
        for member in members:
            member.tags = await self._get_member_tags(db, member.id)

        return members, total

    async def update_member(
        self,
        db: AsyncSession,
        member_id: int,
        member_data: MemberUpdate
    ) -> Optional[Member]:
        """更新会员资料"""
        member = await self.get_member_by_id(db, member_id, include_tags=False)
        if not member:
            return None

        # 更新字段
        for field, value in member_data.dict(exclude_unset=True).items():
            setattr(member, field, value)

        await db.commit()
        await db.refresh(member)

        logger.info(f"Updated member ID: {member_id}")
        return member

    async def delete_member(
        self,
        db: AsyncSession,
        member_id: int
    ) -> bool:
        """删除会员"""
        member = await self.get_member_by_id(db, member_id, include_tags=False)
        if not member:
            return False

        await db.delete(member)
        await db.commit()

        logger.info(f"Deleted member ID: {member_id}")
        return True

    # ========== 标签管理方法 ==========

    async def add_tags_to_member(
        self,
        db: AsyncSession,
        member_id: int,
        tag_ids: List[int]
    ) -> Member:
        """为会员添加标签"""
        member = await self.get_member_by_id(db, member_id, include_tags=False)
        if not member:
            raise ValueError(f"Member {member_id} not found")

        for tag_id in tag_ids:
            # 检查标签是否存在
            tag = await self._get_tag_by_id(db, tag_id)
            if not tag:
                logger.warning(f"Tag {tag_id} not found, skipping")
                continue

            # 检查是否已存在关联
            existing = await self._check_tag_relation(db, member_id, tag_id, tag.type)
            if existing:
                logger.debug(f"Tag {tag_id} already added to member {member_id}, skipping")
                continue

            # 创建关联
            relation = MemberTagRelation(
                member_id=member_id,
                tag_id=tag_id,
                tag_type=tag.type,
                tagged_at=datetime.now(),
            )
            db.add(relation)

        await db.commit()
        logger.info(f"Added {len(tag_ids)} tags to member ID: {member_id}")
        return await self.get_member_by_id(db, member_id)

    async def remove_tag_from_member(
        self,
        db: AsyncSession,
        member_id: int,
        tag_id: int
    ) -> bool:
        """移除会员标签"""
        # 查找关联记录
        query = select(MemberTagRelation).where(
            and_(
                MemberTagRelation.member_id == member_id,
                MemberTagRelation.tag_id == tag_id,
            )
        )
        result = await db.execute(query)
        relation = result.scalar_one_or_none()

        if not relation:
            return False

        await db.delete(relation)
        await db.commit()

        logger.info(f"✅ Removed tag {tag_id} from member {member_id}")
        return True

    async def update_member_notes(
        self,
        db: AsyncSession,
        member_id: int,
        notes: str
    ) -> Optional[Member]:
        """更新会员备注"""
        member = await self.get_member_by_id(db, member_id, include_tags=False)
        if not member:
            return None

        member.notes = notes
        await db.commit()
        await db.refresh(member)

        logger.info(f"✅ Updated notes for member {member_id}")
        return member

    # ========== 私有辅助方法 ==========

    async def _get_member_by_email(self, db: AsyncSession, email: str) -> Optional[Member]:
        """通过 email 查找会员"""
        query = select(Member).where(Member.email == email)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def _get_member_by_phone(self, db: AsyncSession, phone: str) -> Optional[Member]:
        """通过 phone 查找会员"""
        query = select(Member).where(Member.phone == phone)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def _get_member_by_id_number(self, db: AsyncSession, id_number: str) -> Optional[Member]:
        """通过 id_number 查找会员"""
        query = select(Member).where(Member.id_number == id_number)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def _get_member_tags(self, db: AsyncSession, member_id: int) -> List[Dict]:
        """获取会员的所有标签"""
        tags = []

        # 查询会员标签
        member_tags_query = (
            select(MemberTag)
            .join(MemberTagRelation, MemberTag.id == MemberTagRelation.tag_id)
            .where(
                and_(
                    MemberTagRelation.member_id == member_id,
                    MemberTagRelation.tag_type == TagType.MEMBER,
                )
            )
        )
        member_tags_result = await db.execute(member_tags_query)
        member_tags = member_tags_result.scalars().all()

        for tag in member_tags:
            tags.append({
                "id": tag.id,
                "name": tag.name,
                "type": "member",
            })

        # 查询互动标签
        interaction_tags_query = (
            select(InteractionTag)
            .join(MemberTagRelation, InteractionTag.id == MemberTagRelation.tag_id)
            .where(
                and_(
                    MemberTagRelation.member_id == member_id,
                    MemberTagRelation.tag_type == TagType.INTERACTION,
                )
            )
        )
        interaction_tags_result = await db.execute(interaction_tags_query)
        interaction_tags = interaction_tags_result.scalars().all()

        for tag in interaction_tags:
            tags.append({
                "id": tag.id,
                "name": tag.name,
                "type": "interaction",
            })

        return tags

    async def _get_tag_by_id(
        self,
        db: AsyncSession,
        tag_id: int
    ) -> Optional[MemberTag | InteractionTag]:
        """获取标签（可能是会員標籤或互動標籤）

        Args:
            db: 數據庫 session
            tag_id: 標籤 ID

        Returns:
            Optional[MemberTag | InteractionTag]: 找到的標籤對象或 None
        """
        # 先尝试查询会员标签
        member_tag_query = select(MemberTag).where(MemberTag.id == tag_id)
        result = await db.execute(member_tag_query)
        member_tag = result.scalar_one_or_none()

        if member_tag:
            return member_tag

        # 再尝试查询互动标签
        interaction_tag_query = select(InteractionTag).where(InteractionTag.id == tag_id)
        result = await db.execute(interaction_tag_query)
        return result.scalar_one_or_none()

    async def _check_tag_relation(
        self,
        db: AsyncSession,
        member_id: int,
        tag_id: int,
        tag_type: TagType
    ) -> bool:
        """检查会员-标签关联是否存在"""
        query = select(MemberTagRelation).where(
            and_(
                MemberTagRelation.member_id == member_id,
                MemberTagRelation.tag_id == tag_id,
                MemberTagRelation.tag_type == tag_type,
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none() is not None


# 全局服务实例
member_service = MemberService()
