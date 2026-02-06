"""
Facebook 頻道設定 API
用於基本設定頁面的 Facebook 粉絲專頁連結與驗證
"""

from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.clients.fb_message_client import FbMessageClient
from app.models.member import Member
from app.config import settings
from app.models.fb_channel import FbChannel
from app.schemas.common import SuccessResponse
from app.schemas.fb_channel import (
    FbChannelCreate,
    FbChannelUpdate,
    FbChannelResponse,
    FbChannelStatusResponse,
    FacebookSdkConfigResponse,
    FbChannelSyncRequest,
    FbChannelVerifyResult,
    FbChannelVerifyResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

REQUIRED_FIELDS = ("page_id",)


def _has_value(value: Optional[str]) -> bool:
    return bool(value and value.strip())


def _collect_missing_fields(channel: FbChannel) -> List[str]:
    missing: List[str] = []
    if not _has_value(channel.page_id):
        missing.append("page_id")
    return missing


@router.get("", response_model=List[FbChannelResponse])
async def list_channels(db: AsyncSession = Depends(get_db)):
    """列出所有啟用中的 Facebook 粉絲專頁頻道設定"""
    stmt = select(FbChannel).where(FbChannel.is_active == True).order_by(FbChannel.id.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/status", response_model=FbChannelStatusResponse)
async def get_channel_status(db: AsyncSession = Depends(get_db)):
    """取得 Facebook 頻道設定狀態與缺漏欄位（單一頻道視角）"""
    stmt = select(FbChannel).where(FbChannel.is_active == True).order_by(FbChannel.id.desc()).limit(1)
    result = await db.execute(stmt)
    channel = result.scalar_one_or_none()

    if not channel:
        return FbChannelStatusResponse(
            has_active_channel=False,
            is_configured=False,
            missing_fields=list(REQUIRED_FIELDS),
            channel_db_id=None,
            connection_status="disconnected",
            last_verified_at=None,
        )

    missing_fields = _collect_missing_fields(channel)
    is_configured = len(missing_fields) == 0 and channel.connection_status == "connected"
    return FbChannelStatusResponse(
        has_active_channel=True,
        is_configured=is_configured,
        missing_fields=missing_fields,
        channel_db_id=channel.id,
        connection_status=channel.connection_status or "disconnected",
        last_verified_at=channel.last_verified_at,
    )


@router.get("/sdk_config", response_model=FacebookSdkConfigResponse)
async def get_facebook_sdk_config():
    """提供前端初始化 Facebook SDK 的必要設定（不包含 app secret）"""
    app_id = (settings.VITE_FACEBOOK_APP_ID or "").strip()
    if not app_id:
        raise HTTPException(status_code=500, detail="缺少 VITE_FACEBOOK_APP_ID")

    raw_version = (settings.FACEBOOK_GRAPH_API_VERSION or "v23.0").strip()
    version = raw_version
    if version and version[0] in {"V", "v"} and len(version) > 1:
        version = f"v{version[1:]}"
    if version and not version.startswith("v"):
        version = f"v{version}"

    return FacebookSdkConfigResponse(app_id=app_id, api_version=version or "v23.0")


@router.get("/message-list")
async def get_fb_message_list(
    jwt_token: str = Query(..., description="Meta JWT Token"),
):
    """
    取得 FB 訊息列表（用於會員管理頁合併顯示）

    透過外部 API 取得 FB 會員的訊息摘要資訊，包含：
    - customer_id, customer_name
    - last_message_time, unread 狀態
    - customer_tag 等
    """
    fb_client = FbMessageClient()
    result = await fb_client.list_messages(jwt_token)

    if not result.get("ok"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "取得 FB 訊息列表失敗")
        )

    return result


@router.post("", response_model=FbChannelResponse, status_code=201)
async def create_or_update_channel(data: FbChannelCreate, db: AsyncSession = Depends(get_db)):
    """
    創建 Facebook 粉絲專頁頻道設定（若 page_id 已存在則更新）
    """
    if not _has_value(data.page_id):
        raise HTTPException(status_code=422, detail="page_id 為必填")

    page_id = data.page_id.strip()

    stmt = select(FbChannel).where(FbChannel.page_id == page_id).limit(1)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if existing:
        existing.page_id = page_id
        existing.channel_name = data.channel_name or existing.channel_name
        existing.is_active = True if data.is_active is None else bool(data.is_active)
        existing.connection_status = data.connection_status or existing.connection_status
        existing.last_verified_at = now
        await db.commit()
        await db.refresh(existing)
        return existing

    channel = FbChannel(
        page_id=page_id,
        channel_name=data.channel_name,
        is_active=True if data.is_active is None else bool(data.is_active),
        connection_status=data.connection_status or "disconnected",
        last_verified_at=now,
    )

    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    return channel


@router.post("/sync", response_model=List[FbChannelResponse])
async def sync_channels(data: FbChannelSyncRequest, db: AsyncSession = Depends(get_db)):
    """
    根據外部 API 返回的頻道列表同步本地資料庫。

    - 列表中的頻道：建立或更新，設為 is_active=True
    - 不在列表中的頻道：設為 is_active=False

    這確保本地 DB 的 is_active 狀態與外部 API 的授權狀態一致。
    """
    now = datetime.now(timezone.utc)
    active_page_ids = [ch.page_id for ch in data.channels]

    # 1. 將不在列表中的頻道設為 is_active=False
    if active_page_ids:
        deactivate_stmt = (
            update(FbChannel)
            .where(FbChannel.is_active == True)
            .where(FbChannel.page_id.not_in(active_page_ids))
            .values(is_active=False)
        )
    else:
        # 若列表為空，停用所有頻道
        deactivate_stmt = (
            update(FbChannel)
            .where(FbChannel.is_active == True)
            .values(is_active=False)
        )
    await db.execute(deactivate_stmt)

    # 2. 建立或更新列表中的頻道
    results = []
    for ch in data.channels:
        stmt = select(FbChannel).where(FbChannel.page_id == ch.page_id).limit(1)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.channel_name = ch.channel_name or existing.channel_name
            existing.is_active = True
            existing.last_verified_at = now
            results.append(existing)
        else:
            channel = FbChannel(
                page_id=ch.page_id,
                channel_name=ch.channel_name,
                is_active=True,
                connection_status="connected",
                last_verified_at=now,
            )
            db.add(channel)
            results.append(channel)

    await db.commit()
    for r in results:
        await db.refresh(r)

    logger.info(f"FB channels synced: {len(results)} active, deactivated others not in list")
    return results


@router.post("/verify", response_model=FbChannelVerifyResponse)
async def verify_channels(
    jwt_token: str = Body(..., embed=True, description="Meta JWT Token"),
    db: AsyncSession = Depends(get_db),
):
    """
    驗證本地 FB 頻道與外部 API 狀態是否一致，並自動修復不一致的記錄。

    自動修復邏輯：
    - not_found: 刪除本地 DB 記錄
    - expired: 設為 is_active=0（停用）
    """
    # 1. 取得本地所有 is_active=1 的記錄
    stmt = select(FbChannel).where(FbChannel.is_active == True)
    result = await db.execute(stmt)
    local_channels = list(result.scalars().all())

    if not local_channels:
        return FbChannelVerifyResponse(
            verified_count=0,
            mismatch_count=0,
            deleted_count=0,
            deactivated_count=0,
            results=[],
        )

    # 2. 呼叫外部 login_status API
    fb_client = FbMessageClient()
    external_result = await fb_client.get_login_status(jwt_token)

    if not external_result.get("ok"):
        raise HTTPException(
            status_code=500,
            detail=f"外部 API 呼叫失敗: {external_result.get('error')}",
        )

    external_data = external_result.get("data", [])

    # 建立外部資料的 page_id → 資訊 對照表
    external_map = {
        item["page_id"]: {
            "name": item.get("name"),
            "expired_time": item.get("expired_time"),
        }
        for item in external_data if item.get("page_id")
    }

    # 3. 逐一驗證每個本地 page_id
    results = []
    verified_count = 0
    to_delete = []      # 待刪除的記錄 (not_found)
    to_deactivate = []  # 待停用的記錄 (expired)
    now = datetime.now()

    for local in local_channels:
        page_id = local.page_id
        external_info = external_map.get(page_id)

        if not external_info:
            # 外部已移除：標記刪除
            to_delete.append(local)
            results.append(FbChannelVerifyResult(
                page_id=page_id,
                channel_name=local.channel_name,
                external_status="not_found",
                is_valid=False,
                expired_time=None,
                action_taken="deleted",
            ))
            continue

        # 檢查是否過期
        expired_time = external_info.get("expired_time")
        is_expired = False
        if expired_time:
            try:
                expired_date = datetime.strptime(expired_time, "%Y-%m-%d %H:%M")
                is_expired = expired_date <= now
            except ValueError:
                logger.warning(f"Invalid expired_time format: {expired_time}")

        external_status = "expired" if is_expired else "connected"
        is_valid = not is_expired

        if is_expired:
            to_deactivate.append(local)
            action_taken = "deactivated"
        else:
            verified_count += 1
            action_taken = None

        results.append(FbChannelVerifyResult(
            page_id=page_id,
            channel_name=local.channel_name,
            external_status=external_status,
            is_valid=is_valid,
            expired_time=expired_time,
            action_taken=action_taken,
        ))

    # 4. 執行停用操作 (expired)
    for channel in to_deactivate:
        channel.is_active = False
        channel.connection_status = "expired"

    # 5. 執行刪除操作 (not_found)
    for channel in to_delete:
        await db.delete(channel)

    if to_deactivate or to_delete:
        await db.commit()
        logger.info(f"FB channels verify: deactivated {len(to_deactivate)}, deleted {len(to_delete)}")

    return FbChannelVerifyResponse(
        verified_count=verified_count,
        mismatch_count=len(to_deactivate) + len(to_delete),
        deleted_count=len(to_delete),
        deactivated_count=len(to_deactivate),
        results=results,
    )


@router.patch("/{channel_id}", response_model=FbChannelResponse)
async def update_channel(channel_id: int, data: FbChannelUpdate, db: AsyncSession = Depends(get_db)):
    """更新 Facebook 頻道設定（支援部分更新）"""
    channel = await db.get(FbChannel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="頻道設定不存在")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(channel, key, value)

    try:
        await db.commit()
        await db.refresh(channel)
        return channel
    except Exception as exc:
        await db.rollback()
        logger.error("更新 Facebook 頻道設定失敗: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="更新設定失敗")


@router.delete("/{channel_id}", response_model=SuccessResponse)
async def deactivate_channel(channel_id: int, db: AsyncSession = Depends(get_db)):
    """解除連結（停用）Facebook 頻道設定"""
    channel = await db.get(FbChannel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="頻道設定不存在")

    channel.is_active = False
    channel.connection_status = "disconnected"
    await db.commit()
    return SuccessResponse(data={"id": channel_id})


@router.post("/sync-members", response_model=SuccessResponse)
async def sync_facebook_members(
    jwt_token: Optional[str] = Body(None, embed=True, description="Meta JWT Token"),
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    同步 Facebook 會員列表到 members 表（先清除再寫入）

    1. 清除所有會員的 fb_customer_* 欄位
    2. 刪除孤兒會員（三個渠道都是 NULL）
    3. 根據外部 API 返回的資料重新綁定
    """
    token = jwt_token
    if not token and authorization:
        token = authorization.replace("Bearer ", "", 1) if authorization.startswith("Bearer ") else authorization
    if not token:
        raise HTTPException(status_code=400, detail="缺少 jwt_token")

    # 1. 獲取外部 API 會員列表
    fb_client = FbMessageClient()
    result = await fb_client.list_messages(token)

    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=f"獲取 FB 會員列表失敗: {result.get('error')}")

    fb_members = result.get("data", [])

    # 2. 清除所有 FB 會員資料
    clear_result = await db.execute(
        update(Member)
        .where(Member.fb_customer_id.isnot(None))
        .values(fb_customer_id=None, fb_customer_name=None, fb_avatar=None)
    )
    cleared_count = clear_result.rowcount

    # 3. 刪除孤兒會員（三個渠道都是 NULL）
    delete_result = await db.execute(
        delete(Member)
        .where(Member.line_uid.is_(None))
        .where(Member.fb_customer_id.is_(None))
        .where(Member.webchat_uid.is_(None))
    )
    deleted_count = delete_result.rowcount

    if not fb_members:
        await db.commit()
        logger.info(f"FB sync: cleared {cleared_count}, deleted {deleted_count} orphans, no FB members to sync")
        return SuccessResponse(data={
            "synced": 0,
            "created": 0,
            "updated": 0,
            "cleared": cleared_count,
            "deleted_orphans": deleted_count,
        })

    # 4. 重新綁定會員資料
    created_count = 0
    updated_count = 0
    processed_fb_ids = set()  # 追蹤已處理的 fb_customer_id，避免重複

    for fb_member in fb_members:
        fb_customer_id = str(fb_member.get("customer_id", ""))
        if not fb_customer_id:
            continue

        # 跳過已處理的 fb_customer_id
        if fb_customer_id in processed_fb_ids:
            continue
        processed_fb_ids.add(fb_customer_id)

        fb_customer_name = fb_member.get("customer_name", "")
        fb_email = (fb_member.get("email") or "").strip() or None

        # 先檢查是否已存在此 fb_customer_id 的會員
        existing_fb_result = await db.execute(
            select(Member).where(Member.fb_customer_id == fb_customer_id)
        )
        existing_fb_member = existing_fb_result.scalar_one_or_none()
        if existing_fb_member:
            # 已存在，更新名稱
            existing_fb_member.fb_customer_name = fb_customer_name
            updated_count += 1
            continue

        # 根據 email 查詢現有會員
        member = None
        if fb_email:
            result = await db.execute(select(Member).where(Member.email == fb_email))
            member = result.scalar_one_or_none()

        if member:
            # 綁定到現有會員
            member.fb_customer_id = fb_customer_id
            member.fb_customer_name = fb_customer_name
            updated_count += 1
        else:
            # 新建會員
            db.add(Member(
                fb_customer_id=fb_customer_id,
                fb_customer_name=fb_customer_name,
                email=fb_email,
                name=fb_customer_name,
                join_source="Facebook",
            ))
            created_count += 1

    await db.commit()

    logger.info(f"FB sync: cleared {cleared_count}, deleted {deleted_count} orphans, {created_count} created, {updated_count} updated")

    return SuccessResponse(data={
        "synced": len(fb_members),
        "created": created_count,
        "updated": updated_count,
        "cleared": cleared_count,
        "deleted_orphans": deleted_count,
    })
