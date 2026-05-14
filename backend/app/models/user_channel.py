"""
帳號 × LINE 頻道 關聯表 — 控制每個 user 可看哪些 LINE OA
"""
from sqlalchemy import Column, BigInteger, String, ForeignKey, UniqueConstraint, Index
from app.models.base import Base


class UserChannel(Base):
    """帳號可存取的 LINE OA"""

    __tablename__ = "user_channels"
    __table_args__ = (
        UniqueConstraint("user_id", "line_channel_id", name="uq_user_channel"),
        Index("ix_user_channels_user_id", "user_id"),
        Index("ix_user_channels_line_channel_id", "line_channel_id"),
    )

    user_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        comment="users.id",
    )
    line_channel_id = Column(
        String(100),
        ForeignKey("line_channels.channel_id", ondelete="CASCADE"),
        nullable=False,
        comment="line_channels.channel_id",
    )
