"""
活動管理相關 Schema（新 Campaign 表）
注意：此為活動管理表，與群發訊息（messages）分離
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class CampaignBase(BaseModel):
    """活動管理基礎模型"""

    campaign_name: str
    campaign_tag: Optional[str] = None
    campaign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CampaignCreateNew(CampaignBase):
    """創建活動"""

    pass


class CampaignUpdateNew(BaseModel):
    """更新活動"""

    campaign_name: Optional[str] = None
    campaign_tag: Optional[str] = None
    campaign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CampaignListItemNew(BaseModel):
    """活動列表項"""

    id: int
    campaign_name: str
    campaign_tag: Optional[str] = None
    campaign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignDetailNew(CampaignListItemNew):
    """活動詳情"""

    updated_at: Optional[datetime] = None


class CampaignSearchParams(BaseModel):
    """活動搜索參數"""

    campaign_tag: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    page: int = 1
    page_size: int = 20
