"""
自動回應 API
"""
import logging
from datetime import date, time, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.auto_response import AutoResponse, AutoResponseKeyword, TriggerType
from app.models.auto_response_message import AutoResponseMessage
from app.models.line_channel import LineChannel
from app.schemas.common import SuccessResponse
from app.clients.fb_message_client import FbMessageClient
from pydantic import BaseModel, conlist
from typing import Optional, List, Sequence, Dict, Any, Union

logger = logging.getLogger(__name__)


def _parse_datetime(value: Union[int, float, str, datetime, None]) -> Optional[datetime]:
    """
    Parse various datetime formats into a datetime object.

    Handles:
    - Unix timestamps (int/float)
    - ISO datetime strings (with optional 'Z' suffix)
    - datetime objects (passthrough)
    - None/missing values

    Returns datetime object or None if parsing fails.
    """
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(value)
        except (ValueError, OSError):
            return None

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return None

    return None

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
    規則：
    1. 當多個啟用的自動回應包含相同關鍵字時，只有最新建立的版本有效，其他標記為重複。
    2. 若自動回應的所有關鍵字都被標記為重複，則自動停用該自動回應。
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

    # === 自動停用無有效關鍵字的自動回應 ===
    # 收集所有受影響的自動回應 ID
    affected_ar_ids = set()
    for kw in all_keywords:
        if kw.auto_response:
            affected_ar_ids.add(kw.auto_response_id)

    # 檢查每個自動回應是否還有非重複的關鍵字
    for ar_id in affected_ar_ids:
        # 取得該自動回應的所有關鍵字
        ar_keywords = [kw for kw in all_keywords if kw.auto_response_id == ar_id]

        # 檢查是否所有關鍵字都是重複的
        has_valid_keyword = any(not kw.is_duplicate for kw in ar_keywords)

        if not has_valid_keyword and ar_keywords:
            # 所有關鍵字都是重複的，自動停用此自動回應
            auto_response = ar_keywords[0].auto_response
            if auto_response and auto_response.is_active:
                auto_response.is_active = False


async def _sync_fb_auto_template(
    auto_response: AutoResponse,
    jwt_token: str
) -> None:
    """同步自動回應到 Facebook 外部 API"""
    if not jwt_token:
        raise HTTPException(
            status_code=400,
            detail="缺少 jwt_token，請先完成 Facebook 授權"
        )

    payload = {
        "firm_id": 1,
        "channel": "FB",
        "page_id": auto_response.channel_id or "",
        "response_type": 2 if auto_response.trigger_type == TriggerType.KEYWORD.value else 3,
        "enabled": auto_response.is_active,
        "trigger_time": 0,
        "tags": [kw.keyword for kw in auto_response.keyword_relations],
        "text": [
            msg.message_content
            for msg in sorted(auto_response.response_messages, key=lambda m: m.sequence_order)
        ],
    }

    logger.info(f"Syncing FB auto_template: {payload}")

    fb_client = FbMessageClient()
    result = await fb_client.set_auto_template(payload, jwt_token)

    if not result.get("ok"):
        error_msg = result.get("error", "未知錯誤")
        logger.error(f"FB auto_template sync failed: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"同步 Facebook 自動回應失敗: {error_msg}"
        )

    logger.info(f"FB auto_template synced for auto_response_id={auto_response.id}")


async def _get_fb_auto_responses_from_api(jwt_token: str, db: AsyncSession) -> List[Dict[str, Any]]:
    """
    從 FB 外部 API 獲取自動回應並轉換為內部格式
    參考 message_service.py 的合併模式
    """
    if not jwt_token:
        logger.warning("No JWT token provided, skipping FB auto-response fetch")
        return []

    try:
        fb_client = FbMessageClient()
        result = await fb_client.get_auto_templates(jwt_token)

        if not result.get("ok"):
            error_msg = result.get("error", "未知錯誤")
            logger.error(f"FB auto_template list failed: {error_msg}")
            return []

        fb_data = result.get("data", [])

        # 轉換為內部格式
        fb_auto_responses = []
        for item in fb_data:
            # 提取關鍵字
            fb_keywords = item.get("keywords", [])
            keywords_list = [
                {
                    "id": kw.get("id"),
                    "keyword": kw.get("name", ""),
                    "name": kw.get("name", ""),
                    "type": "keyword",
                    "match_type": "exact",
                    "is_enabled": kw.get("enabled", True),
                    "is_duplicate": not kw.get("enabled", True),  # FB API 的 enabled=false 表示重複
                    "match_count": 0,
                    "last_triggered_at": None,
                }
                for kw in fb_keywords
            ]

            # 提取訊息（保留真實 FB API id、basic_id、count）
            text_items = item.get("text", [])
            messages_list = [
                {
                    "id": t.get("id"),  # 保留 FB API 的真實 id
                    "basic_id": t.get("basic_id"),  # 保留父記錄 ID
                    "content": t.get("text", ""),
                    "count": t.get("count", 0),  # 保留觸發計數
                    "sequence_order": idx + 1,
                }
                for idx, t in enumerate(text_items)
                if t.get("enabled") is not False
            ]

            # Parse create_time with fallback to current time
            created_at_dt = _parse_datetime(item.get("create_time")) or datetime.now()

            # 粉專名稱
            channel_name = item.get("channel_name") or f"FB 自動回應 #{item.get('id')}"

            fb_auto_response = {
                "id": f"fb-{item.get('id')}",  # 加上 fb- 前綴避免與 LINE 的 ID 衝突
                "name": item.get("channel_name") or f"FB 自動回應 #{item.get('id')}",
                "channel_name": channel_name,  # 新增：粉專名稱（與 LINE 統一）
                "trigger_type": "keyword" if item.get("response_type") == 2 else "follow",
                "content": messages_list[0]["content"] if messages_list else "",
                "is_active": item.get("enabled", False),
                "trigger_count": item.get("count", 0),
                "success_rate": 0,
                "created_at": created_at_dt,  # 已轉換為 datetime 對象
                "updated_at": None,
                "keywords": keywords_list,
                "messages": messages_list,
                "trigger_time_start": None,
                "trigger_time_end": None,
                "date_range_start": None,
                "date_range_end": None,
                "channels": ["Facebook"],
                "channel_id": item.get("page_id", ""),
            }

            fb_auto_responses.append(fb_auto_response)

        logger.info(f"✅ 從 FB API 獲取了 {len(fb_auto_responses)} 個自動回應")
        return fb_auto_responses

    except Exception as e:
        logger.error(f"獲取 FB 自動回應失敗（非致命）: {e}")
        return []


@router.get("", response_model=SuccessResponse)
async def get_auto_responses(
    trigger_type: Optional[TriggerType] = None,
    is_active: Optional[bool] = None,
    jwt_token: Optional[str] = Query(None, description="FB JWT token for fetching FB auto-responses"),
    db: AsyncSession = Depends(get_db),
):
    """
    獲取自動回應列表（合併 LINE DB + FB API）

    架構參考活動推播的 list_messages()：
    - Step 1: 獲取 LINE 自動回應（本地 DB）
    - Step 2: 獲取 FB 自動回應（外部 API）
    - Step 3: 合併兩個數據源
    - Step 4: 排序並返回
    """
    # Step 1: 獲取 LINE 自動回應（本地 DB）
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

    # 查詢所有 LINE 頻道名稱
    # 建立兩個映射：channel_id -> channel_name 和 basic_id -> channel_name
    line_channels_query = select(LineChannel).where(LineChannel.is_active == True)
    line_channels_result = await db.execute(line_channels_query)
    line_channels = line_channels_result.scalars().all()

    # 同時建立 channel_id 和 basic_id 的映射，因為自動回應可能存儲任一種
    channel_name_map = {}
    for ch in line_channels:
        if ch.channel_id:
            channel_name_map[ch.channel_id] = ch.channel_name
        if ch.basic_id:
            channel_name_map[ch.basic_id] = ch.channel_name

    # 序列化 LINE 自動回應
    line_items = []
    for ar in auto_responses:
        # 獲取頻道名稱（匹配 channel_id 或 basic_id）
        channel_name = None
        if ar.channel_id and ar.channel_id in channel_name_map:
            channel_name = channel_name_map[ar.channel_id]

        line_items.append(
            {
                "id": ar.id,
                "name": ar.name,
                "channel_name": channel_name,  # 新增：頻道名稱
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

    # Step 2: 獲取 FB 自動回應（外部 API）
    fb_items = []
    if jwt_token:
        fb_items = await _get_fb_auto_responses_from_api(jwt_token, db)

    # Step 3: 合併兩個數據源
    all_items = line_items + fb_items

    # Step 4: 按創建時間排序（降序）
    # _parse_datetime ensures type consistency; datetime.min used as fallback for None
    all_items.sort(
        key=lambda x: _parse_datetime(x.get("created_at")) or datetime.min,
        reverse=True
    )

    logger.info(f"✅ 返回自動回應列表: LINE={len(line_items)}, FB={len(fb_items)}, 總計={len(all_items)}")

    return SuccessResponse(data=all_items)


@router.get("/fb", response_model=SuccessResponse)
async def get_fb_auto_responses(
    jwt_token: str = Query(..., description="FB JWT token"),
):
    """取得 Facebook 自動回應列表（從外部 FB API）"""
    fb_client = FbMessageClient()
    result = await fb_client.get_auto_templates(jwt_token)

    if not result.get("ok"):
        error_msg = result.get("error", "未知錯誤")
        logger.error(f"FB auto_template list failed: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"取得 Facebook 自動回應列表失敗: {error_msg}"
        )

    return SuccessResponse(data=result.get("data", []))


class FbKeywordItem(BaseModel):
    """FB 關鍵字項目（帶 id 為編輯，無 id 為新增）"""
    id: Optional[int] = None
    name: str


class FbTextItem(BaseModel):
    """FB 訊息項目（帶 id 為編輯，無 id 為新增）"""
    id: Optional[int] = None
    basic_id: Optional[int] = None  # 父自動回應 ID
    text: str
    count: int = 0  # 觸發計數
    enabled: bool = True


class FbAutoResponseUpdate(BaseModel):
    """FB 自動回應更新 payload"""
    keywords: Optional[List[FbKeywordItem]] = None
    messages: Optional[List[FbTextItem]] = None
    is_active: Optional[bool] = None
    trigger_type: Optional[str] = None
    page_id: Optional[str] = None


@router.patch("/fb/{fb_id}", response_model=SuccessResponse)
async def update_fb_auto_response(
    fb_id: int,
    data: FbAutoResponseUpdate,
    jwt_token: str = Query(..., description="FB JWT token"),
):
    """更新 Facebook 自動回應（透過外部 FB API）"""
    payload = {
        "firm_id": 1,
        "channel": "FB",
        "trigger_time": 0,
    }

    if data.page_id is not None:
        payload["page_id"] = data.page_id
    if data.trigger_type:
        payload["response_type"] = 2 if data.trigger_type == "keyword" else 3
    if data.is_active is not None:
        payload["enabled"] = data.is_active

    # 構建 keywords payload（帶 id 為編輯，無 id 為新增）
    if data.keywords is not None:
        payload["keywords"] = [
            {"id": kw.id, "name": kw.name} if kw.id else {"name": kw.name}
            for kw in data.keywords
        ]

    # 構建 text payload（帶 id 為編輯，無 id 為新增）
    if data.messages is not None:
        payload["text"] = [
            {
                "id": msg.id,
                "basic_id": msg.basic_id,
                "text": msg.text,
                "count": msg.count,
                "enabled": msg.enabled
            } if msg.id else {
                "text": msg.text,
                "enabled": msg.enabled
            }
            for msg in data.messages
        ]

    logger.info(f"Updating FB auto_template {fb_id}: {payload}")

    fb_client = FbMessageClient()
    result = await fb_client.update_auto_template(fb_id, payload, jwt_token)

    if not result.get("ok"):
        error_msg = result.get("error", "未知錯誤")
        logger.error(f"FB auto_template update failed: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"更新 Facebook 自動回應失敗: {error_msg}"
        )

    return SuccessResponse(message="更新成功")


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
    jwt_token: Optional[str] = Query(None, description="FB 渠道需要的 JWT token"),
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

    # ✅ 新架構：純 FB 自動回應不保存本地 DB，直接調用 FB API
    if channels and channels == ['Facebook']:
        logger.info("⚡ 純 FB 自動回應，只保存到外部 API，不保存本地 DB")

        if not jwt_token:
            raise HTTPException(
                status_code=400,
                detail="缺少 jwt_token，請先完成 Facebook 授權"
            )

        # 構建 FB API payload
        payload = {
            "firm_id": 1,
            "channel": "FB",
            "page_id": data.channel_id or "",
            "response_type": 2 if data.trigger_type == TriggerType.KEYWORD else 3,
            "enabled": data.is_active,
            "trigger_time": 0,
            "tags": keywords,
            "text": message_list,
        }

        logger.info(f"Creating FB-only auto_template: {payload}")

        # 調用 FB API
        fb_client = FbMessageClient()
        result = await fb_client.set_auto_template(payload, jwt_token)

        if not result.get("ok"):
            error_msg = result.get("error", "未知錯誤")
            logger.error(f"FB auto_template creation failed: {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=f"創建 Facebook 自動回應失敗: {error_msg}"
            )

        fb_id = result.get("data", {}).get("id") or result.get("id", 0)
        logger.info(f"✅ FB 自動回應創建成功，外部 ID: {fb_id}")

        return SuccessResponse(
            data={"id": f"fb-{fb_id}", "external_only": True},
            message="創建成功（已保存到 Facebook API）"
        )

    # ✅ LINE 或混合渠道：繼續保存到本地 DB
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

    # 若渠道包含 Facebook，先同步到外部 API（失敗則 rollback）
    if channels and 'Facebook' in channels:
        try:
            # 需要 flush 以確保關聯資料已建立，然後重新查詢載入
            await db.flush()
            result = await db.execute(
                select(AutoResponse)
                .options(
                    selectinload(AutoResponse.keyword_relations),
                    selectinload(AutoResponse.response_messages),
                )
                .where(AutoResponse.id == auto_response.id)
            )
            auto_response_with_relations = result.scalar_one()
            await _sync_fb_auto_template(auto_response_with_relations, jwt_token)
        except HTTPException:
            await db.rollback()
            raise

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
    jwt_token: Optional[str] = Query(None, description="FB 渠道需要的 JWT token"),
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
        # 編輯啟用中的歡迎訊息時，不排除自己（視為新版本需確認）
        # 只有編輯停用的歡迎訊息（並嘗試啟用）時，才排除自己
        exclude_id_for_check = auto_response_id if not auto_response.is_active else None
        existing_welcome = await _check_welcome_conflict(db, final_channel_id, exclude_id=exclude_id_for_check)
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
            # 只有當衝突的歡迎訊息不是當前正在編輯的記錄時才停用
            if existing_welcome.id != auto_response_id:
                existing_welcome.is_active = False
            # 如果是編輯自己，不需要額外操作，繼續正常儲存即可

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

    # 確定最終的 channels
    final_channels = data.channels if data.channels is not None else auto_response.channels

    # 若渠道包含 Facebook，先同步到外部 API（失敗則 rollback）
    if final_channels and 'Facebook' in final_channels:
        try:
            # 需要 flush 以確保關聯資料已更新，然後重新查詢載入
            await db.flush()
            result = await db.execute(
                select(AutoResponse)
                .options(
                    selectinload(AutoResponse.keyword_relations),
                    selectinload(AutoResponse.response_messages),
                )
                .where(AutoResponse.id == auto_response.id)
            )
            auto_response_with_relations = result.scalar_one()
            await _sync_fb_auto_template(auto_response_with_relations, jwt_token)
        except HTTPException:
            await db.rollback()
            raise

    await db.commit()
    await db.refresh(auto_response)

    # 如果是關鍵字類型或有更新關鍵字，重新檢測重複關鍵字
    if final_trigger_type == TriggerType.KEYWORD.value or data.keywords is not None:
        await _detect_and_mark_duplicate_keywords(db)
        await db.commit()

    return SuccessResponse(data={"id": auto_response.id}, message="更新成功")


@router.delete("/{auto_response_id}", response_model=SuccessResponse)
async def delete_auto_response(
    auto_response_id: str,
    jwt_token: Optional[str] = Query(None, description="FB 渠道需要的 JWT token"),
    db: AsyncSession = Depends(get_db)
):
    """刪除自動回應"""

    # FB-only auto-response (prefixed with "fb-")
    if auto_response_id.startswith("fb-"):
        return await _delete_fb_auto_response(auto_response_id, jwt_token)

    # Local DB auto-response
    return await _delete_local_auto_response(auto_response_id, jwt_token, db)


async def _delete_fb_auto_response(auto_response_id: str, jwt_token: Optional[str]) -> SuccessResponse:
    """刪除純 FB 自動回應 (ID 以 fb- 開頭)"""
    logger.info(f"Deleting FB auto-response: {auto_response_id}")

    if not jwt_token:
        raise HTTPException(status_code=400, detail="缺少 jwt_token，請先完成 Facebook 授權")

    basic_id = auto_response_id[3:]  # Remove "fb-" prefix
    fb_client = FbMessageClient()
    result = await fb_client.delete_template(basic_id, jwt_token)

    if not result.get("ok"):
        error_msg = result.get("error", "未知錯誤")
        logger.error(f"FB delete failed: {error_msg}")
        raise HTTPException(status_code=500, detail=f"刪除 Facebook 自動回應失敗: {error_msg}")

    logger.info(f"FB auto-response deleted: {auto_response_id}")
    return SuccessResponse(message="刪除成功（已從 Facebook API 刪除）")


async def _delete_local_auto_response(
    auto_response_id: str,
    jwt_token: Optional[str],
    db: AsyncSession
) -> SuccessResponse:
    """刪除本地 DB 自動回應"""
    try:
        auto_response_id_int = int(auto_response_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="無效的 auto_response_id 格式")

    result = await db.execute(select(AutoResponse).where(AutoResponse.id == auto_response_id_int))
    auto_response = result.scalar_one_or_none()

    if not auto_response:
        raise HTTPException(status_code=404, detail="自動回應不存在")

    # Sync delete to FB API if this auto-response includes Facebook channel
    await _sync_delete_fb_copy(auto_response, jwt_token)

    is_keyword_type = auto_response.trigger_type == TriggerType.KEYWORD.value

    await db.delete(auto_response)
    await db.commit()

    if is_keyword_type:
        await _detect_and_mark_duplicate_keywords(db)
        await db.commit()

    return SuccessResponse(message="刪除成功")


async def _sync_delete_fb_copy(auto_response: AutoResponse, jwt_token: Optional[str]) -> None:
    """嘗試同步刪除 FB API 副本 (僅對包含 Facebook 渠道的自動回應)"""
    has_facebook_channel = auto_response.channels and 'Facebook' in auto_response.channels
    if not has_facebook_channel:
        return

    if not jwt_token:
        logger.warning(
            f"Mixed-channel auto-response {auto_response.id} deleted from local DB, "
            "but missing jwt_token - cannot delete FB API copy"
        )
        return

    logger.info(f"Syncing delete to FB API for mixed-channel auto-response: {auto_response.id}")
    fb_client = FbMessageClient()
    fb_result = await fb_client.delete_template(str(auto_response.id), jwt_token)

    if not fb_result.get("ok"):
        logger.warning(
            f"FB API copy delete failed (auto_response_id={auto_response.id}): "
            f"{fb_result.get('error', '未知錯誤')}"
        )


@router.patch("/{auto_response_id}/toggle", response_model=SuccessResponse)
async def toggle_auto_response(
    auto_response_id: int,
    is_active: bool,
    force_activate: bool = False,
    jwt_token: Optional[str] = Query(None, description="FB 渠道需要的 JWT token"),
    db: AsyncSession = Depends(get_db)
):
    """切換自動回應狀態"""
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

    # 只有啟用時才需要檢查衝突
    if is_active:
        # 歡迎訊息衝突檢查
        if auto_response.trigger_type == TriggerType.WELCOME.value:
            existing = await _check_welcome_conflict(
                db, auto_response.channel_id, exclude_id=auto_response_id
            )
            if existing and not force_activate:
                return SuccessResponse(
                    data={
                        "conflict": True,
                        "conflict_type": "welcome",
                        "existing_id": existing.id,
                        "existing_name": existing.name,
                    },
                    message="系統目前已啟用中的歡迎訊息，是否切換至新的設定？"
                )
            elif existing and force_activate:
                existing.is_active = False

        # 一律回應日期區間衝突檢查
        if auto_response.trigger_type == TriggerType.FOLLOW.value:
            overlapping = await _check_always_date_overlap(
                db,
                auto_response.channel_id,
                auto_response.date_range_start,
                auto_response.date_range_end,
                exclude_id=auto_response_id
            )
            if overlapping and not force_activate:
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
            elif overlapping and force_activate:
                overlapping.is_active = False

    auto_response.is_active = is_active

    # 若渠道包含 Facebook，同步到外部 API（失敗則 rollback）
    if auto_response.channels and 'Facebook' in auto_response.channels:
        try:
            await _sync_fb_auto_template(auto_response, jwt_token)
        except HTTPException:
            await db.rollback()
            raise

    await db.commit()

    # 關鍵字類型切換狀態後重新檢測重複關鍵字
    if auto_response.trigger_type == TriggerType.KEYWORD.value:
        await _detect_and_mark_duplicate_keywords(db)
        await db.commit()

    return SuccessResponse(message="狀態更新成功")


@router.patch("/keywords/{keyword_id}/activate", response_model=SuccessResponse)
async def activate_keyword(
    keyword_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    激活指定的重複關鍵字，使其成為生效版本。
    其他相同關鍵字會被標記為 is_duplicate=True。
    """
    # 1. 查找目標關鍵字
    result = await db.execute(
        select(AutoResponseKeyword)
        .options(selectinload(AutoResponseKeyword.auto_response))
        .where(AutoResponseKeyword.id == keyword_id)
    )
    target_keyword = result.scalar_one_or_none()

    if not target_keyword:
        raise HTTPException(status_code=404, detail="關鍵字不存在")

    keyword_text = target_keyword.keyword.lower().strip()

    # 2. 查找所有相同文字的關鍵字（跨啟用的自動回應）
    query = (
        select(AutoResponseKeyword)
        .join(AutoResponse)
        .where(
            AutoResponse.trigger_type == TriggerType.KEYWORD.value,
            AutoResponse.is_active == True,
        )
    )
    result = await db.execute(query)
    all_keywords = result.scalars().all()

    # 3. 更新重複標記
    for kw in all_keywords:
        if kw.keyword.lower().strip() == keyword_text:
            if kw.id == keyword_id:
                kw.is_duplicate = False
            else:
                kw.is_duplicate = True

    await db.commit()

    return SuccessResponse(message="標籤已更新")
