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

    async def send_message(self, fb_customer_id: str, text: str, jwt_token: str) -> dict:
        """
        發送訊息到 Facebook 用戶

        Args:
            fb_customer_id: Facebook Customer ID (會轉為整數)
            text: 訊息內容
            jwt_token: JWT Token (Bearer token)

        Returns:
            {"ok": True, ...} on success
            {"ok": False, "error": "...", "error_code": int} on failure
        """
        headers = self._auth_headers(jwt_token)

        # 轉換 customer_id 為整數
        try:
            customer_id_int = int(fb_customer_id)
        except (ValueError, TypeError):
            logger.error(f"Invalid fb_customer_id format: {fb_customer_id}")
            return {"ok": False, "error": f"無效的 Facebook 會員 ID: {fb_customer_id}"}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/v1/admin/meta_page/message/single",
                    json={"customer_id": customer_id_int, "text": text},
                    headers=headers
                )

                result = response.json()
                status_code = result.get("status", response.status_code)

                # 處理錯誤碼
                if status_code != 200:
                    error_messages = {
                        1004: "請求參數錯誤",
                        604: "資料讀取失敗",
                        610: "無平台存取資訊",
                        611: "平台存取資訊已過期，請重新授權",
                        635: "此會員不存在於 Facebook",
                        2001: "呼叫 Facebook API 錯誤",
                        603: "資料寫入失敗"
                    }
                    error_msg = error_messages.get(status_code, result.get("msg", f"未知錯誤 ({status_code})"))
                    logger.error(f"FB API error: {status_code} - {error_msg}")
                    return {"ok": False, "error": error_msg, "error_code": status_code}

                logger.info(f"FB message sent to customer_id={customer_id_int}")
                return {"ok": True, **result}

            except httpx.HTTPStatusError as e:
                logger.error(f"FB API HTTP error: {e.response.status_code} - {e.response.text}")
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
                    logger.info(f"📥 FB API raw response: {data}")
                except ValueError:
                    preview = response.text[:200] if response.text else "empty body"
                    logger.error(f"FB broadcast API returned non‑JSON body: {preview}")
                    return {"ok": False, "error": "FB API 回應非 JSON"}

                status_code = data.get("status", response.status_code)
                # 根據 body 中的 status 判斷成功/失敗（外部 API 可能回傳 HTTP 200 但 status != 200）
                # 同時支援兩種回應格式：
                # 格式 1 (舊): {"status": 200, "data": {"success": N, "failure": N, "total_targets": N}}
                # 格式 2 (新): {"ok": true, "sent": N, "failed": N, "total": N}
                if status_code == 200 or data.get("ok") is True:
                    result_data = data.get("data", {}) or {}
                    # 彈性解析：優先取頂層欄位，否則從 data 子物件取
                    sent = data.get("sent") or result_data.get("success", 0)
                    failed = data.get("failed") or result_data.get("failure", 0)
                    total = data.get("total") or result_data.get("total_targets", 0)
                    return {
                        "ok": True,
                        "sent": sent,
                        "failed": failed,
                        "total": total,
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

    async def _delete_resource(
        self,
        endpoint: str,
        resource_type: str,
        resource_id: str,
        jwt_token: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        通用 DELETE 請求處理

        Args:
            endpoint: API 路徑 (不含 base_url)
            resource_type: 資源類型名稱 (用於日誌)
            resource_id: 資源 ID (用於日誌)
            jwt_token: JWT Token
            params: 可選的查詢參數
        """
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.delete(
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    params=params,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB {resource_type} DELETE: {resource_id}")
                return {"ok": True, **result}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB {resource_type} DELETE error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB {resource_type} DELETE request error: {e}")
                return {"ok": False, "error": str(e)}

    async def delete_keyword(self, keyword_id: int, jwt_token: str) -> Dict[str, Any]:
        """刪除關鍵字 (DELETE /meta_page/message/auto_template/keyword/{id})"""
        return await self._delete_resource(
            endpoint=f"/api/v1/admin/meta_page/message/auto_template/keyword/{keyword_id}",
            resource_type="keyword",
            resource_id=str(keyword_id),
            jwt_token=jwt_token,
        )

    async def delete_reply(self, reply_id: int, jwt_token: str) -> Dict[str, Any]:
        """刪除訊息 (DELETE /meta_page/message/auto_template/Reply/{id})"""
        return await self._delete_resource(
            endpoint=f"/api/v1/admin/meta_page/message/auto_template/Reply/{reply_id}",
            resource_type="reply",
            resource_id=str(reply_id),
            jwt_token=jwt_token,
        )

    async def delete_template(self, basic_id: str, jwt_token: str) -> Dict[str, Any]:
        """刪除整組設定 (DELETE /meta_page/message/auto_template?basic_id={id})"""
        return await self._delete_resource(
            endpoint="/api/v1/admin/meta_page/message/auto_template",
            resource_type="template",
            resource_id=basic_id,
            jwt_token=jwt_token,
            params={"basic_id": basic_id},
        )

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
                        "channel_name": "粉專名稱",
                        "status": 0,  // 0=草稿, 1=已發送, 2=已排程
                        "amount": 0,
                        "admin_id": 1,
                        "click_amount": 0,
                        "create_time": 1768793957,
                        "keywords": [{"id": 1, "basic_id": 14, "name": "#標籤", "enabled": true}]
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

    async def get_broadcast_detail(self, group_message_id: int, jwt_token: str) -> Dict[str, Any]:
        """取得推播活動詳細資訊"""
        headers = self._auth_headers(jwt_token)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/admin/meta_page/message/gourp_detail",
                    params={"group_message_id": group_message_id},
                    headers=headers,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"FB broadcast detail fetched for id={group_message_id}")
                return {"ok": True, **result}
            except httpx.HTTPStatusError as e:
                logger.error(f"FB broadcast detail API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"API error: {e.response.status_code}", "data": []}
            except httpx.RequestError as e:
                logger.error(f"FB broadcast detail request error: {e}")
                return {"ok": False, "error": str(e), "data": []}

    async def firm_login(self, account: str, password: str) -> Dict[str, Any]:
        """
        Firm Login 獲取 JWT Token

        Args:
            account: Firm 帳號
            password: Firm 密碼

        Returns:
            {
                "ok": True,
                "access_token": "eyJ..."
            }
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/v1/admin/firm_login",
                    json={"account": account, "password": password},
                )
                response.raise_for_status()
                result = response.json()

                access_token = result.get("data", {}).get("access_token")
                if not access_token:
                    logger.error(f"FB firm_login 未返回 access_token: {result}")
                    return {"ok": False, "error": "未獲取到 access_token"}

                logger.info(f"FB firm_login 成功，已獲取 JWT token")
                return {"ok": True, "access_token": access_token}

            except httpx.HTTPStatusError as e:
                logger.error(f"FB firm_login API error: {e.response.status_code} - {e.response.text}")
                return {"ok": False, "error": f"登入失敗: {e.response.status_code}"}
            except httpx.RequestError as e:
                logger.error(f"FB firm_login request error: {e}")
                return {"ok": False, "error": str(e)}
