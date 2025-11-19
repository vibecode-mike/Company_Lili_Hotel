"""
LINE 頻道設定 Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LineChannelBase(BaseModel):
    """LINE 頻道基礎 Schema"""

    channel_id: Optional[str] = Field(None, max_length=100, description="Messaging API Channel ID")
    channel_access_token: Optional[str] = Field(None, max_length=500, description="頻道存取權杖")
    channel_secret: Optional[str] = Field(None, max_length=100, description="頻道密鑰")
    login_channel_id: Optional[str] = Field(None, max_length=100, description="LINE Login Channel ID")
    login_channel_secret: Optional[str] = Field(None, max_length=100, description="LINE Login Channel Secret")
    channel_name: Optional[str] = Field(None, max_length=100, description="頻道名稱")
    is_active: Optional[bool] = Field(True, description="是否啟用")


class LineChannelCreate(LineChannelBase):
    """創建 LINE 頻道設定"""

    channel_access_token: str = Field(..., max_length=500, description="頻道存取權杖（必填）")
    channel_secret: str = Field(..., max_length=100, description="頻道密鑰（必填）")


class LineChannelUpdate(BaseModel):
    """更新 LINE 頻道設定（支援部分更新）"""

    channel_id: Optional[str] = Field(None, max_length=100, description="Messaging API Channel ID")
    channel_access_token: Optional[str] = Field(None, max_length=500, description="頻道存取權杖")
    channel_secret: Optional[str] = Field(None, max_length=100, description="頻道密鑰")
    login_channel_id: Optional[str] = Field(None, max_length=100, description="LINE Login Channel ID")
    login_channel_secret: Optional[str] = Field(None, max_length=100, description="LINE Login Channel Secret")
    channel_name: Optional[str] = Field(None, max_length=100, description="頻道名稱")
    is_active: Optional[bool] = Field(None, description="是否啟用")


class LineChannelResponse(LineChannelBase):
    """LINE 頻道設定回應"""

    id: int = Field(..., description="ID")
    created_at: Optional[datetime] = Field(None, description="建立時間")
    updated_at: Optional[datetime] = Field(None, description="更新時間")

    class Config:
        from_attributes = True
