"""
聊天紀錄 API
用於會員管理頁面的一對一聊天記錄查詢
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime
import logging

from app.database import get_db
from app.schemas.common import SuccessResponse
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

        # 無法解析，返回原始內容前100字
        return str(message_content)[:100]

    except (json.JSONDecodeError, TypeError, KeyError) as e:
        logger.warning(f"無法解析消息內容: {e}")
        # 如果解析失敗，返回原始內容前100字
        return str(message_content)[:100]


# Schema 定義
from pydantic import BaseModel

class ChatMessage(BaseModel):
    """聊天消息"""
    id: int
    type: str  # 'user' | 'official'
    text: str
    time: str  # "上午 03:30"
    isRead: bool = False

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
    db: AsyncSession = Depends(get_db),
):
    """
    獲取會員的聊天紀錄

    從 message_records 表查詢該會員的歷史對話
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
        from sqlalchemy import func, text

        logger.info(f"📖 獲取會員聊天紀錄: member_id={member_id}, page={page}, page_size={page_size}")

        # 計算總數
        count_query = text("""
            SELECT COUNT(*) as total
            FROM message_records
            WHERE member_id = :member_id
        """)
        count_result = await db.execute(count_query, {"member_id": member_id})
        total = count_result.scalar() or 0

        # 計算分頁
        offset = (page - 1) * page_size
        has_more = (offset + page_size) < total

        # 查詢聊天紀錄
        query = text("""
            SELECT
                id,
                direction,
                message_content,
                message_status,
                created_at
            FROM message_records
            WHERE member_id = :member_id
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)

        result = await db.execute(
            query,
            {
                "member_id": member_id,
                "limit": page_size,
                "offset": offset
            }
        )
        records = result.fetchall()

        # 轉換為前端格式
        messages = []
        for record in records:
            # 格式化時間
            created_at = record.created_at if hasattr(record, 'created_at') else record[4]
            time_str = format_chat_time(created_at)

            # 判斷消息類型
            direction = record.direction if hasattr(record, 'direction') else record[1]
            msg_type = 'user' if direction == 'incoming' else 'official'

            # 判斷是否已讀
            status = record.message_status if hasattr(record, 'message_status') else record[3]
            is_read = status == '已讀' if status else False

            # 獲取消息內容
            content = record.message_content if hasattr(record, 'message_content') else record[2]

            # 解析並提取實際的消息文字
            text_content = extract_message_text(content) if content else ''

            # 獲取 ID
            msg_id = record.id if hasattr(record, 'id') else record[0]

            messages.append(ChatMessage(
                id=msg_id,
                type=msg_type,
                text=text_content,
                time=time_str,
                isRead=is_read
            ))

        logger.info(f"✅ 成功獲取 {len(messages)} 筆聊天紀錄（共 {total} 筆）")

        return SuccessResponse(
            data=ChatMessagesResponse(
                messages=messages,
                total=total,
                page=page,
                page_size=page_size,
                has_more=has_more
            ).model_dump()
        )

    except Exception as e:
        logger.error(f"❌ 獲取聊天紀錄失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"獲取聊天紀錄失敗: {str(e)}")


def format_chat_time(dt: datetime) -> str:
    """
    格式化聊天時間為 "上午/下午 HH:mm" 格式

    Args:
        dt: datetime 對象

    Returns:
        格式化的時間字串，例如 "下午 03:30"
    """
    if not dt:
        return ""

    hour = dt.hour
    minute = dt.minute

    # 判斷上午/下午
    period = "上午" if hour < 12 else "下午"

    # 轉換為 12 小時制
    display_hour = hour if hour <= 12 else hour - 12
    if display_hour == 0:
        display_hour = 12

    return f"{period} {display_hour:02d}:{minute:02d}"
