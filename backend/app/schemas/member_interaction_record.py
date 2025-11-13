"""
會員互動記錄相關 Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MemberInteractionRecordBase(BaseModel):
    """會員互動記錄基礎模型"""

    member_id: int
    tag_id: int
    message_id: Optional[int] = None


class MemberInteractionRecordCreate(MemberInteractionRecordBase):
    """創建會員互動記錄"""

    pass


class MemberInteractionRecordListItem(BaseModel):
    """會員互動記錄列表項"""

    id: int
    member_id: int
    tag_id: int
    message_id: Optional[int] = None
    triggered_at: datetime

    class Config:
        from_attributes = True


class MemberInteractionRecordDetail(MemberInteractionRecordListItem):
    """會員互動記錄詳情"""

    pass


class InteractionSearchParams(BaseModel):
    """互動記錄搜索參數"""

    member_id: Optional[int] = None
    tag_id: Optional[int] = None
    message_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = 1
    page_size: int = 20
