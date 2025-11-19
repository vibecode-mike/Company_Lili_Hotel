"""
活動管理模型（新）
注意：這是規格中定義的 Campaign 表（活動管理），
與原本的 campaigns 表（推播訊息）不同
"""
from sqlalchemy import (
    Column,
    String,
    Text,
    Date,
    BigInteger,
    DateTime,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class Campaign(Base):
    """活動管理表"""

    __tablename__ = "campaigns"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_name = Column(String(100), nullable=False, comment="活動名稱")
    campaign_tag = Column(String(50), comment="活動標籤")
    campaign_date = Column(Date, comment="活動日期")
    start_date = Column(Date, comment="活動開始日期")
    end_date = Column(Date, comment="活動結束日期")
    description = Column(Text, comment="活動描述")
    status = Column(
        String(20), default="active", comment="活動狀態：active/inactive/completed"
    )
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    messages = relationship("Message", back_populates="campaign")
