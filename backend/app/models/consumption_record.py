"""
消費紀錄模型
"""
from sqlalchemy import (
    Column,
    String,
    Text,
    BigInteger,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class ConsumptionRecord(Base):
    """消費紀錄表"""

    __tablename__ = "consumption_records"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬會員ID",
    )
    pms_integration_id = Column(
        BigInteger,
        ForeignKey("pms_integrations.id", ondelete="SET NULL"),
        nullable=True,
        comment="PMS整合資料ID",
    )
    amount = Column(Numeric(10, 2), comment="消費金額")
    room_type = Column(String(50), comment="房型或套餐")
    stay_date = Column(Date, comment="入住日期")
    check_in_date = Column(Date, comment="入住日期（精確）")
    check_out_date = Column(Date, comment="退房日期")
    notes = Column(Text, comment="備註")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    member = relationship("Member", back_populates="consumption_records")
    pms_integration = relationship("PMSIntegration", back_populates="consumption_records")
