"""
模板庫 API (Template Library)
負責模板庫的瀏覽、複製和管理功能
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from app.database import get_db
from app.schemas.template import (
    TemplateLibraryItem,
    TemplateCopyResponse,
    TemplateLibraryToggle,
)
from app.services.template_service import TemplateService

router = APIRouter()
logger = logging.getLogger(__name__)

# 創建服務實例
template_service = TemplateService()


@router.get("/library", response_model=List[TemplateLibraryItem])
async def list_library_templates(
    sort_by: str = Query("usage_count", description="排序方式：usage_count | created_at"),
    db: AsyncSession = Depends(get_db),
):
    """
    瀏覽模板庫

    獲取所有標記為「在模板庫中」的模板列表

    Query Parameters:
        - sort_by: 排序方式
          - "usage_count": 按使用次數降序（默認）
          - "created_at": 按創建時間降序

    Returns:
        List[TemplateLibraryItem]: 模板庫列表
    """
    try:
        logger.info(f"📚 瀏覽模板庫: sort_by={sort_by}")

        templates = await template_service.list_library_templates(db, sort_by)

        logger.info(f"✅ 模板庫查詢成功: 找到 {len(templates)} 個模板")

        return templates

    except Exception as e:
        logger.error(f"❌ 模板庫查詢失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"模板庫查詢失敗: {str(e)}")


@router.post("/{template_id}/copy", response_model=TemplateCopyResponse)
async def copy_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    複製模板

    從模板庫複製模板用於創建新消息。
    操作會：
    1. 創建新的模板副本
    2. 記錄來源模板 ID (source_template_id)
    3. 增加源模板的使用次數 (usage_count)

    Path Parameters:
        - template_id: 源模板 ID

    Returns:
        TemplateCopyResponse: 新創建的模板副本信息
    """
    try:
        logger.info(f"📋 複製模板: template_id={template_id}")

        new_template = await template_service.copy_template(db, template_id)

        logger.info(f"✅ 模板複製成功: 新模板 ID={new_template.id}")

        return new_template

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ 模板複製失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"模板複製失敗: {str(e)}")


@router.put("/{template_id}/library", response_model=TemplateLibraryItem)
async def toggle_library(
    template_id: int,
    data: TemplateLibraryToggle,
    db: AsyncSession = Depends(get_db),
):
    """
    添加或移除模板庫中的模板

    切換模板的 is_in_library 標誌。

    Path Parameters:
        - template_id: 模板 ID

    Request Body:
        - add_to_library: true=加入模板庫, false=從模板庫移除

    Returns:
        TemplateLibraryItem: 更新後的模板信息
    """
    try:
        action = "加入" if data.add_to_library else "移除"
        logger.info(f"📚 {action}模板庫: template_id={template_id}")

        template = await template_service.add_to_library(
            db,
            template_id,
            add=data.add_to_library
        )

        logger.info(f"✅ 模板庫更新成功: ID={template_id}, is_in_library={template.is_in_library}")

        return template

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ 模板庫更新失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"模板庫更新失敗: {str(e)}")
