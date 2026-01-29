"""
Meta Page (FB) admin proxy endpoints.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.clients.fb_message_client import FbMessageClient
from app.schemas.common import SuccessResponse


class KeywordUpdateRequest(BaseModel):
    keyword_id: int
    enabled: bool

router = APIRouter()
logger = logging.getLogger(__name__)


def _require_jwt_token(jwt_token: str | None) -> str:
    if not jwt_token:
        raise HTTPException(status_code=400, detail="缺少 jwt_token，請先完成 Facebook 授權")
    return jwt_token


@router.patch("/keyword", response_model=SuccessResponse)
async def update_fb_keyword(
    request: KeywordUpdateRequest,
    jwt_token: str | None = Query(None, description="Meta JWT Token"),
) -> SuccessResponse:
    """更新 FB 關鍵字狀態（啟用/停用）"""
    jwt_token = _require_jwt_token(jwt_token)
    fb_client = FbMessageClient()
    result = await fb_client.update_keyword(
        keyword_id=request.keyword_id,
        enabled=request.enabled,
        jwt_token=jwt_token
    )

    if not result.get("ok"):
        error_msg = result.get("error", "更新 FB 關鍵字失敗")
        logger.error(f"FB keyword update failed: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    return SuccessResponse(message="更新成功")


@router.delete("/keyword/{keyword_id}", response_model=SuccessResponse)
async def delete_fb_keyword(
    keyword_id: int,
    jwt_token: str | None = Query(None, description="Meta JWT Token"),
):
    """刪除 FB 關鍵字"""
    jwt_token = _require_jwt_token(jwt_token)
    fb_client = FbMessageClient()
    result = await fb_client.delete_keyword(keyword_id, jwt_token)

    if not result.get("ok"):
        error_msg = result.get("error", "刪除 FB 關鍵字失敗")
        logger.error(f"FB keyword delete failed: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    return SuccessResponse(message="刪除成功")


@router.delete("/Reply/{reply_id}", response_model=SuccessResponse)
async def delete_fb_reply(
    reply_id: int,
    jwt_token: str | None = Query(None, description="Meta JWT Token"),
):
    """刪除 FB 訊息回覆"""
    jwt_token = _require_jwt_token(jwt_token)
    fb_client = FbMessageClient()
    result = await fb_client.delete_reply(reply_id, jwt_token)

    if not result.get("ok"):
        error_msg = result.get("error", "刪除 FB 訊息失敗")
        logger.error(f"FB reply delete failed: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    return SuccessResponse(message="刪除成功")


@router.delete("", response_model=SuccessResponse)
async def delete_fb_auto_template(
    basic_id: str = Query(..., description="FB auto_template basic_id"),
    jwt_token: str | None = Query(None, description="Meta JWT Token"),
):
    """刪除 FB 自動回應整組設定"""
    jwt_token = _require_jwt_token(jwt_token)
    fb_client = FbMessageClient()
    result = await fb_client.delete_template(basic_id, jwt_token)

    if not result.get("ok"):
        error_msg = result.get("error", "刪除 FB 自動回應失敗")
        logger.error(f"FB auto_template delete failed: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    return SuccessResponse(message="刪除成功")
