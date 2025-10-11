"""
通用 Schema
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class ResponseBase(BaseModel):
    """基礎響應模型"""

    code: int = 200
    message: str = "success"
    timestamp: datetime = datetime.utcnow()


class SuccessResponse(ResponseBase):
    """成功響應"""

    data: Optional[Any] = None


class ErrorResponse(ResponseBase):
    """錯誤響應"""

    errors: Optional[list] = None


class MessageResponse(ResponseBase):
    """消息響應"""

    pass
