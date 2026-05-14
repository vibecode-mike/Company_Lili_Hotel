"""
Webchat 站點 ↔ LINE OA 綁定表

每個 webchat 嵌入站點（如 starbit-ryan、starbit-mike）對應一個 LINE OA。
新訪客進來時，系統用 site_id 查到 line_channel_id，寫進 members.line_channel_id，
讓該訪客的對話資料（會員、FAQ 答覆、token quota、booking）都歸屬到正確的館別。
"""
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base as SQLAlchemyBase


class WebchatSiteChannel(SQLAlchemyBase):
    """Webchat 站點與 LINE OA 的綁定（多 OA 路由）"""

    __tablename__ = "webchat_site_channels"

    site_id = Column(
        String(50),
        primary_key=True,
        comment="Webchat widget 嵌入站點代號（例：starbit-ryan）",
    )
    line_channel_id = Column(
        String(100),
        ForeignKey("line_channels.channel_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="綁定的 LINE OA channel_id",
    )
    site_name = Column(
        String(100),
        nullable=True,
        comment="顯示名稱（例：思偉達飯店｜雷恩館），方便後台識別",
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False, comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True, comment="更新時間")
