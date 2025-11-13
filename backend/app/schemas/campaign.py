"""
群發訊息相關 Schema (Message)
注意：原 campaigns 表已重命名為 messages（語意變更）
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, date, time
from decimal import Decimal


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


class MessageBase(BaseModel):
    """群發訊息基礎模型"""

    template_id: int
    message_content: Optional[str] = None  # 訊息內容（用於列表顯示）
    thumbnail: Optional[str] = None  # 縮圖 URL

    # 發送對象設定（兩欄位設計）
    target_type: str  # 所有好友/篩選目標對象
    target_filter: Optional[Dict[str, Any]] = None  # 篩選條件（JSON格式）

    # 排程設定（分開儲存）
    scheduled_date: Optional[date] = None  # 排程發送日期
    scheduled_time: Optional[time] = None  # 排程發送時間

    trigger_condition: Optional[Dict[str, Any]] = None  # 特定觸發條件


class MessageCreate(BaseModel):
    """創建群發訊息"""

    # 基本欄位
    template_id: int
    message_content: Optional[str] = None  # 訊息內容（用於列表顯示）
    thumbnail: Optional[str] = None  # 縮圖 URL

    # 圖片相關（單圖模式）
    image_url: Optional[str] = None  # 前端上傳後獲得的圖片 URL（主圖）
    interaction_type: Optional[str] = None
    interaction_tags: Optional[List[str]] = None  # 改為數組支持多標籤
    trigger_message: Optional[str] = None
    trigger_image_url: Optional[str] = None  # 觸發圖片 URL

    # 訊息相關
    notification_text: Optional[str] = None
    preview_text: Optional[str] = None
    template_type: Optional[str] = None  # Template01/Template02/Template03/Template04

    # 發送對象設定（兩欄位設計）
    target_type: str  # 所有好友/篩選目標對象
    target_filter: Optional[Dict[str, Any]] = None  # 篩選條件（JSON格式）

    # 兼容舊 API 的欄位
    target_audience: Optional[Union[str, Dict[str, Any]]] = None  # 'all' 或包含詳細條件（向後兼容）
    target_condition: Optional[str] = None  # 'include' 或 'exclude'（向後兼容）
    target_tags: Optional[List[str]] = None  # 篩選標籤數組（向後兼容）

    # 排程設定（分開儲存）
    schedule_type: str  # 'immediate', 'scheduled', 'draft'
    scheduled_date: Optional[date] = None  # 排程發送日期
    scheduled_time: Optional[time] = None  # 排程發送時間
    scheduled_at: Optional[datetime] = None  # 向後兼容（會被拆分成 date + time）

    # 輪播相關（多圖模式）
    carousel_items: Optional[List[CarouselItemCreate]] = None

    # 進階觸發條件
    trigger_condition: Optional[Dict[str, Any]] = None

    # Flex Message 支援
    flex_message_json: Optional[str] = None  # LINE Flex Message JSON 字串

    # 系統欄位
    campaign_id: Optional[int] = None  # 關聯活動ID（選填）
    estimated_send_count: int = 0  # 預計發送好友人數
    available_quota: int = 0  # 可用訊息配額用量


class MessageUpdate(MessageBase):
    """更新群發訊息"""

    template_id: Optional[int] = None  # 更新時可選
    target_type: Optional[str] = None  # 更新時可選
    failure_reason: Optional[str] = None  # 發送失敗原因


# 向後兼容：保留舊名稱作為別名
CampaignCreate = MessageCreate
CampaignUpdate = MessageUpdate


class TemplateInfo(BaseModel):
    """模板信息"""

    id: int
    type: str
    name: Optional[str] = None

    class Config:
        from_attributes = True


class MessageListItem(BaseModel):
    """群發訊息列表項"""

    id: int
    message_content: Optional[str] = None  # 訊息內容（用於列表顯示）
    thumbnail: Optional[str] = None  # 縮圖 URL
    template: TemplateInfo
    send_status: str  # 排程發送/已發送/草稿/發送失敗
    interaction_tags: Optional[List[str]] = None  # 互動標籤數組
    platform: str = "LINE"  # 平台名稱（目前固定為 LINE）
    send_count: int = 0  # 傳送人數
    open_count: int = 0  # 開啟次數（不重複）
    click_count: int = 0  # 點擊次數（不重複）
    open_rate: Optional[float] = None
    click_rate: Optional[float] = None
    scheduled_date: Optional[date] = None  # 排程發送日期
    scheduled_time: Optional[time] = None  # 排程發送時間
    send_time: Optional[datetime] = None  # 傳送時間
    created_at: datetime

    class Config:
        from_attributes = True


# 向後兼容：保留舊名稱作為別名
CampaignListItem = MessageListItem


class UserInfo(BaseModel):
    """用戶信息"""

    id: int
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class MessageDetail(MessageListItem):
    """群發訊息詳情"""

    template_id: int
    target_type: str  # 所有好友/篩選目標對象
    target_filter: Optional[Dict[str, Any]] = None  # 篩選條件（JSON格式）
    trigger_condition: Optional[Dict[str, Any]] = None
    failure_reason: Optional[str] = None  # 發送失敗原因
    campaign_id: Optional[int] = None  # 關聯活動ID（選填）
    created_by: Optional[UserInfo] = None
    estimated_send_count: int = 0  # 預計發送好友人數
    available_quota: int = 0  # 可用訊息配額用量

    # 向後兼容：保留 target_audience
    @property
    def target_audience(self) -> Dict[str, Any]:
        """向後兼容：轉換 target_type + target_filter 為 target_audience"""
        if self.target_type == "所有好友":
            return {"type": "all"}
        return self.target_filter or {}


# 向後兼容：保留舊名稱作為別名
CampaignDetail = MessageDetail


class MessageSearchParams(BaseModel):
    """群發訊息搜索參數"""

    send_status: Optional[str] = None  # 排程發送/已發送/草稿/發送失敗
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = 1
    page_size: int = 20


# 向後兼容：保留舊名稱作為別名
CampaignSearchParams = MessageSearchParams


class SendMessageResponse(BaseModel):
    """發送群發訊息響應"""

    message_id: int
    sent_count: int
    sent_at: datetime


# 向後兼容：保留舊名稱作為別名
SendCampaignResponse = SendMessageResponse


class RecipientListItem(BaseModel):
    """接收者列表項"""

    member: Dict[str, Any]
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    status: str  # pending/sent/opened/clicked/failed

    class Config:
        from_attributes = True
