"""
系統用戶模型
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from app.models.base import Base
import enum


class UserRole(str, enum.Enum):
    """用戶角色"""

    ADMIN = "admin"
    MARKETING = "marketing"
    CUSTOMER_SERVICE = "customer_service"


class User(Base):
    """系統用戶表"""

    __tablename__ = "users"

    username = Column(String(50), unique=True, nullable=False, comment="用戶名")
    email = Column(String(100), unique=True, nullable=False, comment="郵箱")
    password_hash = Column(String(255), nullable=False, comment="密碼雜湊")
    full_name = Column(String(100), comment="全名")
    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.CUSTOMER_SERVICE,
        comment="角色",
    )
    is_active = Column(Boolean, default=True, comment="是否啟用")
    last_login_at = Column(DateTime, comment="最後登入時間")
