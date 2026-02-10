"""
SSE (Server-Sent Events) API 路由
提供即時訊息推送功能，兼容 HTTP/2
"""
import asyncio
import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/sse/chat/{thread_id}")
async def sse_chat(thread_id: str, request: Request):
    """
    SSE 連線端點
    前端透過 EventSource 連線此端點，當對應 thread 有訊息時會即時收到推送

    Args:
        thread_id: 對話 Thread ID
    """
    queue = manager.connect(thread_id)

    async def event_stream():
        try:
            while True:
                # 檢查客戶端是否已斷開
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps(msg, ensure_ascii=False)}\n\n"
                except asyncio.TimeoutError:
                    # SSE keepalive comment（防止代理或瀏覽器關閉連線）
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            manager.disconnect(thread_id, queue)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 告知 Nginx 不要緩衝
        },
    )
