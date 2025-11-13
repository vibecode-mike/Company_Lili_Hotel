"""
消費紀錄 API
職責：處理會員消費與住宿記錄
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.consumption_record import ConsumptionRecord
from app.schemas.consumption_record import (
    ConsumptionRecordCreate,
    ConsumptionRecordUpdate,
    ConsumptionRecordListItem,
    ConsumptionRecordDetail
)
from typing import List, Optional
from datetime import date
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=dict)
async def create_consumption_record(
    data: ConsumptionRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    創建消費紀錄

    Args:
        data: 消費記錄資料
        db: 資料庫 session

    Returns:
        創建的記錄 ID
    """
    try:
        record = ConsumptionRecord(**data.model_dump())
        db.add(record)
        await db.commit()
        await db.refresh(record)

        return {
            "code": 200,
            "message": "消費紀錄創建成功",
            "data": {"id": record.id}
        }
    except Exception as e:
        logger.error(f"❌ Failed to create consumption record: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"創建失敗: {str(e)}")


@router.get("", response_model=dict)
async def list_consumption_records(
    member_id: Optional[int] = Query(None, description="會員ID篩選"),
    start_date: Optional[date] = Query(None, description="消費日期起始"),
    end_date: Optional[date] = Query(None, description="消費日期結束"),
    room_type: Optional[str] = Query(None, description="房型篩選"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    獲取消費紀錄列表

    Args:
        member_id: 會員ID
        start_date: 開始日期
        end_date: 結束日期
        room_type: 房型
        page: 頁碼
        page_size: 每頁數量
        db: 資料庫 session

    Returns:
        消費紀錄列表
    """
    try:
        # 構建查詢
        query = select(ConsumptionRecord)

        if member_id:
            query = query.where(ConsumptionRecord.member_id == member_id)
        if start_date:
            query = query.where(ConsumptionRecord.stay_date >= start_date)
        if end_date:
            query = query.where(ConsumptionRecord.stay_date <= end_date)
        if room_type:
            query = query.where(ConsumptionRecord.room_type == room_type)

        # 計算總數
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 分頁查詢
        query = query.order_by(ConsumptionRecord.stay_date.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        records = result.scalars().all()

        return {
            "code": 200,
            "data": {
                "items": [
                    {
                        "id": r.id,
                        "member_id": r.member_id,
                        "pms_integration_id": r.pms_integration_id,
                        "amount": float(r.amount) if r.amount else None,
                        "room_type": r.room_type,
                        "stay_date": r.stay_date.isoformat() if r.stay_date else None,
                        "checkout_date": r.checkout_date.isoformat() if r.checkout_date else None,
                        "notes": r.notes,
                        "created_at": r.created_at.isoformat() if r.created_at else None,
                    }
                    for r in records
                ],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        }
    except Exception as e:
        logger.error(f"❌ Failed to list consumption records: {e}")
        raise HTTPException(status_code=500, detail=f"查詢失敗: {str(e)}")


@router.get("/{record_id}", response_model=dict)
async def get_consumption_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    獲取單個消費紀錄詳情

    Args:
        record_id: 記錄 ID
        db: 資料庫 session

    Returns:
        消費紀錄詳情
    """
    query = select(ConsumptionRecord).where(ConsumptionRecord.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="記錄不存在")

    return {
        "code": 200,
        "data": {
            "id": record.id,
            "member_id": record.member_id,
            "pms_integration_id": record.pms_integration_id,
            "amount": float(record.amount) if record.amount else None,
            "room_type": record.room_type,
            "stay_date": record.stay_date.isoformat() if record.stay_date else None,
            "checkout_date": record.checkout_date.isoformat() if record.checkout_date else None,
            "notes": record.notes,
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "updated_at": record.updated_at.isoformat() if record.updated_at else None,
        }
    }


@router.put("/{record_id}", response_model=dict)
async def update_consumption_record(
    record_id: int,
    data: ConsumptionRecordUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新消費紀錄

    Args:
        record_id: 記錄 ID
        data: 更新資料
        db: 資料庫 session

    Returns:
        更新結果
    """
    query = select(ConsumptionRecord).where(ConsumptionRecord.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="記錄不存在")

    try:
        # 更新字段
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(record, field, value)

        await db.commit()
        await db.refresh(record)

        return {
            "code": 200,
            "message": "更新成功",
            "data": {"id": record.id}
        }
    except Exception as e:
        logger.error(f"❌ Failed to update consumption record: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"更新失敗: {str(e)}")


@router.delete("/{record_id}", response_model=dict)
async def delete_consumption_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    刪除消費紀錄

    Args:
        record_id: 記錄 ID
        db: 資料庫 session

    Returns:
        刪除結果
    """
    query = select(ConsumptionRecord).where(ConsumptionRecord.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="記錄不存在")

    try:
        await db.delete(record)
        await db.commit()

        return {
            "code": 200,
            "message": "刪除成功"
        }
    except Exception as e:
        logger.error(f"❌ Failed to delete consumption record: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"刪除失敗: {str(e)}")


@router.get("/member/{member_id}/summary", response_model=dict)
async def get_member_consumption_summary(
    member_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    獲取會員消費統計摘要

    Args:
        member_id: 會員ID
        db: 資料庫 session

    Returns:
        消費統計摘要
    """
    try:
        query = select(
            func.count(ConsumptionRecord.id).label('total_count'),
            func.sum(ConsumptionRecord.amount).label('total_amount'),
            func.max(ConsumptionRecord.stay_date).label('last_stay_date')
        ).where(ConsumptionRecord.member_id == member_id)

        result = await db.execute(query)
        summary = result.one()

        return {
            "code": 200,
            "data": {
                "member_id": member_id,
                "total_records": summary.total_count or 0,
                "total_amount": float(summary.total_amount) if summary.total_amount else 0.0,
                "last_stay_date": summary.last_stay_date.isoformat() if summary.last_stay_date else None,
            }
        }
    except Exception as e:
        logger.error(f"❌ Failed to get consumption summary: {e}")
        raise HTTPException(status_code=500, detail=f"查詢失敗: {str(e)}")
