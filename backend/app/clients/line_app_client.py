"""
line_app HTTP 客户端
用于 Backend 通过 HTTP 调用 line_app 服务
"""
import httpx
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class LineAppClient:
    """line_app HTTP 客户端"""

    def __init__(self, base_url: str = "http://localhost:3001"):
        """
        初始化 line_app HTTP 客户端

        Args:
            base_url: line_app 服务地址 (默认: http://localhost:3001)
        """
        self.base_url = base_url
        self.timeout = httpx.Timeout(300.0)  # 5分钟超时
        logger.info(f"LineAppClient initialized with base_url: {base_url}")

    async def health_check(self) -> Dict[str, Any]:
        """
        健康检查

        Returns:
            {"status": "ok", "service": "line_app"}
        """
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{self.base_url}/api/v1/health")
            response.raise_for_status()
            return response.json()

    async def broadcast_message(
        self,
        flex_message_json: dict,
        target_audience: str,
        include_tags: Optional[List[str]] = None,
        exclude_tags: Optional[List[str]] = None,
        alt_text: str = "新訊息",
        notification_message: Optional[str] = None,
        campaign_id: Optional[int] = None,
        title: Optional[str] = None,
        interaction_tags: Optional[List[str]] = None,
        channel_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        群发消息

        Args:
            flex_message_json: Flex Message JSON
            target_audience: "all" | "filtered"
            include_tags: 包含标签列表（发送给拥有这些标签的会员）
            exclude_tags: 排除标签列表（不发送给拥有这些标签的会员）
            alt_text: 替代文字
            notification_message: 推播通知文字
            campaign_id: 活动 ID
            title: 消息标题
            interaction_tags: 互动标签列表
            channel_id: LINE 频道 ID（多租户支持）

        Returns:
            {
                "ok": bool,
                "sent": int,
                "failed": int,
                "errors": List[dict]
            }
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            payload = {
                "flex_message_json": flex_message_json,
                "target_audience": target_audience,
                "alt_text": alt_text,
                "type": "FlexMessage",  # 添加类型字段，line_app 需要用此字段查找模板
            }

            if include_tags:
                payload["include_tags"] = include_tags
            if exclude_tags:
                payload["exclude_tags"] = exclude_tags
            if notification_message:
                payload["notification_message"] = notification_message
            if campaign_id:
                payload["campaign_id"] = campaign_id
            if title:
                payload["title"] = title
            if interaction_tags:
                payload["interaction_tags"] = interaction_tags
            if channel_id:
                payload["channel_id"] = channel_id

            logger.info(f"Sending broadcast via HTTP to {self.base_url}/api/v1/messages/broadcast")
            logger.debug(f"Payload: target_audience={target_audience}, include_tags={include_tags}, exclude_tags={exclude_tags}, campaign_id={campaign_id}")

            response = await client.post(
                f"{self.base_url}/api/v1/messages/broadcast",
                json=payload
            )
            response.raise_for_status()
            result = response.json()

            logger.info(f"Broadcast result: ok={result.get('ok')}, sent={result.get('sent')}, failed={result.get('failed')}")
            return result

    async def send_message(
        self,
        user_id: str,
        messages: List[dict]
    ) -> Dict[str, Any]:
        """
        单发消息

        Args:
            user_id: LINE User ID
            messages: 消息列表

        Returns:
            {"ok": bool, "sent": int}
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            logger.info(f"Sending single message to user {user_id}")

            response = await client.post(
                f"{self.base_url}/api/v1/messages/send",
                json={
                    "user_id": user_id,
                    "messages": messages
                }
            )
            response.raise_for_status()
            result = response.json()

            logger.info(f"Send result: ok={result.get('ok')}")
            return result

    async def get_quota_status(self) -> Dict[str, Any]:
        """
        查询配额状态

        Returns:
            {
                "type": "limited" | "none",
                "monthly_limit": int,
                "used": int,
                "remaining": int
            }
        """
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{self.base_url}/api/v1/quota/status"
            )
            response.raise_for_status()
            return response.json()

    async def preflight_check(
        self,
        estimated_count: int
    ) -> Dict[str, Any]:
        """
        发送预检

        Args:
            estimated_count: 预估接收人数

        Returns:
            {
                "ok": bool,
                "status": "OK" | "INSUFFICIENT_QUOTA",
                "remaining": int,
                "needed": int
            }
        """
        async with httpx.AsyncClient(timeout=5.0) as client:
            logger.info(f"Preflight check for {estimated_count} recipients")

            response = await client.post(
                f"{self.base_url}/api/v1/quota/preflight",
                json={"estimated_count": estimated_count}
            )
            response.raise_for_status()
            result = response.json()

            logger.info(f"Preflight result: status={result.get('status')}, remaining={result.get('remaining')}")
            return result

    async def send_chat_message(
        self,
        line_uid: str,
        text: str
    ) -> Dict[str, Any]:
        """
        发送 1:1 聊天消息

        Args:
            line_uid: LINE User ID
            text: 消息文本

        Returns:
            {
                "ok": bool,
                "message_id": str,
                "thread_id": str
            }
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            logger.info(f"Sending chat message to {line_uid}")

            response = await client.post(
                f"{self.base_url}/api/v1/chat/send",
                json={"line_uid": line_uid, "text": text}
            )
            response.raise_for_status()
            result = response.json()

            logger.info(f"Chat message sent: ok={result.get('ok')}, message_id={result.get('message_id')}")
            return result

    async def mark_chat_read(
        self,
        line_uid: str
    ) -> Dict[str, Any]:
        """
        标记聊天消息为已读

        Args:
            line_uid: LINE User ID

        Returns:
            {
                "ok": bool,
                "marked_count": int
            }
        """
        async with httpx.AsyncClient(timeout=5.0) as client:
            logger.info(f"Marking chat as read for {line_uid}")

            response = await client.put(
                f"{self.base_url}/api/v1/chat/mark-read",
                json={"line_uid": line_uid}
            )
            response.raise_for_status()
            result = response.json()

            logger.info(f"Chat marked as read: ok={result.get('ok')}, count={result.get('marked_count')}")
            return result
