"""
對話相關模型
對應 line_app/app.py 中使用的對話表

多渠道設計說明（單表 + platform 欄位）：
- conversation_threads.id 直接使用渠道原始 UID（如 U123xxx）
- 跨渠道查詢使用 (platform, platform_uid) 複合索引
- 透過 member_id 關聯會員，實現跨渠道整合查詢
- 各渠道邏輯差異在 Service 層抽象處理（LineService, FbService, WebchatService）
"""
from sqlalchemy import (
    BigInteger,
    Column,
    String,
    ForeignKey,
    DateTime,
    Text,
    Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class ConversationThread(Base):
    """對話串表（多渠道支援）

    id：直接使用渠道原始 UID（如 U123xxx）
    跨渠道查詢：使用 (platform, platform_uid) 複合索引
    """

    __tablename__ = "conversation_threads"
    __table_args__ = (
        Index("ix_conversation_threads_member_platform", "member_id", "platform"),
        Index("ix_conversation_threads_platform_uid", "platform", "platform_uid"),
        Index("ix_conversation_threads_last_message_at", "last_message_at"),
    )

    id = Column(
        String(150), primary_key=True, comment="對話串ID，直接使用渠道 UID"
    )
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
        comment="關聯會員ID（跨渠道整合用）",
    )
    platform = Column(
        String(20), nullable=True, comment="渠道類型：LINE / Facebook / Webchat"
    )
    platform_uid = Column(
        String(100), nullable=True, comment="渠道原始 UID"
    )
    conversation_name = Column(String(200), nullable=True, comment="對話名稱")
    last_message_at = Column(
        DateTime, nullable=True, comment="最後訊息時間（用於找最近互動渠道）"
    )
    created_at = Column(
        DateTime, server_default=func.now(), nullable=True, comment="建立時間"
    )
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True, comment="更新時間")

    # 關聯關係
    messages = relationship(
        "ConversationMessage", back_populates="thread", cascade="all, delete-orphan"
    )
    member = relationship("Member", backref="conversation_threads")


class ConversationMessage(Base):
    """對話訊息表（多渠道支援）

    message_source 值域：
    - webhook: Webhook 收到的訊息
    - manual: 客服手動發送
    - gpt: GPT 自動回覆
    - keyword: 關鍵字回覆
    - welcome: 歡迎訊息
    - always: 常態回覆
    - broadcast: 群發訊息
    """

    __tablename__ = "conversation_messages"
    __table_args__ = (
        Index("ix_conversation_messages_thread_id", "thread_id"),
        Index("ix_conversation_messages_platform", "platform"),
        Index("ix_conversation_messages_created_at", "created_at"),
        Index("ix_conversation_messages_thread_created", "thread_id", "created_at"),
    )

    id = Column(String(100), primary_key=True, comment="訊息ID")
    thread_id = Column(
        String(150),
        ForeignKey("conversation_threads.id", ondelete="CASCADE"),
        nullable=False,
        comment="所屬對話串",
    )
    platform = Column(
        String(20), nullable=True, comment="渠道類型（冗餘欄位，方便查詢）"
    )
    role = Column(String(20), nullable=True, comment="角色：user / assistant")
    direction = Column(
        String(20), nullable=True, comment="方向：incoming/outgoing"
    )
    message_type = Column(String(50), nullable=True, comment="訊息類型")
    question = Column(Text, nullable=True, comment="問題內容")
    response = Column(Text, nullable=True, comment="回應內容")
    event_id = Column(String(100), nullable=True, comment="事件ID")
    status = Column(String(20), nullable=True, comment="狀態")
    message_source = Column(
        String(20),
        nullable=True,
        comment="訊息來源：webhook|manual|gpt|keyword|welcome|always|broadcast",
    )
    sent_by = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="發送人員ID（僅 manual 訊息有值）",
    )
    created_at = Column(
        DateTime, server_default=func.now(), nullable=True, comment="建立時間"
    )
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True, comment="更新時間")

    # 關聯關係
    thread = relationship("ConversationThread", back_populates="messages")
    sender = relationship("User", foreign_keys=[sent_by])
