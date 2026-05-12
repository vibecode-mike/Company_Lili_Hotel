"""
line_app HTTP 客戶端
用于 Backend 通過 HTTP 調用 line_app 服務
"""
import httpx
from typing import Dict, List, Optional, Any
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class LineAppClient:
    """line_app HTTP 客戶端"""

    def __init__(self, base_url: str = None):
        """
        初始化 line_app HTTP 客戶端

        Args:
            base_url: line_app 服務地址 (默認從 settings 讀取)
        """
        self.base_url = base_url or settings.LINE_APP_URL
        self.timeout = httpx.Timeout(300.0)  # 5分鍾超時
        logger.info(f"LineAppClient initialized with base_url: {base_url}")

    async def health_check(self) -> Dict[str, Any]:
        """
        健康檢查

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
        群發消息

        Args:
            flex_message_json: Flex Message JSON
            target_audience: "all" | "filtered"
            include_tags: 包含標籤列表（發送給擁有這些標籤的會員）
            exclude_tags: 排除標籤列表（不發送給擁有這些標籤的會員）
            alt_text: 替代文字
            notification_message: 推播通知文字
            campaign_id: 活動 ID
            title: 消息標題
            interaction_tags: 互動標籤列表
            channel_id: LINE 頻道 ID（多租戶支持）

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
                "type": "FlexMessage",  # 添加類型字段，line_app 需要用此字段查找模板
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
        單發消息

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
        查詢配額狀態

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
        發送預檢

        Args:
            estimated_count: 預估接收人數

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
        發送 1:1 聊天消息

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
        標記聊天消息爲已讀

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
