"""
Usage Monitoring Router

Monitors LINE messaging API quota usage and provides preflight checks for broadcasts.

Features:
- Get monthly quota and consumption from LINE API
- Preflight check before broadcast to avoid quota overflow
- Multi-channel support with token resolution
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import httpx

from app.config import LINE_CHANNEL_ACCESS_TOKEN
from app.db_async import fetchone

router = APIRouter(prefix="/api/usage", tags=["Usage Monitoring"])
logger = logging.getLogger(__name__)

# LINE API endpoints
LINE_QUOTA_URL = "https://api.line.me/v2/bot/message/quota"
LINE_CONSUMPTION_URL = "https://api.line.me/v2/bot/message/quota/consumption"

# Fallback token from environment
ENV_FALLBACK_TOKEN = LINE_CHANNEL_ACCESS_TOKEN


# -------------------------------------------------
# Pydantic Models
# -------------------------------------------------

class PreflightRequest(BaseModel):
    """Request model for preflight broadcast check"""
    target_audience: Optional[str] = "all"
    target_tags: Optional[list[str]] = []
    channel_id: Optional[str] = None


class UsageSummary(BaseModel):
    """Response model for usage summary"""
    ok: bool
    type: str
    monthly_limit: Optional[int]
    used: int
    remaining: Optional[int]
    updated_at: str
    error: Optional[str] = None


class PreflightResponse(BaseModel):
    """Response model for preflight check"""
    ok: bool
    remaining: Optional[int]
    needed: int
    type: Optional[str] = None
    code: Optional[str] = None
    deficit: Optional[int] = None
    error: Optional[str] = None


# -------------------------------------------------
# Helper Functions
# -------------------------------------------------

async def resolve_access_token(channel_id: Optional[str]) -> Optional[str]:
    """
    Resolve LINE channel access token from database or fallback to environment.

    Args:
        channel_id: LINE channel ID

    Returns:
        Access token string, or None if not found
    """
    if channel_id:
        row = await fetchone("""
            SELECT channel_access_token AS token
            FROM line_channels
            WHERE channel_id = :cid AND is_active = 1
            LIMIT 1
        """, {"cid": channel_id})
        if row and row.get("token"):
            return row["token"]

    return ENV_FALLBACK_TOKEN or None


async def get_monthly_usage_summary(channel_id: Optional[str]) -> Dict[str, Any]:
    """
    Fetch monthly quota and consumption from LINE API.

    Args:
        channel_id: Optional LINE channel ID

    Returns:
        Dictionary with keys:
        - ok: Success flag
        - type: "limited" or "none" (unlimited)
        - monthly_limit: Monthly quota limit (None if unlimited)
        - used: Current month consumption
        - remaining: Remaining quota (None if unlimited)
        - updated_at: ISO timestamp
        - error: Error message if ok=False
    """
    token = await resolve_access_token(channel_id)
    if not token:
        return {"ok": False, "error": "no_token"}

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch quota
            quota_resp = await client.get(LINE_QUOTA_URL, headers=headers)
            qj = quota_resp.json() if quota_resp.status_code == 200 else {}

            # Fetch consumption
            consumption_resp = await client.get(LINE_CONSUMPTION_URL, headers=headers)
            cj = consumption_resp.json() if consumption_resp.status_code == 200 else {}

        # Parse quota type
        qtype = (qj.get("type") or "").lower()
        if qtype == "limited":
            monthly_limit = int(qj.get("value") or 0)
        else:
            monthly_limit = None  # Unlimited (enterprise account)

        # Parse consumption
        used = int(cj.get("totalUsage") or 0)

        # Calculate remaining
        remaining = None if monthly_limit is None else max(0, monthly_limit - used)

        return {
            "ok": True,
            "type": qtype or "unknown",
            "monthly_limit": monthly_limit,
            "used": used,
            "remaining": remaining,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

    except Exception as e:
        logger.error(f"Failed to fetch LINE API usage: {e}")
        return {"ok": False, "error": str(e)}


async def count_recipients_for_payload(payload: Dict[str, Any]) -> int:
    """
    Count number of recipients based on target audience and tags.

    Matches logic from broadcast service: only valid LINE UIDs (U prefix, length 33).

    Args:
        payload: Dictionary with target_audience and target_tags

    Returns:
        Number of valid recipients
    """
    target_audience = payload.get("target_audience", "all")
    target_tags = payload.get("target_tags") or []

    if target_audience == "tags" and target_tags:
        # Count members with specific tags
        placeholders = ", ".join([f":tag{i}" for i in range(len(target_tags))])
        params = {f"tag{i}": t for i, t in enumerate(target_tags)}
        sql = f"""
            SELECT COUNT(DISTINCT m.id) AS n
            FROM members m
            JOIN member_tags mt ON m.id = mt.member_id
            WHERE m.line_uid IS NOT NULL
              AND m.line_uid <> ''
              AND m.line_uid LIKE 'U%%'
              AND LENGTH(m.line_uid) = 33
              AND mt.tag_name IN ({placeholders})
        """
        row = await fetchone(sql, params)
        return int(row["n"]) if row else 0

    # Default: count all valid members
    row = await fetchone("""
        SELECT COUNT(*) AS n
        FROM members
        WHERE line_uid IS NOT NULL
          AND line_uid <> ''
          AND line_uid LIKE 'U%'
          AND LENGTH(line_uid) = 33
    """)
    return int(row["n"]) if row else 0


async def preflight_check(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check if there's sufficient quota for the planned broadcast.

    Args:
        payload: Broadcast payload with channel_id, target_audience, target_tags

    Returns:
        Dictionary with:
        - ok: True if sufficient quota, False otherwise
        - remaining: Remaining quota (None if unlimited)
        - needed: Number of recipients
        - type: Quota type ("limited" or "none")
        - code: Error code if ok=False ("INSUFFICIENT_QUOTA", "USAGE_FETCH_FAILED")
        - deficit: Quota shortfall if insufficient
    """
    channel_id = payload.get("channel_id")

    # Fetch usage summary
    summary = await get_monthly_usage_summary(channel_id)
    if not summary.get("ok"):
        return {
            "ok": False,
            "code": "USAGE_FETCH_FAILED",
            "error": summary.get("error", "unknown")
        }

    # Count recipients
    needed = await count_recipients_for_payload(payload)
    remaining = summary.get("remaining")  # May be None (unlimited)

    # Check if quota is sufficient
    if remaining is None or remaining >= needed:
        return {
            "ok": True,
            "remaining": remaining,
            "needed": needed,
            "type": summary.get("type")
        }

    # Insufficient quota
    return {
        "ok": False,
        "code": "INSUFFICIENT_QUOTA",
        "remaining": remaining,
        "needed": needed,
        "deficit": max(0, needed - remaining),
        "type": summary.get("type")
    }


# -------------------------------------------------
# API Endpoints
# -------------------------------------------------

@router.get("", response_model=UsageSummary)
async def get_usage(channel_id: Optional[str] = None):
    """
    Get monthly quota and consumption summary.

    Query Parameters:
        channel_id: Optional LINE channel ID

    Returns:
        UsageSummary with quota information

    Example:
        GET /api/usage?channel_id=2005363092
    """
    summary = await get_monthly_usage_summary(channel_id)
    return UsageSummary(**summary)


@router.post("/preflight_broadcast", response_model=PreflightResponse)
async def preflight_broadcast(request: Request):
    """
    Check quota before broadcast.

    Returns 200 if sufficient, 409 if insufficient.

    Request Body:
        {
            "target_audience": "all" | "tags",
            "target_tags": ["tag1", "tag2"],
            "channel_id": "optional_channel_id"
        }

    Returns:
        PreflightResponse with quota check results

    Raises:
        HTTPException: 409 if insufficient quota
    """
    payload = await request.json()
    result = await preflight_check(payload)

    if not result.get("ok"):
        raise HTTPException(status_code=409, detail=result)

    return PreflightResponse(**result)
