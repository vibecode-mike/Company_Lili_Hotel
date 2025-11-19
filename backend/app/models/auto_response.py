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
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Text,
    Numeric,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
import enum


class TriggerType(str, enum.Enum):
    """觸發類型"""

    WELCOME = "welcome"  # 歡迎訊息
    KEYWORD = "keyword"  # 關鍵字
    TIME = "time"  # 指定時間觸發（排程）
    FOLLOW = "follow"  # 一律回應（AI 額度不足時的後備方案）


class AutoResponse(Base):
    """自動回應表"""

    __tablename__ = "auto_responses"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), comment="自動回應名稱")
    trigger_type = Column(
        String(20),
        nullable=False,
        comment="觸發類型：新好友歡迎訊息/關鍵字觸發/指定時間觸發",
    )
    content = Column(Text, nullable=False, comment="回應內容")
    template_id = Column(
        BigInteger,
        ForeignKey("message_templates.id", ondelete="SET NULL"),
        nullable=True,
        comment="模板ID",
    )

    # 關鍵字設定（JSON 格式，最多20組）
    keywords = Column(JSON, comment="關鍵字（JSON格式，最多20組）")

    # 時間設定
    trigger_time_start = Column(Time, comment="指定時間區間起始")
    trigger_time_end = Column(Time, comment="指定時間區間結束")
    date_range_start = Column(Date, comment="指定日期區間起始")
    date_range_end = Column(Date, comment="指定日期區間結束")

    # 狀態設定
    is_active = Column(Boolean, default=True, comment="啟用狀態")
    response_count = Column(Integer, default=1, comment="自動回應訊息數量（1-5筆）")

    # 統計
    trigger_count = Column(Integer, default=0, comment="觸發次數")
    success_rate = Column(Numeric(5, 2), default=0, comment="發送成功率")

    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    template = relationship("MessageTemplate")
    keyword_relations = relationship(
        "AutoResponseKeyword",
        back_populates="auto_response",
        cascade="all, delete-orphan",
    )
    response_messages = relationship(
        "AutoResponseMessage",
        back_populates="auto_response",
        cascade="all, delete-orphan",
        order_by="AutoResponseMessage.sequence_order",
    )


class AutoResponseKeyword(Base):
    """自動回應關鍵字表"""

    __tablename__ = "auto_response_keywords"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    auto_response_id = Column(
        BigInteger,
        ForeignKey("auto_responses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="自動回應ID",
    )
    keyword = Column(String(50), nullable=False, comment="關鍵字")
    match_count = Column(Integer, default=0, comment="匹配次數")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    auto_response = relationship("AutoResponse", back_populates="keyword_relations")

    __table_args__ = (
        UniqueConstraint("auto_response_id", "keyword", name="uq_auto_response_keyword"),
    )
