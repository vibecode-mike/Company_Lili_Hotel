"""
連線管理器（WebSocket + SSE）
用於即時推送訊息到前端聊天室
- WebSocket：Facebook / Webchat 渠道
- SSE：LINE 渠道（因外部代理 HTTP/2 不支援 WebSocket Upgrade）
"""
import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """管理 WebSocket 與 SSE 連線"""

    def __init__(self):
        # thread_id -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # thread_id -> Set[asyncio.Queue]  (SSE)
        self.sse_connections: Dict[str, Set[asyncio.Queue]] = {}

    # ── WebSocket ──────────────────────────────────────

    async def connect(self, websocket: WebSocket, thread_id: str):
        """建立 WebSocket 連線"""
        await websocket.accept()
        if thread_id not in self.active_connections:
            self.active_connections[thread_id] = set()
        self.active_connections[thread_id].add(websocket)
        logger.info(
            f"✅ WebSocket connected for thread {thread_id}, total: {self.get_connection_count(thread_id)}"
        )

    def disconnect(self, websocket: WebSocket, thread_id: str):
        """斷開 WebSocket 連線"""
        if thread_id in self.active_connections:
            self.active_connections[thread_id].discard(websocket)
            if not self.active_connections[thread_id]:
                del self.active_connections[thread_id]
        logger.info(f"🔌 WebSocket disconnected for thread {thread_id}")

    # ── SSE ────────────────────────────────────────────

    def connect_sse(self, queue: asyncio.Queue, thread_id: str):
        """註冊 SSE 連線（Queue）"""
        if thread_id not in self.sse_connections:
            self.sse_connections[thread_id] = set()
        self.sse_connections[thread_id].add(queue)
        logger.info(
            f"✅ SSE connected for thread {thread_id}, total: {self.get_connection_count(thread_id)}"
        )

    def disconnect_sse(self, queue: asyncio.Queue, thread_id: str):
        """移除 SSE 連線"""
        if thread_id in self.sse_connections:
            self.sse_connections[thread_id].discard(queue)
            if not self.sse_connections[thread_id]:
                del self.sse_connections[thread_id]
        logger.info(f"🔌 SSE disconnected for thread {thread_id}")

    # ── 推送 ───────────────────────────────────────────

    async def send_new_message(self, thread_id: str, message_data: dict):
        """
        通知前端有新訊息（WebSocket + SSE）

        Args:
            thread_id: 對話 thread ID（格式：{platform}:{uid}）
            message_data: 訊息資料 (符合前端 ChatMessage 格式)
        """
        payload = {"type": "new_message", "data": message_data}
        ws_count = await self._push_ws(thread_id, payload)
        sse_count = await self._push_sse(thread_id, payload)

        total = ws_count + sse_count
        if total > 0:
            logger.info(
                f"📤 Sent message to {total} connection(s) for thread {thread_id} "
                f"(WS:{ws_count}, SSE:{sse_count})"
            )
        else:
            logger.debug(f"No active connections for thread {thread_id}")

    async def broadcast(self, event_type: str, data: dict):
        """
        廣播通知至所有已連線的前端（跨 thread，WebSocket + SSE）

        Args:
            event_type: 事件類型（如 "rule_updated"）
            data: 事件資料
        """
        payload = {"type": event_type, "data": data}

        # WebSocket broadcast
        ws_disconnected = []
        ws_count = 0
        for thread_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(payload)
                    ws_count += 1
                except Exception as e:
                    logger.error(f"❌ WS broadcast failed for thread {thread_id}: {e}")
                    ws_disconnected.append((connection, thread_id))
        for conn, tid in ws_disconnected:
            self.disconnect(conn, tid)

        # SSE broadcast
        sse_count = 0
        for thread_id, queues in self.sse_connections.items():
            for queue in queues:
                try:
                    await queue.put(payload)
                    sse_count += 1
                except Exception:
                    pass

        total = ws_count + sse_count
        if total > 0:
            logger.info(
                f"📢 Broadcast '{event_type}' to {total} connection(s) (WS:{ws_count}, SSE:{sse_count})"
            )

    # ── 內部推送 ───────────────────────────────────────

    async def _push_ws(self, thread_id: str, payload: dict) -> int:
        """推送到 WebSocket 連線，回傳成功數"""
        if thread_id not in self.active_connections:
            return 0

        disconnected = set()
        count = 0
        for connection in self.active_connections[thread_id]:
            try:
                await connection.send_json(payload)
                count += 1
            except Exception as e:
                logger.error(f"❌ WS send failed: {e}")
                disconnected.add(connection)

        for conn in disconnected:
            self.disconnect(conn, thread_id)
        return count

    async def _push_sse(self, thread_id: str, payload: dict) -> int:
        """推送到 SSE 連線（Queue），回傳成功數"""
        if thread_id not in self.sse_connections:
            return 0

        count = 0
        for queue in self.sse_connections[thread_id]:
            try:
                await queue.put(payload)
                count += 1
            except Exception:
                pass
        return count

    # ── 連線數 ─────────────────────────────────────────

    def get_connection_count(self, thread_id: str = None) -> int:
        """獲取連線數量（WebSocket + SSE）"""
        if thread_id:
            ws = len(self.active_connections.get(thread_id, set()))
            sse = len(self.sse_connections.get(thread_id, set()))
            return ws + sse
        ws_total = sum(len(conns) for conns in self.active_connections.values())
        sse_total = sum(len(conns) for conns in self.sse_connections.values())
        return ws_total + sse_total


# 全域實例
manager = ConnectionManager()
