"""
自動回應 API
"""
from datetime import date, time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.auto_response import AutoResponse, AutoResponseKeyword, TriggerType
from app.models.auto_response_message import AutoResponseMessage
from app.schemas.common import SuccessResponse
from pydantic import BaseModel, conlist
from typing import Optional, List, Sequence, Dict, Any

router = APIRouter()


class AutoResponseCreate(BaseModel):
    name: str
    trigger_type: TriggerType
    content: Optional[str] = None
    keywords: Optional[List[str]] = None
    is_active: bool = True
    messages: conlist(str, min_length=1, max_length=5)
    trigger_time_start: Optional[time] = None
    trigger_time_end: Optional[time] = None
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None


class AutoResponseUpdate(BaseModel):
    name: Optional[str] = None
    trigger_type: Optional[TriggerType] = None
    content: Optional[str] = None
    keywords: Optional[List[str]] = None
    is_active: Optional[bool] = None
    messages: Optional[conlist(str, min_length=1, max_length=5)] = None
    trigger_time_start: Optional[time] = None
    trigger_time_end: Optional[time] = None
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None


def _serialize_keywords(keyword_relations: Sequence[AutoResponseKeyword]) -> List[Dict[str, Any]]:
    return [
        {
            "id": kw.id,
            "keyword": kw.keyword,
            "name": kw.keyword,
            "type": "keyword",
            "match_type": kw.match_type,
            "is_enabled": kw.is_enabled,
            "match_count": kw.match_count,
            "last_triggered_at": kw.last_triggered_at.isoformat() if kw.last_triggered_at else None,
        }
        for kw in keyword_relations
    ]


def _serialize_messages(messages: Sequence[AutoResponseMessage]) -> List[Dict[str, Any]]:
    return [
        {
            "id": msg.id,
            "content": msg.message_content,
            "sequence_order": msg.sequence_order,
        }
        for msg in sorted(messages, key=lambda item: item.sequence_order)
    ]


def _normalize_keywords(keywords: Optional[List[str]]) -> List[str]:
    if not keywords:
        return []
    cleaned = [kw.strip() for kw in keywords if kw and kw.strip()]
    if len(cleaned) > 20:
        raise HTTPException(status_code=400, detail="關鍵字數量已達上限 20 組")
    return cleaned


@router.get("", response_model=SuccessResponse)
async def get_auto_responses(
    trigger_type: Optional[TriggerType] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """獲取自動回應列表"""
    query = (
        select(AutoResponse)
        .options(
            selectinload(AutoResponse.keyword_relations),
            selectinload(AutoResponse.response_messages),
        )
    )

    if trigger_type:
        query = query.where(AutoResponse.trigger_type == trigger_type)
    if is_active is not None:
        query = query.where(AutoResponse.is_active == is_active)

    query = query.order_by(AutoResponse.created_at.desc())
    result = await db.execute(query)
    auto_responses = result.scalars().all()

    items = []
    for ar in auto_responses:
        items.append(
            {
                "id": ar.id,
                "name": ar.name,
                "trigger_type": ar.trigger_type,
                "content": ar.content,
                "is_active": ar.is_active,
                "trigger_count": ar.trigger_count,
                "success_rate": float(ar.success_rate) if ar.success_rate else 0,
                "created_at": ar.created_at,
                "updated_at": ar.updated_at,
                "keywords": _serialize_keywords(ar.keyword_relations),
                "messages": _serialize_messages(ar.response_messages),
                "trigger_time_start": ar.trigger_time_start.isoformat() if ar.trigger_time_start else None,
                "trigger_time_end": ar.trigger_time_end.isoformat() if ar.trigger_time_end else None,
                "date_range_start": ar.date_range_start.isoformat() if ar.date_range_start else None,
                "date_range_end": ar.date_range_end.isoformat() if ar.date_range_end else None,
            }
        )

    return SuccessResponse(data=items)


@router.get("/{auto_response_id}", response_model=SuccessResponse)
async def get_auto_response(
    auto_response_id: int,
    db: AsyncSession = Depends(get_db)
):
    """獲取單個自動回應詳情"""
    result = await db.execute(
        select(AutoResponse)
        .options(
            selectinload(AutoResponse.keyword_relations),
            selectinload(AutoResponse.response_messages),
        )
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
            "updated_at": auto_response.updated_at,
            "keywords": _serialize_keywords(auto_response.keyword_relations),
            "messages": _serialize_messages(auto_response.response_messages),
            "trigger_time_start": auto_response.trigger_time_start.isoformat() if auto_response.trigger_time_start else None,
            "trigger_time_end": auto_response.trigger_time_end.isoformat() if auto_response.trigger_time_end else None,
            "date_range_start": auto_response.date_range_start.isoformat() if auto_response.date_range_start else None,
            "date_range_end": auto_response.date_range_end.isoformat() if auto_response.date_range_end else None,
        }
    )


@router.post("", response_model=SuccessResponse)
async def create_auto_response(
    data: AutoResponseCreate,
    db: AsyncSession = Depends(get_db)
):
    """創建自動回應"""
    message_list = [msg.strip() for msg in data.messages if msg and msg.strip()]
    if not message_list:
        raise HTTPException(status_code=400, detail="請至少輸入一則訊息內容")
    keywords = _normalize_keywords(data.keywords)

    auto_response = AutoResponse(
        name=data.name,
        trigger_type=data.trigger_type,
        content=data.content or message_list[0],
        is_active=data.is_active,
        trigger_time_start=data.trigger_time_start,
        trigger_time_end=data.trigger_time_end,
        date_range_start=data.date_range_start,
        date_range_end=data.date_range_end,
        response_count=len(message_list),
    )
    db.add(auto_response)
    await db.flush()  # Get the ID before adding keywords

    # Add keywords if provided
    if keywords:
        for keyword in keywords:
            kw = AutoResponseKeyword(
                auto_response_id=auto_response.id,
                keyword=keyword,
            )
            db.add(kw)

    for index, message_text in enumerate(message_list, start=1):
        db.add(
            AutoResponseMessage(
                response_id=auto_response.id,
                message_content=message_text,
                sequence_order=index,
            )
        )

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
        .options(selectinload(AutoResponse.keyword_relations))
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
    if data.trigger_time_start is not None or data.trigger_time_end is not None:
        auto_response.trigger_time_start = data.trigger_time_start
        auto_response.trigger_time_end = data.trigger_time_end
    if data.date_range_start is not None or data.date_range_end is not None:
        auto_response.date_range_start = data.date_range_start
        auto_response.date_range_end = data.date_range_end

    # Update keywords if provided
    if data.keywords is not None:
        cleaned_keywords = _normalize_keywords(data.keywords)
        await db.execute(
            delete(AutoResponseKeyword).where(
                AutoResponseKeyword.auto_response_id == auto_response.id
            )
        )
        for keyword in cleaned_keywords:
            db.add(
                AutoResponseKeyword(
                    auto_response_id=auto_response.id,
                    keyword=keyword,
                )
            )

    # Update messages if provided
    if data.messages is not None:
        message_list = [msg.strip() for msg in data.messages if msg and msg.strip()]
        if not message_list:
            raise HTTPException(status_code=400, detail="請至少輸入一則訊息內容")

        await db.execute(
            delete(AutoResponseMessage).where(
                AutoResponseMessage.response_id == auto_response.id
            )
        )
        for index, message_text in enumerate(message_list, start=1):
            db.add(
                AutoResponseMessage(
                    response_id=auto_response.id,
                    message_content=message_text,
                    sequence_order=index,
                )
            )

        # keep content in sync with第一則訊息（若未單獨提供 content）
        if data.content is None:
            auto_response.content = message_list[0]
        auto_response.response_count = len(message_list)

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
