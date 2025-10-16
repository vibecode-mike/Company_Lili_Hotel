"""
會員管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, delete
from app.database import get_db
from app.models.member import Member
from app.models.tag import MemberTag, InteractionTag, MemberTagRelation, TagType
from app.models.user import User
from app.schemas.member import (
    MemberCreate,
    MemberUpdate,
    MemberListItem,
    MemberDetail,
    MemberSearchParams,
    AddTagsRequest,
    UpdateNotesRequest,
    TagInfo,
)
from app.schemas.common import SuccessResponse
from app.core.pagination import PageParams, PageResponse
from app.api.v1.auth import get_current_user
from datetime import datetime

router = APIRouter()


@router.get("", response_model=SuccessResponse)
async def get_members(
    params: MemberSearchParams = Depends(),
    page_params: PageParams = Depends(),
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證，開發階段使用
):
    """獲取會員列表"""
    query = select(Member)

    # 搜索條件
    if params.search:
        search_pattern = f"%{params.search}%"
        query = query.where(
            or_(
                Member.first_name.like(search_pattern),
                Member.last_name.like(search_pattern),
                Member.email.like(search_pattern),
                Member.phone.like(search_pattern),
                Member.line_display_name.like(search_pattern),
            )
        )

    # 來源篩選
    if params.source:
        query = query.where(Member.source == params.source)

    # 標籤篩選
    if params.tags:
        tag_ids = [int(tid) for tid in params.tags.split(",")]
        query = query.join(MemberTagRelation).where(
            MemberTagRelation.tag_id.in_(tag_ids)
        )

    # 排序 (MySQL 兼容版本)
    if params.sort_by == "last_interaction_at":
        if params.order == "desc":
            query = query.order_by(Member.last_interaction_at.desc())
        else:
            query = query.order_by(Member.last_interaction_at.asc())
    elif params.sort_by == "created_at":
        if params.order == "desc":
            query = query.order_by(Member.created_at.desc())
        else:
            query = query.order_by(Member.created_at.asc())
    else:
        # 默認按創建時間倒序排列
        query = query.order_by(Member.created_at.desc())

    # 計算總數
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 分頁
    query = query.offset(page_params.offset).limit(page_params.limit)
    result = await db.execute(query)
    members = result.scalars().all()

    # 獲取標籤信息
    items = []
    for member in members:
        # 獲取會員標籤 - 分兩次查詢避免 JOIN 歧義
        tags = []

        # 查詢會員標籤
        member_tags_result = await db.execute(
            select(MemberTag)
            .join(MemberTagRelation, MemberTag.id == MemberTagRelation.tag_id)
            .where(
                and_(
                    MemberTagRelation.member_id == member.id,
                    MemberTagRelation.tag_type == TagType.MEMBER
                )
            )
        )
        for tag in member_tags_result.scalars():
            tags.append(TagInfo(id=tag.id, name=tag.name, type="member"))

        # 查詢互動標籤
        interaction_tags_result = await db.execute(
            select(InteractionTag)
            .join(MemberTagRelation, InteractionTag.id == MemberTagRelation.tag_id)
            .where(
                and_(
                    MemberTagRelation.member_id == member.id,
                    MemberTagRelation.tag_type == TagType.INTERACTION
                )
            )
        )
        for tag in interaction_tags_result.scalars():
            tags.append(TagInfo(id=tag.id, name=tag.name, type="interaction"))

        member_dict = MemberListItem.model_validate(member).model_dump()
        member_dict["tags"] = tags
        items.append(member_dict)

    page_response = PageResponse.create(
        items=items,
        total=total,
        page=page_params.page,
        page_size=page_params.page_size,
    )

    return SuccessResponse(data=page_response.model_dump())


@router.get("/count", response_model=SuccessResponse)
async def get_member_count(
    target_audience: str = "all",
    tag_ids: str = None,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證，開發階段使用
):
    """獲取符合條件的會員數量"""
    query = select(func.count(Member.id))

    # 如果是篩選目標對象且有標籤條件
    if target_audience == "filtered" and tag_ids:
        tag_id_list = [int(tid) for tid in tag_ids.split(",")]

        # 加入標籤關聯表並篩選
        query = (
            select(func.count(func.distinct(Member.id)))
            .select_from(Member)
            .join(MemberTagRelation, Member.id == MemberTagRelation.member_id)
            .where(MemberTagRelation.tag_id.in_(tag_id_list))
        )

    result = await db.execute(query)
    count = result.scalar()

    return SuccessResponse(data={"count": count or 0})


@router.get("/{member_id}", response_model=SuccessResponse)
async def get_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證，開發階段使用
):
    """獲取會員詳情"""
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 獲取標籤 - 分兩次查詢避免 JOIN 歧義
    tags = []

    # 查詢會員標籤
    member_tags_result = await db.execute(
        select(MemberTag)
        .join(MemberTagRelation, MemberTag.id == MemberTagRelation.tag_id)
        .where(
            and_(
                MemberTagRelation.member_id == member.id,
                MemberTagRelation.tag_type == TagType.MEMBER
            )
        )
    )
    for tag in member_tags_result.scalars():
        tags.append(TagInfo(id=tag.id, name=tag.name, type="member"))

    # 查詢互動標籤
    interaction_tags_result = await db.execute(
        select(InteractionTag)
        .join(MemberTagRelation, InteractionTag.id == MemberTagRelation.tag_id)
        .where(
            and_(
                MemberTagRelation.member_id == member.id,
                MemberTagRelation.tag_type == TagType.INTERACTION
            )
        )
    )
    for tag in interaction_tags_result.scalars():
        tags.append(TagInfo(id=tag.id, name=tag.name, type="interaction"))

    # 處理 None 值的欄位
    member_data = {
        "id": member.id,
        "line_uid": member.line_uid,
        "line_display_name": member.line_display_name,
        "line_picture_url": member.line_picture_url,
        "first_name": member.first_name,
        "last_name": member.last_name,
        "email": member.email,
        "phone": member.phone,
        "gender": member.gender,
        "birthday": member.birthday,
        "id_number": member.id_number,
        "source": member.source,
        "accept_marketing": member.accept_marketing if member.accept_marketing is not None else True,
        "notes": member.notes,
        "created_at": member.created_at,
        "last_interaction_at": member.last_interaction_at,
        "tags": tags,
    }

    return SuccessResponse(data=member_data)


@router.post("", response_model=SuccessResponse)
async def create_member(
    member_data: MemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """新增會員"""
    # 檢查身分證是否已存在
    if member_data.id_number:
        result = await db.execute(
            select(Member).where(Member.id_number == member_data.id_number)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="身分證號碼已存在")

    member = Member(**member_data.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return SuccessResponse(data=MemberDetail.model_validate(member).model_dump())


@router.put("/{member_id}", response_model=SuccessResponse)
async def update_member(
    member_id: int,
    member_data: MemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新會員資料"""
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 更新欄位
    for field, value in member_data.model_dump(exclude_unset=True).items():
        setattr(member, field, value)

    await db.commit()
    await db.refresh(member)

    return SuccessResponse(data=MemberDetail.model_validate(member).model_dump())


@router.delete("/{member_id}", response_model=SuccessResponse)
async def delete_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """刪除會員"""
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    await db.delete(member)
    await db.commit()

    return SuccessResponse(message="會員刪除成功")


@router.post("/{member_id}/tags", response_model=SuccessResponse)
async def add_member_tags(
    member_id: int,
    request: AddTagsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """為會員添加標籤"""
    # 檢查會員是否存在
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 添加標籤
    for tag_id in request.tag_ids:
        # 檢查標籤是否已存在
        exists = await db.execute(
            select(MemberTagRelation).where(
                and_(
                    MemberTagRelation.member_id == member_id,
                    MemberTagRelation.tag_id == tag_id,
                )
            )
        )

        if not exists.scalar_one_or_none():
            relation = MemberTagRelation(
                member_id=member_id,
                tag_id=tag_id,
                tag_type=TagType.MEMBER,
                tagged_at=datetime.utcnow(),
            )
            db.add(relation)

    await db.commit()

    return SuccessResponse(message="標籤添加成功")


@router.delete("/{member_id}/tags/{tag_id}", response_model=SuccessResponse)
async def remove_member_tag(
    member_id: int,
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """移除會員標籤"""
    await db.execute(
        delete(MemberTagRelation).where(
            and_(
                MemberTagRelation.member_id == member_id,
                MemberTagRelation.tag_id == tag_id,
            )
        )
    )
    await db.commit()

    return SuccessResponse(message="標籤移除成功")


@router.put("/{member_id}/notes", response_model=SuccessResponse)
async def update_member_notes(
    member_id: int,
    request: UpdateNotesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新會員備註"""
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    member.notes = request.notes
    await db.commit()

    return SuccessResponse(message="備註更新成功")
