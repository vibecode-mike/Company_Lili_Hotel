"""
聊天紀錄 API
用於會員管理頁面的一對一聊天記錄查詢
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import logging

from app.database import get_db
from app.models.member import Member
from app.schemas.common import SuccessResponse
from app.services.chatroom_service import ChatroomService
import json

logger = logging.getLogger(__name__)

router = APIRouter()


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

        member_query = select(Member).where(Member.id == member_id)
        member_result = await db.execute(member_query)
        member = member_result.scalar_one_or_none()

        if not member:
            raise HTTPException(status_code=404, detail="會員不存在")

        chatroom_service = ChatroomService(db)
        resolved_platform = _resolve_platform(platform)

        result = await chatroom_service.get_messages(member, resolved_platform, page, page_size)

        messages = []
        for record in result["messages"]:
            ts_raw = record.get("timestamp")
            created_at = datetime.fromisoformat(ts_raw) if ts_raw else None
            time_str = format_chat_time(created_at)
            text_content = extract_message_text(record.get("text", "")) if record.get("text") else ""

            messages.append(ChatMessage(
                id=record["id"],
                type=record["type"],
                text=text_content,
                time=time_str,
                timestamp=record.get("timestamp"),
                isRead=record.get("isRead", False),
                source=record.get("source"),
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


def _resolve_platform_uid(member: Member, platform: str) -> str:
    if platform == "LINE":
        if not member.line_uid:
            raise HTTPException(status_code=400, detail="會員未綁定 LINE 帳號")
        return member.line_uid
    if platform == "Facebook":
        if not member.fb_uid:
            raise HTTPException(status_code=400, detail="會員未綁定 Facebook 帳號")
        return member.fb_uid
    if platform == "Webchat":
        if not member.webchat_uid:
            raise HTTPException(status_code=400, detail="會員未綁定 Webchat")
        return member.webchat_uid
    raise HTTPException(status_code=400, detail="不支援的渠道平台")


def format_chat_time(dt: datetime) -> str:
    """
    格式化聊天時間為 "時段 HH:mm" 格式

    時段分類：
    - 凌晨: 00:00-05:59
    - 上午: 06:00-11:59
    - 中午: 12:00-13:59
    - 下午: 14:00-17:59
    - 晚上: 18:00-23:59

    Args:
        dt: datetime 對象

    Returns:
        格式化的時間字串，例如 "下午 03:30"
    """
    if not dt:
        return ""

    hour = dt.hour
    minute = dt.minute

    # 判斷時段
    if 0 <= hour < 6:
        period = "凌晨"
    elif 6 <= hour < 12:
        period = "上午"
    elif 12 <= hour < 14:
        period = "中午"
    elif 14 <= hour < 18:
        period = "下午"
    else:  # 18-23
        period = "晚上"

    # 轉換為 12 小時制
    display_hour = hour if hour <= 12 else hour - 12
    if display_hour == 0:
        display_hour = 12

    return f"{period} {display_hour:02d}:{minute:02d}"
