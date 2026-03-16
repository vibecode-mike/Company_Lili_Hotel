"""
SSE (Server-Sent Events) API 路由
用於 LINE 渠道的即時訊息推送（因外部代理 HTTP/2 不支援 WebSocket Upgrade）
"""
import asyncio
import json
import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()

# SSE keepalive 間隔（秒）— 防止代理/瀏覽器因閒置斷線
KEEPALIVE_INTERVAL = 25


@router.get("/sse/chat/{thread_id}")
async def sse_endpoint(thread_id: str):
    """
    SSE 連線端點
    前端使用 EventSource 連線後，當對應 thread 有訊息時會即時收到推送

    Args:
        thread_id: 對話 Thread ID（直接使用 platform_uid，如 U123xxx）
    """
    queue: asyncio.Queue = asyncio.Queue()
    manager.connect_sse(queue, thread_id)

    async def event_generator():
        try:
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=KEEPALIVE_INTERVAL)
                    yield f"data: {json.dumps(message, ensure_ascii=False)}\n\n"
                except asyncio.TimeoutError:
                    # SSE 註解作為 keepalive（不觸發 onmessage）
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            logger.info(f"SSE stream cancelled for thread {thread_id}")
        except Exception as e:
            logger.error(f"SSE error for thread {thread_id}: {e}")
        finally:
            manager.disconnect_sse(queue, thread_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # nginx 不緩衝 SSE
        },
    )
