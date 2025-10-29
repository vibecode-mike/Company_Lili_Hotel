"""
活動推播模型
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    JSON,
    UniqueConstraint,
    Text,
)
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


class CampaignStatus(str, enum.Enum):
    """活動狀態"""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    FAILED = "failed"


class RecipientStatus(str, enum.Enum):
    """接收者狀態"""

    PENDING = "pending"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    FAILED = "failed"


class Campaign(Base):
    """活動推播表"""

    __tablename__ = "campaigns"

    title = Column(String(100), nullable=False, comment="活動標題")
    template_id = Column(
        BigInteger,
        ForeignKey("message_templates.id", ondelete="RESTRICT"),
        nullable=False,
        comment="消息模板ID",
    )
    target_audience = Column(JSON, nullable=False, comment="目標受眾條件")
    trigger_condition = Column(JSON, comment="觸發條件")
    interaction_tags = Column(JSON, comment="互動標籤數組")
    scheduled_at = Column(DateTime, comment="排程時間")
    sent_at = Column(DateTime, comment="實際發送時間")
    status = Column(
        SQLEnum(CampaignStatus),
        nullable=False,
        default=CampaignStatus.DRAFT,
        comment="狀態",
    )
    sent_count = Column(Integer, default=0, comment="發送人數")
    opened_count = Column(Integer, default=0, comment="開啟次數")
    clicked_count = Column(Integer, default=0, comment="點擊次數")
    created_by = Column(BigInteger, ForeignKey("users.id"), comment="創建者ID")

    # 關聯關係
    template = relationship("MessageTemplate", back_populates="campaigns")
    creator = relationship("User")
    recipients = relationship(
        "CampaignRecipient", back_populates="campaign", cascade="all, delete-orphan"
    )
    interaction_tag_records = relationship("InteractionTag", back_populates="campaign")
    messages = relationship("Message", back_populates="campaign")
    tag_trigger_logs = relationship("TagTriggerLog", back_populates="campaign")
    interaction_logs = relationship(
        "ComponentInteractionLog", back_populates="campaign", cascade="all, delete-orphan"
    )


class CampaignRecipient(Base):
    """推播對象記錄表"""

    __tablename__ = "campaign_recipients"

    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="活動ID",
    )
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="會員ID",
    )
    sent_at = Column(DateTime, comment="發送時間")
    opened_at = Column(DateTime, comment="開啟時間")
    clicked_at = Column(DateTime, comment="點擊時間")
    status = Column(
        SQLEnum(RecipientStatus),
        nullable=False,
        default=RecipientStatus.PENDING,
        comment="狀態",
    )
    error_message = Column(String(500), comment="錯誤訊息")

    # 關聯關係
    campaign = relationship("Campaign", back_populates="recipients")
    member = relationship("Member", back_populates="campaign_recipients")

    __table_args__ = (UniqueConstraint("campaign_id", "member_id", name="uq_campaign_member"),)
