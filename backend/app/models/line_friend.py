"""
LINE 好友模型

收編 dev legacy line_friends 表（dev 從 alembic 之前就存在的非標準表）。
本表與 members 透過 trigger + stored procedure 雙向同步，
維護於 migration: 26d892fb5b82_baseline_create_line_friends_with_sync。
"""
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.models.base import Base


class LineFriend(Base):
    __tablename__ = "line_friends"
    __table_args__ = (
        UniqueConstraint("line_uid", name="line_uid"),
        Index("idx_member_id", "member_id"),
        {"comment": "LINE 好友表"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="LINE 好友 ID")
    line_uid = Column(String(100), nullable=False, comment="LINE UID")
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="SET NULL", name="fk_line_friends_member"),
        nullable=True,
        comment="關聯的 CRM 會員 ID（可為空）",
    )
    line_display_name = Column(String(100), nullable=True, comment="LINE 顯示名稱")
    line_picture_url = Column(String(500), nullable=True, comment="LINE 頭像 URL")
    email = Column(String(255), nullable=True, comment="電子信箱")
    is_following = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="1",
        comment="是否為當前好友（1=是，0=否）",
    )
    followed_at = Column(DateTime, nullable=True, comment="首次關注時間")
    unfollowed_at = Column(DateTime, nullable=True, comment="最後取消關注時間")
    last_interaction_at = Column(DateTime, nullable=True, comment="最後互動時間")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")
