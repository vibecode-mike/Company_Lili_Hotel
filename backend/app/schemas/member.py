"""
會員相關 Schema
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from app.models.member import Gender, MemberSource


class TagInfo(BaseModel):
    """標籤信息"""

    id: int
    name: str
    type: str

    class Config:
        from_attributes = True


class MemberBase(BaseModel):
    """會員基礎模型"""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[Gender] = None
    birthday: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    id_number: Optional[str] = None
    accept_marketing: bool = True


class MemberCreate(MemberBase):
    """創建會員"""

    pass


class MemberUpdate(MemberBase):
    """更新會員"""

    notes: Optional[str] = None


class MemberListItem(BaseModel):
    """會員列表項"""

    id: int
    line_uid: Optional[str] = None
    line_display_name: Optional[str] = None
    line_picture_url: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    tags: List[TagInfo] = []
    created_at: datetime
    last_interaction_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MemberDetail(MemberListItem):
    """會員詳情"""

    gender: Optional[Gender] = None
    birthday: Optional[date] = None
    id_number: Optional[str] = None
    source: MemberSource
    accept_marketing: bool = True
    notes: Optional[str] = None


class MemberSearchParams(BaseModel):
    """會員搜索參數"""

    search: Optional[str] = None  # 姓名/Email/手機
    tags: Optional[str] = None  # 標籤ID列表（逗號分隔）
    source: Optional[MemberSource] = None
    sort_by: str = "last_interaction_at"
    order: str = "desc"
    page: int = 1
    page_size: int = 20


class AddTagsRequest(BaseModel):
    """添加標籤請求"""

    tag_ids: List[int]


class UpdateNotesRequest(BaseModel):
    """更新備註請求"""

    notes: str
