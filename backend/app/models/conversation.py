"""
對話相關模型
對應 line_app/app.py 中使用的對話表
"""
from sqlalchemy import (
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
    """對話串表（對應 line_app/app.py 使用的表）"""

    __tablename__ = "conversation_threads"

    id = Column(
        String(100), primary_key=True, comment="對話串ID（使用 LINE userId）"
    )
    conversation_name = Column(String(200), nullable=True, comment="對話名稱")
    created_at = Column(
        DateTime, server_default=func.now(), nullable=True, comment="建立時間"
    )
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True, comment="更新時間")

    # 關聯關係
    messages = relationship(
        "ConversationMessage", back_populates="thread", cascade="all, delete-orphan"
    )


class ConversationMessage(Base):
    """對話訊息表（對應 line_app/app.py 使用的表）"""

    __tablename__ = "conversation_messages"
    __table_args__ = (Index("ix_conversation_messages_thread_id", "thread_id"),)

    id = Column(String(100), primary_key=True, comment="訊息ID")
    thread_id = Column(
        String(100),
        ForeignKey("conversation_threads.id", ondelete="CASCADE"),
        nullable=False,
        comment="所屬對話串",
    )
    role = Column(String(20), nullable=True, comment="角色")
    direction = Column(
        String(20), nullable=True, comment="方向：incoming/outgoing"
    )
    message_type = Column(String(50), nullable=True, comment="訊息類型")
    question = Column(Text, nullable=True, comment="問題內容")
    response = Column(Text, nullable=True, comment="回應內容")
    event_id = Column(String(100), nullable=True, comment="事件ID")
    status = Column(String(20), nullable=True, comment="狀態")
    created_at = Column(
        DateTime, server_default=func.now(), nullable=True, comment="建立時間"
    )
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True, comment="更新時間")

    # 關聯關係
    thread = relationship("ConversationThread", back_populates="messages")
