"""
Chat API Router

Handles chat-related endpoints including marking messages as read.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from app.db_async import execute

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])
logger = logging.getLogger(__name__)


class MarkReadRequest(BaseModel):
    """Request model for marking messages as read"""
    line_uid: str


class MarkReadResponse(BaseModel):
    """Response model for mark-read operation"""
    ok: bool
    marked_count: int


@router.put("/mark-read", response_model=MarkReadResponse)
async def mark_chat_read(req: MarkReadRequest):
    """
    Mark all incoming messages as read for a specific user.

    Args:
        req: Request containing line_uid

    Returns:
        Response with success status and count of marked messages

    Raises:
        HTTPException: If line_uid is missing or invalid
    """
    if not req.line_uid or not req.line_uid.strip():
        raise HTTPException(status_code=400, detail="line_uid is required")

    try:
        # Update conversation messages to read status
        result = await execute("""
            UPDATE conversation_messages
            SET status = 'read', updated_at = NOW()
            WHERE thread_id = :thread_id
              AND direction = 'incoming'
              AND status != 'read'
        """, {"thread_id": req.line_uid})

        # Get row count from result
        marked_count = result.rowcount if hasattr(result, 'rowcount') else 0

        logger.info(f"Marked {marked_count} messages as read for user {req.line_uid}")

        return MarkReadResponse(ok=True, marked_count=marked_count)

    except Exception as e:
        logger.error(f"Error marking messages as read for {req.line_uid}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark messages as read: {str(e)}"
        )
