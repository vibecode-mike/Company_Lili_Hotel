"""
標籤管理 API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.tag import MemberTag, InteractionTag, TagType, TagSource
from app.models.tag_trigger_log import TagTriggerLog
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.core.pagination import PageParams, PageResponse
from app.api.v1.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class TagCreate(BaseModel):
    tag_name: str
    type: TagType
    tag_source: TagSource


class TagUpdate(BaseModel):
    tag_name: Optional[str] = None
    tag_source: Optional[str] = None


@router.get("", response_model=SuccessResponse)
async def get_tags(
    type: Optional[TagType] = None,
    source: Optional[TagSource] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,  # trigger_count, last_triggered_at, created_at
    sort_order: Optional[str] = "desc",  # asc, desc
    page_params: PageParams = Depends(),
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證，開發階段使用
):
    """獲取標籤列表"""
    if type == TagType.MEMBER or type is None:
        query = select(MemberTag)
        if search:
            query = query.where(MemberTag.tag_name.like(f"%{search}%"))
        if source:
            query = query.where(MemberTag.tag_source == source)

        # 排序
        if sort_by == "member_count":
            order_col = MemberTag.trigger_member_count
        elif sort_by == "last_triggered_at":
            order_col = MemberTag.last_triggered_at
        else:
            order_col = MemberTag.created_at

        if sort_order == "asc":
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        query = query.offset(page_params.offset).limit(page_params.limit)
        result = await db.execute(query)
        tags = result.scalars().all()

        items = [
            {
                "id": t.id,
                "tag_name": t.tag_name,
                "type": "member",
                "tag_source": t.tag_source,
                "trigger_member_count": t.trigger_member_count or 0,
                "last_triggered_at": t.last_triggered_at.isoformat() if t.last_triggered_at else None,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tags
        ]
    else:
        query = select(InteractionTag)
        if search:
            query = query.where(InteractionTag.tag_name.like(f"%{search}%"))

        # 排序
        if sort_by == "trigger_count":
            order_col = InteractionTag.trigger_count
        elif sort_by == "member_count":
            order_col = InteractionTag.trigger_member_count
        elif sort_by == "last_triggered_at":
            order_col = InteractionTag.last_triggered_at
        else:
            order_col = InteractionTag.created_at

        if sort_order == "asc":
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        query = query.offset(page_params.offset).limit(page_params.limit)
        result = await db.execute(query)
        tags = result.scalars().all()

        items = [
            {
                "id": t.id,
                "tag_name": t.tag_name,
                "type": "interaction",
                "trigger_count": t.trigger_count or 0,
                "trigger_member_count": t.trigger_member_count or 0,
                "last_triggered_at": t.last_triggered_at.isoformat() if t.last_triggered_at else None,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tags
        ]

    page_response = PageResponse.create(
        items=items, total=total, page=page_params.page, page_size=page_params.page_size
    )

    return SuccessResponse(data=page_response.model_dump())


@router.get("/available-options", response_model=SuccessResponse)
async def get_available_tag_options(
    db: AsyncSession = Depends(get_db),
):
    """
    獲取標籤編輯器的可用標籤選項

    返回所有資料庫中出現過的不重複標籤名稱，
    用於標籤編輯器的選項池
    """
    # 查詢會員標籤 - 獲取所有不重複的標籤名稱
    member_tags_query = select(MemberTag.tag_name).distinct().order_by(MemberTag.tag_name)
    member_result = await db.execute(member_tags_query)
    member_tag_names = [row[0] for row in member_result.all()]

    # 查詢互動標籤 - 獲取所有不重複的標籤名稱
    interaction_tags_query = (
        select(InteractionTag.tag_name).distinct().order_by(InteractionTag.tag_name)
    )
    interaction_result = await db.execute(interaction_tags_query)
    interaction_tag_names = [row[0] for row in interaction_result.all()]

    return SuccessResponse(
        data={
            "memberTags": member_tag_names,
            "interactionTags": interaction_tag_names,
        }
    )


@router.post("", response_model=SuccessResponse)
async def create_tag(
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """新增標籤"""
    # 驗證標籤名稱長度
    if len(tag_data.tag_name) > 20:
        raise HTTPException(status_code=400, detail="標籤名稱不得超過 20 個字")

    # 檢查標籤是否已存在
    if tag_data.type == TagType.MEMBER:
        existing = await db.execute(
            select(MemberTag).where(MemberTag.tag_name == tag_data.tag_name)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="標籤名稱已存在")
        tag = MemberTag(**tag_data.model_dump(exclude={'type'}))
    else:
        existing = await db.execute(
            select(InteractionTag).where(InteractionTag.tag_name == tag_data.tag_name)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="標籤名稱已存在")
        tag = InteractionTag(**tag_data.model_dump(exclude={'type'}))

    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return SuccessResponse(data={"id": tag.id, "tag_name": tag.tag_name, "type": tag_data.type.value})


@router.put("/{tag_id}", response_model=SuccessResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    tag_type: TagType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新標籤"""
    # 驗證標籤名稱長度
    if tag_data.tag_name and len(tag_data.tag_name) > 20:
        raise HTTPException(status_code=400, detail="標籤名稱不得超過 20 個字")

    if tag_type == TagType.MEMBER:
        result = await db.execute(select(MemberTag).where(MemberTag.id == tag_id))
        tag = result.scalar_one_or_none()
        if not tag:
            raise HTTPException(status_code=404, detail="標籤不存在")

        # 檢查名稱是否與其他標籤重複
        if tag_data.tag_name and tag_data.tag_name != tag.tag_name:
            existing = await db.execute(
                select(MemberTag).where(MemberTag.tag_name == tag_data.tag_name)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="標籤名稱已存在")
    else:
        result = await db.execute(select(InteractionTag).where(InteractionTag.id == tag_id))
        tag = result.scalar_one_or_none()
        if not tag:
            raise HTTPException(status_code=404, detail="標籤不存在")

        # 檢查名稱是否與其他標籤重複
        if tag_data.tag_name and tag_data.tag_name != tag.tag_name:
            existing = await db.execute(
                select(InteractionTag).where(InteractionTag.tag_name == tag_data.tag_name)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="標籤名稱已存在")

    for field, value in tag_data.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)

    await db.commit()
    return SuccessResponse(message="標籤更新成功")


@router.delete("/{tag_id}", response_model=SuccessResponse)
async def delete_tag(
    tag_id: int,
    tag_type: TagType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """刪除標籤"""
    if tag_type == TagType.MEMBER:
        result = await db.execute(select(MemberTag).where(MemberTag.id == tag_id))
    else:
        result = await db.execute(select(InteractionTag).where(InteractionTag.id == tag_id))

    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="標籤不存在")

    await db.delete(tag)
    await db.commit()

    return SuccessResponse(message="標籤刪除成功")


@router.get("/statistics", response_model=SuccessResponse)
async def get_tag_statistics(
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    """獲取標籤統計資訊"""
    # 獲取標籤數量
    member_tags_count_result = await db.execute(select(func.count()).select_from(MemberTag))
    member_tags_count = member_tags_count_result.scalar()

    interaction_tags_count_result = await db.execute(select(func.count()).select_from(InteractionTag))
    interaction_tags_count = interaction_tags_count_result.scalar()

    # 會員標籤最多使用
    most_used_member_tag_result = await db.execute(
        select(MemberTag)
        .where(MemberTag.trigger_member_count.isnot(None))
        .order_by(MemberTag.trigger_member_count.desc())
        .limit(1)
    )
    most_used_member_tag = most_used_member_tag_result.scalar_one_or_none()

    # 互動標籤最多觸發
    most_triggered_interaction_tag_result = await db.execute(
        select(InteractionTag)
        .where(InteractionTag.trigger_count.isnot(None))
        .order_by(InteractionTag.trigger_count.desc())
        .limit(1)
    )
    most_triggered_interaction_tag = most_triggered_interaction_tag_result.scalar_one_or_none()

    # 總會員標籤數
    total_member_tags_result = await db.execute(
        select(func.sum(MemberTag.trigger_member_count))
    )
    total_member_tags_sum = total_member_tags_result.scalar() or 0

    # 總互動標籤觸發次數
    total_interaction_triggers_result = await db.execute(
        select(func.sum(InteractionTag.trigger_count))
    )
    total_interaction_sum = total_interaction_triggers_result.scalar() or 0

    data = {
        "total_tags": member_tags_count + interaction_tags_count,
        "member_tags_count": member_tags_count,
        "interaction_tags_count": interaction_tags_count,
        "total_member_tagged": total_member_tags_sum,
        "total_interaction_triggers": total_interaction_sum,
        "most_used_member_tag": (
            {
                "id": most_used_member_tag.id,
                "tag_name": most_used_member_tag.tag_name,
                "trigger_member_count": most_used_member_tag.trigger_member_count or 0,
                "type": "member",
            }
            if most_used_member_tag
            else None
        ),
        "most_triggered_interaction_tag": (
            {
                "id": most_triggered_interaction_tag.id,
                "tag_name": most_triggered_interaction_tag.tag_name,
                "trigger_count": most_triggered_interaction_tag.trigger_count or 0,
                "type": "interaction",
            }
            if most_triggered_interaction_tag
            else None
        ),
    }

    return SuccessResponse(data=data)


@router.get("/{tag_id}/history", response_model=SuccessResponse)
async def get_tag_history(
    tag_id: int,
    tag_type: TagType,
    page_params: PageParams = Depends(),
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證，開發階段使用
):
    """獲取標籤觸發歷史記錄"""
    # 驗證標籤是否存在
    if tag_type == TagType.MEMBER:
        tag_result = await db.execute(select(MemberTag).where(MemberTag.id == tag_id))
        tag = tag_result.scalar_one_or_none()
    else:
        tag_result = await db.execute(select(InteractionTag).where(InteractionTag.id == tag_id))
        tag = tag_result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="標籤不存在")

    # 查詢觸發記錄（只有互動標籤有觸發記錄）
    if tag_type == TagType.INTERACTION:
        # 構建查詢
        query = (
            select(TagTriggerLog)
            .where(TagTriggerLog.tag_id == tag_id)
            .order_by(TagTriggerLog.triggered_at.desc())
        )

        # 計算總數
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 分頁查詢
        query = query.offset(page_params.offset).limit(page_params.limit)
        result = await db.execute(query)
        logs = result.scalars().all()

        # 組裝返回數據
        items = [
            {
                "id": log.id,
                "member_id": log.member_id,
                "campaign_id": log.campaign_id,
                "trigger_source": log.trigger_source,
                "triggered_at": log.triggered_at.isoformat() if log.triggered_at else None,
            }
            for log in logs
        ]
    else:
        # 會員標籤沒有觸發記錄，返回空列表
        total = 0
        items = []

    page_response = PageResponse.create(
        items=items, total=total, page=page_params.page, page_size=page_params.page_size
    )

    return SuccessResponse(data=page_response.model_dump())


@router.get("/trends", response_model=SuccessResponse)
async def get_tag_trends(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證，開發階段使用
):
    """獲取標籤觸發趨勢資料（用於圖表展示）

    從 TagTriggerLog 和 MemberTagRelation 表中統計實際資料。
    """
    from datetime import datetime, timedelta
    from sqlalchemy import and_, distinct

    # 獲取前10個最活躍的標籤（MySQL 不支持 NULLS LAST，使用 COALESCE 處理）
    member_tags_result = await db.execute(
        select(MemberTag)
        .order_by(func.coalesce(MemberTag.trigger_member_count, 0).desc())
        .limit(10)
    )
    member_tags = member_tags_result.scalars().all()

    interaction_tags_result = await db.execute(
        select(InteractionTag)
        .order_by(func.coalesce(InteractionTag.trigger_count, 0).desc())
        .limit(10)
    )
    interaction_tags = interaction_tags_result.scalars().all()

    # 合併所有標籤
    all_tags = []
    for tag in member_tags:
        all_tags.append({
            "id": tag.id,
            "tag_name": tag.tag_name,
            "type": "member",
        })
    for tag in interaction_tags:
        all_tags.append({
            "id": tag.id,
            "tag_name": tag.tag_name,
            "type": "interaction",
        })

    # 生成趨勢資料
    trends = []
    today = datetime.now().date()

    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime("%m/%d")

        # 設定日期範圍（當天00:00到23:59）
        date_start = datetime.combine(date, datetime.min.time())
        date_end = datetime.combine(date, datetime.max.time())

        trend_item = {"date": date_str}

        # 統計每個標籤的真實資料
        for tag in all_tags:
            if tag['type'] == 'interaction':
                # 互動標籤：統計觸發次數和不重複會員數
                trigger_count_result = await db.execute(
                    select(func.count())
                    .select_from(TagTriggerLog)
                    .where(
                        and_(
                            TagTriggerLog.tag_id == tag['id'],
                            TagTriggerLog.triggered_at >= date_start,
                            TagTriggerLog.triggered_at <= date_end
                        )
                    )
                )
                trigger_count = trigger_count_result.scalar() or 0

                member_count_result = await db.execute(
                    select(func.count(distinct(TagTriggerLog.member_id)))
                    .select_from(TagTriggerLog)
                    .where(
                        and_(
                            TagTriggerLog.tag_id == tag['id'],
                            TagTriggerLog.triggered_at >= date_start,
                            TagTriggerLog.triggered_at <= date_end
                        )
                    )
                )
                member_count = member_count_result.scalar() or 0

                trend_item[f"{tag['tag_name']}_trigger"] = trigger_count
                trend_item[f"{tag['tag_name']}_member"] = member_count
            else:
                # 會員標籤：統計當天新增的會員數（使用新的單表設計）
                member_count_result = await db.execute(
                    select(func.count())
                    .select_from(MemberTag)
                    .where(
                        and_(
                            MemberTag.tag_name == tag['tag_name'],
                            MemberTag.tagged_at >= date_start,
                            MemberTag.tagged_at <= date_end
                        )
                    )
                )
                member_count = member_count_result.scalar() or 0

                # 會員標籤沒有觸發次數概念，設為0
                trend_item[f"{tag['tag_name']}_trigger"] = 0
                trend_item[f"{tag['tag_name']}_member"] = member_count

        trends.append(trend_item)

    return SuccessResponse(data={
        "trends": trends,
        "tags": all_tags,
        "days": days
    })
