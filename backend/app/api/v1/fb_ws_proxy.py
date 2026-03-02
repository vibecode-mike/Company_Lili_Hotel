"""
Facebook WebSocket 代理 API
前端呼叫 start/stop/send 來控制後端與外部 FB WS 的代理連線
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.user import User
from app.api.v1.auth import get_current_user
from app.services.fb_ws_proxy import fb_ws_proxy_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fb-ws-proxy", tags=["Facebook WS Proxy"])


class StartProxySchema(BaseModel):
    fb_customer_id: str
    page_id: str
    jwt_token: str
    thread_id: str


class StopProxySchema(BaseModel):
    fb_customer_id: str
    page_id: str


@router.post("/start")
async def start_proxy(req: StartProxySchema):
    """啟動 FB WebSocket 代理連線"""
    await fb_ws_proxy_manager.start_proxy(
        fb_customer_id=req.fb_customer_id,
        page_id=req.page_id,
        jwt_token=req.jwt_token,
        thread_id=req.thread_id,
    )
    logger.info(f"[FB WS Proxy API] Started proxy for customer={req.fb_customer_id}")
    return {"ok": True, "message": "Proxy started"}


@router.post("/stop")
async def stop_proxy(req: StopProxySchema):
    """停止 FB WebSocket 代理連線"""
    stopped = await fb_ws_proxy_manager.stop_proxy(
        fb_customer_id=req.fb_customer_id,
        page_id=req.page_id,
    )
    return {"ok": True, "stopped": stopped}


class SendMessageSchema(BaseModel):
    fb_customer_id: str
    page_id: str
    text: str


@router.post("/send")
async def send_message_via_proxy(
    req: SendMessageSchema,
    current_user: User = Depends(get_current_user),
):
    """透過 WebSocket 代理連線發送 Facebook 訊息（聊天紀錄由外部 FB API 管理）"""
    result = await fb_ws_proxy_manager.send_message(
        fb_customer_id=req.fb_customer_id,
        page_id=req.page_id,
        text=req.text,
    )

    if not result.get("ok"):
        raise HTTPException(
            status_code=503,
            detail=f"WebSocket 代理發送失敗: {result.get('error')}",
        )

    logger.info(f"[FB WS Proxy API] Sent message for customer={req.fb_customer_id}: {req.text[:50]}")
    return {"success": True}
