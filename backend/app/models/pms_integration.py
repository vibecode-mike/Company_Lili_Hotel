"""
PMS 整合模型
"""
from sqlalchemy import (
    Column,
    String,
    Text,
    Date,
    BigInteger,
    DateTime,
    Numeric,
    JSON,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class PMSIntegration(Base):
    """PMS 整合表"""

    __tablename__ = "pms_integrations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    id_number = Column(String(50), index=True, comment="身分證字號")
    phone = Column(String(20), index=True, comment="手機號碼")
    stay_records = Column(JSON, comment="住宿紀錄資訊（JSON格式）")
    room_type = Column(String(50), comment="房型")
    stay_date = Column(Date, comment="住宿日期")
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="關聯的會員ID",
    )
    match_status = Column(
        String(20), default="pending", comment="比對狀態：matched/pending/failed"
    )
    match_rate = Column(Numeric(5, 2), comment="比對成功率")
    error_message = Column(Text, comment="比對失敗原因")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    member = relationship("Member", back_populates="pms_integrations")
    consumption_records = relationship(
        "ConsumptionRecord", back_populates="pms_integration", cascade="all, delete-orphan"
    )
