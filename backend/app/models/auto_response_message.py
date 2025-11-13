"""
自動回應訊息模型
用於管理自動回應的訊息內容清單（1-5筆訊息）
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class AutoResponseMessage(Base):
    """自動回應訊息表（1:N關係）"""

    __tablename__ = "auto_response_messages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    response_id = Column(
        BigInteger,
        ForeignKey("auto_responses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬自動回應",
    )
    message_content = Column(
        Text,
        nullable=False,
        comment="訊息內容（純文字），建議 <= 500 字元",
    )
    sequence_order = Column(
        Integer,
        nullable=False,
        comment="UI 顯示順序與發送順序，>= 1",
    )
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")

    # 關聯關係
    auto_response = relationship(
        "AutoResponse",
        back_populates="response_messages",
    )

    __table_args__ = (
        UniqueConstraint(
            "response_id",
            "sequence_order",
            name="uq_response_sequence",
        ),
    )
