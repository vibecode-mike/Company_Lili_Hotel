"""
組織（Tenant）管理 API

組織是系統最頂層的歸屬單位（一個組織 = 一個客戶 / 一個館）。
LINE、官網彈窗、FB、PMS 都是組織底下「可有可無的工具」。

重點：建立一個組織「只需要名稱」，不需要先有 LINE —— 這是組織重構
（Phase 4）解除「沒有 LINE 就不能用系統」限制的核心入口。
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.tenant import Tenant
from app.models.line_channel import LineChannel
from app.models.webchat_site import WebchatSiteChannel
from app.models.user import User, UserRole
from app.api.v1.auth import get_current_user
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse

router = APIRouter()
logger = logging.getLogger(__name__)


async def _require_admin(current_user: User) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="僅限 ADMIN 角色操作")
    return current_user


async def _to_response(db: AsyncSession, tenant: Tenant) -> TenantResponse:
    line_count = (
        await db.execute(
            select(func.count()).select_from(LineChannel).where(LineChannel.tenant_id == tenant.id)
        )
    ).scalar() or 0
    site_count = (
        await db.execute(
            select(func.count()).select_from(WebchatSiteChannel).where(WebchatSiteChannel.tenant_id == tenant.id)
        )
    ).scalar() or 0
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        is_active=tenant.is_active,
        line_channel_count=int(line_count),
        webchat_site_count=int(site_count),
        created_at=tenant.created_at,
    )


@router.get("", response_model=List[TenantResponse])
async def list_tenants(db: AsyncSession = Depends(get_db)):
    """列出所有組織"""
    result = await db.execute(select(Tenant).order_by(Tenant.id))
    tenants = result.scalars().all()
    return [await _to_response(db, t) for t in tenants]


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(
    payload: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    建立組織。只需要名稱即可成立（不需要 LINE）。

    若帶 webchat_site_id，會順手建立一個「純官網彈窗」站點並綁到此組織
    （line_channel_id 留空）—— 這就是無 LINE 組織能直接運作的關鍵。
    """
    await _require_admin(current_user)

    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="組織名稱必填")

    # slug 唯一性檢查
    if payload.slug:
        exists = (
            await db.execute(select(Tenant.id).where(Tenant.slug == payload.slug))
        ).scalar()
        if exists:
            raise HTTPException(status_code=409, detail=f"組織代碼 '{payload.slug}' 已存在")

    tenant = Tenant(name=name, slug=payload.slug or None, is_active=True)
    db.add(tenant)
    await db.flush()  # 取得 tenant.id

    # 選配：建立純官網彈窗站點
    if payload.webchat_site_id:
        site_id = payload.webchat_site_id.strip()
        dup = (
            await db.execute(
                select(WebchatSiteChannel.site_id).where(WebchatSiteChannel.site_id == site_id)
            )
        ).scalar()
        if dup:
            raise HTTPException(status_code=409, detail=f"官網彈窗站點代號 '{site_id}' 已被使用")
        db.add(
            WebchatSiteChannel(
                site_id=site_id,
                tenant_id=tenant.id,
                line_channel_id=None,  # 純官網彈窗：不接 LINE
                site_name=payload.webchat_site_name or name,
            )
        )

    await db.commit()
    await db.refresh(tenant)
    logger.info(f"建立組織 id={tenant.id} name={name} webchat_site={payload.webchat_site_id or '-'}")
    resp = await _to_response(db, tenant)
    # 官網機器人佈署：若建立了官網站點，附上嵌入碼（只需 site_id）
    if payload.webchat_site_id:
        from app.config import settings
        public_base = (settings.PUBLIC_BASE or "").rstrip("/")
        resp.webchat_embed_code = (
            f'<script src="{public_base}/api/v1/widget/lili-chatbot.js" '
            f'data-site-id="{payload.webchat_site_id.strip()}" '
            f'data-site-name="{(payload.webchat_site_name or name) or ""}"></script>'
        )
    return resp


@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    payload: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新組織名稱 / 代碼 / 啟用狀態"""
    await _require_admin(current_user)

    tenant = (
        await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    ).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="組織不存在")

    if payload.name is not None:
        tenant.name = payload.name.strip()
    if payload.slug is not None:
        tenant.slug = payload.slug or None
    if payload.is_active is not None:
        tenant.is_active = payload.is_active

    await db.commit()
    await db.refresh(tenant)
    return await _to_response(db, tenant)
