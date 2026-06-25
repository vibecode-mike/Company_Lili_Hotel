"""
官網彈窗（Webchat）站點 API
- GET /webchat_sites/list  ：基本設定列表用，列出所有站點與「已開通/待開通」狀態
- POST /webchat_sites/{site_id}/seen ：公開 beacon，widget 載入時回報，更新 last_seen_at

狀態語意（一次性）：曾收到過 beacon（last_seen_at 有值）→ 已開通；從未收到 → 待開通。
"""
from app.core.timezone import now_utc
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.line_channel import LineChannel
from app.models.tenant import Tenant
from app.models.webchat_site import WebchatSiteChannel
from app.schemas.common import SuccessResponse
from app.schemas.webchat_site import (
    WebchatSiteBind,
    WebchatSiteCreate,
    WebchatSiteCreateResponse,
    WebchatSiteResponse,
)

import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/list", response_model=List[WebchatSiteResponse])
async def list_webchat_sites(db: AsyncSession = Depends(get_db)):
    """
    取得所有官網彈窗站點（供基本設定清單頁）。
    依 created_at 排序，狀態由 last_seen_at 是否有值決定。
    """
    stmt = select(WebchatSiteChannel).order_by(WebchatSiteChannel.created_at.asc())
    result = await db.execute(stmt)
    sites = result.scalars().all()
    return [
        WebchatSiteResponse(
            site_id=s.site_id,
            site_name=s.site_name,
            tenant_id=s.tenant_id,
            line_channel_id=s.line_channel_id,
            last_seen_at=s.last_seen_at,
            last_seen_url=s.last_seen_url,
            is_activated=s.last_seen_at is not None,
        )
        for s in sites
    ]


@router.post("", response_model=WebchatSiteCreateResponse, status_code=201)
async def create_webchat_site(
    payload: WebchatSiteCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    建立官網彈窗站點並綁到既有 LINE OA（基本設定「為現有 LINE 加官網」用）。

    綁定機制：site 的 line_channel_id 指向該 LINE。官網訪客 register 時被蓋上同一個
    line_channel_id，members trigger 再從它推導 tenant_id → 自動跟 LINE 落在同組織，
    數據洞察官網 tab 即正確歸屬，無需手動。tenant_id 順手從 LINE 帶上（可能為 None，
    仍可靠 line_channel_id 歸併）。

    1 LINE 對 1 官網：若該 LINE 已綁過官網，擋下避免重複。
    """
    site_id = (payload.site_id or "").strip()
    if not site_id:
        raise HTTPException(status_code=400, detail="官網代號必填")

    dup = (
        await db.execute(
            select(WebchatSiteChannel.site_id).where(WebchatSiteChannel.site_id == site_id)
        )
    ).scalar()
    if dup:
        raise HTTPException(status_code=409, detail=f"官網代號 '{site_id}' 已被使用")

    line_channel_id = (payload.line_channel_id or "").strip() or None
    tenant_id = None
    if line_channel_id:
        lc = (
            await db.execute(
                select(LineChannel).where(LineChannel.channel_id == line_channel_id)
            )
        ).scalar_one_or_none()
        if lc is None:
            raise HTTPException(status_code=404, detail=f"找不到 LINE 帳號 '{line_channel_id}'")
        tenant_id = lc.tenant_id  # 跟 LINE 同組織
        bound = (
            await db.execute(
                select(WebchatSiteChannel.site_id).where(
                    WebchatSiteChannel.line_channel_id == line_channel_id
                )
            )
        ).scalar()
        if bound:
            raise HTTPException(status_code=409, detail="此 LINE 帳號已綁定官網彈窗")

    site_name = (payload.site_name or "").strip() or None
    db.add(
        WebchatSiteChannel(
            site_id=site_id,
            site_name=site_name,
            line_channel_id=line_channel_id,
            tenant_id=tenant_id,
        )
    )
    await db.commit()

    from app.config import settings

    public_base = (settings.PUBLIC_BASE or "").rstrip("/")
    embed_code = (
        f'<script src="{public_base}/api/v1/widget/lili-chatbot.js" '
        f'data-site-id="{site_id}" '
        f'data-site-name="{site_name or ""}"></script>'
    )
    logger.info(f"建立官網彈窗站點 site_id={site_id} line_channel_id={line_channel_id} tenant_id={tenant_id}")
    return WebchatSiteCreateResponse(
        site_id=site_id,
        site_name=site_name,
        line_channel_id=line_channel_id,
        tenant_id=tenant_id,
        embed_code=embed_code,
    )


@router.patch("/{site_id}/bind", response_model=WebchatSiteCreateResponse)
async def bind_webchat_site_to_line(
    site_id: str,
    payload: WebchatSiteBind,
    db: AsyncSession = Depends(get_db),
):
    """
    把既有官網站點（多為「獨立官網」）重新綁定到某個 LINE OA，讓它併入該 LINE 的組織。

    完整搬遷（避免資料分裂）：
    1. site.line_channel_id / tenant_id 改指向該 LINE
    2. 既有訪客會員（members.webchat_site_id = 本站）一起搬到新組織
       （members.tenant_id FK 為 ON DELETE SET NULL，搬移後即可安全清舊組織）
    3. 若舊組織因此變空（無 LINE、無官網站點），順手刪除，避免切換器出現幽靈空組織

    1 LINE 對 1 官網：目標 LINE 已綁別的官網 → 409。
    """
    site = await db.get(WebchatSiteChannel, site_id)
    if site is None:
        raise HTTPException(status_code=404, detail=f"找不到官網站點 '{site_id}'")

    line_channel_id = (payload.line_channel_id or "").strip()
    if not line_channel_id:
        raise HTTPException(status_code=400, detail="line_channel_id 必填")

    lc = (
        await db.execute(select(LineChannel).where(LineChannel.channel_id == line_channel_id))
    ).scalar_one_or_none()
    if lc is None:
        raise HTTPException(status_code=404, detail=f"找不到 LINE 帳號 '{line_channel_id}'")

    # 1 LINE 1 官網：目標 LINE 若已被「別的」站點綁走，擋下
    other = (
        await db.execute(
            select(WebchatSiteChannel.site_id).where(
                WebchatSiteChannel.line_channel_id == line_channel_id,
                WebchatSiteChannel.site_id != site_id,
            )
        )
    ).scalar()
    if other:
        raise HTTPException(status_code=409, detail="此 LINE 帳號已綁定其他官網彈窗")

    old_tenant_id = site.tenant_id
    new_tenant_id = lc.tenant_id

    # 1) 站點改綁
    site.line_channel_id = line_channel_id
    site.tenant_id = new_tenant_id

    # 2) 既有訪客會員一起搬
    await db.execute(
        text(
            "UPDATE members SET line_channel_id = :lcid, tenant_id = :tid "
            "WHERE webchat_site_id = :sid"
        ),
        {"lcid": line_channel_id, "tid": new_tenant_id, "sid": site_id},
    )

    await db.flush()  # session autoflush=False，下面的 count 要先把改綁沖到 DB 才看得到

    # 3) 舊組織若變空就清掉
    if old_tenant_id is not None and old_tenant_id != new_tenant_id:
        line_cnt = (
            await db.execute(
                select(func.count()).select_from(LineChannel).where(LineChannel.tenant_id == old_tenant_id)
            )
        ).scalar() or 0
        site_cnt = (
            await db.execute(
                select(func.count())
                .select_from(WebchatSiteChannel)
                .where(WebchatSiteChannel.tenant_id == old_tenant_id)
            )
        ).scalar() or 0
        if line_cnt == 0 and site_cnt == 0:
            old_tenant = await db.get(Tenant, old_tenant_id)
            if old_tenant is not None:
                await db.delete(old_tenant)

    await db.commit()

    from app.config import settings

    public_base = (settings.PUBLIC_BASE or "").rstrip("/")
    embed_code = (
        f'<script src="{public_base}/api/v1/widget/lili-chatbot.js" '
        f'data-site-id="{site_id}" '
        f'data-site-name="{site.site_name or ""}"></script>'
    )
    logger.info(
        f"官網站點改綁 site_id={site_id} → line_channel_id={line_channel_id} "
        f"tenant_id={new_tenant_id}（舊組織 {old_tenant_id}）"
    )
    return WebchatSiteCreateResponse(
        site_id=site_id,
        site_name=site.site_name,
        line_channel_id=line_channel_id,
        tenant_id=new_tenant_id,
        embed_code=embed_code,
    )


@router.delete("/{site_id}", response_model=SuccessResponse)
async def delete_webchat_site(site_id: str, db: AsyncSession = Depends(get_db)):
    """
    刪除官網彈窗站點。

    - 解除既有訪客會員的站點指向（members.webchat_site_id → NULL），避免懸空指標。
    - 若該站點所屬組織因此變空（無 LINE、無其他官網站點），順手刪除空組織
      （members.tenant_id FK = ON DELETE SET NULL，安全）。
    """
    site = await db.get(WebchatSiteChannel, site_id)
    if site is None:
        raise HTTPException(status_code=404, detail=f"找不到官網站點 '{site_id}'")

    tenant_id = site.tenant_id
    await db.delete(site)
    await db.execute(
        text("UPDATE members SET webchat_site_id = NULL WHERE webchat_site_id = :sid"),
        {"sid": site_id},
    )
    await db.flush()  # session autoflush=False，下面的 count 要先把這筆刪除沖到 DB 才看得到

    # 舊組織若變空就清掉（與 bind 收尾一致）
    if tenant_id is not None:
        line_cnt = (
            await db.execute(
                select(func.count()).select_from(LineChannel).where(LineChannel.tenant_id == tenant_id)
            )
        ).scalar() or 0
        site_cnt = (
            await db.execute(
                select(func.count())
                .select_from(WebchatSiteChannel)
                .where(WebchatSiteChannel.tenant_id == tenant_id)
            )
        ).scalar() or 0
        if line_cnt == 0 and site_cnt == 0:
            old_tenant = await db.get(Tenant, tenant_id)
            if old_tenant is not None:
                await db.delete(old_tenant)

    await db.commit()
    logger.info(f"刪除官網彈窗站點 site_id={site_id}（原組織 {tenant_id}）")
    return SuccessResponse(message="ok")


@router.post("/{site_id}/seen", response_model=SuccessResponse)
async def report_widget_seen(
    site_id: str,
    url: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    公開 beacon：widget 載入時由客戶官網前端呼叫，標記此站點「已開通」。

    `url` 走 query string（不收 JSON body）——這是刻意設計：客戶官網是跨網域，
    若用 application/json body 會觸發瀏覽器 CORS 預檢(OPTIONS)，而 nginx 的預檢
    回應未帶 Access-Control-Allow-Origin 會把請求擋掉。改成無 body 的「簡單請求」
    （搭配前端 navigator.sendBeacon）即可完全略過預檢，不依賴 nginx CORS 設定。

    找不到 site_id 一律靜默成功（避免外部探測造成噪音，也不可影響客服開啟）。
    時間用 now_utc()（DB naive = UTC，與 chatbot_service 一致）。
    """
    site = await db.get(WebchatSiteChannel, site_id)
    if site is None:
        return SuccessResponse(message="ignored")

    site.last_seen_at = now_utc()
    if url:
        site.last_seen_url = url[:500]
    await db.commit()
    return SuccessResponse(message="ok")
