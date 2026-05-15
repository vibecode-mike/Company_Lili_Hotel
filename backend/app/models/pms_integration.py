"""
PMS 整合模型
"""

from sqlalchemy import (
    Column,
    String,
    Text,
    Date,
    BigInteger,
    Integer,
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
    pms_type = Column(String(50), nullable=True, comment="PMS 系統類型")
    api_endpoint = Column(String(500), nullable=True, comment="PMS API 端點")
    api_key = Column(Text, nullable=True, comment="API 認證金鑰（加密儲存）")
    config_json = Column(JSON, nullable=True, comment="PMS 特定配置（JSON格式）")
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
    channel_id = Column(
        String(100),
        ForeignKey("line_channels.channel_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="所屬 LINE OA channel_id（多 OA 隔離）",
    )
    match_status = Column(
        String(20), default="pending", comment="比對狀態：matched/pending/failed"
    )
    match_rate = Column(Numeric(5, 2), comment="比對成功率")
    sync_status = Column(
        String(20),
        default="active",
        index=True,
        comment="同步狀態：active/failed/disabled",
    )
    last_sync_at = Column(DateTime, index=True, comment="最後同步時間（UTC）")
    consecutive_failed_count = Column(
        Integer, default=0, nullable=False, comment="連續同步失敗次數"
    )
    last_failed_at = Column(DateTime, comment="最近一次同步失敗時間（UTC）")
    error_message = Column(Text, comment="比對失敗原因")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    member = relationship("Member", back_populates="pms_integrations")
    consumption_records = relationship(
        "ConsumptionRecord",
        back_populates="pms_integration",
        cascade="all, delete-orphan",
    )
