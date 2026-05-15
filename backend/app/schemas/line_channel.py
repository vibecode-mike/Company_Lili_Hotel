"""
LINE 頻道設定 Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LineChannelBase(BaseModel):
    """LINE 頻道基礎 Schema"""

    channel_id: Optional[str] = Field(None, max_length=100, description="Messaging API Channel ID")
    channel_access_token: Optional[str] = Field(None, max_length=500, description="頻道存取權杖")
    channel_secret: Optional[str] = Field(None, max_length=100, description="頻道密鑰")
    login_channel_id: Optional[str] = Field(None, max_length=100, description="LINE Login Channel ID")
    login_channel_secret: Optional[str] = Field(None, max_length=100, description="LINE Login Channel Secret")
    channel_name: Optional[str] = Field(None, max_length=100, description="頻道名稱")
    basic_id: Optional[str] = Field(None, max_length=100, description="LINE Bot Basic ID (format: @xxxxxxx)")
    is_active: Optional[bool] = Field(True, description="是否啟用")


class LineChannelCreate(LineChannelBase):
    """創建 LINE 頻道設定（含 Phase E 一條龍選填欄位）"""

    channel_access_token: str = Field(..., max_length=500, description="頻道存取權杖（必填）")
    channel_secret: str = Field(..., max_length=100, description="頻道密鑰（必填）")

    # Phase E 一條龍：以下選填，提供時系統同時建立對應的 row
    site_id: Optional[str] = Field(
        None,
        max_length=50,
        description="Webchat 嵌入站點代號（例：starbit-ryan）。提供時自動建立 webchat_site_channels 綁定",
    )
    site_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Webchat 站點顯示名稱（例：思偉達飯店｜雷恩館）",
    )
    hotelcode: Optional[str] = Field(
        None,
        max_length=50,
        description="閎運 PMS hotelcode（例：ZH01）。提供時自動建立 faq_pms_connections（status='disabled'），admin 之後可在 PMS 頁啟用",
    )


class LineChannelUpdate(BaseModel):
    """更新 LINE 頻道設定（支援部分更新）"""

    channel_id: Optional[str] = Field(None, max_length=100, description="Messaging API Channel ID")
    channel_access_token: Optional[str] = Field(None, max_length=500, description="頻道存取權杖")
    channel_secret: Optional[str] = Field(None, max_length=100, description="頻道密鑰")
    login_channel_id: Optional[str] = Field(None, max_length=100, description="LINE Login Channel ID")
    login_channel_secret: Optional[str] = Field(None, max_length=100, description="LINE Login Channel Secret")
    channel_name: Optional[str] = Field(None, max_length=100, description="頻道名稱")
    basic_id: Optional[str] = Field(None, max_length=100, description="LINE Bot Basic ID (format: @xxxxxxx)")
    is_active: Optional[bool] = Field(None, description="是否啟用")


class LineChannelResponse(LineChannelBase):
    """LINE 頻道設定回應"""

    id: int = Field(..., description="ID")
    created_at: Optional[datetime] = Field(None, description="建立時間")
    updated_at: Optional[datetime] = Field(None, description="更新時間")

    class Config:
        from_attributes = True


class LineChannelStatusResponse(BaseModel):
    """LINE 頻道設定檢查結果"""

    has_active_channel: bool = Field(
        False, description="是否已存在啟用中的 LINE 頻道設定"
    )
    is_configured: bool = Field(
        False, description="必填欄位是否皆已通過驗證"
    )
    missing_fields: List[str] = Field(
        default_factory=list, description="尚未通過驗證的欄位"
    )
    channel_db_id: Optional[int] = Field(
        None, description="資料表中的頻道資料 ID（若存在）"
    )
