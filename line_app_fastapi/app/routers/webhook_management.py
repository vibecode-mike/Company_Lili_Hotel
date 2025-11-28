"""
Webhook Management Router

Admin API for configuring LINE webhook endpoints.
Provides HTTP endpoint to replace CLI manage_webhook.py functionality.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import httpx

router = APIRouter(prefix="/api/admin/webhook", tags=["Admin - Webhook"])
logger = logging.getLogger(__name__)

# LINE API endpoints
LINE_SET_ENDPOINT = "https://api.line.me/v2/bot/channel/webhook/endpoint"
LINE_ENABLE = "https://api.line.me/v2/bot/channel/webhook/enable"
LINE_GET = "https://api.line.me/v2/bot/channel/webhook/endpoint"


# -------------------------------------------------
# Pydantic Models
# -------------------------------------------------

class WebhookSetupRequest(BaseModel):
    """Request model for webhook setup"""
    channel_id: str
    access_token: str
    base_url: str
    with_channel_id: bool = False


class WebhookSetupResponse(BaseModel):
    """Response model for webhook setup"""
    ok: bool
    webhook_url: str
    set_status: int
    enable_status: int
    get_status: int
    current: Dict[str, Any]


# -------------------------------------------------
# Helper Functions
# -------------------------------------------------

async def set_and_enable_webhook(
    channel_id: str,
    access_token: str,
    base_url: str,
    with_id: bool
) -> Dict[str, Any]:
    """
    Configure and enable LINE webhook endpoint.

    Steps:
    1. Set webhook endpoint URL
    2. Enable webhook
    3. Verify by reading back current settings

    Args:
        channel_id: LINE Messaging API channel ID
        access_token: Long-lived channel access token
        base_url: Webhook base URL (e.g., https://linebot.star-bit.io/callback)
        with_id: If True, append channel_id to URL path

    Returns:
        Dictionary with webhook setup results
    """
    # Construct webhook URL
    webhook_url = base_url.rstrip("/")
    if with_id:
        webhook_url += f"/{channel_id}"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # STEP 1: Set webhook endpoint
            set_resp = await client.put(
                LINE_SET_ENDPOINT,
                headers=headers,
                json={"endpoint": webhook_url}
            )

            # STEP 2: Enable webhook
            enable_resp = await client.put(LINE_ENABLE, headers=headers)

            # STEP 3: Verify by reading back
            get_resp = await client.get(LINE_GET, headers=headers)

        # Parse current settings
        try:
            current = get_resp.json() if get_resp.status_code == 200 else {"raw": get_resp.text}
        except Exception:
            current = {"raw": get_resp.text}

        return {
            "webhook_url": webhook_url,
            "set_status": set_resp.status_code,
            "enable_status": enable_resp.status_code,
            "get_status": get_resp.status_code,
            "current": current,
        }

    except httpx.RequestError as e:
        logger.error(f"Failed to setup webhook: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to communicate with LINE API: {str(e)}"
        )


# -------------------------------------------------
# API Endpoints
# -------------------------------------------------

@router.post("/setup", response_model=WebhookSetupResponse)
async def setup_webhook(req: WebhookSetupRequest):
    """
    Configure and enable LINE webhook endpoint.

    Request Body:
        {
            "channel_id": "2005363092",
            "access_token": "LONG_LIVED_CHANNEL_ACCESS_TOKEN",
            "base_url": "https://linebot.star-bit.io/callback",
            "with_channel_id": true  // Optional, default false
        }

    Returns:
        WebhookSetupResponse with setup results

    Example:
        POST /api/admin/webhook/setup
        {
            "channel_id": "2005363092",
            "access_token": "xxx",
            "base_url": "https://linebot.star-bit.io/callback",
            "with_channel_id": true
        }

        Response:
        {
            "ok": true,
            "webhook_url": "https://linebot.star-bit.io/callback/2005363092",
            "set_status": 200,
            "enable_status": 200,
            "get_status": 200,
            "current": {
                "endpoint": "https://linebot.star-bit.io/callback/2005363092",
                "active": true
            }
        }

    Raises:
        HTTPException: 503 if LINE API communication fails
        HTTPException: 400 if webhook setup returns non-200 status
    """
    result = await set_and_enable_webhook(
        channel_id=req.channel_id,
        access_token=req.access_token,
        base_url=req.base_url,
        with_id=req.with_channel_id
    )

    # Check if all operations succeeded
    ok = (
        result["set_status"] == 200 and
        result["enable_status"] == 200 and
        result["get_status"] == 200
    )

    if not ok:
        logger.warning(
            f"Webhook setup incomplete: set={result['set_status']}, "
            f"enable={result['enable_status']}, get={result['get_status']}"
        )
        # Return result but log warning
        # Don't raise exception to allow caller to see what failed

    return WebhookSetupResponse(ok=ok, **result)
