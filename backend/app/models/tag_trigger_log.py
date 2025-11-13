"""
標籤觸發日誌模型
"""
from sqlalchemy import Column, BigInteger, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime
import enum


class TriggerSource(str, enum.Enum):
    """觸發來源"""

    CLICK = "click"  # 點擊
    INTERACTION = "interaction"  # 互動
    MANUAL = "manual"  # 手動


class TagTriggerLog(Base):
    """標籤觸發日誌表"""

    __tablename__ = "tag_trigger_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="會員ID",
    )
    tag_id = Column(
        BigInteger,
        ForeignKey("interaction_tags.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="標籤ID",
    )
    message_id = Column(
        BigInteger,
        ForeignKey("messages.id", ondelete="CASCADE"),
        index=True,
        comment="群發訊息ID",
    )
    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="活動ID（選填）",
    )
    trigger_source = Column(SQLEnum(TriggerSource), nullable=False, comment="觸發來源")
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="觸發時間")

    # 關聯關係
    member = relationship("Member")
    tag = relationship("InteractionTag", back_populates="tag_trigger_logs")
    message = relationship("Message", back_populates="tag_trigger_logs")
    campaign = relationship("Campaign")
