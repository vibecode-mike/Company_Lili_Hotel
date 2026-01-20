"""
Facebook Message HTTP 客户端
用於 Backend 通過 HTTP 調用外部 Meta Page 服務
"""
import httpx
import logging
from typing import Dict, Any, Optional
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

    @staticmethod
    def _auth_headers(jwt_token: str) -> Dict[str, str]:
        """組裝帶 Authorization 的標頭"""
        return {"Authorization": f"Bearer {jwt_token}"}

    async def send_message(self, page_id: str, fb_customer_id: str, text: str, jwt_token: str) -> dict:
        """
        發送訊息到 Facebook 用戶 (使用 fb_customer_id 識別)

        Args:
            page_id: Facebook Page ID
            fb_customer_id: Facebook Customer ID
            text: 訊息內容
            jwt_token: JWT Token (Bearer token)

        Returns:
            {"ok": True, ...} on success
            {"ok": False, "error": "..."} on failure
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/v1/admin/meta_page/message/single",
                    json={"page_id": page_id, "customer_id": fb_customer_id, "text": text},
                    headers=headers
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB message sent to fb_customer_id={fb_customer_id}")
                return {"ok": True, **result}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB request error: {e}")
                return {"ok": False, "error": str(e)}

    async def get_chat_history(self, customer_id: str, page_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        獲取 Facebook 聊天記錄

        Args:
            customer_id: Facebook Customer ID (fb_customer_id)
            page_id: Facebook Page ID
            jwt_token: JWT Token (Bearer token)

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
        headers = {"Authorization": f"Bearer {jwt_token}"}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/admin/meta_page/message/history",
                    params={"customer_id": customer_id, "page_id": page_id},
                    headers=headers
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB chat history fetched for customer_id={customer_id}, page_id={page_id}, {len(result.get('data', []))} messages")
                return {"ok": True, "data": result.get("data", [])}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB history API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}", "data": []}
            except httpx.RequestError as e:
                logger.error(f"FB history request error: {e}")
                return {"ok": False, "error": str(e), "data": []}


    async def send_broadcast_message(self, payload: Dict[str, Any], jwt_token: str) -> Dict[str, Any]:
        """
        群發 Messenger 訊息 (/meta_page/message)

        Args:
            payload: API 所需 JSON（包含 channel/target_type/targets/element）
            jwt_token: JWT Token (Bearer)
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/v1/admin/meta_page/message",
                    json=payload,
                    headers=headers,
                )
                try:
                    data = response.json()
                except ValueError:
                    preview = response.text[:200] if response.text else "empty body"
                    logger.error(f"FB broadcast API returned non‑JSON body: {preview}")
                    return {"ok": False, "error": "FB API 回應非 JSON"}

                status_code = data.get("status", response.status_code)
                # 根據 body 中的 status 判斷成功/失敗（外部 API 可能回傳 HTTP 200 但 status != 200）
                if status_code == 200:
                    result_data = data.get("data", {}) or {}
                    return {
                        "ok": True,
                        "sent": result_data.get("success", 0),
                        "failed": result_data.get("failure", 0),
                        "total": result_data.get("total_targets", 0),
                        "msg": data.get("msg", "ok"),
                    }

                error_msg = data.get("msg", f"API error: {status_code}")
                logger.error(f"FB broadcast API error ({status_code}): {error_msg}")
                return {"ok": False, "error": error_msg}
            except httpx.RequestError as e:
                logger.error(f"FB broadcast request error: {e}")
                return {"ok": False, "error": str(e)}

    async def list_messages(self, jwt_token: str) -> Dict[str, Any]:
        """
        取得訊息列表 (/meta_page/message/list)
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/admin/meta_page/message/list",
                    headers=headers,
                )
                response.raise_for_status()
                return {"ok": True, **response.json()}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB message list API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB message list request error: {e}")
                return {"ok": False, "error": str(e)}

    async def set_auto_template(self, payload: Dict[str, Any], jwt_token: str) -> Dict[str, Any]:
        """
        設定自動回應模板 (/meta_page/message/auto_template)
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/v1/admin/meta_page/message/auto_template",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB auto_template API response: {result}")
                return {"ok": True, **result}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB auto_template API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB auto_template request error: {e}")
                return {"ok": False, "error": str(e)}

    async def get_auto_templates(self, jwt_token: str) -> Dict[str, Any]:
        """
        取得自動回應模板列表 (GET /meta_page/message/auto_template)
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/admin/meta_page/message/auto_template",
                    headers=headers,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB auto_template list API response: {len(result.get('data', []))} items")
                return {"ok": True, **result}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB auto_template list API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}", "data": []}
            except httpx.RequestError as e:
                logger.error(f"FB auto_template list request error: {e}")
                return {"ok": False, "error": str(e), "data": []}

    async def update_auto_template(self, template_id: int, payload: Dict[str, Any], jwt_token: str) -> Dict[str, Any]:
        """
        更新自動回應模板 (PATCH /meta_page/message/auto_template)
        """
        headers = self._auth_headers(jwt_token)
        payload_with_id = {"id": template_id, **payload}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.patch(
                    f"{self.base_url}/api/v1/admin/meta_page/message/auto_template",
                    json=payload_with_id,
                    headers=headers,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB auto_template PATCH response: {result}")
                return {"ok": True, **result}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB auto_template PATCH error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB auto_template PATCH request error: {e}")
                return {"ok": False, "error": str(e)}

    async def create_message_template(self, payload: Dict[str, Any], jwt_token: str) -> Dict[str, Any]:
        """
        建立/更新群發訊息模板 (/meta_page/message/template)
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/v1/admin/meta_page/message/template",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                return {"ok": True, **response.json()}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB template API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB template request error: {e}")
                return {"ok": False, "error": str(e)}

    async def get_message_template(self, setting_id: Optional[str], jwt_token: str) -> Dict[str, Any]:
        """
        取得訊息模板內容 (/meta_page/message/template?setting_id=xxx)
        """
        headers = self._auth_headers(jwt_token)
        params: Dict[str, str] = {}
        if setting_id:
            params["setting_id"] = setting_id

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/admin/meta_page/message/template",
                    headers=headers,
                    params=params or None,
                )
                response.raise_for_status()
                return {"ok": True, **response.json()}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB template fetch API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB template fetch request error: {e}")
                return {"ok": False, "error": str(e)}

    async def get_login_status(self, jwt_token: str) -> Dict[str, Any]:
        """
        取得 FB 連結狀態 (/meta_page/login_status)

        Returns:
            {"ok": True, "data": [...]} on success
            {"ok": False, "error": "...", "data": []} on failure
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/admin/meta_page/login_status",
                    headers=headers,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB login_status: {len(result.get('data', []))} pages")
                return {"ok": True, "data": result.get("data", [])}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB login_status error: {e.response.status_code}")
                return {"ok": False, "error": f"API error: {e.response.status_code}", "data": []}
            except httpx.RequestError as e:
                logger.error(f"FB login_status request error: {e}")
                return {"ok": False, "error": str(e), "data": []}

    async def get_broadcast_list(self, jwt_token: str) -> Dict[str, Any]:
        """
        取得推播活動列表 (/meta_page/message/gourp_list)

        API.XLSX API 7: 活動與訊息推播 (一進到頁面的列表)

        Returns:
            {
                "ok": True,
                "data": [
                    {
                        "id": 14,
                        "title": "12345",
                        "channel": "FB",
                        "status": 0,
                        "amount": 0,
                        "admin_id": 1,
                        "click_amount": 0,
                        "create_time": 1768793957
                    }
                ],
                "msg": "ok",
                "status": 200
            }
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/admin/meta_page/message/gourp_list",
                    headers=headers,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB broadcast list API response: {len(result.get('data', []))} items")
                return {"ok": True, **result}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB broadcast list API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}", "data": []}
            except httpx.RequestError as e:
                logger.error(f"FB broadcast list request error: {e}")
                return {"ok": False, "error": str(e), "data": []}
