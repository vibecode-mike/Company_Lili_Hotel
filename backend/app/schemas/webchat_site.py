"""
Webchat 站點 Schema
供基本設定頁面列出官網彈窗帳號，以及 widget 載入回報（beacon）使用。
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class WebchatSiteResponse(BaseModel):
    """基本設定列表用：官網彈窗帳號狀態"""

    model_config = ConfigDict(from_attributes=True)

    site_id: str
    site_name: Optional[str] = None
    tenant_id: Optional[int] = None
    line_channel_id: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    last_seen_url: Optional[str] = None
    # 一次性語意：曾收到過 beacon 即視為已開通
    is_activated: bool = False


class WebchatSiteCreate(BaseModel):
    """建立官網彈窗站點。line_channel_id 有給=綁到既有 LINE OA（同組織）；
    沒給代表獨立官網（這條路徑前端改走 POST /tenants 建新組織，不走本 endpoint）。"""

    site_id: str
    site_name: Optional[str] = None
    line_channel_id: Optional[str] = None


class WebchatSiteCreateResponse(BaseModel):
    """建立成功後回傳，附嵌入碼供前端顯示複製。"""

    site_id: str
    site_name: Optional[str] = None
    line_channel_id: Optional[str] = None
    tenant_id: Optional[int] = None
    embed_code: str


class WebchatSiteBind(BaseModel):
    """把既有（多為獨立）官網站點重新綁定到某個 LINE OA。"""

    line_channel_id: str
