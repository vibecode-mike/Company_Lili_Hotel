"""
自動回應模型
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Boolean,
    Time,
    Enum as SQLEnum,
    ForeignKey,
    Text,
    Numeric,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


class TriggerType(str, enum.Enum):
    """觸發類型"""

    WELCOME = "welcome"  # 歡迎訊息
    KEYWORD = "keyword"  # 關鍵字
    TIME = "time"  # 指定時間


class AutoResponse(Base):
    """自動回應表"""

    __tablename__ = "auto_responses"

    name = Column(String(100), nullable=False, comment="規則名稱")
    trigger_type = Column(SQLEnum(TriggerType), nullable=False, comment="觸發類型")
    content = Column(Text, nullable=False, comment="回應內容")
    template_id = Column(BigInteger, ForeignKey("message_templates.id"), comment="模板ID")
    is_active = Column(Boolean, default=True, comment="是否啟用")
    trigger_time_start = Column(Time, comment="觸發時間開始")
    trigger_time_end = Column(Time, comment="觸發時間結束")
    trigger_count = Column(Integer, default=0, comment="觸發次數")
    success_rate = Column(Numeric(5, 2), default=0, comment="發送成功率")

    # 關聯關係
    template = relationship("MessageTemplate")
    keywords = relationship(
        "AutoResponseKeyword",
        back_populates="auto_response",
        cascade="all, delete-orphan",
    )


class AutoResponseKeyword(Base):
    """自動回應關鍵字表"""

    __tablename__ = "auto_response_keywords"

    auto_response_id = Column(
        BigInteger,
        ForeignKey("auto_responses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="自動回應ID",
    )
    keyword = Column(String(50), nullable=False, comment="關鍵字")
    match_count = Column(Integer, default=0, comment="匹配次數")

    # 關聯關係
    auto_response = relationship("AutoResponse", back_populates="keywords")

    __table_args__ = (
        UniqueConstraint("auto_response_id", "keyword", name="uq_auto_response_keyword"),
    )
