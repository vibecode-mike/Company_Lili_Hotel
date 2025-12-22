"""
Facebook 粉絲專頁頻道設定 Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FbChannelBase(BaseModel):
    """Facebook 頻道基礎 Schema"""

    page_id: Optional[str] = Field(None, max_length=255, description="Facebook Page ID")
    app_id: Optional[str] = Field(None, max_length=255, description="Facebook App ID")
    channel_name: Optional[str] = Field(None, max_length=100, description="頻道名稱")
    is_active: Optional[bool] = Field(True, description="是否啟用（管理員手動控制）")
    connection_status: Optional[str] = Field('disconnected', description="連結狀態: connected/expired/disconnected（系統自動偵測）")
    last_verified_at: Optional[datetime] = Field(None, description="最後驗證時間（UTC）")


class FbChannelCreate(FbChannelBase):
    """創建 Facebook 頻道設定"""

    page_access_token: str = Field(..., max_length=500, description="FB頻道存取權杖（必填）")


class FbChannelUpdate(BaseModel):
    """更新 Facebook 頻道設定（支援部分更新）"""

    page_id: Optional[str] = Field(None, max_length=255, description="Facebook Page ID")
    page_access_token: Optional[str] = Field(None, max_length=500, description="FB頻道存取權杖")
    channel_name: Optional[str] = Field(None, max_length=100, description="頻道名稱")
    is_active: Optional[bool] = Field(None, description="是否啟用")
    connection_status: Optional[str] = Field(None, description="連結狀態")
    last_verified_at: Optional[datetime] = Field(None, description="最後驗證時間")


class FbChannelResponse(FbChannelBase):
    """Facebook 頻道設定回應"""

    id: int = Field(..., description="ID")
    created_at: Optional[datetime] = Field(None, description="建立時間")
    updated_at: Optional[datetime] = Field(None, description="更新時間")

    class Config:
        from_attributes = True


class FbChannelStatusResponse(BaseModel):
    """Facebook 頻道設定檢查結果"""

    has_active_channel: bool = Field(
        False, description="是否已存在啟用中的 Facebook 頻道設定"
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
    connection_status: Optional[str] = Field(
        'disconnected', description="連結狀態: connected/expired/disconnected"
    )
    last_verified_at: Optional[datetime] = Field(
        None, description="最後驗證時間（UTC）"
    )


class FacebookSdkConfigResponse(BaseModel):
    """Frontend Facebook SDK 初始化所需的設定（安全可公開）"""

    app_id: str = Field(..., description="Facebook App ID")
    api_version: str = Field(..., description="Facebook Graph/API 版本（例如 v23.0）")
