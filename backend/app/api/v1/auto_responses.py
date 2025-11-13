"""
自動回應 API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.auto_response import AutoResponse, AutoResponseKeyword, TriggerType
from app.schemas.common import SuccessResponse
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class AutoResponseCreate(BaseModel):
    name: str
    trigger_type: TriggerType
    content: str
    keywords: Optional[List[str]] = None
    is_active: bool = True


class AutoResponseUpdate(BaseModel):
    name: Optional[str] = None
    trigger_type: Optional[TriggerType] = None
    content: Optional[str] = None
    keywords: Optional[List[str]] = None
    is_active: Optional[bool] = None


@router.get("", response_model=SuccessResponse)
async def get_auto_responses(
    trigger_type: Optional[TriggerType] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """獲取自動回應列表"""
    query = select(AutoResponse).options(selectinload(AutoResponse.keywords))

    if trigger_type:
        query = query.where(AutoResponse.trigger_type == trigger_type)
    if is_active is not None:
        query = query.where(AutoResponse.is_active == is_active)

    query = query.order_by(AutoResponse.created_at.desc())
    result = await db.execute(query)
    auto_responses = result.scalars().all()

    items = [
        {
            "id": ar.id,
            "name": ar.name,
            "trigger_type": ar.trigger_type,
            "content": ar.content,
            "is_active": ar.is_active,
            "trigger_count": ar.trigger_count,
            "success_rate": float(ar.success_rate) if ar.success_rate else 0,
            "created_at": ar.created_at,
            "keywords": [
                {
                    "id": kw.id,
                    "keyword": kw.keyword,
                    "match_count": kw.match_count,
                }
                for kw in ar.keywords
            ],
        }
        for ar in auto_responses
    ]

    return SuccessResponse(data=items)


@router.get("/{auto_response_id}", response_model=SuccessResponse)
async def get_auto_response(
    auto_response_id: int,
    db: AsyncSession = Depends(get_db)
):
    """獲取單個自動回應詳情"""
    result = await db.execute(
        select(AutoResponse)
        .options(selectinload(AutoResponse.keywords))
        .where(AutoResponse.id == auto_response_id)
    )
    auto_response = result.scalar_one_or_none()

    if not auto_response:
        raise HTTPException(status_code=404, detail="自動回應不存在")

    return SuccessResponse(
        data={
            "id": auto_response.id,
            "name": auto_response.name,
            "trigger_type": auto_response.trigger_type,
            "content": auto_response.content,
            "is_active": auto_response.is_active,
            "trigger_count": auto_response.trigger_count,
            "success_rate": float(auto_response.success_rate) if auto_response.success_rate else 0,
            "created_at": auto_response.created_at,
            "keywords": [
                {
                    "id": kw.id,
                    "keyword": kw.keyword,
                    "match_count": kw.match_count,
                }
                for kw in auto_response.keywords
            ],
        }
    )


@router.post("", response_model=SuccessResponse)
async def create_auto_response(
    data: AutoResponseCreate,
    db: AsyncSession = Depends(get_db)
):
    """創建自動回應"""
    auto_response = AutoResponse(
        name=data.name,
        trigger_type=data.trigger_type,
        content=data.content,
        is_active=data.is_active,
    )
    db.add(auto_response)
    await db.flush()  # Get the ID before adding keywords

    # Add keywords if provided
    if data.keywords:
        for keyword in data.keywords:
            kw = AutoResponseKeyword(
                auto_response_id=auto_response.id,
                keyword=keyword,
            )
            db.add(kw)

    await db.commit()
    await db.refresh(auto_response)

    return SuccessResponse(data={"id": auto_response.id}, message="創建成功")


@router.put("/{auto_response_id}", response_model=SuccessResponse)
async def update_auto_response(
    auto_response_id: int,
    data: AutoResponseUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新自動回應"""
    result = await db.execute(
        select(AutoResponse)
        .options(selectinload(AutoResponse.keywords))
        .where(AutoResponse.id == auto_response_id)
    )
    auto_response = result.scalar_one_or_none()

    if not auto_response:
        raise HTTPException(status_code=404, detail="自動回應不存在")

    # Update basic fields
    if data.name is not None:
        auto_response.name = data.name
    if data.trigger_type is not None:
        auto_response.trigger_type = data.trigger_type
    if data.content is not None:
        auto_response.content = data.content
    if data.is_active is not None:
        auto_response.is_active = data.is_active

    # Update keywords if provided
    if data.keywords is not None:
        # Remove existing keywords
        for kw in auto_response.keywords:
            await db.delete(kw)

        # Add new keywords
        for keyword in data.keywords:
            kw = AutoResponseKeyword(
                auto_response_id=auto_response.id,
                keyword=keyword,
            )
            db.add(kw)

    await db.commit()
    await db.refresh(auto_response)

    return SuccessResponse(data={"id": auto_response.id}, message="更新成功")


@router.delete("/{auto_response_id}", response_model=SuccessResponse)
async def delete_auto_response(
    auto_response_id: int,
    db: AsyncSession = Depends(get_db)
):
    """刪除自動回應"""
    result = await db.execute(select(AutoResponse).where(AutoResponse.id == auto_response_id))
    auto_response = result.scalar_one_or_none()

    if not auto_response:
        raise HTTPException(status_code=404, detail="自動回應不存在")

    await db.delete(auto_response)
    await db.commit()

    return SuccessResponse(message="刪除成功")


@router.patch("/{auto_response_id}/toggle", response_model=SuccessResponse)
async def toggle_auto_response(
    auto_response_id: int,
    is_active: bool,
    db: AsyncSession = Depends(get_db)
):
    """切換自動回應狀態"""
    result = await db.execute(select(AutoResponse).where(AutoResponse.id == auto_response_id))
    auto_response = result.scalar_one_or_none()

    if not auto_response:
        raise HTTPException(status_code=404, detail="自動回應不存在")

    auto_response.is_active = is_active
    await db.commit()

    return SuccessResponse(message="狀態更新成功")
