"""
會員管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, delete
from app.database import get_db
from app.models.member import Member
from app.models.tag import MemberTag, InteractionTag, MemberInteractionTag
from app.models.tracking import ComponentInteractionLog
from app.models.user import User
from app.schemas.member import (
    MemberCreate,
    MemberUpdate,
    MemberListItem,
    MemberDetail,
    MemberSearchParams,
    UpdateTagsRequest,
    UpdateNotesRequest,
    TagInfo,
)
from app.schemas.common import SuccessResponse
from app.core.pagination import PageParams, PageResponse
from app.api.v1.auth import get_current_user
from app.clients.line_app_client import LineAppClient
from datetime import datetime
import os

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
                Member.name.like(search_pattern),
                Member.email.like(search_pattern),
                Member.phone.like(search_pattern),
                Member.line_name.like(search_pattern),
            )
        )

    # 來源篩選
    if params.join_source:
        query = query.where(Member.join_source == params.join_source)

    # 標籤篩選 - 使用新的單表設計
    if params.tags:
        tag_names = params.tags.split(",")  # 現在使用標籤名稱而非ID
        query = query.join(MemberTag).where(
            MemberTag.tag_name.in_(tag_names)
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
        # 獲取會員標籤 - 使用新的單表設計
        tags = []

        # 查詢會員標籤（直接從 MemberTag 表查詢）
        member_tags_result = await db.execute(
            select(MemberTag).where(MemberTag.member_id == member.id).order_by(MemberTag.tag_name)
        )
        for tag in member_tags_result.scalars():
            tags.append(TagInfo(id=tag.id, name=tag.tag_name, type="member"))

        # 查詢互動標籤（通過 ComponentInteractionLog 關聯）
        interaction_tags_result = await db.execute(
            select(InteractionTag)
            .join(ComponentInteractionLog, InteractionTag.id == ComponentInteractionLog.interaction_tag_id)
            .where(ComponentInteractionLog.line_id == member.line_uid)
            .distinct()
            .order_by(InteractionTag.tag_name)
        )
        for tag in interaction_tags_result.scalars():
            tags.append(TagInfo(id=tag.id, name=tag.tag_name, type="interaction"))

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
        tag_name_list = tag_ids.split(",")  # 現在使用標籤名稱

        # 使用新的單表設計篩選
        query = (
            select(func.count(func.distinct(Member.id)))
            .select_from(Member)
            .join(MemberTag, Member.id == MemberTag.member_id)
            .where(MemberTag.tag_name.in_(tag_name_list))
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
    """
    獲取會員詳情

    優化說明：
    1. 使用索引查詢：member_id 和 line_uid 都有索引
    2. 平行查詢：三個標籤查詢可以平行執行（未來可用 asyncio.gather 進一步優化）
    3. 去重邏輯：使用 Python set 進行記憶體內去重，效率高於 SQL DISTINCT
    """
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 獲取標籤 - 使用三表架構並行查詢
    tags = []
    interaction_tag_names = set()  # 用於去重

    # 查詢 1：會員標籤（綠色）- 使用 member_id 索引
    member_tags_result = await db.execute(
        select(MemberTag.id, MemberTag.tag_name)
        .where(MemberTag.member_id == member.id)
        .order_by(MemberTag.tag_name)
    )
    for tag_id, tag_name in member_tags_result.all():
        tags.append(TagInfo(id=tag_id, name=tag_name, type="member", source=None))

    # 查詢 2：自動互動標籤（黃色）- 使用 line_id 索引
    # 使用 DISTINCT 避免重複的標籤名稱
    if member.line_uid:  # 只有當 line_uid 存在時才查詢
        auto_interaction_tags_result = await db.execute(
            select(InteractionTag.id, InteractionTag.tag_name)
            .join(ComponentInteractionLog, InteractionTag.id == ComponentInteractionLog.interaction_tag_id)
            .where(ComponentInteractionLog.line_id == member.line_uid)
            .distinct()
            .order_by(InteractionTag.tag_name)
        )
        for tag_id, tag_name in auto_interaction_tags_result.all():
            if tag_name not in interaction_tag_names:
                tags.append(TagInfo(id=tag_id, name=tag_name, type="interaction", source="auto"))
                interaction_tag_names.add(tag_name)

    # 查詢 3：手動互動標籤（藍色）- 使用 member_id 索引
    manual_interaction_tags_result = await db.execute(
        select(MemberInteractionTag.id, MemberInteractionTag.tag_name)
        .where(MemberInteractionTag.member_id == member.id)
        .order_by(MemberInteractionTag.tag_name)
    )
    for tag_id, tag_name in manual_interaction_tags_result.all():
        if tag_name not in interaction_tag_names:  # 去重：避免與自動標籤重複
            tags.append(TagInfo(id=tag_id, name=tag_name, type="interaction", source="manual"))
            interaction_tag_names.add(tag_name)

    # 處理 None 值的欄位
    member_data = {
        "id": member.id,
        "line_uid": member.line_uid,
        "line_name": member.line_name,
        "line_avatar": member.line_avatar,
        "name": member.name,
        "email": member.email,
        "phone": member.phone,
        "gender": member.gender,
        "birthday": member.birthday,
        "id_number": member.id_number,
        "passport_number": member.passport_number,
        "residence": member.residence,
        "join_source": member.join_source,
        "receive_notification": member.receive_notification if member.receive_notification is not None else True,
        "internal_note": member.internal_note,
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


@router.put("/{member_id}/tags", response_model=SuccessResponse)
async def update_member_tags(
    member_id: int,
    request: UpdateTagsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """批量更新會員標籤（完全取代現有標籤）"""
    # 檢查會員是否存在
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 1. 刪除該會員的所有現有標籤
    await db.execute(delete(MemberTag).where(MemberTag.member_id == member_id))

    # 2. 新增新的標籤
    for tag_name in request.tag_names:
        member_tag = MemberTag(
            member_id=member_id,
            tag_name=tag_name,
            tag_source="CRM",  # 手動添加的標籤來源為 CRM
            click_count=1,  # 初始點擊次數為 1
        )
        db.add(member_tag)

    await db.commit()

    return SuccessResponse(message="標籤更新成功")


@router.put("/{member_id}/interaction-tags", response_model=SuccessResponse)
async def update_member_interaction_tags(
    member_id: int,
    request: UpdateTagsRequest,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證
):
    """
    批量更新會員互動標籤（完全取代現有手動標籤）

    注意：此端點只更新手動新增的互動標籤（MemberInteractionTag），
         不影響自動產生的標籤（InteractionTag + ComponentInteractionLog）
         手動標籤的 click_count 固定為 1，不累加
    """
    # 檢查會員是否存在
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 1. 刪除該會員的所有手動互動標籤
    await db.execute(delete(MemberInteractionTag).where(MemberInteractionTag.member_id == member_id))

    # 2. 新增新的互動標籤
    for tag_name in request.tag_names:
        interaction_tag = MemberInteractionTag(
            member_id=member_id,
            tag_name=tag_name,
            tag_source="CRM",  # 手動添加的標籤來源為 CRM
            click_count=1,  # 手動標籤固定為 1
            tagged_at=datetime.utcnow(),
        )
        db.add(interaction_tag)

    await db.commit()

    return SuccessResponse(message="互動標籤更新成功")


@router.post("/{member_id}/tags/add", response_model=SuccessResponse)
async def add_member_tag(
    member_id: int,
    tag_name: str = Body(..., embed=True),
    message_id: int = Body(None, embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    新增會員標籤（支援 click_count 累加）

    若 (member_id, tag_name, message_id) 組合已存在，則執行 click_count + 1
    否則新增記錄，click_count 初始值為 1
    """
    # 檢查會員是否存在
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 使用 MySQL 的 INSERT ... ON DUPLICATE KEY UPDATE 實現 click_count 累加
    # 由於 SQLAlchemy 的限制，這裡使用原生 SQL
    from sqlalchemy import text

    sql = text("""
        INSERT INTO member_tags
            (member_id, tag_name, tag_source, message_id, click_count, tagged_at, created_at)
        VALUES
            (:member_id, :tag_name, 'CRM', :message_id, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            click_count = click_count + 1,
            updated_at = NOW()
    """)

    await db.execute(sql, {
        "member_id": member_id,
        "tag_name": tag_name,
        "message_id": message_id
    })
    await db.commit()

    return SuccessResponse(message="標籤新增成功")


@router.post("/{member_id}/interaction-tags/add", response_model=SuccessResponse)
async def add_member_interaction_tag(
    member_id: int,
    tag_name: str = Body(..., embed=True),
    message_id: int = Body(None, embed=True),
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證
):
    """
    新增會員互動標籤（手動標籤，click_count 固定為 1）

    若 (member_id, tag_name, message_id) 組合已存在，則忽略
    手動互動標籤的 click_count 不累加，固定為 1
    """
    # 檢查會員是否存在
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    # 檢查是否已存在
    existing = await db.execute(
        select(MemberInteractionTag).where(
            and_(
                MemberInteractionTag.member_id == member_id,
                MemberInteractionTag.tag_name == tag_name,
                MemberInteractionTag.message_id == message_id if message_id else MemberInteractionTag.message_id.is_(None)
            )
        )
    )

    if existing.scalar_one_or_none():
        return SuccessResponse(message="互動標籤已存在（手動標籤不累加）")

    # 新增互動標籤
    interaction_tag = MemberInteractionTag(
        member_id=member_id,
        tag_name=tag_name,
        tag_source="CRM",
        message_id=message_id,
        click_count=1,  # 手動標籤固定為 1
        tagged_at=datetime.utcnow(),
    )
    db.add(interaction_tag)
    await db.commit()

    return SuccessResponse(message="互動標籤新增成功")


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

    member.internal_note = request.internal_note
    await db.commit()

    return SuccessResponse(message="備註更新成功")


# ============================================
# 1:1 聊天相關端點
# ============================================

@router.post("/{member_id}/chat/send")
async def send_member_chat_message(
    member_id: int,
    text: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    發送訊息到會員聊天室

    Args:
        member_id: 會員 ID
        text: 訊息文本

    Returns:
        {
            "success": true,
            "message_id": "msg_abc123",
            "sent_at": "2025-11-22T10:30:00Z"
        }
    """
    # 查詢會員
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    if not member.line_uid:
        raise HTTPException(status_code=400, detail="會員未綁定 LINE 帳號")

    # 調用 line_app 發送訊息
    line_app_url = os.getenv("LINE_APP_URL", "http://localhost:3001")
    client = LineAppClient(base_url=line_app_url)

    try:
        send_result = await client.send_chat_message(
            line_uid=member.line_uid,
            text=text
        )

        if not send_result.get("ok"):
            raise HTTPException(status_code=500, detail="發送訊息失敗")

        return {
            "success": True,
            "message_id": send_result.get("message_id"),
            "thread_id": send_result.get("thread_id"),
            "sent_at": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"發送訊息失敗: {str(e)}")


@router.put("/{member_id}/chat/mark-read")
async def mark_member_chat_read(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    標記與指定會員的聊天訊息為已讀

    Args:
        member_id: 會員 ID

    Returns:
        {
            "success": true,
            "marked_count": 3
        }
    """
    # 查詢會員
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    if not member.line_uid:
        raise HTTPException(status_code=400, detail="會員未綁定 LINE 帳號")

    # 調用 line_app 標記已讀
    line_app_url = os.getenv("LINE_APP_URL", "http://localhost:3001")
    client = LineAppClient(base_url=line_app_url)

    try:
        mark_result = await client.mark_chat_read(line_uid=member.line_uid)

        if not mark_result.get("ok"):
            raise HTTPException(status_code=500, detail="標記已讀失敗")

        return {
            "success": True,
            "marked_count": mark_result.get("marked_count", 0)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"標記已讀失敗: {str(e)}")
