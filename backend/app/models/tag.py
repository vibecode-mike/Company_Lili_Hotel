"""
標籤模型

⚠️ 向後兼容性說明：
- TagType 和 TagSource 枚舉用於向後兼容舊 API
- name, source, type, description 等屬性通過 property 映射到新欄位
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
from enum import Enum


class TagType(str, Enum):
    """標籤類型枚舉（向後兼容）"""
    MEMBER = "member"
    INTERACTION = "interaction"


class TagSource(str, Enum):
    """標籤來源枚舉（向後兼容）"""
    CRM = "CRM"
    PMS = "PMS"
    SURVEY = "問券"
    MANUAL = "後台自訂"
    MESSAGE = "訊息模板"


class MemberTag(Base):
    """會員標籤表（單表設計，直接關聯會員）"""

    __tablename__ = "member_tags"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬會員ID",
    )
    tag_name = Column(String(20), nullable=False, comment="標籤名稱，不得超過 20 個字元（中英文皆計算，每個字元計 1）。格式限制：僅允許中文（\\u4e00-\\u9fa5）、英文（a-zA-Z）、數字（0-9）、空格，禁止特殊字元與 Emoji。驗證：前端使用正則表達式 /^[\\u4e00-\\u9fa5a-zA-Z0-9\\s]+$/ 即時驗證")
    tag_source = Column(String(20), comment="標籤來源：CRM/PMS/問券/後台自訂")
    trigger_count = Column(Integer, default=0, comment="觸發次數")
    trigger_member_count = Column(Integer, default=0, comment="觸發會員數")
    last_triggered_at = Column(DateTime, comment="最近觸發時間")
    message_id = Column(
        BigInteger,
        ForeignKey("messages.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="觸發來源訊息ID（用於去重）",
    )
    tagged_at = Column(DateTime, server_default=func.now(), comment="標記時間")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    member = relationship("Member", back_populates="member_tags")
    message = relationship("Message", foreign_keys=[message_id])

    __table_args__ = (
        UniqueConstraint(
            "member_id",
            "tag_name",
            "message_id",
            name="uq_member_tag_message",
        ),
    )

    # ============================================================
    # 向後兼容屬性：映射舊欄位名稱到新欄位
    # ============================================================

    @property
    def name(self) -> str:
        """向後兼容：name 映射到 tag_name"""
        return self.tag_name or ""

    @name.setter
    def name(self, value: str):
        """向後兼容：設置 name 時更新 tag_name"""
        self.tag_name = value

    @property
    def source(self) -> str:
        """向後兼容：source 映射到 tag_source"""
        return self.tag_source or ""

    @source.setter
    def source(self, value):
        """向後兼容：設置 source 時更新 tag_source"""
        if isinstance(value, TagSource):
            self.tag_source = value.value
        else:
            self.tag_source = str(value) if value else None

    @property
    def type(self) -> TagType:
        """向後兼容：type 固定返回 TagType.MEMBER"""
        return TagType.MEMBER

    @property
    def description(self) -> str:
        """向後兼容：description 欄位（新設計中不存在）"""
        return ""

    @property
    def member_count(self) -> int:
        """向後兼容：member_count 映射到 trigger_member_count"""
        return self.trigger_member_count or 0

    @member_count.setter
    def member_count(self, value: int):
        """向後兼容：設置 member_count 時更新 trigger_member_count"""
        self.trigger_member_count = value


class InteractionTag(Base):
    """互動標籤定義表"""

    __tablename__ = "interaction_tags"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tag_name = Column(String(20), nullable=False, index=True, comment="標籤名稱，不得超過 20 個字元（中英文皆計算，每個字元計 1）。格式限制：僅允許中文（\\u4e00-\\u9fa5）、英文（a-zA-Z）、數字（0-9）、空格，禁止特殊字元與 Emoji。驗證：前端使用正則表達式 /^[\\u4e00-\\u9fa5a-zA-Z0-9\\s]+$/ 即時驗證")
    tag_source = Column(String(20), comment="標籤來源：訊息模板/問券模板")
    trigger_count = Column(Integer, default=0, comment="觸發次數")
    trigger_member_count = Column(Integer, default=0, comment="觸發會員數")
    last_triggered_at = Column(DateTime, comment="最近觸發時間")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    interaction_records = relationship(
        "MemberInteractionRecord", back_populates="interaction_tag", cascade="all, delete-orphan"
    )
    tag_trigger_logs = relationship(
        "TagTriggerLog", back_populates="tag", cascade="all, delete-orphan"
    )
    interaction_logs = relationship(
        "ComponentInteractionLog", back_populates="interaction_tag"
    )

    # ============================================================
    # 向後兼容屬性：映射舊欄位名稱到新欄位
    # ============================================================

    @property
    def name(self) -> str:
        """向後兼容：name 映射到 tag_name"""
        return self.tag_name or ""

    @name.setter
    def name(self, value: str):
        """向後兼容：設置 name 時更新 tag_name"""
        self.tag_name = value

    @property
    def source(self) -> str:
        """向後兼容：source 映射到 tag_source"""
        return self.tag_source or ""

    @source.setter
    def source(self, value):
        """向後兼容：設置 source 時更新 tag_source"""
        if isinstance(value, TagSource):
            self.tag_source = value.value
        else:
            self.tag_source = str(value) if value else None

    @property
    def type(self) -> TagType:
        """向後兼容：type 固定返回 TagType.INTERACTION"""
        return TagType.INTERACTION

    @property
    def description(self) -> str:
        """向後兼容：description 欄位（新設計中不存在）"""
        return ""

    @property
    def member_count(self) -> int:
        """向後兼容：member_count 映射到 trigger_member_count"""
        return self.trigger_member_count or 0

    @member_count.setter
    def member_count(self, value: int):
        """向後兼容：設置 member_count 時更新 trigger_member_count"""
        self.trigger_member_count = value

    @property
    def campaign_id(self) -> int:
        """向後兼容：campaign_id 欄位（新設計中不存在）"""
        return None
