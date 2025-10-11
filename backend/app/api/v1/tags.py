"""
d¡ API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.tag import MemberTag, InteractionTag, TagType, TagSource
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.core.pagination import PageParams, PageResponse
from app.api.v1.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class TagCreate(BaseModel):
    name: str
    type: TagType
    source: TagSource
    description: Optional[str] = None


class TagUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.get("", response_model=SuccessResponse)
async def get_tags(
    type: Optional[TagType] = None,
    search: Optional[str] = None,
    page_params: PageParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """rÖdh"""
    if type == TagType.MEMBER or type is None:
        query = select(MemberTag)
        if search:
            query = query.where(MemberTag.name.like(f"%{search}%"))
        query = query.order_by(MemberTag.created_at.desc())

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        query = query.offset(page_params.offset).limit(page_params.limit)
        result = await db.execute(query)
        tags = result.scalars().all()

        items = [
            {
                "id": t.id,
                "name": t.name,
                "type": t.type,
                "source": t.source,
                "member_count": t.member_count,
                "created_at": t.created_at,
            }
            for t in tags
        ]
    else:
        query = select(InteractionTag)
        if search:
            query = query.where(InteractionTag.name.like(f"%{search}%"))
        query = query.order_by(InteractionTag.created_at.desc())

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        query = query.offset(page_params.offset).limit(page_params.limit)
        result = await db.execute(query)
        tags = result.scalars().all()

        items = [
            {
                "id": t.id,
                "name": t.name,
                "type": t.type,
                "trigger_count": t.trigger_count,
                "created_at": t.created_at,
            }
            for t in tags
        ]

    page_response = PageResponse.create(
        items=items, total=total, page=page_params.page, page_size=page_params.page_size
    )

    return SuccessResponse(data=page_response.model_dump())


@router.post("", response_model=SuccessResponse)
async def create_tag(
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """uúd"""
    if tag_data.type == TagType.MEMBER:
        tag = MemberTag(**tag_data.model_dump())
    else:
        tag = InteractionTag(**tag_data.model_dump())

    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return SuccessResponse(data={"id": tag.id, "name": tag.name, "type": tag.type})


@router.put("/{tag_id}", response_model=SuccessResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    tag_type: TagType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ô°d"""
    if tag_type == TagType.MEMBER:
        result = await db.execute(select(MemberTag).where(MemberTag.id == tag_id))
    else:
        result = await db.execute(select(InteractionTag).where(InteractionTag.id == tag_id))

    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="dX(")

    for field, value in tag_data.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)

    await db.commit()
    return SuccessResponse(message="dô°Ÿ")


@router.delete("/{tag_id}", response_model=SuccessResponse)
async def delete_tag(
    tag_id: int,
    tag_type: TagType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """*dd"""
    if tag_type == TagType.MEMBER:
        result = await db.execute(select(MemberTag).where(MemberTag.id == tag_id))
    else:
        result = await db.execute(select(InteractionTag).where(InteractionTag.id == tag_id))

    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="dX(")

    await db.delete(tag)
    await db.commit()

    return SuccessResponse(message="d*dŸ")


@router.get("/statistics", response_model=SuccessResponse)
async def get_tag_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """rÖdqxÚ"""
    member_tags_count = await db.execute(select(func.count()).select_from(MemberTag))
    interaction_tags_count = await db.execute(select(func.count()).select_from(InteractionTag))

    most_used_tag_result = await db.execute(
        select(MemberTag).order_by(MemberTag.member_count.desc()).limit(1)
    )
    most_used_tag = most_used_tag_result.scalar_one_or_none()

    data = {
        "total_tags": member_tags_count.scalar() + interaction_tags_count.scalar(),
        "member_tags": member_tags_count.scalar(),
        "interaction_tags": interaction_tags_count.scalar(),
        "most_used_tag": (
            {
                "id": most_used_tag.id,
                "name": most_used_tag.name,
                "member_count": most_used_tag.member_count,
            }
            if most_used_tag
            else None
        ),
    }

    return SuccessResponse(data=data)
