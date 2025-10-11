"""
標籤模型
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum
from datetime import datetime


class TagType(str, enum.Enum):
    """標籤類型"""

    MEMBER = "member"
    INTERACTION = "interaction"


class TagSource(str, enum.Enum):
    """標籤來源"""

    API = "api"
    MANUAL = "manual"


class MemberTag(Base):
    """會員標籤表"""

    __tablename__ = "member_tags"

    name = Column(String(50), unique=True, nullable=False, index=True, comment="標籤名稱")
    type = Column(
        SQLEnum(TagType),
        nullable=False,
        default=TagType.MEMBER,
        comment="類型",
    )
    source = Column(SQLEnum(TagSource), nullable=False, comment="來源")
    description = Column(String(200), comment="描述")
    member_count = Column(Integer, default=0, comment="會員數量")

    # 關聯關係
    member_relations = relationship(
        "MemberTagRelation",
        back_populates="member_tag",
        primaryjoin="and_(MemberTag.id==foreign(MemberTagRelation.tag_id), MemberTagRelation.tag_type=='member')",
        cascade="all, delete-orphan",
        viewonly=True,
    )


class InteractionTag(Base):
    """互動標籤表"""

    __tablename__ = "interaction_tags"

    name = Column(String(50), nullable=False, index=True, comment="標籤名稱")
    type = Column(
        SQLEnum(TagType),
        nullable=False,
        default=TagType.INTERACTION,
        comment="類型",
    )
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id"), comment="關聯活動ID")
    description = Column(String(200), comment="描述")
    trigger_count = Column(Integer, default=0, comment="觸發次數")

    # 關聯關係
    campaign = relationship("Campaign", back_populates="interaction_tags")
    member_relations = relationship(
        "MemberTagRelation",
        back_populates="interaction_tag",
        primaryjoin="and_(InteractionTag.id==foreign(MemberTagRelation.tag_id), MemberTagRelation.tag_type=='interaction')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    tag_trigger_logs = relationship(
        "TagTriggerLog", back_populates="tag", cascade="all, delete-orphan"
    )


class MemberTagRelation(Base):
    """會員標籤關聯表"""

    __tablename__ = "member_tag_relations"

    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="會員ID",
    )
    tag_id = Column(BigInteger, nullable=False, index=True, comment="標籤ID")
    tag_type = Column(SQLEnum(TagType), nullable=False, comment="標籤類型")
    tagged_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="標記時間")

    # 關聯關係
    member = relationship("Member", back_populates="tag_relations")
    member_tag = relationship(
        "MemberTag",
        foreign_keys=[tag_id],
        primaryjoin="and_(MemberTagRelation.tag_id==MemberTag.id, MemberTagRelation.tag_type=='member')",
        viewonly=True,
    )
    interaction_tag = relationship(
        "InteractionTag",
        foreign_keys=[tag_id],
        primaryjoin="and_(MemberTagRelation.tag_id==InteractionTag.id, MemberTagRelation.tag_type=='interaction')",
        viewonly=True,
    )

    __table_args__ = (
        UniqueConstraint("member_id", "tag_id", "tag_type", name="uq_member_tag"),
    )
