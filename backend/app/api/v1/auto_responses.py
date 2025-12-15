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
    channels: Optional[List[str]] = None  # 支持的渠道列表
    channel_id: Optional[str] = None  # 渠道ID（LINE channel ID 或 FB page ID）
    force_activate: bool = False  # 強制啟用（確認切換時使用）


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
    channels: Optional[List[str]] = None  # 支持的渠道列表
    channel_id: Optional[str] = None  # 渠道ID（LINE channel ID 或 FB page ID）
    force_activate: bool = False  # 強制啟用（確認切換時使用）


def _serialize_keywords(keyword_relations: Sequence[AutoResponseKeyword]) -> List[Dict[str, Any]]:
    return [
        {
            "id": kw.id,
            "keyword": kw.keyword,
            "name": kw.keyword,
            "type": "keyword",
            "match_type": kw.match_type,
            "is_enabled": kw.is_enabled,
            "is_duplicate": kw.is_duplicate or False,
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


def _validate_channels(channels: Optional[List[str]]) -> Optional[List[str]]:
    """驗證渠道列表"""
    if not channels:
        return None
    allowed_channels = {'LINE', 'Facebook'}
    invalid = [ch for ch in channels if ch not in allowed_channels]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"無效的渠道: {', '.join(invalid)}。允許的渠道: LINE, Facebook"
        )
    # 去重
    return list(set(channels))


async def _check_welcome_conflict(
    db: AsyncSession,
    channel_id: Optional[str],
    exclude_id: Optional[int] = None
) -> Optional[AutoResponse]:
    """檢查歡迎訊息衝突（同一 channel_id 只能有一個啟用的歡迎訊息）"""
    query = select(AutoResponse).where(
        AutoResponse.trigger_type == TriggerType.WELCOME.value,
        AutoResponse.is_active == True,
    )
    # 按 channel_id 篩選（帳號級別）
    if channel_id:
        query = query.where(AutoResponse.channel_id == channel_id)
    else:
        query = query.where(AutoResponse.channel_id.is_(None))

    if exclude_id:
        query = query.where(AutoResponse.id != exclude_id)

    result = await db.execute(query)
    return result.scalar_one_or_none()


def _check_date_overlap(
    start1: Optional[date], end1: Optional[date],
    start2: Optional[date], end2: Optional[date]
) -> bool:
    """檢查兩個日期區間是否重疊"""
    # 如果任一區間沒有設定，視為不重疊
    if not start1 or not end1 or not start2 or not end2:
        return False
    return start1 <= end2 and start2 <= end1


async def _check_always_date_overlap(
    db: AsyncSession,
    channel_id: Optional[str],
    date_start: Optional[date],
    date_end: Optional[date],
    exclude_id: Optional[int] = None
) -> Optional[AutoResponse]:
    """檢查一律回應日期區間衝突"""
    if not date_start or not date_end:
        return None

    query = select(AutoResponse).where(
        AutoResponse.trigger_type == TriggerType.FOLLOW.value,
        AutoResponse.is_active == True,
        AutoResponse.date_range_start.isnot(None),
        AutoResponse.date_range_end.isnot(None),
    )
    # 按 channel_id 篩選
    if channel_id:
        query = query.where(AutoResponse.channel_id == channel_id)
    else:
        query = query.where(AutoResponse.channel_id.is_(None))

    if exclude_id:
        query = query.where(AutoResponse.id != exclude_id)

    result = await db.execute(query)
    existing_responses = result.scalars().all()

    for ar in existing_responses:
        if _check_date_overlap(date_start, date_end, ar.date_range_start, ar.date_range_end):
            return ar
    return None


async def _deactivate_conflicting(
    db: AsyncSession,
    trigger_type: str,
    channel_id: Optional[str],
    exclude_id: int
) -> None:
    """停用衝突的自動回應"""
    query = select(AutoResponse).where(
        AutoResponse.trigger_type == trigger_type,
        AutoResponse.is_active == True,
        AutoResponse.id != exclude_id,
    )
    if channel_id:
        query = query.where(AutoResponse.channel_id == channel_id)
    else:
        query = query.where(AutoResponse.channel_id.is_(None))

    result = await db.execute(query)
    conflicting = result.scalars().all()
    for ar in conflicting:
        ar.is_active = False


async def _detect_and_mark_duplicate_keywords(db: AsyncSession) -> None:
    """
    檢測並標記重複的關鍵字。
    規則：當多個啟用的自動回應包含相同關鍵字時，只有最新建立的版本有效，其他標記為重複。
    """
    # 獲取所有啟用的關鍵字類型自動回應的關鍵字
    query = (
        select(AutoResponseKeyword)
        .join(AutoResponse)
        .where(
            AutoResponse.trigger_type == TriggerType.KEYWORD.value,
            AutoResponse.is_active == True,
        )
        .options(selectinload(AutoResponseKeyword.auto_response))
    )
    result = await db.execute(query)
    all_keywords = result.scalars().all()

    # 按關鍵字分組
    keyword_groups: Dict[str, List[AutoResponseKeyword]] = {}
    for kw in all_keywords:
        key = kw.keyword.lower().strip()
        if key not in keyword_groups:
            keyword_groups[key] = []
        keyword_groups[key].append(kw)

    # 標記重複（保留最新的版本）
    for keyword, kw_list in keyword_groups.items():
        if len(kw_list) <= 1:
            # 沒有重複
            for kw in kw_list:
                kw.is_duplicate = False
        else:
            # 按 auto_response 的 created_at 排序，最新的在前
            sorted_kws = sorted(
                kw_list,
                key=lambda x: x.auto_response.created_at if x.auto_response and x.auto_response.created_at else x.created_at,
                reverse=True
            )
            # 最新的不是重複，其他都是重複
            for i, kw in enumerate(sorted_kws):
                kw.is_duplicate = i > 0


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
                "channels": ar.channels,
                "channel_id": ar.channel_id,
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
            "channels": auto_response.channels,
            "channel_id": auto_response.channel_id,
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
    channels = _validate_channels(data.channels)

    # 歡迎訊息衝突檢查（同一 channel_id 只能有一個啟用）
    if data.trigger_type == TriggerType.WELCOME and data.is_active:
        existing_welcome = await _check_welcome_conflict(db, data.channel_id)
        if existing_welcome and not data.force_activate:
            return SuccessResponse(
                data={
                    "conflict": True,
                    "conflict_type": "welcome",
                    "existing_id": existing_welcome.id,
                    "existing_name": existing_welcome.name,
                },
                message="系統目前已啟用中的歡迎訊息，是否切換至新的設定？"
            )
        elif existing_welcome and data.force_activate:
            # 停用舊的歡迎訊息
            existing_welcome.is_active = False

    # 一律回應日期區間衝突檢查
    if data.trigger_type == TriggerType.FOLLOW and data.is_active:
        overlapping = await _check_always_date_overlap(
            db, data.channel_id, data.date_range_start, data.date_range_end
        )
        if overlapping and not data.force_activate:
            return SuccessResponse(
                data={
                    "conflict": True,
                    "conflict_type": "always_date_overlap",
                    "existing_id": overlapping.id,
                    "existing_name": overlapping.name,
                    "existing_date_range": f"{overlapping.date_range_start} ~ {overlapping.date_range_end}",
                },
                message="與現有一律回應的日期區間重疊，是否切換至新的設定？"
            )
        elif overlapping and data.force_activate:
            # 停用重疊的一律回應
            overlapping.is_active = False

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
        channels=channels,
        channel_id=data.channel_id,
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

    # 如果是關鍵字類型，重新檢測重複關鍵字
    if data.trigger_type == TriggerType.KEYWORD:
        await _detect_and_mark_duplicate_keywords(db)
        await db.commit()

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

    # 確定最終的 trigger_type, is_active, channel_id, date_range
    final_trigger_type = data.trigger_type if data.trigger_type is not None else auto_response.trigger_type
    final_is_active = data.is_active if data.is_active is not None else auto_response.is_active
    final_channel_id = data.channel_id if data.channel_id is not None else auto_response.channel_id
    final_date_start = data.date_range_start if data.date_range_start is not None else auto_response.date_range_start
    final_date_end = data.date_range_end if data.date_range_end is not None else auto_response.date_range_end

    # 歡迎訊息衝突檢查（編輯現有歡迎訊息視為新版本）
    if final_trigger_type == TriggerType.WELCOME.value and final_is_active:
        existing_welcome = await _check_welcome_conflict(db, final_channel_id, exclude_id=auto_response_id)
        if existing_welcome and not data.force_activate:
            return SuccessResponse(
                data={
                    "conflict": True,
                    "conflict_type": "welcome",
                    "existing_id": existing_welcome.id,
                    "existing_name": existing_welcome.name,
                },
                message="系統目前已啟用中的歡迎訊息，是否切換至新的設定？"
            )
        elif existing_welcome and data.force_activate:
            existing_welcome.is_active = False

    # 一律回應日期區間衝突檢查
    if final_trigger_type == TriggerType.FOLLOW.value and final_is_active:
        overlapping = await _check_always_date_overlap(
            db, final_channel_id, final_date_start, final_date_end, exclude_id=auto_response_id
        )
        if overlapping and not data.force_activate:
            return SuccessResponse(
                data={
                    "conflict": True,
                    "conflict_type": "always_date_overlap",
                    "existing_id": overlapping.id,
                    "existing_name": overlapping.name,
                    "existing_date_range": f"{overlapping.date_range_start} ~ {overlapping.date_range_end}",
                },
                message="與現有一律回應的日期區間重疊，是否切換至新的設定？"
            )
        elif overlapping and data.force_activate:
            overlapping.is_active = False

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
    if data.channel_id is not None:
        auto_response.channel_id = data.channel_id
    if data.channels is not None:
        auto_response.channels = _validate_channels(data.channels)

    # 更新版本號
    auto_response.version = (auto_response.version or 1) + 1

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

    # 如果是關鍵字類型或有更新關鍵字，重新檢測重複關鍵字
    if final_trigger_type == TriggerType.KEYWORD.value or data.keywords is not None:
        await _detect_and_mark_duplicate_keywords(db)
        await db.commit()

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

    is_keyword_type = auto_response.trigger_type == TriggerType.KEYWORD.value

    await db.delete(auto_response)
    await db.commit()

    # 刪除關鍵字類型後重新檢測重複關鍵字
    if is_keyword_type:
        await _detect_and_mark_duplicate_keywords(db)
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

    # 關鍵字類型切換狀態後重新檢測重複關鍵字
    if auto_response.trigger_type == TriggerType.KEYWORD.value:
        await _detect_and_mark_duplicate_keywords(db)
        await db.commit()

    return SuccessResponse(message="狀態更新成功")
