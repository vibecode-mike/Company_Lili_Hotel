"""
SSE 連線管理器
用於即時推送訊息到前端聊天室（透過 Server-Sent Events）
"""
import asyncio
import logging
from typing import Dict, Set

logger = logging.getLogger(__name__)


class ConnectionManager:
    """管理 SSE 連線（以 asyncio.Queue 作為傳輸介質）"""

    def __init__(self):
        # thread_id -> Set[asyncio.Queue]
        self.active_connections: Dict[str, Set[asyncio.Queue]] = {}

    def connect(self, thread_id: str) -> asyncio.Queue:
        """建立 SSE 連線，返回該連線的訊息 Queue"""
        queue: asyncio.Queue = asyncio.Queue()
        if thread_id not in self.active_connections:
            self.active_connections[thread_id] = set()
        self.active_connections[thread_id].add(queue)
        logger.info(
            f"✅ SSE connected for thread {thread_id}, total connections: {self.get_connection_count(thread_id)}"
        )
        return queue

    def disconnect(self, thread_id: str, queue: asyncio.Queue):
        """斷開 SSE 連線"""
        if thread_id in self.active_connections:
            self.active_connections[thread_id].discard(queue)
            if not self.active_connections[thread_id]:
                del self.active_connections[thread_id]
        logger.info(f"🔌 SSE disconnected for thread {thread_id}")

    async def send_new_message(self, thread_id: str, message_data: dict):
        """
        通知前端有新訊息

        Args:
            thread_id: 對話 thread ID
            message_data: 訊息資料 (符合前端 ChatMessage 格式)
        """
        if thread_id not in self.active_connections:
            logger.debug(f"No active SSE connections for thread {thread_id}")
            return

        stale = set()
        success_count = 0

        for queue in self.active_connections[thread_id]:
            try:
                await queue.put({"type": "new_message", "data": message_data})
                success_count += 1
            except Exception as e:
                logger.error(f"❌ Failed to push message to SSE queue: {e}")
                stale.add(queue)

        for q in stale:
            self.disconnect(thread_id, q)

        if success_count > 0:
            logger.info(f"📤 Sent message to {success_count} SSE connection(s) for thread {thread_id}")

    def get_connection_count(self, thread_id: str = None) -> int:
        """獲取連線數量"""
        if thread_id:
            return len(self.active_connections.get(thread_id, set()))
        return sum(len(conns) for conns in self.active_connections.values())


# 全域實例
manager = ConnectionManager()
