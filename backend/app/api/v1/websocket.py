"""
WebSocket API 路由
提供即時訊息推送功能
"""
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/chat/{member_id}")
async def websocket_endpoint(websocket: WebSocket, member_id: int):
    """
    WebSocket 連線端點
    前端連線此端點後,當 LINE 使用者發送訊息時會即時收到通知

    Args:
        member_id: 會員 ID
    """
    member_id_str = str(member_id)
    await manager.connect(websocket, member_id_str)

    try:
        # 保持連線活躍
        while True:
            # 接收前端的 ping 或其他保活訊息
            data = await websocket.receive_text()
            logger.debug(f"Received from WebSocket (member {member_id}): {data}")

            # 回應 pong
            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally for member {member_id}")
    except Exception as e:
        logger.error(f"WebSocket error for member {member_id}: {e}")
    finally:
        manager.disconnect(websocket, member_id_str)
