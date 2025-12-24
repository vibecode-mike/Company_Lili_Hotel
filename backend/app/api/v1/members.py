"""
會員管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, delete
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.member import Member
from app.models.tag import MemberTag, MemberInteractionTag
from app.models.user import User
from app.models.conversation import ConversationMessage
from app.models.line_channel import LineChannel
from app.schemas.member import (
    MemberCreate,
    MemberUpdate,
    MemberListItem,
    MemberDetail,
    MemberSearchParams,
    UpdateTagsRequest,
    UpdateNotesRequest,
    TagInfo,
    BatchUpdateTagsRequest,
)
from app.schemas.common import SuccessResponse
from app.core.pagination import PageParams, PageResponse, paginate_query
from app.api.v1.auth import get_current_user
from app.clients.line_app_client import LineAppClient
from app.clients.fb_message_client import FbMessageClient
from datetime import datetime, timezone
from typing import Optional
import os

from app.services.chatroom_service import ChatroomService
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

    # 搜索條件（已在 Schema 層驗證和清理）
    if params.search:
        # 使用 escape 參數防止 LIKE 通配符注入
        # params.search 已經過 InputValidator.sanitize_search_input() 驗證
        from app.utils.validators import InputValidator

        # 轉義 LIKE 特殊字符
        escaped_search = InputValidator.escape_like_pattern(params.search)
        search_pattern = f"%{escaped_search}%"

        query = query.where(
            or_(
                Member.name.like(search_pattern, escape='\\'),
                Member.email.like(search_pattern, escape='\\'),
                Member.phone.like(search_pattern, escape='\\'),
                Member.line_display_name.like(search_pattern, escape='\\'),
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

    # 預加載關聯數據（解決 N+1 查詢問題）
    query = query.options(
        selectinload(Member.member_tags),
        selectinload(Member.member_interaction_tags)
    )

    # 使用通用分頁函數
    members, total = await paginate_query(db, query, page_params)

    # 查詢 LINE channel_id（假設同一家只有一個 channel）
    channel_result = await db.execute(
        select(LineChannel.channel_id).where(LineChannel.is_active == True).limit(1)
    )
    channel_id = channel_result.scalar()

    # 批量查詢所有會員的最後聊天時間（避免 N+1）
    member_line_uids = [m.line_uid for m in members if m.line_uid]
    last_chat_times = {}

    if member_line_uids:
        # 使用子查詢找出每個 thread_id (line_uid) 的最新聊天時間
        # conversation_messages 的 thread_id = platform_uid (line_uid)
        subq = (
            select(
                ConversationMessage.thread_id,
                func.max(ConversationMessage.created_at).label('max_created_at')
            )
            .where(
                ConversationMessage.thread_id.in_(member_line_uids),
                ConversationMessage.platform == 'LINE'
            )
            .group_by(ConversationMessage.thread_id)
        ).subquery()

        chat_result = await db.execute(
            select(ConversationMessage.thread_id, ConversationMessage.created_at)
            .join(subq, and_(
                ConversationMessage.thread_id == subq.c.thread_id,
                ConversationMessage.created_at == subq.c.max_created_at
            ))
        )

        for thread_id, created_at in chat_result:
            last_chat_times[thread_id] = created_at

    # 組裝響應數據
    items = []
    for member in members:
        tags = []

        # 使用預加載的會員標籤（已經在內存中，無需額外查詢）
        for tag in sorted(member.member_tags, key=lambda t: t.tag_name):
            tags.append(TagInfo(id=tag.id, name=tag.tag_name, type="member"))

        # 使用預加載的互動標籤（已經在內存中，無需額外查詢）
        for tag in sorted(
            member.member_interaction_tags,
            key=lambda t: (-t.click_count, t.tag_name)
        ):
            tags.append(TagInfo(id=tag.id, name=tag.tag_name, type="interaction"))

        member_dict = MemberListItem.model_validate(member).model_dump()
        member_dict["tags"] = tags

        # 添加 channel_id
        member_dict["channel_id"] = channel_id

        # 使用批量查詢的聊天時間（無需額外查詢）
        if member.line_uid and member.line_uid in last_chat_times:
            member_dict["last_interaction_at"] = last_chat_times[member.line_uid]

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

    # 查詢 LINE channel_id（所有會員使用同一個 LINE channel）
    from app.models.line_channel import LineChannel
    channel_result = await db.execute(
        select(LineChannel.channel_id)
        .where(LineChannel.is_active == True)
        .limit(1)
    )
    channel_id = channel_result.scalar()

    # 獲取標籤 - 簡化為兩表查詢
    tags = []

    # 查詢 1：會員標籤 - 使用 member_id 索引
    member_tags_result = await db.execute(
        select(MemberTag.id, MemberTag.tag_name)
        .where(MemberTag.member_id == member.id)
        .order_by(MemberTag.tag_name)
    )
    for tag_id, tag_name in member_tags_result.all():
        tags.append(TagInfo(id=tag_id, name=tag_name, type="member"))

    # 查詢 2：互動標籤 - 統一從 MemberInteractionTag 表查詢（自動+手動）
    # 按 click_count 降序排列，讓高互動的標籤排在前面
    interaction_tags_result = await db.execute(
        select(MemberInteractionTag.id, MemberInteractionTag.tag_name)
        .where(MemberInteractionTag.member_id == member.id)
        .order_by(MemberInteractionTag.click_count.desc(), MemberInteractionTag.tag_name)
    )
    for tag_id, tag_name in interaction_tags_result.all():
        tags.append(TagInfo(id=tag_id, name=tag_name, type="interaction"))

    # 查詢該會員最後一條聊天訊息的時間
    # 使用 conversation_messages，thread_id = platform_uid (line_uid)
    last_chat_time = member.last_interaction_at
    if member.line_uid:
        last_chat_result = await db.execute(
            select(ConversationMessage.created_at)
            .where(
                ConversationMessage.thread_id == member.line_uid,
                ConversationMessage.platform == 'LINE'
            )
            .order_by(ConversationMessage.created_at.desc())
            .limit(1)
        )
        last_chat_row = last_chat_result.scalar()
        if last_chat_row:
            last_chat_time = last_chat_row

    # 處理 None 值的欄位
    member_data = {
        "id": member.id,
        "line_uid": member.line_uid,
        "line_display_name": member.line_display_name,
        "line_avatar": member.line_avatar,
        "channel_id": channel_id,
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
        "last_interaction_at": last_chat_time,
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

    # 添加調試日誌
    update_data = member_data.model_dump(exclude_unset=True)
    print(f"🔍 [Update Member] member_id={member_id}, user={current_user.username}")
    print(f"🔍 [Update Member] Received data: {update_data}")
    print(f"🔍 [Update Member] Current gpt_enabled: {member.gpt_enabled}")

    # 更新欄位
    for field, value in update_data.items():
        print(f"🔍 [Update Member] Setting {field} = {value}")
        setattr(member, field, value)

    print(f"🔍 [Update Member] After update gpt_enabled: {member.gpt_enabled}")

    await db.commit()
    await db.refresh(member)

    print(f"🔍 [Update Member] After commit gpt_enabled: {member.gpt_enabled}")
    print(f"✅ [Update Member] Successfully updated member {member_id}")

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
    批量更新會員互動標籤（完全取代現有標籤）

    注意：此端點會刪除並重建所有互動標籤（MemberInteractionTag），
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
            tagged_at=datetime.now(timezone.utc),
        )
        db.add(interaction_tag)

    await db.commit()

    return SuccessResponse(message="互動標籤更新成功")


@router.post("/{member_id}/tags/batch-update", response_model=SuccessResponse)
async def batch_update_member_tags(
    member_id: int,
    request: BatchUpdateTagsRequest,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 暫時移除認證
):
    """
    批量更新會員標籤（原子操作，保留 click_count）

    UPSERT 邏輯：
    - 新標籤：INSERT with click_count=1
    - 現有標籤：保留（不修改 click_count）
    - 刪除的標籤：DELETE

    特點：
    1. 單一原子操作（事務保護）
    2. 保留 click_count 數據
    3. 支援 message_id 去重機制
    """
    # 驗證會員存在
    result = await db.execute(select(Member).where(Member.id == member_id))
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="會員不存在")

    try:
        # === 處理會員標籤 (MemberTag) ===

        # 1. 獲取當前標籤
        current_member_tags_result = await db.execute(
            select(MemberTag.tag_name, MemberTag.message_id)
            .where(MemberTag.member_id == member_id)
        )
        current_member_tags = {
            (row[0], row[1]) for row in current_member_tags_result.all()
        }

        # 2. 刪除不再需要的標籤（只刪除不在新列表中的標籤）
        tags_to_delete = [
            (tag_name, message_id)
            for tag_name, message_id in current_member_tags
            if tag_name not in request.member_tags
        ]

        if tags_to_delete:
            for tag_name, message_id in tags_to_delete:
                if message_id is not None:
                    await db.execute(
                        delete(MemberTag).where(
                            and_(
                                MemberTag.member_id == member_id,
                                MemberTag.tag_name == tag_name,
                                MemberTag.message_id == message_id
                            )
                        )
                    )
                else:
                    await db.execute(
                        delete(MemberTag).where(
                            and_(
                                MemberTag.member_id == member_id,
                                MemberTag.tag_name == tag_name,
                                MemberTag.message_id.is_(None)
                            )
                        )
                    )

        # 3. UPSERT 新標籤（保留 click_count）
        # 由於 message_id 可以是 NULL，唯一約束不會生效，所以需要先檢查是否存在
        member_tags_updated = 0
        existing_tag_names = {tag_name for tag_name, _ in current_member_tags}

        for tag_name in request.member_tags:
            if tag_name not in existing_tag_names:
                # 只有標籤不存在時才插入
                new_tag = MemberTag(
                    member_id=member_id,
                    tag_name=tag_name,
                    tag_source="會員資訊表",
                    message_id=None,
                    click_count=1,
                    tagged_at=datetime.now(timezone.utc),
                )
                db.add(new_tag)
                member_tags_updated += 1
            else:
                # 標籤已存在，計入更新數
                member_tags_updated += 1

        # === 處理互動標籤 (MemberInteractionTag) ===

        # 1. 獲取當前標籤
        current_interaction_tags_result = await db.execute(
            select(MemberInteractionTag.tag_name, MemberInteractionTag.message_id)
            .where(MemberInteractionTag.member_id == member_id)
        )
        current_interaction_tags = {
            (row[0], row[1]) for row in current_interaction_tags_result.all()
        }

        # 2. 刪除不再需要的標籤
        interaction_tags_to_delete = [
            (tag_name, message_id)
            for tag_name, message_id in current_interaction_tags
            if tag_name not in request.interaction_tags
        ]

        if interaction_tags_to_delete:
            for tag_name, message_id in interaction_tags_to_delete:
                if message_id is not None:
                    await db.execute(
                        delete(MemberInteractionTag).where(
                            and_(
                                MemberInteractionTag.member_id == member_id,
                                MemberInteractionTag.tag_name == tag_name,
                                MemberInteractionTag.message_id == message_id
                            )
                        )
                    )
                else:
                    await db.execute(
                        delete(MemberInteractionTag).where(
                            and_(
                                MemberInteractionTag.member_id == member_id,
                                MemberInteractionTag.tag_name == tag_name,
                                MemberInteractionTag.message_id.is_(None)
                            )
                        )
                    )

        # 3. UPSERT 新標籤
        # 由於 message_id 可以是 NULL，唯一約束不會生效，所以需要先檢查是否存在
        interaction_tags_updated = 0
        existing_interaction_tag_names = {tag_name for tag_name, _ in current_interaction_tags}

        for tag_name in request.interaction_tags:
            if tag_name not in existing_interaction_tag_names:
                # 只有標籤不存在時才插入
                new_tag = MemberInteractionTag(
                    member_id=member_id,
                    tag_name=tag_name,
                    tag_source="會員資訊表",
                    message_id=None,
                    click_count=1,
                    tagged_at=datetime.now(timezone.utc),
                )
                db.add(new_tag)
                interaction_tags_updated += 1
            else:
                # 標籤已存在，計入更新數
                interaction_tags_updated += 1

        # 提交事務
        await db.commit()

        return SuccessResponse(
            message="標籤更新成功",
            data={
                "updated_member_tags": member_tags_updated,
                "updated_interaction_tags": interaction_tags_updated
            }
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"標籤更新失敗: {str(e)}"
        )


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
        tagged_at=datetime.now(timezone.utc),
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
    platform: str = Body("LINE", embed=True, description="渠道：LINE/Facebook/Webchat"),
    meta_jwt_token: Optional[str] = Body(None, embed=True, description="FB 渠道需要的 JWT token"),
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

    platform = platform.strip()

    # 建立/寫入對話訊息
    from app.services.chatroom_service import ChatroomService

    chatroom_service = ChatroomService(db)

    if platform == "LINE":
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

            await chatroom_service.append_message(member, "LINE", "outgoing", text, message_source="manual")

            return {
                "success": True,
                "message_id": send_result.get("message_id"),
                "thread_id": send_result.get("thread_id"),
                "sent_at": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"發送訊息失敗: {str(e)}")

    elif platform == "Facebook":
        # 檢查 meta_jwt_token
        if not meta_jwt_token:
            raise HTTPException(status_code=400, detail="缺少 meta_jwt_token，請先完成 Facebook 授權")

        # 調用外部 FB API 發送訊息 (FB 會員一定有 email)
        fb_client = FbMessageClient()
        send_result = await fb_client.send_message(
            recipient_email=member.email,
            text=text,
            meta_jwt_token=meta_jwt_token
        )

        if not send_result.get("ok"):
            raise HTTPException(status_code=500, detail=f"發送 Facebook 訊息失敗: {send_result.get('error')}")

        # 成功後寫入對話訊息
        msg = await chatroom_service.append_message(member, "Facebook", "outgoing", text, message_source="manual")
        return {
            "success": True,
            "message_id": send_result.get("message_id", msg.id),
            "thread_id": msg.thread_id,
            "sent_at": msg.created_at.replace(tzinfo=timezone.utc).isoformat() if msg.created_at else None
        }

    elif platform == "Webchat":
        # Webchat 僅寫入資料庫
        try:
            msg = await chatroom_service.append_message(member, platform, "outgoing", text, message_source="manual")
            return {
                "success": True,
                "message_id": msg.id,
                "thread_id": msg.thread_id,
                "sent_at": msg.created_at.replace(tzinfo=timezone.utc).isoformat() if msg.created_at else None
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"發送訊息失敗: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail="不支援的渠道平台")


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
