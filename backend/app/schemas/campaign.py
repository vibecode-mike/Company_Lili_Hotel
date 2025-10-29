"""
活動推播相關 Schema
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from decimal import Decimal
from app.models.campaign import CampaignStatus, RecipientStatus


class CarouselItemCreate(BaseModel):
    """輪播項目創建"""

    image_url: Optional[str] = None  # 前端上傳後獲得的圖片 URL
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    action_url: Optional[str] = None
    interaction_tag: Optional[str] = None
    action_button_enabled: bool = False
    action_button_text: Optional[str] = None
    action_button_interaction_type: Optional[str] = None
    action_button_url: Optional[str] = None  # 動作按鈕網址
    action_button_trigger_message: Optional[str] = None  # 動作按鈕觸發訊息
    action_button_trigger_image_url: Optional[str] = None  # 動作按鈕觸發圖片URL
    action_button2_enabled: bool = False  # 第二個動作按鈕啟用狀態
    action_button2_text: Optional[str] = None  # 第二個動作按鈕文字
    action_button2_interaction_type: Optional[str] = None  # 第二個動作按鈕互動類型
    action_button2_url: Optional[str] = None  # 第二個動作按鈕網址
    action_button2_trigger_message: Optional[str] = None  # 第二個動作按鈕觸發訊息
    action_button2_trigger_image_url: Optional[str] = None  # 第二個動作按鈕觸發圖片URL
    image_aspect_ratio: str = "1:1"  # 圖片長寬比例
    image_click_action_type: str = "open_image"  # 圖片點擊動作類型
    image_click_action_value: Optional[str] = None  # 圖片點擊動作值
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

    # 圖片相關（單圖模式）
    image_url: Optional[str] = None  # 前端上傳後獲得的圖片 URL（主圖）
    interaction_type: Optional[str] = None
    interaction_tags: Optional[List[str]] = None  # 改為數組支持多標籤
    # url 字段已刪除，統一使用 action_button_* 字段
    trigger_message: Optional[str] = None
    trigger_image_url: Optional[str] = None  # 觸發圖片 URL

    # 訊息相關
    title: Optional[str] = None
    notification_text: str
    preview_text: str
    template_type: str

    # 發送相關
    target_audience: Union[str, Dict[str, Any]]  # 'all' 或包含詳細條件
    target_condition: Optional[str] = None  # 'include' 或 'exclude'
    target_tags: Optional[List[str]] = None  # 篩選標籤數組
    schedule_type: str  # 'immediate', 'scheduled', 'draft'
    scheduled_at: Optional[datetime] = None

    # 輪播相關（多圖模式）
    carousel_items: Optional[List[CarouselItemCreate]] = None

    # 進階觸發條件（可選，兼容舊資料結構）
    trigger_condition: Optional[Dict[str, Any]] = None


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
    interaction_tags: Optional[List[str]] = None  # 互動標籤數組
    platform: str = "LINE"  # 平台名稱（目前固定為 LINE）
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
