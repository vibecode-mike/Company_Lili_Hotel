"""
會員相關 Schema
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date


class TagInfo(BaseModel):
    """標籤信息"""

    id: int
    name: str
    type: str

    class Config:
        from_attributes = True


class MemberBase(BaseModel):
    """會員基礎模型"""

    name: Optional[str] = None  # 統一單欄位
    gender: Optional[str] = None  # 0=不透漏/1=男/2=女
    birthday: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    id_number: Optional[str] = None
    passport_number: Optional[str] = None
    residence: Optional[str] = None  # 新增居住地
    receive_notification: Optional[bool] = True


class MemberCreate(MemberBase):
    """創建會員"""

    pass


class MemberUpdate(MemberBase):
    """更新會員"""

    internal_note: Optional[str] = None  # 改名為 internal_note


class MemberListItem(BaseModel):
    """會員列表項"""

    id: int
    line_uid: Optional[str] = None
    line_name: Optional[str] = None  # 改名為 line_name
    line_avatar: Optional[str] = None  # 改名為 line_avatar
    name: Optional[str] = None  # 統一單欄位
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    tags: List[TagInfo] = []
    created_at: datetime
    last_interaction_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MemberDetail(MemberListItem):
    """會員詳情"""

    gender: Optional[str] = None  # 0=不透漏/1=男/2=女
    birthday: Optional[date] = None
    id_number: Optional[str] = None
    passport_number: Optional[str] = None
    residence: Optional[str] = None  # 新增居住地
    join_source: str = "LINE"  # 改名為 join_source
    receive_notification: Optional[bool] = True
    internal_note: Optional[str] = None  # 改名為 internal_note


class MemberSearchParams(BaseModel):
    """會員搜索參數"""

    search: Optional[str] = None  # 姓名/Email/手機
    tags: Optional[str] = None  # 標籤ID列表（逗號分隔）
    join_source: Optional[str] = None  # LINE/CRM/PMS/ERP/系統
    sort_by: str = "last_interaction_at"
    order: str = "desc"
    page: int = 1
    page_size: int = 20


class AddTagsRequest(BaseModel):
    """添加標籤請求"""

    tag_ids: List[str]  # 標籤名稱列表


class UpdateTagsRequest(BaseModel):
    """批量更新標籤請求"""

    tag_names: List[str]  # 完整的標籤名稱列表（會完全取代現有標籤）


class BatchUpdateTagsRequest(BaseModel):
    """批量更新會員標籤請求（原子操作，保留 click_count）"""

    member_tags: List[str] = []  # 會員標籤名稱列表
    interaction_tags: List[str] = []  # 互動標籤名稱列表

    class Config:
        json_schema_extra = {
            "example": {
                "member_tags": ["VIP", "常客"],
                "interaction_tags": ["已點擊優惠", "參與活動"]
            }
        }


class UpdateNotesRequest(BaseModel):
    """更新備註請求"""

    internal_note: str  # 改名為 internal_note
