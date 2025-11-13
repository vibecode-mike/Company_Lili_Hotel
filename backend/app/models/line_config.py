"""
LINE 設定相關模型
包含：LineOAConfig（LINE OA 設定）、LoginConfig（LINE Login 設定）、LoginSession（登入會話）、SystemAuthorization（系統授權）
"""
from sqlalchemy import (
    Column,
    String,
    BigInteger,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class LineOAConfig(Base):
    """LINE 官方帳號設定表"""

    __tablename__ = "line_oa_configs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(
        BigInteger,
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
        comment="所屬管理員",
    )
    channel_id = Column(String(20), comment="Messaging API Channel ID（10位數字）")
    channel_secret = Column(
        String(50), comment="Messaging API Channel Secret（32字元英數字）"
    )
    channel_access_token = Column(
        String(255), comment="Messaging API Channel Access Token"
    )
    line_account_id = Column(String(50), comment="LINE 官方帳號 ID，如 @262qaash")
    webhook_enabled = Column(Boolean, default=False, comment="Webhook 是否已開啟")
    is_verified = Column(Boolean, default=False, comment="是否已完成 LINE 驗證")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="最後更新時間")

    # 關聯關係
    admin = relationship("Admin", back_populates="line_oa_configs")


class LoginConfig(Base):
    """LINE Login Channel 設定表"""

    __tablename__ = "login_configs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(
        BigInteger,
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
        comment="所屬管理員",
    )
    channel_id = Column(
        String(20), comment="Login Channel ID（以165開頭的10位數字）"
    )
    channel_secret = Column(
        String(50), comment="Login Channel Secret（32位大小寫英數字）"
    )
    is_verified = Column(Boolean, default=False, comment="是否已完成 LINE 驗證")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="最後更新時間")

    # 關聯關係
    admin = relationship("Admin", back_populates="login_configs")


class LoginSession(Base):
    """管理員登入會話表"""

    __tablename__ = "login_sessions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(
        BigInteger,
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
        comment="所屬管理員",
    )
    login_method = Column(
        String(20), comment="登入方式：email_password / google / line"
    )
    login_time = Column(
        DateTime, nullable=False, comment="登入時間（UTC+8 時區）"
    )
    expire_time = Column(DateTime, comment="會話過期時間")
    device_info = Column(Text, comment="裝置資訊")
    is_active = Column(Boolean, default=True, comment="會話是否有效")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")

    # 關聯關係
    admin = relationship("Admin", back_populates="login_sessions")


class SystemAuthorization(Base):
    """系統授權表"""

    __tablename__ = "system_authorizations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(
        BigInteger,
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
        comment="所屬管理員",
    )
    expire_date = Column(Date, nullable=False, comment="授權到期日")
    is_active = Column(Boolean, default=True, comment="授權是否有效")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")

    # 關聯關係
    admin = relationship("Admin", back_populates="system_authorizations")
