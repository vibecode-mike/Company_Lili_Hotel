"""
FAQ 知識庫管理 API
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.services.faq_service import FaqService
from app.services.ai_chat_service import AiChatService
from app.schemas.faq import (
    FaqCategoryToggleSchema,
    FaqRuleCreateSchema,
    FaqRuleUpdateSchema,
    AiTokenUsageUpdateSchema,
    FaqModuleAuthUpdateSchema,
    AiTestChatRequestSchema,
)
from typing import Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
faq_service = FaqService()
ai_chat_service = AiChatService()


# === 大分類 ===


@router.get("/categories", response_model=dict)
async def get_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """取得大分類清單（含欄位定義與規則數量）"""
    industry = await faq_service.get_default_industry(db)
    if not industry:
        raise HTTPException(status_code=404, detail="尚未設定產業資料")

    categories = await faq_service.get_categories(db, industry.id)
    return {
        "code": 200,
        "message": "查詢成功",
        "data": [
            {
                "id": cat.id,
                "industry_id": cat.industry_id,
                "name": cat.name,
                "is_active": cat.is_active,
                "is_system_default": cat.is_system_default,
                "sort_order": cat.sort_order,
                "fields": [
                    {
                        "id": f.id,
                        "field_name": f.field_name,
                        "field_type": f.field_type,
                        "is_required": f.is_required,
                        "sort_order": f.sort_order,
                    }
                    for f in sorted(cat.fields, key=lambda x: x.sort_order)
                ],
                "rule_count": getattr(cat, "rule_count", 0),
            }
            for cat in categories
        ],
    }


@router.put("/categories/{category_id}/toggle", response_model=dict)
async def toggle_category(
    category_id: int,
    data: FaqCategoryToggleSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """啟用/停用大分類"""
    category = await faq_service.toggle_category(db, category_id, data.is_active)
    if not category:
        raise HTTPException(status_code=404, detail="大分類不存在")

    return {
        "code": 200,
        "message": f"大分類已{'啟用' if data.is_active else '停用'}",
        "data": {"id": category.id, "is_active": category.is_active},
    }


# === 規則 CRUD ===


@router.get("/categories/{category_id}/rules", response_model=dict)
async def get_rules(
    category_id: int,
    status: Optional[str] = Query(None, description="狀態篩選：draft/active/disabled"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """取得分類下規則清單"""
    result = await faq_service.get_rules(db, category_id, status, page, page_size)

    items = []
    for rule in result["items"]:
        content = rule.content_json
        if isinstance(content, str):
            try:
                content = json.loads(content)
            except (json.JSONDecodeError, TypeError):
                pass
        items.append({
            "id": rule.id,
            "category_id": rule.category_id,
            "content_json": content,
            "status": rule.status,
            "tags": [{"id": t.id, "tag_name": t.tag_name} for t in (rule.tags or [])],
            "created_at": rule.created_at.isoformat() if rule.created_at else None,
            "updated_at": rule.updated_at.isoformat() if rule.updated_at else None,
        })

    return {
        "code": 200,
        "message": "查詢成功",
        "data": {
            "items": items,
            "total": result["total"],
            "page": result["page"],
            "page_size": result["page_size"],
        },
    }


@router.post("/categories/{category_id}/rules", response_model=dict)
async def create_rule(
    category_id: int,
    data: FaqRuleCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """建立規則"""
    try:
        rule = await faq_service.create_rule(
            db, category_id, data.content_json, data.tag_names, current_user.id
        )
        return {
            "code": 200,
            "message": "規則建立成功",
            "data": {"id": rule.id, "status": rule.status},
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rules/{rule_id}", response_model=dict)
async def get_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """取得單筆規則詳情"""
    rule = await faq_service.get_rule(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="規則不存在")

    content = rule.content_json
    if isinstance(content, str):
        try:
            content = json.loads(content)
        except (json.JSONDecodeError, TypeError):
            pass

    return {
        "code": 200,
        "message": "查詢成功",
        "data": {
            "id": rule.id,
            "category_id": rule.category_id,
            "content_json": content,
            "status": rule.status,
            "created_by": rule.created_by,
            "updated_by": rule.updated_by,
            "published_at": rule.published_at.isoformat() if rule.published_at else None,
            "published_by": rule.published_by,
            "tags": [{"id": t.id, "tag_name": t.tag_name} for t in (rule.tags or [])],
            "created_at": rule.created_at.isoformat() if rule.created_at else None,
            "updated_at": rule.updated_at.isoformat() if rule.updated_at else None,
        },
    }


@router.put("/rules/{rule_id}", response_model=dict)
async def update_rule(
    rule_id: int,
    data: FaqRuleUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """編輯規則"""
    rule = await faq_service.update_rule(
        db, rule_id, data.content_json, data.tag_names, current_user.id
    )
    if not rule:
        raise HTTPException(status_code=404, detail="規則不存在")

    return {
        "code": 200,
        "message": "規則更新成功",
        "data": {"id": rule.id, "status": rule.status},
    }


@router.delete("/rules/{rule_id}", response_model=dict)
async def delete_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """刪除規則"""
    deleted = await faq_service.delete_rule(db, rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="規則不存在")

    return {"code": 200, "message": "規則刪除成功"}


# === 發佈與版本 ===


@router.post("/rules/{rule_id}/publish", response_model=dict)
async def publish_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """發佈規則"""
    rule = await faq_service.publish_rule(db, rule_id, current_user.id)
    if not rule:
        raise HTTPException(status_code=404, detail="規則不存在")

    return {
        "code": 200,
        "message": "規則發佈成功",
        "data": {"id": rule.id, "status": rule.status},
    }


@router.post("/rules/{rule_id}/revert", response_model=dict)
async def revert_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """回復至上一版本"""
    try:
        rule = await faq_service.revert_rule(db, rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail="規則不存在")

        return {
            "code": 200,
            "message": "已回復至上一版本",
            "data": {"id": rule.id, "status": rule.status},
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rules/{rule_id}/versions", response_model=dict)
async def get_rule_versions(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """取得版本歷史"""
    versions = await faq_service.get_rule_versions(db, rule_id)

    return {
        "code": 200,
        "message": "查詢成功",
        "data": [
            {
                "id": v.id,
                "rule_id": v.rule_id,
                "content_json": json.loads(v.content_json) if isinstance(v.content_json, str) else v.content_json,
                "status": v.status,
                "version_number": v.version_number,
                "snapshot_at": v.snapshot_at.isoformat() if v.snapshot_at else None,
            }
            for v in versions
        ],
    }


# === 測試聊天 ===


@router.post("/test-chat", response_model=dict)
async def test_chat(
    data: AiTestChatRequestSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """測試聊天（不計 token、不貼 tag）"""
    result = await ai_chat_service.test_chat(
        db, data.message, data.rule_ids, data.category_id
    )
    return {
        "code": 200,
        "message": "測試完成",
        "data": result,
    }


# === Token 用量 ===


@router.get("/token-usage", response_model=dict)
async def get_token_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """查詢 Token 用量"""
    industry = await faq_service.get_default_industry(db)
    if not industry:
        raise HTTPException(status_code=404, detail="尚未設定產業資料")

    usage = await faq_service.get_token_usage(db, industry.id)
    if not usage:
        return {
            "code": 200,
            "message": "查詢成功",
            "data": {"total_quota": 0, "used_amount": 0, "remaining": 0, "usage_percent": 0},
        }

    remaining = max(0, usage.total_quota - usage.used_amount)
    usage_percent = round(usage.used_amount / usage.total_quota * 100, 1) if usage.total_quota > 0 else 0

    return {
        "code": 200,
        "message": "查詢成功",
        "data": {
            "id": usage.id,
            "industry_id": usage.industry_id,
            "total_quota": usage.total_quota,
            "used_amount": usage.used_amount,
            "remaining": remaining,
            "usage_percent": usage_percent,
        },
    }


@router.put("/token-usage", response_model=dict)
async def update_token_quota(
    data: AiTokenUsageUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """設定 Token 額度"""
    industry = await faq_service.get_default_industry(db)
    if not industry:
        raise HTTPException(status_code=404, detail="尚未設定產業資料")

    usage = await faq_service.update_token_quota(db, industry.id, data.total_quota)
    return {
        "code": 200,
        "message": "Token 額度設定成功",
        "data": {"total_quota": usage.total_quota},
    }


# === 語氣設定 ===


@router.get("/tone-config", response_model=dict)
async def get_tone_configs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """查詢語氣設定"""
    tones = await faq_service.get_tone_configs(db)
    return {
        "code": 200,
        "message": "查詢成功",
        "data": [
            {
                "id": t.id,
                "tone_type": t.tone_type,
                "tone_name": t.tone_name,
                "prompt_text": t.prompt_text,
                "is_active": t.is_active,
            }
            for t in tones
        ],
    }


@router.put("/tone-config/{tone_id}/activate", response_model=dict)
async def activate_tone(
    tone_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """切換語氣"""
    tone = await faq_service.activate_tone(db, tone_id)
    if not tone:
        raise HTTPException(status_code=404, detail="語氣設定不存在")

    return {
        "code": 200,
        "message": f"已切換至「{tone.tone_name}」語氣",
        "data": {"id": tone.id, "tone_name": tone.tone_name, "is_active": tone.is_active},
    }


# === 模組授權 ===


@router.get("/module-auth", response_model=dict)
async def get_module_auth(
    client_id: str = Query(..., description="客戶帳號識別碼"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """查詢模組授權狀態"""
    auth = await faq_service.get_module_auth(db, client_id)
    if not auth:
        return {
            "code": 200,
            "message": "查詢成功",
            "data": {"client_id": client_id, "is_authorized": False},
        }

    return {
        "code": 200,
        "message": "查詢成功",
        "data": {
            "id": auth.id,
            "client_id": auth.client_id,
            "is_authorized": auth.is_authorized,
            "authorized_at": auth.authorized_at.isoformat() if auth.authorized_at else None,
            "authorized_by": auth.authorized_by,
        },
    }


@router.put("/module-auth", response_model=dict)
async def update_module_auth(
    data: FaqModuleAuthUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """設定模組授權"""
    auth = await faq_service.update_module_auth(
        db, data.client_id, data.is_authorized, current_user.username if hasattr(current_user, 'username') else str(current_user.id)
    )
    return {
        "code": 200,
        "message": f"模組授權已{'開通' if data.is_authorized else '關閉'}",
        "data": {
            "client_id": auth.client_id,
            "is_authorized": auth.is_authorized,
        },
    }
