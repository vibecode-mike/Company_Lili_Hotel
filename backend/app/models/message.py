"""
群發訊息模型（Message）- v0.2 統一新架構
注意：Messages（群發訊息）與 Campaigns（活動管理）職責清晰分離
- Message: 管理單筆群發訊息，可選關聯至 Campaign
- Campaign: 活動容器，管理多筆 Message（請參考 new_campaign.py）
"""
import uuid

from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    JSON,
    UniqueConstraint,
    Text,
    Index,
)
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
class Message(Base):
    """群發訊息表"""

    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    template_id = Column(
        BigInteger,
        ForeignKey("message_templates.id", ondelete="RESTRICT"),
        nullable=False,
        comment="訊息模板ID",
    )
    message_title = Column(Text, comment="訊息標題（用於列表顯示）")
    notification_message = Column(String(200), comment="通知推播訊息（顯示在手機通知欄）")
    thumbnail = Column(String(500), comment="縮圖 URL")
    send_time = Column(DateTime, index=True, comment="傳送時間")
    send_count = Column(Integer, default=0, comment="傳送人數")
    open_count = Column(Integer, default=0, comment="開啟次數（不重複）")
    send_status = Column(
        String(20),
        nullable=False,
        default="草稿",
        comment="發送狀態：已排程/已發送/草稿/發送失敗",
        index=True,
    )
    failure_reason = Column(Text, comment="發送失敗原因")

    # 發送對象設定（規格：兩欄位設計）
    target_type = Column(
        String(20), nullable=False, comment="傳送對象類型：所有好友/篩選目標對象"
    )
    target_filter = Column(JSON, comment="篩選條件（JSON格式）")

    scheduled_datetime_utc = Column(
        DateTime,
        index=True,
        comment="排程發送時間（UTC）",
    )

    trigger_condition = Column(JSON, comment="特定觸發條件")
    estimated_send_count = Column(Integer, default=0, comment="預計發送好友人數")
    available_quota = Column(Integer, default=0, comment="可用訊息配額用量")

    # 系統欄位
    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        comment="關聯活動ID（選填）",
        index=True,
    )
    source_draft_id = Column(
        BigInteger,
        ForeignKey("messages.id", ondelete="SET NULL"),
        nullable=True,
        comment="來源草稿ID（從草稿發布時記錄原始草稿）",
        index=True,
    )
    created_by = Column(BigInteger, ForeignKey("users.id"), comment="創建者ID")
    flex_message_json = Column(MEDIUMTEXT, nullable=True, comment="Flex Message JSON 內容（最大 16MB）")
    fb_message_json = Column(MEDIUMTEXT, nullable=True, comment="Facebook Messenger JSON 內容")

    # 平台設定（新增）
    platform = Column(
        String(20),
        nullable=True,
        default="LINE",
        comment="發送平台：LINE/Facebook/Instagram",
    )

    # 相容 line_app/app.py 的欄位
    interaction_tags = Column(JSON, comment="互動標籤（相容舊程式）")

    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    template = relationship("MessageTemplate", back_populates="messages")
    campaign = relationship("Campaign", back_populates="messages")
    creator = relationship("User")
    deliveries = relationship(
        "MessageDelivery", back_populates="message", cascade="all, delete-orphan"
    )
    member_tags = relationship(
        "MemberTag",
        foreign_keys="MemberTag.message_id",
        overlaps="message",
    )
    tag_trigger_logs = relationship("TagTriggerLog", back_populates="message")
    interaction_logs = relationship(
        "ComponentInteractionLog", back_populates="message", cascade="all, delete-orphan"
    )

    @property
    def scheduled_at(self):
        """提供與 Schema 對應的排程時間欄位"""
        return self.scheduled_datetime_utc


class MessageDelivery(Base):
    """訊息發送明細表"""

    __tablename__ = "message_deliveries"

    # 覆蓋 Base 的 id，此表使用 delivery_id 作為主鍵
    id = None

    delivery_id = Column(
        String(50),
        primary_key=True,
        default=lambda: uuid.uuid4().hex,
        comment="發送記錄唯一識別碼",
    )
    message_id = Column(
        BigInteger,
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="群發訊息ID",
    )
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="會員ID",
    )
    delivery_status = Column(
        String(20),
        nullable=False,
        default="pending",
        comment="狀態：pending/sent/failed/opened/clicked",
    )
    sent_at = Column(DateTime, comment="實際發送時間（UTC）")
    opened_at = Column(DateTime, comment="開啟時間（UTC）")
    clicked_at = Column(DateTime, comment="點擊時間（UTC）")
    failure_reason = Column(String(500), comment="發送失敗原因")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    message = relationship("Message", back_populates="deliveries")
    member = relationship("Member", back_populates="message_deliveries")

    __table_args__ = (
        UniqueConstraint("message_id", "member_id", name="uq_message_delivery_member"),
        Index("ix_message_deliveries_member_status", "member_id", "delivery_status"),
        Index("ix_message_deliveries_sent_at", "sent_at"),
    )
