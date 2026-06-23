"""
Webchat 站點 Schema
供基本設定頁面列出官網彈窗帳號，以及 widget 載入回報（beacon）使用。
"""
from app.core.timezone import AwareUtcDatetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class WebchatSiteResponse(BaseModel):
    """基本設定列表用：官網彈窗帳號狀態"""

    model_config = ConfigDict(from_attributes=True)

    site_id: str
    site_name: Optional[str] = None
    tenant_id: Optional[int] = None
    line_channel_id: Optional[str] = None
    last_seen_at: Optional[AwareUtcDatetime] = None
    last_seen_url: Optional[str] = None
    # 一次性語意：曾收到過 beacon 即視為已開通
    is_activated: bool = False
