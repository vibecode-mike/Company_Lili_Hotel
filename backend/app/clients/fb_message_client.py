"""
Facebook Message HTTP 客户端
用於 Backend 通過 HTTP 調用外部 Meta Page 服務
"""
import httpx
import logging
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)


class FbMessageClient:
    """Facebook Message HTTP 客户端"""

    def __init__(self, base_url: str = None):
        """
        初始化 Facebook Message HTTP 客户端

        Args:
            base_url: FB API 服務地址 (默認從 settings 讀取)
        """
        self.base_url = base_url or settings.FB_API_URL
        self.timeout = httpx.Timeout(30.0)

    async def send_message(self, recipient_email: str, text: str, meta_jwt_token: str) -> dict:
        """
        發送訊息到 Facebook 用戶 (使用 email 識別)

        Args:
            recipient_email: 會員 Email
            text: 訊息內容
            meta_jwt_token: Meta JWT Token (Bearer token)

        Returns:
            {"ok": True, ...} on success
            {"ok": False, "error": "..."} on failure
        """
        headers = {"Authorization": f"Bearer {meta_jwt_token}"}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/v1/admin/meta_page/message/single",
                    json={"recipient": recipient_email, "text": text},
                    headers=headers
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB message sent to {recipient_email}")
                return {"ok": True, **result}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB request error: {e}")
                return {"ok": False, "error": str(e)}

    async def get_chat_history(self, email: str, meta_jwt_token: str) -> Dict[str, Any]:
        """
        獲取 Facebook 聊天記錄

        Args:
            email: 會員 Email
            meta_jwt_token: Meta JWT Token (Bearer token)

        Returns:
            {
                "ok": True,
                "data": [
                    {"direction": "outgoing"/"ingoing", "message": str/dict, "time": int},
                    ...
                ]
            }
            or {"ok": False, "error": "...", "data": []} on failure
        """
        headers = {"Authorization": f"Bearer {meta_jwt_token}"}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/admin/meta_page/message/history",
                    params={"email": email},
                    headers=headers
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB chat history fetched for {email}, {len(result.get('data', []))} messages")
                return {"ok": True, "data": result.get("data", [])}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB history API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}", "data": []}
            except httpx.RequestError as e:
                logger.error(f"FB history request error: {e}")
                return {"ok": False, "error": str(e), "data": []}
