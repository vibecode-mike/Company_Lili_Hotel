"""
會員互動紀錄模型
"""
from sqlalchemy import (
    Column,
    BigInteger,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class MemberInteractionRecord(Base):
    """會員互動紀錄表"""

    __tablename__ = "member_interaction_records"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬會員ID",
    )
    tag_id = Column(
        BigInteger,
        ForeignKey("interaction_tags.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="互動標籤ID",
    )
    message_id = Column(
        BigInteger,
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="關聯的訊息ID（若來自訊息模板）",
    )
    triggered_at = Column(
        DateTime, server_default=func.now(), comment="觸發時間"
    )
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")

    # 關聯關係
    member = relationship("Member", back_populates="interaction_records")
    interaction_tag = relationship("InteractionTag", back_populates="interaction_records")
    message = relationship("Message", back_populates="interaction_records")

    __table_args__ = (
        UniqueConstraint(
            "member_id",
            "tag_id",
            "message_id",
            name="uq_member_tag_msg_interaction",
        ),
    )
