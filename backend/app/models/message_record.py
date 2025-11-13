"""
一對一訊息紀錄模型
"""
from sqlalchemy import (
    Column,
    String,
    Text,
    Date,
    Time,
    BigInteger,
    DateTime,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class MessageRecord(Base):
    """一對一訊息紀錄表"""

    __tablename__ = "message_records"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所屬會員ID",
    )
    message_content = Column(Text, nullable=False, comment="訊息內容")
    message_type = Column(
        String(20), nullable=False, comment="訊息類型：純文字/圖片/訊息模板"
    )
    message_status = Column(
        String(20), default="未讀", comment="訊息狀態：已讀/未讀"
    )
    send_time = Column(Time, comment="傳送時間（HH:MM）")
    message_source = Column(
        String(50), comment="訊息來源：人工回覆/訊息推播/自動回應"
    )
    conversation_date = Column(Date, comment="對話開啟日期")
    scheduled_send = Column(Boolean, default=False, comment="是否排程發送")
    scheduled_date = Column(Date, comment="排程指定日期")
    scheduled_time = Column(Time, comment="排程指定時間")
    direction = Column(String(20), comment="方向：incoming/outgoing")

    # 相容舊資料欄位
    campaign_id = Column(
        BigInteger,
        ForeignKey("messages.id", ondelete="SET NULL"),
        nullable=True,
        comment="來源群發訊息ID（相容）",
    )
    sender_type = Column(String(20), comment="發送者類型（相容）")

    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    member = relationship("Member", back_populates="message_records")
    source_message = relationship("Message", foreign_keys=[campaign_id])
