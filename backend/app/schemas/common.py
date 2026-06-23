"""
通用 Schema
"""
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from app.core.timezone import AwareUtcDatetime
from typing import Optional, Any


class ResponseBase(BaseModel):
    """基礎響應模型"""

    code: int = 200
    message: str = "success"
    timestamp: AwareUtcDatetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SuccessResponse(ResponseBase):
    """成功響應"""

    data: Optional[Any] = None


class ErrorResponse(ResponseBase):
    """錯誤響應"""

    errors: Optional[list] = None


class MessageResponse(ResponseBase):
    """消息響應"""

    pass
