"""
Í’ﬁ… API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.auto_response import AutoResponse, TriggerType
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.api.v1.auth import get_current_user
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class AutoResponseCreate(BaseModel):
    name: str
    trigger_type: TriggerType
    content: str
    keywords: Optional[List[str]] = None
    is_active: bool = True


@router.get("", response_model=SuccessResponse)
async def get_auto_responses(
    trigger_type: Optional[TriggerType] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """r÷Í’ﬁ…h"""
    query = select(AutoResponse)

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
        }
        for ar in auto_responses
    ]

    return SuccessResponse(data=items)


@router.post("", response_model=SuccessResponse)
async def create_auto_response(
    data: AutoResponseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """u˙Í’ﬁ…"""
    auto_response = AutoResponse(
        name=data.name,
        trigger_type=data.trigger_type,
        content=data.content,
        is_active=data.is_active,
    )
    db.add(auto_response)
    await db.commit()
    await db.refresh(auto_response)

    return SuccessResponse(data={"id": auto_response.id}, message="Í’ﬁ…u˙ü")


@router.patch("/{auto_response_id}/toggle", response_model=SuccessResponse)
async def toggle_auto_response(
    auto_response_id: int,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """€Í’ﬁ…_(¿K"""
    result = await db.execute(select(AutoResponse).where(AutoResponse.id == auto_response_id))
    auto_response = result.scalar_one_or_none()

    if not auto_response:
        raise HTTPException(status_code=404, detail="Í’ﬁ…X(")

    auto_response.is_active = is_active
    await db.commit()

    return SuccessResponse(message="¿KÙ∞ü")
