"""
組織（Tenant）Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TenantCreate(BaseModel):
    """建立組織。只有 name 必填；LINE/官網彈窗/FB/PMS 都是事後可加的工具。"""

    name: str = Field(..., max_length=100, description="組織名稱（必填）")
    slug: Optional[str] = Field(None, max_length=100, description="組織代碼（選填，唯一）")
    # 選配：建立時順手綁一個純官網彈窗站點（不需 LINE）
    webchat_site_id: Optional[str] = Field(
        None, max_length=50, description="選填：同時建立一個官網彈窗站點代號並綁到此組織"
    )
    webchat_site_name: Optional[str] = Field(
        None, max_length=100, description="選填：官網彈窗站點顯示名稱"
    )


class TenantUpdate(BaseModel):
    """更新組織"""

    name: Optional[str] = Field(None, max_length=100)
    slug: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class TenantResponse(BaseModel):
    """組織回應"""

    id: int
    name: str
    slug: Optional[str] = None
    is_active: bool
    line_channel_count: int = Field(0, description="底下已接的 LINE OA 數")
    webchat_site_count: int = Field(0, description="底下已接的官網彈窗站點數")
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
