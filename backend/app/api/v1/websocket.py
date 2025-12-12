"""
WebSocket API 路由
提供即時訊息推送功能
"""
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/chat/{thread_id}")
async def websocket_endpoint(websocket: WebSocket, thread_id: str):
    """
    WebSocket 連線端點
    前端連線此端點後,當對應 thread 有訊息時會即時收到通知

    Args:
        thread_id: 對話 Thread ID（格式：{platform}:{uid}）
    """
    await manager.connect(websocket, thread_id)

    try:
        # 保持連線活躍
        while True:
            # 接收前端的 ping 或其他保活訊息
            data = await websocket.receive_text()
            logger.debug(f"Received from WebSocket (thread {thread_id}): {data}")

            # 回應 pong
            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally for thread {thread_id}")
    except Exception as e:
        logger.error(f"WebSocket error for thread {thread_id}: {e}")
    finally:
        manager.disconnect(websocket, thread_id)
