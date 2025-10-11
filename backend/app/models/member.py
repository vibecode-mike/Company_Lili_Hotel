"""
會員模型
"""
from sqlalchemy import Column, String, Boolean, Date, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


class Gender(str, enum.Enum):
    """性別"""

    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class MemberSource(str, enum.Enum):
    """會員來源"""

    LINE = "line"
    SYSTEM = "system"


class Member(Base):
    """會員表"""

    __tablename__ = "members"

    # LINE 相關資訊
    line_uid = Column(String(100), unique=True, index=True, comment="LINE UID")
    line_display_name = Column(String(100), comment="LINE 顯示名稱")
    line_picture_url = Column(String(500), comment="LINE 頭像URL")

    # 基本資訊
    first_name = Column(String(50), comment="名")
    last_name = Column(String(50), comment="姓")
    gender = Column(SQLEnum(Gender), comment="性別")
    birthday = Column(Date, comment="生日")
    email = Column(String(100), index=True, comment="電子信箱")
    phone = Column(String(20), index=True, comment="手機號碼")
    id_number = Column(String(50), unique=True, index=True, comment="身分證/護照號碼")

    # 系統資訊
    source = Column(
        SQLEnum(MemberSource),
        nullable=False,
        default=MemberSource.LINE,
        comment="來源",
    )
    accept_marketing = Column(Boolean, default=True, comment="是否接收優惠通知")
    notes = Column(Text, comment="內部備註")
    last_interaction_at = Column(DateTime, comment="最後互動時間")

    # 關聯關係
    tag_relations = relationship(
        "MemberTagRelation", back_populates="member", cascade="all, delete-orphan"
    )
    messages = relationship("Message", back_populates="member", cascade="all, delete-orphan")
    campaign_recipients = relationship(
        "CampaignRecipient", back_populates="member", cascade="all, delete-orphan"
    )
