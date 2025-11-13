"""
消息記錄模型
"""
from sqlalchemy import Column, String, BigInteger, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


class MessageDirection(str, enum.Enum):
    """消息方向"""

    INCOMING = "incoming"  # 用戶發送
    OUTGOING = "outgoing"  # 系統發送


class MessageType(str, enum.Enum):
    """消息類型"""

    TEXT = "text"
    IMAGE = "image"
    TEMPLATE = "template"


class SenderType(str, enum.Enum):
    """發送者類型"""

    MANUAL = "manual"  # 人工發送
    AUTO = "auto"  # 自動回應
    CAMPAIGN = "campaign"  # 活動推播


class Message(Base):
    """消息記錄表"""

    __tablename__ = "messages"

    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="會員ID",
    )
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id"), index=True, comment="活動ID")
    content = Column(Text, nullable=False, comment="消息內容")
    direction = Column(SQLEnum(MessageDirection), nullable=False, comment="方向")
    message_type = Column(SQLEnum(MessageType), nullable=False, comment="類型")
    sender_type = Column(SQLEnum(SenderType), comment="發送者類型")
    sender_id = Column(BigInteger, ForeignKey("users.id"), comment="發送者ID")
    read_at = Column(DateTime, comment="已讀時間")

    # 關聯關係
    member = relationship("Member", back_populates="messages")
    campaign = relationship("Campaign", back_populates="messages")
    sender = relationship("User")
