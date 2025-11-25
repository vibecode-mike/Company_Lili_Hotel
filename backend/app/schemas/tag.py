"""
標籤相關 Schema
"""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re


class TagNameValidator:
    """標籤名稱驗證器

    格式限制：
    - 長度不得超過 20 個字元（中英文皆計算，每個字元計 1）
    - 僅允許中文（\\u4e00-\\u9fa5）、英文（a-zA-Z）、數字（0-9）、空格
    - 禁止特殊字元與 Emoji
    """

    TAG_NAME_PATTERN = re.compile(r'^[\u4e00-\u9fa5a-zA-Z0-9\s]+$')
    MAX_LENGTH = 20

    @classmethod
    def validate_tag_name(cls, value: str) -> str:
        """驗證標籤名稱"""
        if not value:
            raise ValueError('標籤名稱不得為空')

        # 去除首尾空格
        value = value.strip()

        if not value:
            raise ValueError('標籤名稱不得為空')

        # 檢查長度
        if len(value) > cls.MAX_LENGTH:
            raise ValueError(f'標籤名稱不得超過 {cls.MAX_LENGTH} 個字元')

        # 檢查格式
        if not cls.TAG_NAME_PATTERN.match(value):
            raise ValueError('標籤名稱僅允許中文、英文、數字和空格')

        return value


class TagBase(BaseModel):
    """標籤基礎模型"""

    tag_name: str
    tag_source: Optional[str] = None

    @field_validator('tag_name')
    @classmethod
    def validate_tag_name(cls, v: str) -> str:
        return TagNameValidator.validate_tag_name(v)


class MemberTagCreate(TagBase):
    """創建會員標籤"""

    member_id: int
    message_id: Optional[int] = None


class MemberTagUpdate(BaseModel):
    """更新會員標籤"""

    tag_name: Optional[str] = None
    tag_source: Optional[str] = None

    @field_validator('tag_name')
    @classmethod
    def validate_tag_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return TagNameValidator.validate_tag_name(v)
        return v


class InteractionTagCreate(TagBase):
    """創建互動標籤"""

    pass


class InteractionTagUpdate(BaseModel):
    """更新互動標籤"""

    tag_name: Optional[str] = None
    tag_source: Optional[str] = None

    @field_validator('tag_name')
    @classmethod
    def validate_tag_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return TagNameValidator.validate_tag_name(v)
        return v


class TagListItem(BaseModel):
    """標籤列表項"""

    id: int
    tag_name: str
    tag_source: Optional[str] = None
    trigger_count: int = 0
    trigger_member_count: int = 0
    last_triggered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TagDetail(TagListItem):
    """標籤詳情"""

    updated_at: Optional[datetime] = None


class TagSearchParams(BaseModel):
    """標籤搜索參數"""

    search: Optional[str] = None
    tag_source: Optional[str] = None
    sort_by: str = "trigger_count"
    order: str = "desc"
    page: int = 1
    page_size: int = 20


class MemberInteractionTagCreate(TagBase):
    """創建會員互動標籤"""

    member_id: int
    message_id: Optional[int] = None


class MemberInteractionTagUpdate(BaseModel):
    """更新會員互動標籤"""

    tag_name: Optional[str] = None
    tag_source: Optional[str] = None

    @field_validator('tag_name')
    @classmethod
    def validate_tag_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return TagNameValidator.validate_tag_name(v)
        return v
