"""
認證相關 Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class LoginRequest(BaseModel):
    """登入請求"""

    username: str
    password: str


class UserInfo(BaseModel):
    """用戶信息"""

    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """令牌響應"""

    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserInfo
