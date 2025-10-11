"""
ˆo API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.message import Message, MessageDirection
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.core.pagination import PageParams, PageResponse
from app.api.v1.auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class MessageCreate(BaseModel):
    member_id: int
    content: str
    message_type: str
    scheduled_at: Optional[datetime] = None


@router.get("", response_model=SuccessResponse)
async def get_messages(
    member_id: Optional[int] = None,
    direction: Optional[MessageDirection] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page_params: PageParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """rÖˆoh"""
    query = select(Message)

    if member_id:
        query = query.where(Message.member_id == member_id)
    if direction:
        query = query.where(Message.direction == direction)
    if start_date:
        query = query.where(Message.created_at >= start_date)
    if end_date:
        query = query.where(Message.created_at <= end_date)

    query = query.order_by(Message.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset(page_params.offset).limit(page_params.limit)
    result = await db.execute(query)
    messages = result.scalars().all()

    items = [
        {
            "id": m.id,
            "member_id": m.member_id,
            "content": m.content,
            "direction": m.direction,
            "message_type": m.message_type,
            "sender_type": m.sender_type,
            "read_at": m.read_at,
            "created_at": m.created_at,
        }
        for m in messages
    ]

    page_response = PageResponse.create(
        items=items, total=total, page=page_params.page, page_size=page_params.page_size
    )

    return SuccessResponse(data=page_response.model_dump())


@router.get("/conversation/{member_id}", response_model=SuccessResponse)
async def get_conversation(
    member_id: int,
    page_params: PageParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """rÖšá„q"""
    query = select(Message).where(Message.member_id == member_id)
    query = query.order_by(Message.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset(page_params.offset).limit(page_params.limit)
    result = await db.execute(query)
    messages = result.scalars().all()

    items = [
        {
            "id": m.id,
            "content": m.content,
            "direction": m.direction,
            "message_type": m.message_type,
            "sender_type": m.sender_type,
            "created_at": m.created_at,
        }
        for m in messages
    ]

    page_response = PageResponse.create(
        items=items, total=total, page=page_params.page, page_size=page_params.page_size
    )

    return SuccessResponse(data=page_response.model_dump())


@router.post("", response_model=SuccessResponse)
async def send_message(
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """|ˆo"""
    message = Message(
        member_id=data.member_id,
        content=data.content,
        message_type=data.message_type,
        direction=MessageDirection.OUTGOING,
        sender_id=current_user.id,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    return SuccessResponse(data={"id": message.id}, message="ˆo|Ÿ")
