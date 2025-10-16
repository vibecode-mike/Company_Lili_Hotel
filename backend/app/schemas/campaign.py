"""
活動推播相關 Schema
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal
from app.models.campaign import CampaignStatus, RecipientStatus


class CarouselItemCreate(BaseModel):
    """輪播項目創建"""

    image_path: str
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    action_url: Optional[str] = None
    interaction_tag: Optional[str] = None
    action_button_enabled: bool = False
    action_button_text: Optional[str] = None
    action_button_interaction_type: Optional[str] = None
    sort_order: int = 0


class CampaignBase(BaseModel):
    """活動基礎模型"""

    title: str
    template_id: Optional[int] = None
    target_audience: Dict[str, Any]
    trigger_condition: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[datetime] = None


class CampaignCreate(BaseModel):
    """創建活動"""

    # 圖片相關
    image_path: Optional[str] = None
    interaction_type: Optional[str] = None
    interaction_tag: Optional[str] = None
    url: Optional[str] = None
    trigger_message: Optional[str] = None
    trigger_image_path: Optional[str] = None

    # 訊息相關
    title: Optional[str] = None
    notification_text: str
    preview_text: str
    template_type: str

    # 發送相關
    target_audience: str
    target_tags: Optional[List[str]] = None
    schedule_type: str
    scheduled_at: Optional[datetime] = None

    # 輪播相關
    carousel_items: Optional[List[CarouselItemCreate]] = None


class CampaignUpdate(CampaignBase):
    """更新活動"""

    pass


class TemplateInfo(BaseModel):
    """模板信息"""

    id: int
    type: str
    name: Optional[str] = None

    class Config:
        from_attributes = True


class CampaignListItem(BaseModel):
    """活動列表項"""

    id: int
    title: str
    template: TemplateInfo
    status: CampaignStatus
    sent_count: int
    opened_count: int
    clicked_count: int
    open_rate: Optional[float] = None
    click_rate: Optional[float] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserInfo(BaseModel):
    """用戶信息"""

    id: int
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class CampaignDetail(CampaignListItem):
    """活動詳情"""

    template_id: int
    target_audience: Dict[str, Any]
    trigger_condition: Optional[Dict[str, Any]] = None
    created_by: Optional[UserInfo] = None


class CampaignSearchParams(BaseModel):
    """活動搜索參數"""

    status: Optional[CampaignStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = 1
    page_size: int = 20


class SendCampaignResponse(BaseModel):
    """發送活動響應"""

    campaign_id: int
    sent_count: int
    sent_at: datetime


class RecipientListItem(BaseModel):
    """接收者列表項"""

    member: Dict[str, Any]
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    status: RecipientStatus

    class Config:
        from_attributes = True
