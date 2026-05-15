"""
LINE 頻道設定 API
用於基本設定頁面的頻道參數管理
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import logging
import requests

from app.database import get_db
from app.models.line_channel import LineChannel
from app.models.user import User, UserRole
from app.models.user_channel import UserChannel
from app.schemas.line_channel import (
    LineChannelCreate,
    LineChannelUpdate,
    LineChannelResponse,
    LineChannelStatusResponse,
)
from app.schemas.common import SuccessResponse

router = APIRouter()
logger = logging.getLogger(__name__)


REQUIRED_FIELDS = (
    "channel_id",
    "channel_secret",
    "channel_access_token",
    "login_channel_id",
    "login_channel_secret",
)


def _has_value(value: Optional[str]) -> bool:
    return bool(value and value.strip())


def fetch_bot_info_from_line(channel_access_token: str) -> dict:
    """
    調用 Flask line_app 的 /api/bot/basic-id 端點獲取 LINE Bot 資訊

    Args:
        channel_access_token: LINE Messaging API Channel Access Token

    Returns:
        dict with keys: basic_id, display_name (值可能為 None)
    """
    result = {"basic_id": None, "display_name": None}
    try:
        # Flask line_app 運行在 port 3001
        from app.config import settings
        flask_url = f"{settings.LINE_APP_URL}/api/bot/basic-id"

        response = requests.post(
            flask_url,
            json={"channel_access_token": channel_access_token},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                result["basic_id"] = data.get("basicId")
                result["display_name"] = data.get("displayName")
                logger.info(f"✅ 成功獲取 Bot 資訊: basicId={result['basic_id']}, displayName={result['display_name']}")
                return result

        # 記錄錯誤但不中斷流程
        logger.warning(f"⚠️ 無法獲取 Bot 資訊: status={response.status_code}, response={response.text[:200]}")
        return result

    except requests.exceptions.ConnectionError as e:
        logger.error(f"❌ 無法連接到 Flask line_app (port 3001): {str(e)}")
        return result
    except requests.exceptions.Timeout as e:
        logger.error(f"❌ 請求 Flask line_app 超時: {str(e)}")
        return result
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ 請求 Bot 資訊時發生網路錯誤: {str(e)}")
        return result
    except Exception as e:
        logger.error(f"❌ 獲取 Bot 資訊時發生未預期錯誤: {str(e)}", exc_info=True)
        return result


def _collect_missing_fields(channel: LineChannel) -> List[str]:
    """檢查頻道設定缺少哪些必填欄位"""

    missing: List[str] = []

    if not _has_value(channel.channel_id):
        missing.append("channel_id")
    if not _has_value(channel.channel_secret):
        missing.append("channel_secret")
    if not _has_value(channel.channel_access_token):
        missing.append("channel_access_token")
    if not _has_value(channel.login_channel_id):
        missing.append("login_channel_id")
    if not _has_value(channel.login_channel_secret):
        missing.append("login_channel_secret")

    return missing


@router.get("/list", response_model=List[LineChannelResponse])
async def list_line_channels(db: AsyncSession = Depends(get_db)):
    """
    取得所有啟用中的 LINE 頻道（多帳號模式）

    供前端訊息推播頁 / 切換器 / 基本設定清單頁使用。
    依 id 由小到大排序，第一筆即為前端切換器的預設選項。
    """
    try:
        stmt = (
            select(LineChannel)
            .where(LineChannel.is_active == True)
            .order_by(LineChannel.id.asc())
        )
        result = await db.execute(stmt)
        channels = result.scalars().all()
        logger.info(f"✅ 取得 LINE 頻道清單: 共 {len(channels)} 筆")
        return list(channels)
    except Exception as e:
        logger.error(f"❌ 取得 LINE 頻道清單失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"取得清單失敗: {str(e)}")


@router.get("/current", response_model=Optional[LineChannelResponse])
async def get_current_channel(db: AsyncSession = Depends(get_db)):
    """
    取得當前 LINE 頻道設定（單一頻道模式）

    Returns:
        LineChannelResponse: 頻道設定，若無設定則返回 null
    """
    try:
        # 查詢第一筆啟用的設定
        stmt = select(LineChannel).where(LineChannel.is_active == True).limit(1)
        result = await db.execute(stmt)
        channel = result.scalar_one_or_none()

        if not channel:
            logger.info("❌ 尚未設定 LINE 頻道")
            return None

        logger.info(f"✅ 取得 LINE 頻道設定: ID={channel.id}")
        return channel

    except Exception as e:
        logger.error(f"❌ 取得 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"取得設定失敗: {str(e)}")


@router.get("/status", response_model=LineChannelStatusResponse)
async def get_channel_status(db: AsyncSession = Depends(get_db)):
    """取得 LINE 頻道設定狀態與缺漏欄位"""

    try:
        stmt = select(LineChannel).where(LineChannel.is_active == True).limit(1)
        result = await db.execute(stmt)
        channel = result.scalar_one_or_none()

        if not channel:
            logger.info("ℹ️ 尚未建立任何 LINE 頻道設定")
            return LineChannelStatusResponse(
                has_active_channel=False,
                is_configured=False,
                missing_fields=list(REQUIRED_FIELDS),
                channel_db_id=None,
            )

        missing_fields = _collect_missing_fields(channel)
        is_configured = len(missing_fields) == 0

        if is_configured:
            logger.info("✅ LINE 頻道設定已通過驗證")
        else:
            logger.warning(
                "⚠️ LINE 頻道設定缺少欄位", extra={"missing_fields": missing_fields}
            )

        return LineChannelStatusResponse(
            has_active_channel=True,
            is_configured=is_configured,
            missing_fields=missing_fields,
            channel_db_id=channel.id,
        )

    except Exception as e:
        logger.error(f"❌ 檢查 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"取得設定狀態失敗: {str(e)}")


@router.post("", response_model=LineChannelResponse, status_code=201)
async def create_channel(
    data: LineChannelCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    創建 LINE 頻道設定（Phase E 一條龍）

    主表（line_channels）必建；以下選填 row 視 payload 內容自動 seed：
    - `site_id` / `site_name` 提供 → `webchat_site_channels` 綁定該 LINE OA
    - `hotelcode` 提供 → `faq_pms_connections` 帶 hotelcode、status='disabled'（admin 之後啟用）
    - 不論如何 → `ai_token_usages` 預設 10M quota（讓該 OA 立刻能跑 AI）

    整筆交易，任一失敗 rollback。
    """
    try:
        # 拆出 Phase E 額外欄位（不寫進 LineChannel 主表）
        site_id = (data.site_id or "").strip() or None
        site_name = (data.site_name or "").strip() or None
        hotelcode = (data.hotelcode or "").strip() or None

        # 主表 line_channels（只塞 LineChannel 認識的欄位）
        channel_payload = data.model_dump(
            exclude={"site_id", "site_name", "hotelcode"}
        )
        channel = LineChannel(**channel_payload)

        # 自動獲取 Basic ID + Channel Name
        if data.channel_access_token:
            bot_info = fetch_bot_info_from_line(data.channel_access_token)
            if bot_info["basic_id"]:
                channel.basic_id = bot_info["basic_id"]
            if bot_info["display_name"]:
                channel.channel_name = bot_info["display_name"]

        db.add(channel)
        await db.flush()
        await db.refresh(channel)

        # 自動把新建 LINE OA 加給所有現存 ADMIN
        seeded_rows: list[str] = []
        if channel.channel_id:
            admins = await db.execute(
                select(User.id).where(User.role == UserRole.ADMIN)
            )
            for admin_id in admins.scalars().all():
                db.add(UserChannel(user_id=admin_id, line_channel_id=channel.channel_id))

            # === Phase E 一條龍 seed ===
            from app.models.faq import AiTokenUsage, FaqCategory, Industry
            from app.models.chatbot_booking import FaqPmsConnection
            from app.models.webchat_site import WebchatSiteChannel

            # (1) Webchat 站點綁定
            if site_id:
                db.add(
                    WebchatSiteChannel(
                        site_id=site_id,
                        line_channel_id=channel.channel_id,
                        site_name=site_name,
                    )
                )
                seeded_rows.append(f"webchat_site_channels(site_id={site_id})")

            # (2) Token quota（預設 10M）
            ind_res = await db.execute(
                select(Industry).where(Industry.is_active == True).limit(1)  # noqa: E712
            )
            industry = ind_res.scalar_one_or_none()
            if industry:
                db.add(
                    AiTokenUsage(
                        industry_id=industry.id,
                        channel_id=channel.channel_id,
                        total_quota=10_000_000,
                        used_amount=0,
                    )
                )
                seeded_rows.append("ai_token_usages(10M)")

                # (3) FAQ PMS 連線 row（hotelcode 有給就帶；沒給也建一筆讓 admin 之後啟用）
                cat_res = await db.execute(
                    select(FaqCategory).where(
                        FaqCategory.industry_id == industry.id,
                        FaqCategory.name == "訂房",
                    )
                )
                booking_category = cat_res.scalar_one_or_none()
                if booking_category:
                    db.add(
                        FaqPmsConnection(
                            faq_category_id=booking_category.id,
                            channel_id=channel.channel_id,
                            hotelcode=hotelcode,
                            api_endpoint="",
                            api_key_encrypted="",
                            auth_type="api_key",
                            status="disabled",
                            snapshot_completed=False,
                        )
                    )
                    seeded_rows.append(
                        f"faq_pms_connections(hotelcode={hotelcode or 'NULL'})"
                    )

        await db.commit()
        await db.refresh(channel)

        logger.info(
            f"✅ 創建 LINE 頻道設定: ID={channel.id}, channel_id={channel.channel_id}, "
            f"seeded={seeded_rows}（已自動指派給所有 ADMIN）"
        )
        return channel

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 創建 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"創建設定失敗: {str(e)}")


@router.patch("/{channel_id}", response_model=LineChannelResponse)
async def update_channel(
    channel_id: int,
    data: LineChannelUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    更新 LINE 頻道設定（支援部分更新）

    Args:
        channel_id: 頻道 ID
        data: 要更新的欄位

    Returns:
        LineChannelResponse: 更新後的頻道設定
    """
    try:
        # 查詢頻道
        channel = await db.get(LineChannel, channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="頻道設定不存在")

        # 更新欄位（只更新提供的欄位）
        update_data = data.model_dump(exclude_unset=True)

        # 🆕 當 token 更新時，自動重新獲取 Basic ID + Channel Name
        if "channel_access_token" in update_data:
            new_token = update_data["channel_access_token"]
            bot_info = fetch_bot_info_from_line(new_token)
            if bot_info["basic_id"]:
                update_data["basic_id"] = bot_info["basic_id"]
            if bot_info["display_name"]:
                update_data["channel_name"] = bot_info["display_name"]

        for field, value in update_data.items():
            setattr(channel, field, value)

        await db.commit()
        await db.refresh(channel)

        logger.info(f"✅ 更新 LINE 頻道設定: ID={channel_id}, 更新欄位={list(update_data.keys())}")
        return channel

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 更新 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"更新設定失敗: {str(e)}")


@router.delete("/{channel_id}", response_model=SuccessResponse)
async def delete_channel(
    channel_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    刪除 LINE 頻道設定（重置功能）

    Args:
        channel_id: 頻道 ID

    Returns:
        SuccessResponse: 刪除成功訊息
    """
    try:
        # 查詢頻道
        channel = await db.get(LineChannel, channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="頻道設定不存在")

        # 刪除設定
        await db.delete(channel)
        await db.commit()

        logger.info(f"✅ 刪除 LINE 頻道設定: ID={channel_id}")
        return SuccessResponse(message="頻道設定已重置")

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 刪除 LINE 頻道設定失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"刪除設定失敗: {str(e)}")


@router.get("/{channel_db_id}/embed-code")
async def get_embed_code(
    channel_db_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    取得該 LINE OA 對應官網的 widget 嵌入碼（Phase E-5）。

    URL 用 `settings.PUBLIC_BASE`，依環境自動生成：
    - 地端 dev → https://crmpoc.star-bit.io
    - GCP staging → https://console.star-bit.io
    - GCP prod 之後 → 對應域名

    若該 channel 尚未綁定 webchat site → 回 404 提示先綁站點。
    """
    from app.config import settings
    from app.models.webchat_site import WebchatSiteChannel

    channel = await db.get(LineChannel, channel_db_id)
    if not channel or not channel.channel_id:
        raise HTTPException(status_code=404, detail="LINE 頻道不存在")

    # 查該 channel 綁定的 webchat site
    res = await db.execute(
        select(WebchatSiteChannel).where(
            WebchatSiteChannel.line_channel_id == channel.channel_id
        )
    )
    site = res.scalar_one_or_none()
    if not site:
        raise HTTPException(
            status_code=404,
            detail="此 LINE 頻道尚未綁定官網站點，請先在 Card 10 填寫 Site ID",
        )

    public_base = (settings.PUBLIC_BASE or "").rstrip("/")
    embed_code = (
        f'<script src="{public_base}/widget/loader.js'
        f'?site_id={site.site_id}" async></script>'
    )
    return {
        "embed_code": embed_code,
        "public_base": public_base,
        "site_id": site.site_id,
        "site_name": site.site_name,
        "line_channel_id": channel.channel_id,
    }


@router.post("/basic-id")
async def get_basic_id(data: dict):
    """
    透過 line_app 取得 LINE Bot Basic ID（供前端呼叫）
    """
    token = data.get("channel_access_token", "")
    if not token:
        raise HTTPException(status_code=400, detail="channel_access_token is required")

    from app.config import settings
    try:
        flask_url = f"{settings.LINE_APP_URL}/api/bot/basic-id"
        response = requests.post(
            flask_url,
            json={"channel_access_token": token},
            timeout=10,
        )
        return response.json()
    except Exception as e:
        logger.error(f"❌ 取得 Basic ID 失敗: {e}")
        raise HTTPException(status_code=502, detail="無法連接 LINE Bot 服務")
