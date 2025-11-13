"""
標籤規則模型 (TagRule)
用於定義 CRM/PMS 標籤的自動生成規則
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Float,
    Boolean,
    DateTime,
)
from sqlalchemy.sql import func
from app.models.base import Base


class TagRule(Base):
    """標籤規則表"""

    __tablename__ = "tag_rules"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tag_name = Column(String(20), nullable=False, comment="標籤名稱（如：高消費客戶、常客）")
    tag_source = Column(String(20), nullable=False, comment="標籤來源：CRM/PMS")
    rule_type = Column(
        String(50),
        nullable=False,
        comment="規則類型：consumption_amount（消費金額）/visit_frequency（訪問頻率）/interaction_time（互動時間）/room_type（房型分類）",
    )
    threshold_value = Column(
        Float, nullable=True, comment="門檻值（如：30000 元、3 次）"
    )
    threshold_unit = Column(
        String(20), nullable=True, comment="單位：NTD（新台幣）/times（次）/days（天）"
    )
    period_days = Column(
        Integer,
        nullable=True,
        comment="計算週期（天數），如 365 表示滾動 12 個月",
    )
    condition_operator = Column(
        String(10), nullable=False, default=">=", comment="比較運算子：>=/>/<=/<="
    )
    is_enabled = Column(Boolean, nullable=False, default=True, comment="是否啟用")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")
