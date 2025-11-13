"""
消息模板相關 Schema
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


class CarouselItemBase(BaseModel):
    """輪播項基礎模型"""

    image_url: str
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    action_url: Optional[str] = None
    interaction_tag_id: Optional[int] = None
    sort_order: int = 0


class CarouselItemCreate(CarouselItemBase):
    """創建輪播項"""

    pass


class CarouselItemResponse(CarouselItemBase):
    """輪播項響應"""

    id: int

    class Config:
        from_attributes = True


class TemplateBase(BaseModel):
    """模板基礎模型"""

    template_type: Optional[str] = None  # Template01/Template02/Template03/Template04
    name: Optional[str] = None
    content: Optional[str] = None
    buttons: Optional[Dict[str, Any]] = None
    notification_text: Optional[str] = None
    preview_text: Optional[str] = None
    interaction_tag_id: Optional[int] = None
    interaction_result: Optional[Dict[str, Any]] = None


class TemplateCreate(TemplateBase):
    """創建模板"""

    carousel_items: Optional[List[CarouselItemCreate]] = None


class TemplateUpdate(TemplateBase):
    """更新模板"""

    carousel_items: Optional[List[CarouselItemCreate]] = None


class TemplateListItem(BaseModel):
    """模板列表項"""

    id: int
    name: Optional[str] = None
    template_type: Optional[str] = None  # Template01/Template02/Template03/Template04
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateDetail(TemplateBase):
    """模板詳情"""

    id: int
    carousel_items: List[CarouselItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateSearchParams(BaseModel):
    """模板搜索參數"""

    # 移除 type 篩選，該欄位已廢棄
    page: int = 1
    page_size: int = 20
