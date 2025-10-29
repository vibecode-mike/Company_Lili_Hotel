"""
追蹤相關的 Pydantic Schema
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TrackInteractionRequest(BaseModel):
    """記錄互動請求"""

    line_uid: str = Field(..., description="LINE 用戶 UID")
    campaign_id: int = Field(..., description="活動 ID")
    interaction_type: str = Field(..., description="互動類型：image_click, button_message, button_url, button_image, postback")
    template_id: Optional[int] = Field(None, description="模板 ID")
    carousel_item_id: Optional[int] = Field(None, description="輪播圖卡片 ID")
    component_slot: Optional[str] = Field(None, description="模板元件槽位（如：hero_image, card_button_primary）")
    interaction_tag_id: Optional[int] = Field(None, description="互動標籤 ID")
    interaction_value: Optional[str] = Field(None, description="互動值（URL、訊息等）")
    line_event_type: Optional[str] = Field(None, description="LINE 事件類型")
    user_agent: Optional[str] = Field(None, description="用戶代理")

    class Config:
        json_schema_extra = {
            "example": {
                "line_uid": "U1234567890abcdef",
                "campaign_id": 1,
                "interaction_type": "image_click",
                "template_id": 10,
                "carousel_item_id": 5,
                "component_slot": "hero_image",
                "interaction_tag_id": 3,
                "interaction_value": "https://example.com",
                "line_event_type": "message",
                "user_agent": "LINE/iOS"
            }
        }


class TrackInteractionResponse(BaseModel):
    """記錄互動回應"""

    code: int = 200
    message: str = "記錄成功"
    data: dict


class CampaignStatisticsResponse(BaseModel):
    """活動統計回應"""

    campaign_id: int
    total_interactions: int
    unique_members: int
    interactions_by_type: dict
    carousel_stats: list
    component_stats: list
    generated_at: datetime
