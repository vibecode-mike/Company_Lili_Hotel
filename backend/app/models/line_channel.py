"""
LINE 頻道設定模型
對應 line_app/app.py 中使用的 LINE 頻道表
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


class LineChannel(Base):
    """LINE 頻道設定表（對應 line_app/app.py 使用的表）"""

    __tablename__ = "line_channels"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    channel_access_token = Column(
        String(500), nullable=False, comment="頻道存取權杖"
    )
    channel_secret = Column(String(100), nullable=False, comment="頻道密鑰")
    liff_id_open = Column(String(100), nullable=True, comment="LIFF ID")
    channel_name = Column(String(100), nullable=True, comment="頻道名稱")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否啟用")
    created_at = Column(
        DateTime, server_default=func.now(), nullable=True, comment="建立時間"
    )
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True, comment="更新時間")
