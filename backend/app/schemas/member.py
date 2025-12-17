"""
會員相關 Schema
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
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
    gpt_enabled: Optional[bool] = True


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
    line_display_name: Optional[str] = None
    line_avatar: Optional[str] = None  # 改名為 line_avatar
    channel_id: Optional[str] = None  # LINE channel ID
    name: Optional[str] = None  # 統一單欄位
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    join_source: str = "LINE"  # 加入來源：LINE/CRM/PMS/ERP/系統
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
    gpt_enabled: Optional[bool] = True
    internal_note: Optional[str] = None  # 改名為 internal_note


class MemberSearchParams(BaseModel):
    """會員搜索參數"""

    search: Optional[str] = Field(
        None,
        max_length=100,
        description="姓名/Email/手機搜索關鍵字",
        examples=["張三", "test@example.com", "0912345678"]
    )
    tags: Optional[str] = Field(
        None,
        max_length=500,
        description="標籤名稱列表（逗號分隔）",
        examples=["VIP,新客戶"]
    )
    join_source: Optional[str] = Field(
        None,
        pattern="^(LINE|CRM|PMS|ERP|系統)$",
        description="加入來源篩選"
    )
    sort_by: str = Field(
        "last_interaction_at",
        pattern="^(last_interaction_at|created_at)$",
        description="排序欄位"
    )
    order: str = Field(
        "desc",
        pattern="^(asc|desc)$",
        description="排序方向"
    )
    page: int = Field(1, ge=1, le=10000, description="頁碼")
    page_size: int = Field(20, ge=1, le=200, description="每頁數量")

    @field_validator('search')
    @classmethod
    def validate_search(cls, v: Optional[str]) -> Optional[str]:
        """驗證搜索輸入"""
        if v is None:
            return None

        from app.utils.validators import InputValidator
        try:
            return InputValidator.sanitize_search_input(v)
        except ValueError as e:
            raise ValueError(f"搜索參數無效: {str(e)}")

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[str]) -> Optional[str]:
        """驗證標籤列表"""
        if v is None:
            return None

        from app.utils.validators import InputValidator

        # 分割標籤並驗證每個標籤
        tag_list = [tag.strip() for tag in v.split(',') if tag.strip()]

        if len(tag_list) > 20:
            raise ValueError("標籤數量不能超過 20 個")

        validated_tags = []
        for tag in tag_list:
            try:
                validated_tag = InputValidator.sanitize_tag_name(tag)
                if validated_tag:
                    validated_tags.append(validated_tag)
            except ValueError as e:
                raise ValueError(f"標籤 '{tag}' 無效: {str(e)}")

        return ','.join(validated_tags) if validated_tags else None


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
