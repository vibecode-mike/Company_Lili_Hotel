"""
Admin Router

Simplified admin endpoints for testing and management.
Provides HTTP API alternatives to CLI management scripts.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from app.services.line_service import get_line_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


# -------------------------------------------------
# Pydantic Models
# -------------------------------------------------

class PushTestRequest(BaseModel):
    """Request model for testing push messages"""
    line_uid: str
    message: str
    channel_id: Optional[str] = None


class PushTestResponse(BaseModel):
    """Response model for push test"""
    ok: bool
    message: str
    line_uid: str


# -------------------------------------------------
# API Endpoints
# -------------------------------------------------

@router.post("/push/test", response_model=PushTestResponse)
async def test_push_message(req: PushTestRequest):
    """
    Send a test push message to a specific LINE user.

    Simplified replacement for manage_push.py CLI script.

    Request Body:
        {
            "line_uid": "U1234567890abcdef",
            "message": "Test message",
            "channel_id": "optional_channel_id"
        }

    Returns:
        PushTestResponse with success status

    Example:
        POST /api/admin/push/test
        {
            "line_uid": "U1234567890abcdef",
            "message": "Hello from FastAPI!"
        }

    Raises:
        HTTPException: 400 if line_uid is invalid
        HTTPException: 500 if push fails
    """
    if not req.line_uid or not req.line_uid.startswith("U"):
        raise HTTPException(status_code=400, detail="Invalid LINE UID")

    if len(req.line_uid) != 33:
        raise HTTPException(status_code=400, detail="LINE UID must be 33 characters")

    try:
        line_service = get_line_service()
        await line_service.push_message(req.line_uid, req.message)

        logger.info(f"Test push sent to {req.line_uid}")

        return PushTestResponse(
            ok=True,
            message="Push message sent successfully",
            line_uid=req.line_uid
        )

    except Exception as e:
        logger.error(f"Failed to send test push: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send push message: {str(e)}"
        )


@router.get("/health")
async def admin_health():
    """
    Admin health check endpoint.

    Returns:
        Status information
    """
    return {
        "status": "healthy",
        "service": "admin_api",
        "version": "1.0.0"
    }
