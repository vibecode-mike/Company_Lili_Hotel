"""
Facebook WebSocket 代理服務
連接外部 WS（帶 header JWT），收到訊息後透過 SSE manager 推送給前端
"""
import asyncio
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional

import websockets

from app.config import settings
from app.websocket_manager import manager

logger = logging.getLogger(__name__)


class FbProxyConnection:
    """單一 FB WebSocket 代理連線"""

    def __init__(self, fb_customer_id: str, page_id: str, jwt_token: str, thread_id: str):
        self.fb_customer_id = fb_customer_id
        self.page_id = page_id
        self.jwt_token = jwt_token
        self.thread_id = thread_id
        self._task: Optional[asyncio.Task] = None
        self._stopped = False

    async def start(self):
        self._stopped = False
        self._task = asyncio.create_task(self._run())
        logger.info(f"[FB WS Proxy] Started for customer={self.fb_customer_id}, thread={self.thread_id}")

    async def stop(self):
        self._stopped = True
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        logger.info(f"[FB WS Proxy] Stopped for customer={self.fb_customer_id}")

    async def _run(self):
        base_url = settings.FB_API_URL.replace("https://", "wss://").replace("http://", "ws://")
        url = f"{base_url}/api/v1/admin/single_message?user_id={self.fb_customer_id}&page_id={self.page_id}"
        headers = {"Authorization": f"Bearer {self.jwt_token}"}

        retry_count = 0
        while not self._stopped:
            try:
                async with websockets.connect(url, additional_headers=headers) as ws:
                    logger.info(f"[FB WS Proxy] Connected to external WS for customer={self.fb_customer_id}")
                    retry_count = 0

                    async for raw in ws:
                        if self._stopped:
                            break
                        try:
                            data = json.loads(raw)
                            logger.debug(f"[FB WS Proxy] Received: {data}")
                            msg = self._transform_message(data)
                            await manager.send_new_message(self.thread_id, msg)
                        except json.JSONDecodeError:
                            logger.warning(f"[FB WS Proxy] Non-JSON message: {raw[:200]}")
                        except Exception as e:
                            logger.error(f"[FB WS Proxy] Error processing message: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                if self._stopped:
                    break
                delay = min(2 ** retry_count, 30)
                retry_count += 1
                logger.warning(f"[FB WS Proxy] Disconnected ({e}), reconnecting in {delay}s (attempt {retry_count})")
                await asyncio.sleep(delay)

    def _transform_message(self, raw: dict) -> dict:
        """將外部 WS 訊息轉為 SSE manager 格式 (ChatMessage)"""
        direction = (raw.get("direction") or "outgoing").lower()
        is_incoming = direction in ("ingoing", "incoming")
        timestamp = raw.get("time") or 0

        text = self._extract_text(raw.get("message", ""))

        tz = timezone(timedelta(hours=8))
        dt = datetime.fromtimestamp(timestamp, tz=tz) if timestamp else datetime.now(tz)

        return {
            "id": f"fb_ws_{timestamp}_{id(raw) % 10000}",
            "type": "user" if is_incoming else "official",
            "text": text,
            "time": dt.strftime("%p %I:%M").replace("AM", "上午").replace("PM", "下午"),
            "timestamp": dt.isoformat(),
            "thread_id": self.thread_id,
            "isRead": True,
            "source": "fb_realtime",
        }

    @staticmethod
    def _extract_text(message) -> str:
        """從外部 WS 的 message 欄位提取文字內容"""
        if not isinstance(message, dict):
            return str(message)

        attachment = message.get("attachment", {})
        if attachment.get("type") == "template":
            elements = attachment.get("payload", {}).get("elements", [])
            lines = [f'{el.get("title", "")} - {el.get("subtitle", "")}' for el in elements]
            return "\n".join(lines) or "[模板訊息]"

        return json.dumps(message, ensure_ascii=False)


class FbWsProxyManager:
    """管理所有 FB WebSocket 代理連線"""

    def __init__(self):
        self._proxies: Dict[str, FbProxyConnection] = {}

    @staticmethod
    def _key(fb_customer_id: str, page_id: str) -> str:
        return f"{fb_customer_id}:{page_id}"

    async def start_proxy(
        self,
        fb_customer_id: str,
        page_id: str,
        jwt_token: str,
        thread_id: str,
    ) -> bool:
        key = self._key(fb_customer_id, page_id)

        # 如果已有連線，先停止
        if key in self._proxies:
            await self._proxies[key].stop()

        proxy = FbProxyConnection(fb_customer_id, page_id, jwt_token, thread_id)
        self._proxies[key] = proxy
        await proxy.start()
        return True

    async def stop_proxy(self, fb_customer_id: str, page_id: str) -> bool:
        proxy = self._proxies.pop(self._key(fb_customer_id, page_id), None)
        if proxy:
            await proxy.stop()
            return True
        return False

    async def stop_all(self):
        for proxy in self._proxies.values():
            await proxy.stop()
        self._proxies.clear()

    def is_active(self, fb_customer_id: str, page_id: str) -> bool:
        return self._key(fb_customer_id, page_id) in self._proxies


# 全域實例
fb_ws_proxy_manager = FbWsProxyManager()
