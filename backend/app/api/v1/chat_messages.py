"""
聊天紀錄 API
用於會員管理頁面的一對一聊天記錄查詢
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone
import logging

from app.database import get_db
from app.models.member import Member
from app.models.fb_channel import FbChannel
from app.schemas.common import SuccessResponse
from app.services.chatroom_service import ChatroomService, format_chat_time
from app.clients.fb_message_client import FbMessageClient
import json

logger = logging.getLogger(__name__)

router = APIRouter()


def _ensure_utc(dt: datetime) -> datetime:
    """Treat naive datetimes as UTC and return an aware UTC datetime."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_iso_datetime(value: str) -> Optional[datetime]:
    """
    Parse an ISO datetime string into an aware UTC datetime.
    - Accepts strings ending with 'Z'
    - Treats naive strings as UTC
    """
    if not value:
        return None
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    try:
        return _ensure_utc(datetime.fromisoformat(normalized))
    except ValueError:
        return None


def format_iso_utc(dt: Optional[datetime]) -> Optional[str]:
    if not dt:
        return None
    return _ensure_utc(dt).isoformat()


def extract_message_text(message_content: str) -> str:
    """
    從 message_content JSON 中提取實際的訊息文字

    Args:
        message_content: JSON 字串格式的消息內容

    Returns:
        提取的文字內容，如果無法解析則返回原始內容
    """
    try:
        # 嘗試解析 JSON
        data = json.loads(message_content) if isinstance(message_content, str) else message_content

        # 處理 campaign 格式: {"campaign_id": X, "payload": {...}}
        if isinstance(data, dict) and 'payload' in data:
            payload = data['payload']

            # 優先使用 alt_text（通常是簡潔的摘要）
            if 'alt_text' in payload:
                return payload['alt_text']

            # 否則嘗試從 flex_message_json 中提取文字
            if 'flex_message_json' in payload:
                flex_msg = payload['flex_message_json']

                # 從 body.contents 中提取文字
                if isinstance(flex_msg, dict) and 'body' in flex_msg:
                    body = flex_msg['body']
                    if 'contents' in body and isinstance(body['contents'], list):
                        texts = []
                        for content in body['contents']:
                            if isinstance(content, dict) and content.get('type') == 'text':
                                text = content.get('text', '')
                                if text:
                                    texts.append(text)
                        if texts:
                            return ' '.join(texts)

        # 如果是簡單文字訊息
        if isinstance(data, dict) and 'text' in data:
            return data['text']

        # 如果是純文字
        if isinstance(data, str):
            return data

        # 無法解析，返回原始內容（完整）
        return str(message_content)

    except (json.JSONDecodeError, TypeError, KeyError) as e:
        logger.warning(f"無法解析消息內容: {e}")
        # 如果解析失敗，返回原始內容（完整）
        return str(message_content)


# Schema 定義
from pydantic import BaseModel

class ChatMessage(BaseModel):
    """聊天消息"""
    id: str  # UUID in conversation_messages
    type: str  # 'user' | 'official'
    text: str
    time: str  # "上午 03:30"
    timestamp: Optional[str] = None  # ISO 格式完整時間戳，用於日期顯示
    isRead: bool = False
    source: Optional[str] = None  # 'manual' | 'gpt' | 'keyword' | 'welcome' | 'always'
    senderName: Optional[str] = None  # 發送人員名稱：manual 顯示人員名稱，其他顯示「系統」
    messageType: Optional[str] = None  # 'text' | 'chat' | 'room_cards' 等
    roomCards: Optional[List[dict]] = None  # messageType='room_cards' 時填入房卡資料

    class Config:
        from_attributes = True


class ChatMessagesResponse(BaseModel):
    """聊天消息列表響應"""
    messages: List[ChatMessage]
    total: int
    page: int
    page_size: int
    has_more: bool


@router.get("/members/{member_id}/chat-messages", response_model=SuccessResponse)
async def get_chat_messages(
    member_id: int,
    page: int = Query(1, ge=1, description="頁碼"),
    page_size: int = Query(50, ge=1, le=100, description="每頁筆數"),
    platform: Optional[str] = Query(None, description="渠道：LINE/Facebook/Webchat"),
    jwt_token: Optional[str] = Query(None, description="FB 渠道需要的 JWT token"),
    db: AsyncSession = Depends(get_db),
):
    """
    獲取會員的聊天紀錄

    從 conversation_messages 表查詢該會員的歷史對話
    透過 member.line_uid 作為 thread_id 查詢
    按 created_at 降序排列（最新在前）

    Args:
        member_id: 會員 ID
        page: 頁碼（預設 1）
        page_size: 每頁筆數（預設 50，最大 100）
        db: 數據庫 session

    Returns:
        聊天消息列表
    """
    try:
        logger.info(f"📖 獲取會員聊天紀錄: member_id={member_id}, page={page}, page_size={page_size}")

        resolved_platform = _resolve_platform(platform)
        member = await _resolve_member_by_platform(db, member_id, resolved_platform)

        if not member:
            raise HTTPException(status_code=404, detail="會員不存在")

        chatroom_service = ChatroomService(db)

        # Facebook 渠道：從外部 API 獲取聊天記錄
        if resolved_platform == "Facebook":
            if not jwt_token:
                raise HTTPException(status_code=400, detail="缺少 jwt_token")

            # 查詢 active FbChannel 取得 page_id
            fb_channel_result = await db.execute(
                select(FbChannel.page_id).where(FbChannel.is_active == True).limit(1)
            )
            page_id = fb_channel_result.scalar()

            if not page_id:
                raise HTTPException(status_code=400, detail="未設定 Facebook 粉絲專頁")

            fb_client = FbMessageClient()
            fb_result = await fb_client.get_chat_history(member.fb_customer_id, page_id, jwt_token)

            if not fb_result.get("ok"):
                raise HTTPException(status_code=500, detail=f"獲取 FB 聊天記錄失敗: {fb_result.get('error')}")

            # 轉換外部 API 格式為內部格式
            messages = []
            for idx, item in enumerate(fb_result.get("data", [])):
                direction_raw = (item.get("direction") or "outgoing").lower()
                is_incoming = direction_raw in {"ingoing", "incoming"}
                msg_content = item.get("message", "")
                timestamp = item.get("time", 0)

                # 解析訊息內容
                if isinstance(msg_content, dict):
                    # Template 訊息：提取標題或 subtitle
                    text = _extract_fb_template_text(msg_content)
                else:
                    text = str(msg_content)

                # 轉換時間戳（epoch 秒 -> UTC）
                dt = datetime.fromtimestamp(timestamp, tz=timezone.utc) if timestamp else None
                time_str = format_chat_time(dt)

                messages.append(ChatMessage(
                    id=f"fb_{idx}_{timestamp}",
                    type="user" if is_incoming else "official",
                    text=text,
                    time=time_str,
                    timestamp=format_iso_utc(dt),
                    isRead=True,
                    source="external" if not is_incoming else None,
                ))

            # FB 訊息按時間正序排列
            messages.sort(key=lambda m: m.timestamp or "")

            logger.info(f"✅ 成功獲取 {len(messages)} 筆 FB 聊天紀錄")

            return SuccessResponse(
                data=ChatMessagesResponse(
                    messages=messages,
                    total=len(messages),
                    page=1,
                    page_size=len(messages),
                    has_more=False
                ).model_dump()
            )

        # LINE/Webchat：從本地資料庫獲取
        result = await chatroom_service.get_messages(member, resolved_platform, page, page_size)

        messages = []
        for record in result["messages"]:
            ts_raw = record.get("timestamp")
            created_at = parse_iso_datetime(ts_raw) if ts_raw else None
            time_str = format_chat_time(created_at)
            text_content = extract_message_text(record.get("text", "")) if record.get("text") else ""

            messages.append(ChatMessage(
                id=record["id"],
                type=record["type"],
                text=text_content,
                time=time_str,
                timestamp=format_iso_utc(created_at) if created_at else record.get("timestamp"),
                isRead=record.get("isRead", False),
                source=record.get("source"),
                senderName=record.get("senderName"),
                messageType=record.get("messageType"),
                roomCards=record.get("roomCards"),
            ))

        logger.info(f"✅ 成功獲取 {len(messages)} 筆聊天紀錄（共 {result['total']} 筆）")

        return SuccessResponse(
            data=ChatMessagesResponse(
                messages=messages,
                total=result["total"],
                page=page,
                page_size=page_size,
                has_more=result["has_more"]
            ).model_dump()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 獲取聊天紀錄失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"獲取聊天紀錄失敗: {str(e)}")


def _resolve_platform(request_platform: Optional[str]) -> str:
    if request_platform is None:
        return "LINE"
    normalized = request_platform.strip()
    allowed = {"LINE", "Facebook", "Webchat"}
    if normalized not in allowed:
        raise HTTPException(status_code=400, detail="不支援的渠道平台")
    return normalized


async def _resolve_member_by_platform(
    db: AsyncSession,
    member_id: int,
    platform: str,
) -> Optional[Member]:
    if platform == "Facebook":
        result = await db.execute(select(Member).where(Member.fb_customer_id == str(member_id)))
        member = result.scalar_one_or_none()
        if member:
            return member
    result = await db.execute(select(Member).where(Member.id == member_id))
    return result.scalar_one_or_none()


def _resolve_platform_uid(member: Member, platform: str) -> str:
    if platform == "LINE":
        if not member.line_uid:
            raise HTTPException(status_code=400, detail="會員未綁定 LINE 帳號")
        return member.line_uid
    if platform == "Facebook":
        if not member.fb_customer_id:
            raise HTTPException(status_code=400, detail="會員未綁定 Facebook 帳號")
        return member.fb_customer_id
    if platform == "Webchat":
        if not member.webchat_uid:
            raise HTTPException(status_code=400, detail="會員未綁定 Webchat")
        return member.webchat_uid
    raise HTTPException(status_code=400, detail="不支援的渠道平台")


def _extract_fb_template_text(msg_content: dict) -> str:
    """
    從 FB Template 訊息中提取文字

    FB Template 訊息格式：
    {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {"title": "標題", "subtitle": "副標題", ...}
                ]
            }
        }
    }

    Args:
        msg_content: FB 訊息內容 (dict)

    Returns:
        提取的文字內容
    """
    try:
        # 嘗試從 attachment.payload.elements 中提取
        attachment = msg_content.get("attachment", {})
        payload = attachment.get("payload", {})
        elements = payload.get("elements", [])

        if elements:
            first_element = elements[0]
            title = first_element.get("title", "")
            subtitle = first_element.get("subtitle", "")
            return f"{title} - {subtitle}" if subtitle else title

        # 如果有 text 欄位
        if msg_content.get("text"):
            return msg_content["text"]

        return "[圖文訊息]"
    except Exception:
        return "[圖文訊息]"
