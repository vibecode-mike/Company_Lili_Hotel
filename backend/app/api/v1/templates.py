"""
�o! API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.template import MessageTemplate, TemplateCarouselItem
from app.models.user import User
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateListItem,
    TemplateDetail,
    TemplateSearchParams,
)
from app.schemas.common import SuccessResponse
from app.core.pagination import PageParams, PageResponse
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.get("", response_model=SuccessResponse)
async def get_templates(
    params: TemplateSearchParams = Depends(),
    page_params: PageParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """r�!h"""
    query = select(MessageTemplate)

    # 移除 type 篩選條件，因為該欄位已廢棄

    query = query.order_by(MessageTemplate.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset(page_params.offset).limit(page_params.limit)
    result = await db.execute(query)
    templates = result.scalars().all()

    items = [TemplateListItem.model_validate(t).model_dump() for t in templates]

    page_response = PageResponse.create(
        items=items, total=total, page=page_params.page, page_size=page_params.page_size
    )

    return SuccessResponse(data=page_response.model_dump())


@router.get("/{template_id}", response_model=SuccessResponse)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """r�!s�"""
    result = await db.execute(select(MessageTemplate).where(MessageTemplate.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="!X(")

    return SuccessResponse(data=TemplateDetail.model_validate(template).model_dump())


@router.post("", response_model=SuccessResponse)
async def create_template(
    template_data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """u�!"""
    carousel_items = template_data.carousel_items
    template_dict = template_data.model_dump(exclude={"carousel_items"})

    template = MessageTemplate(**template_dict)
    db.add(template)
    await db.flush()

    if carousel_items:
        for item in carousel_items:
            carousel_item = TemplateCarouselItem(**item.model_dump(), template_id=template.id)
            db.add(carousel_item)

    await db.commit()
    await db.refresh(template)

    return SuccessResponse(data=TemplateDetail.model_validate(template).model_dump())


@router.put("/{template_id}", response_model=SuccessResponse)
async def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """��!"""
    result = await db.execute(select(MessageTemplate).where(MessageTemplate.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="!X(")

    template_dict = template_data.model_dump(exclude={"carousel_items"}, exclude_unset=True)
    for field, value in template_dict.items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)

    return SuccessResponse(data=TemplateDetail.model_validate(template).model_dump())


@router.delete("/{template_id}", response_model=SuccessResponse)
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """*d!"""
    result = await db.execute(select(MessageTemplate).where(MessageTemplate.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="!X(")

    await db.delete(template)
    await db.commit()

    return SuccessResponse(message="!*d�")
