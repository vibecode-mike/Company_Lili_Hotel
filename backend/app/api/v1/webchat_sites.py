"""
官網彈窗（Webchat）站點 API
- GET /webchat_sites/list  ：基本設定列表用，列出所有站點與「已開通/待開通」狀態
- POST /webchat_sites/{site_id}/seen ：公開 beacon，widget 載入時回報，更新 last_seen_at

狀態語意（一次性）：曾收到過 beacon（last_seen_at 有值）→ 已開通；從未收到 → 待開通。
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.webchat_site import WebchatSiteChannel
from app.schemas.common import SuccessResponse
from app.schemas.webchat_site import WebchatSiteResponse

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
    時間用 datetime.now()（伺服器時區 Asia/Taipei，與 chatbot_service 一致）。
    """
    site = await db.get(WebchatSiteChannel, site_id)
    if site is None:
        return SuccessResponse(message="ignored")

    site.last_seen_at = datetime.now()
    if url:
        site.last_seen_url = url[:500]
    await db.commit()
    return SuccessResponse(message="ok")
