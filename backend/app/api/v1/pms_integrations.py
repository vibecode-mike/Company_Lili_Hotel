"""
PMS 系統整合 API
職責：處理 PMS 系統資料匹配與會員綁定
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.database import get_db
from app.models.pms_integration import PMSIntegration
from app.models.member import Member
from app.schemas.pms_integration import (
    PMSIntegrationCreate,
    PMSIntegrationUpdate,
    PMSIntegrationListItem,
    PMSIntegrationDetail,
    PMSMatchRequest,
    PMSSearchParams
)
from typing import List, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=dict)
async def create_pms_integration(
    data: PMSIntegrationCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    創建 PMS 整合記錄

    Args:
        data: PMS 整合資料
        db: 資料庫 session

    Returns:
        創建的記錄 ID
    """
    try:
        pms_record = PMSIntegration(**data.model_dump())
        db.add(pms_record)
        await db.commit()
        await db.refresh(pms_record)

        return {
            "code": 200,
            "message": "PMS 記錄創建成功",
            "data": {"id": pms_record.id}
        }
    except Exception as e:
        logger.error(f"❌ Failed to create PMS integration: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"創建失敗: {str(e)}")


@router.get("", response_model=dict)
async def list_pms_integrations(
    match_status: Optional[str] = Query(None, description="匹配狀態篩選"),
    start_date: Optional[str] = Query(None, description="開始日期"),
    end_date: Optional[str] = Query(None, description="結束日期"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    獲取 PMS 整合記錄列表

    Args:
        match_status: 匹配狀態 (pending, matched, unmatched)
        start_date: 入住日期起始
        end_date: 入住日期結束
        page: 頁碼
        page_size: 每頁數量
        db: 資料庫 session

    Returns:
        PMS 記錄列表
    """
    try:
        # 構建查詢
        query = select(PMSIntegration)

        if match_status:
            query = query.where(PMSIntegration.match_status == match_status)
        if start_date:
            query = query.where(PMSIntegration.stay_date >= start_date)
        if end_date:
            query = query.where(PMSIntegration.stay_date <= end_date)

        # 計算總數
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 分頁查詢
        query = query.order_by(PMSIntegration.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        records = result.scalars().all()

        return {
            "code": 200,
            "data": {
                "items": [
                    {
                        "id": r.id,
                        "id_number": r.id_number,
                        "phone": r.phone,
                        "room_type": r.room_type,
                        "stay_date": r.stay_date.isoformat() if r.stay_date else None,
                        "member_id": r.member_id,
                        "match_status": r.match_status,
                        "match_rate": float(r.match_rate) if r.match_rate else None,
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
        logger.error(f"❌ Failed to list PMS integrations: {e}")
        raise HTTPException(status_code=500, detail=f"查詢失敗: {str(e)}")


@router.get("/{record_id}", response_model=dict)
async def get_pms_integration(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    獲取單個 PMS 整合記錄詳情

    Args:
        record_id: 記錄 ID
        db: 資料庫 session

    Returns:
        PMS 記錄詳情
    """
    query = select(PMSIntegration).where(PMSIntegration.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="記錄不存在")

    return {
        "code": 200,
        "data": {
            "id": record.id,
            "id_number": record.id_number,
            "phone": record.phone,
            "stay_records": record.stay_records,
            "room_type": record.room_type,
            "stay_date": record.stay_date.isoformat() if record.stay_date else None,
            "member_id": record.member_id,
            "match_status": record.match_status,
            "match_rate": float(record.match_rate) if record.match_rate else None,
            "error_message": record.error_message,
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "updated_at": record.updated_at.isoformat() if record.updated_at else None,
        }
    }


@router.post("/match", response_model=dict)
async def match_pms_to_member(
    data: PMSMatchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    執行 PMS 資料與會員的匹配

    Args:
        data: 匹配請求資料
        db: 資料庫 session

    Returns:
        匹配結果
    """
    try:
        # 查找 PMS 記錄
        pms_query = select(PMSIntegration).where(PMSIntegration.id == data.pms_integration_id)
        pms_result = await db.execute(pms_query)
        pms_record = pms_result.scalar_one_or_none()

        if not pms_record:
            raise HTTPException(status_code=404, detail="PMS 記錄不存在")

        # 查找會員
        member_query = select(Member).where(
            or_(
                Member.id == data.member_id,
                Member.phone == pms_record.phone,
                Member.id_number == pms_record.id_number
            )
        )
        member_result = await db.execute(member_query)
        member = member_result.scalar_one_or_none()

        if not member:
            raise HTTPException(status_code=404, detail="會員不存在")

        # 執行匹配
        pms_record.member_id = member.id
        pms_record.match_status = "matched"
        pms_record.match_rate = 100.0  # 手動匹配視為100%

        await db.commit()

        return {
            "code": 200,
            "message": "匹配成功",
            "data": {
                "pms_integration_id": pms_record.id,
                "member_id": member.id,
                "match_status": "matched"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to match PMS record: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"匹配失敗: {str(e)}")


@router.put("/{record_id}", response_model=dict)
async def update_pms_integration(
    record_id: int,
    data: PMSIntegrationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新 PMS 整合記錄

    Args:
        record_id: 記錄 ID
        data: 更新資料
        db: 資料庫 session

    Returns:
        更新結果
    """
    query = select(PMSIntegration).where(PMSIntegration.id == record_id)
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
        logger.error(f"❌ Failed to update PMS integration: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"更新失敗: {str(e)}")


@router.delete("/{record_id}", response_model=dict)
async def delete_pms_integration(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    刪除 PMS 整合記錄

    Args:
        record_id: 記錄 ID
        db: 資料庫 session

    Returns:
        刪除結果
    """
    query = select(PMSIntegration).where(PMSIntegration.id == record_id)
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
        logger.error(f"❌ Failed to delete PMS integration: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"刪除失敗: {str(e)}")
