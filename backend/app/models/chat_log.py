"""Chat log model"""
from sqlalchemy import Column, BigInteger, String, Text, DateTime
from sqlalchemy.sql import func

from app.models.base import Base


class ChatLog(Base):
    """記錄 LINE/客服對話歷程"""

    __tablename__ = "chat_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    platform = Column(String(50), nullable=False, comment="來源平台：LINE/LIFF/後台等")
    user_id = Column(String(100), nullable=False, index=True, comment="平台使用者識別 (例如 LINE userId)")
    direction = Column(String(20), nullable=False, comment="方向：incoming/outgoing")
    message_type = Column(String(20), nullable=False, comment="訊息類型：text/postback/其他")
    text = Column(Text, comment="純文字資訊，利於搜尋")
    content = Column(Text, comment="完整 payload JSON 字串")
    event_id = Column(String(100), index=True, comment="事件 ID（如 LINE eventId）")
    status = Column(String(20), comment="狀態：received/sent/failed")
    created_at = Column(DateTime, server_default=func.now(), nullable=False, comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")
