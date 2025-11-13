"""
一對一訊息記錄相關 Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time


class MessageRecordBase(BaseModel):
    """一對一訊息記錄基礎模型"""

    member_id: int
    message_content: str
    message_type: str  # 純文字/圖片/訊息模板
    message_status: str = "未讀"  # 未讀/已讀/已回覆


class MessageRecordCreate(MessageRecordBase):
    """創建一對一訊息記錄"""

    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    sent_at: Optional[datetime] = None


class MessageRecordUpdate(BaseModel):
    """更新一對一訊息記錄"""

    message_status: Optional[str] = None
    replied_at: Optional[datetime] = None
    reply_content: Optional[str] = None


class MessageRecordListItem(BaseModel):
    """一對一訊息記錄列表項"""

    id: int
    member_id: int
    message_content: str
    message_type: str
    message_status: str
    sent_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MessageRecordDetail(MessageRecordListItem):
    """一對一訊息記錄詳情"""

    reply_content: Optional[str] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
