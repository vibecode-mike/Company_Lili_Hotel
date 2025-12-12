"""
WebSocket 連線管理器
用於即時推送 LINE 使用者訊息到前端聊天室
"""
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """管理 WebSocket 連線"""

    def __init__(self):
        # thread_id -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, thread_id: str):
        """建立 WebSocket 連線"""
        await websocket.accept()
        if thread_id not in self.active_connections:
            self.active_connections[thread_id] = set()
        self.active_connections[thread_id].add(websocket)
        logger.info(
            f"✅ WebSocket connected for thread {thread_id}, total connections: {self.get_connection_count(thread_id)}"
        )

    def disconnect(self, websocket: WebSocket, thread_id: str):
        """斷開 WebSocket 連線"""
        if thread_id in self.active_connections:
            self.active_connections[thread_id].discard(websocket)
            if not self.active_connections[thread_id]:
                del self.active_connections[thread_id]
        logger.info(f"🔌 WebSocket disconnected for thread {thread_id}")

    async def send_new_message(self, thread_id: str, message_data: dict):
        """
        通知前端有新訊息

        Args:
            thread_id: 對話 thread ID（格式：{platform}:{uid}）
            message_data: 訊息資料 (符合前端 ChatMessage 格式)
        """
        if thread_id not in self.active_connections:
            logger.debug(f"No active WebSocket for thread {thread_id}")
            return

        disconnected = set()
        success_count = 0

        for connection in self.active_connections[thread_id]:
            try:
                await connection.send_json({
                    "type": "new_message",
                    "data": message_data
                })
                success_count += 1
            except Exception as e:
                logger.error(f"❌ Failed to send message to WebSocket: {e}")
                disconnected.add(connection)

        # 清理斷開的連線
        for conn in disconnected:
            self.disconnect(conn, thread_id)

        if success_count > 0:
            logger.info(f"📤 Sent message to {success_count} WebSocket connection(s) for thread {thread_id}")

    def get_connection_count(self, thread_id: str = None) -> int:
        """獲取連線數量"""
        if thread_id:
            return len(self.active_connections.get(thread_id, set()))
        return sum(len(conns) for conns in self.active_connections.values())


# 全域實例
manager = ConnectionManager()
