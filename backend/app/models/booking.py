"""
訂單紀錄模型
閎運 callback status=paid 時寫入一筆，用於「完成訂單」KPI 計算
"""
from sqlalchemy import BigInteger, Column, Date, DateTime, ForeignKey, Index, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Booking(Base):
    """完成訂單紀錄（付款成立後）"""

    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_bookings_paid_at", "paid_at"),
        Index("ix_bookings_line_uid", "line_uid"),
        Index("ix_bookings_member_id", "member_id"),
    )

    # 此表用 order_id（閎運訂單編號）作為 PK，明確跳過繼承自 Base 的 id
    # 訂單成立後 immutable（order_id 去重 + insert-only），不需要 updated_at
    id = None
    updated_at = None

    order_id = Column(String(64), primary_key=True, comment="閎運訂單編號，去重用")
    line_uid = Column(String(100), nullable=True, comment="LINE 使用者 UID")
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
        comment="關聯會員 ID（lookup 失敗可為 NULL）",
    )
    checkin_date = Column(Date, nullable=True, comment="入住日期")
    rooms = Column(JSON, nullable=True, comment='訂房房型清單，格式：[{"roomtype": "WS", "quantity": 1}, ...]')
    source = Column(
        String(20),
        nullable=False,
        default="LINE",
        server_default="LINE",
        comment="訂房來源：LINE / Webchat / FB",
    )
    paid_at = Column(DateTime, nullable=True, comment="付款完成時間（callback 抵達時刻）")
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        comment="資料庫建立時間（台灣時間）",
    )

    member = relationship("Member", foreign_keys=[member_id])
