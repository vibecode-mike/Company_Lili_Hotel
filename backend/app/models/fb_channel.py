"""
Facebook 粉絲專頁頻道設定模型
對應 fb_channels 資料表
"""
from sqlalchemy import (
    Column,
    String,
    BigInteger,
    Boolean,
    DateTime,
)
from sqlalchemy.sql import func
from app.models.base import Base


class FbChannel(Base):
    """Facebook 粉絲專頁頻道設定表"""

    __tablename__ = "fb_channels"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    page_id = Column(String(255), nullable=True, comment="Facebook Page ID")
    page_access_token = Column(
        String(500), nullable=False, comment="FB頻道存取權杖"
    )
    app_id = Column(String(255), nullable=True, comment="Facebook App ID")
    app_secret = Column(String(255), nullable=True, comment="Facebook App Secret")
    channel_name = Column(String(100), nullable=True, comment="頻道名稱")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否啟用（管理員手動控制）")
    connection_status = Column(String(20), nullable=False, default='disconnected', comment="連結狀態: connected/expired/disconnected（系統自動偵測）")
    last_verified_at = Column(DateTime, nullable=True, comment="最後驗證時間（UTC）")
    created_at = Column(
        DateTime, server_default=func.now(), nullable=True, comment="建立時間"
    )
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True, comment="更新時間")
