"""
PMS 系統整合相關 Schema
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class PMSIntegrationBase(BaseModel):
    """PMS 系統整合基礎模型"""

    id_number: Optional[str] = None
    phone: Optional[str] = None
    stay_records: Optional[Dict[str, Any]] = None  # JSON 格式


class PMSIntegrationCreate(PMSIntegrationBase):
    """創建 PMS 系統整合記錄"""

    member_id: Optional[int] = None
    match_status: str = "pending"  # pending/matched/unmatched


class PMSIntegrationUpdate(BaseModel):
    """更新 PMS 系統整合記錄"""

    member_id: Optional[int] = None
    match_status: Optional[str] = None
    stay_records: Optional[Dict[str, Any]] = None


class PMSIntegrationListItem(BaseModel):
    """PMS 系統整合列表項"""

    id: int
    id_number: Optional[str] = None
    phone: Optional[str] = None
    member_id: Optional[int] = None
    match_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PMSIntegrationDetail(PMSIntegrationListItem):
    """PMS 系統整合詳情"""

    stay_records: Optional[Dict[str, Any]] = None
    updated_at: Optional[datetime] = None


class PMSMatchRequest(BaseModel):
    """PMS 匹配請求"""

    pms_integration_id: int
    member_id: int


class PMSSearchParams(BaseModel):
    """PMS 搜索參數"""

    match_status: Optional[str] = None  # pending/matched/unmatched
    id_number: Optional[str] = None
    phone: Optional[str] = None
    page: int = 1
    page_size: int = 20
