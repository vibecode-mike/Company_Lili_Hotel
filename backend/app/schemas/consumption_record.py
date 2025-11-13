"""
消費紀錄相關 Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class ConsumptionRecordBase(BaseModel):
    """消費紀錄基礎模型"""

    member_id: int
    amount: Decimal
    room_type: Optional[str] = None
    stay_date: Optional[date] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None


class ConsumptionRecordCreate(ConsumptionRecordBase):
    """創建消費紀錄"""

    pms_integration_id: Optional[int] = None


class ConsumptionRecordUpdate(BaseModel):
    """更新消費紀錄"""

    amount: Optional[Decimal] = None
    room_type: Optional[str] = None
    stay_date: Optional[date] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None


class ConsumptionRecordListItem(BaseModel):
    """消費紀錄列表項"""

    id: int
    member_id: int
    amount: Decimal
    room_type: Optional[str] = None
    stay_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConsumptionRecordDetail(ConsumptionRecordListItem):
    """消費紀錄詳情"""

    pms_integration_id: Optional[int] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
