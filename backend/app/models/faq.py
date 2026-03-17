"""
FAQ 知識庫管理與 AI 聊天模型
"""
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class Industry(Base):
    """產業定義表"""

    __tablename__ = "industries"

    name = Column(String(50), nullable=False, unique=True, comment="產業名稱")
    is_active = Column(Boolean, nullable=False, default=True, comment="是否啟用")

    # 關聯關係
    faq_categories = relationship("FaqCategory", back_populates="industry")
    ai_token_usages = relationship("AiTokenUsage", back_populates="industry")


class FaqCategory(Base):
    """FAQ 大分類表"""

    __tablename__ = "faq_categories"

    industry_id = Column(
        BigInteger,
        ForeignKey("industries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬產業 ID",
    )
    name = Column(String(50), nullable=False, comment="大分類名稱")
    is_active = Column(Boolean, nullable=False, default=True, comment="是否啟用")
    data_source_type = Column(
        String(20),
        nullable=False,
        default="custom_faq",
        comment="資料來源類型：pms（PMS 串接）、custom_faq（自訂 FAQ）",
    )
    is_system_default = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="是否為系統預設大分類",
    )
    sort_order = Column(Integer, nullable=False, default=0, comment="排序順序")

    # 關聯關係
    industry = relationship("Industry", back_populates="faq_categories")
    fields = relationship(
        "FaqCategoryField",
        back_populates="category",
        cascade="all, delete-orphan",
    )
    rules = relationship(
        "FaqRule",
        back_populates="category",
        cascade="all, delete-orphan",
    )


class FaqCategoryField(Base):
    """大分類欄位定義表"""

    __tablename__ = "faq_category_fields"

    category_id = Column(
        BigInteger,
        ForeignKey("faq_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬大分類 ID",
    )
    field_name = Column(String(50), nullable=False, comment="欄位名稱")
    field_type = Column(
        String(20),
        nullable=False,
        default="text",
        comment="欄位類型：text / tag",
    )
    is_required = Column(Boolean, nullable=False, default=False, comment="是否為必填")
    sort_order = Column(Integer, nullable=False, default=0, comment="欄位排序順序")

    # 關聯關係
    category = relationship("FaqCategory", back_populates="fields")


class FaqRule(Base):
    """FAQ 規則表"""

    __tablename__ = "faq_rules"

    @classmethod
    def is_enabled_filter(cls):
        """啟用規則的標準篩選條件，集中管理「啟用」的定義"""
        return cls.is_enabled == True  # noqa: E712

    category_id = Column(
        BigInteger,
        ForeignKey("faq_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬大分類 ID",
    )
    content_json = Column(Text, nullable=False, comment="規則內容 JSON")
    status = Column(
        String(20),
        nullable=False,
        default="draft",
        comment="發佈狀態：draft（未發佈）/ active（已發佈）",
    )
    is_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="啟用狀態（獨立於發佈狀態）",
    )
    created_by = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="建立者 User ID",
    )
    updated_by = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="最後更新者 User ID",
    )
    published_at = Column(DateTime, nullable=True, comment="最後發佈時間")
    published_by = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="最後發佈者 User ID",
    )

    __table_args__ = (
        Index("ix_faq_rules_status", "status"),
        Index("ix_faq_rules_category_status", "category_id", "status"),
    )

    # 關聯關係
    category = relationship("FaqCategory", back_populates="rules")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    publisher = relationship("User", foreign_keys=[published_by])
    versions = relationship(
        "FaqRuleVersion",
        back_populates="rule",
        cascade="all, delete-orphan",
    )
    tags = relationship(
        "FaqRuleTag",
        back_populates="rule",
        cascade="all, delete-orphan",
    )


class FaqRuleVersion(Base):
    """FAQ 規則版本快照表"""

    __tablename__ = "faq_rule_versions"

    rule_id = Column(
        BigInteger,
        ForeignKey("faq_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬規則 ID",
    )
    content_json = Column(Text, nullable=False, comment="版本內容快照 JSON")
    status = Column(
        String(20), nullable=False, comment="快照時的規則狀態"
    )
    version_number = Column(
        Integer, nullable=False, default=1, comment="版本號"
    )
    snapshot_at = Column(DateTime, nullable=False, comment="快照建立時間")

    __table_args__ = (
        Index("ix_faq_rule_versions_rule_version", "rule_id", "version_number"),
    )

    # 關聯關係
    rule = relationship("FaqRule", back_populates="versions")


class FaqRuleTag(Base):
    """FAQ 規則標籤關聯表"""

    __tablename__ = "faq_rule_tags"

    rule_id = Column(
        BigInteger,
        ForeignKey("faq_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="規則 ID",
    )
    tag_name = Column(
        String(20), nullable=False, comment="標籤名稱（對應 MemberTag.tag_name）"
    )

    __table_args__ = (
        UniqueConstraint("rule_id", "tag_name", name="uq_faq_rule_tag"),
        Index("ix_faq_rule_tags_tag_name", "tag_name"),
    )

    # 關聯關係
    rule = relationship("FaqRule", back_populates="tags")


class AiTokenUsage(Base):
    """AI Token 用量追蹤表"""

    __tablename__ = "ai_token_usages"

    industry_id = Column(
        BigInteger,
        ForeignKey("industries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬產業 ID",
    )
    total_quota = Column(
        BigInteger, nullable=False, default=0, comment="Token 總額度"
    )
    used_amount = Column(
        BigInteger, nullable=False, default=0, comment="已消耗 Token 數量"
    )

    # 關聯關係
    industry = relationship("Industry", back_populates="ai_token_usages")


class AiToneConfig(Base):
    """AI 語氣設定表"""

    __tablename__ = "ai_tone_configs"

    tone_type = Column(
        String(20),
        nullable=False,
        comment="語氣類型：professional / casual",
    )
    tone_name = Column(String(20), nullable=False, comment="語氣顯示名稱")
    prompt_text = Column(Text, nullable=False, comment="語氣 system prompt")
    is_active = Column(
        Boolean, nullable=False, default=False, comment="是否為當前啟用語氣"
    )


class FaqModuleAuth(Base):
    """FAQ 模組授權表"""

    __tablename__ = "faq_module_auths"

    client_id = Column(
        String(100), nullable=False, unique=True, comment="客戶帳號識別碼"
    )
    is_authorized = Column(
        Boolean, nullable=False, default=False, comment="是否已授權"
    )
    authorized_at = Column(DateTime, nullable=True, comment="授權開通時間")
    authorized_by = Column(
        String(100), nullable=True, comment="授權操作者"
    )
