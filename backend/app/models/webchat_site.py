"""
Webchat 站點 ↔ LINE OA 綁定表

每個 webchat 嵌入站點（如 starbit-ryan、starbit-mike）對應一個「組織」。
新訪客進來時，系統用 site_id 查到所屬組織（tenant_id），寫進 members.tenant_id，
讓該訪客的對話資料（會員、FAQ 答覆、token quota、booking）都歸屬到正確的組織。

組織重構 Phase 4：site 改為綁「組織」而非硬綁 LINE OA。
line_channel_id 改為可空 —— 純官網彈窗（無 LINE）的組織也能成立。
"""
from sqlalchemy import Column, String, ForeignKey, DateTime, BigInteger
from sqlalchemy.sql import func
from app.database import Base as SQLAlchemyBase


class WebchatSiteChannel(SQLAlchemyBase):
    """Webchat 站點與「組織」的綁定（多組織路由；LINE 為選配）"""

    __tablename__ = "webchat_site_channels"

    site_id = Column(
        String(50),
        primary_key=True,
        comment="Webchat widget 嵌入站點代號（例：starbit-ryan）",
    )
    tenant_id = Column(
        BigInteger,
        ForeignKey("tenants.id", ondelete="CASCADE", name="fk_webchat_site_channels_tenant"),
        nullable=True,
        index=True,
        comment="所屬組織 ID（組織重構 Phase 4，site 的主要歸屬）",
    )
    line_channel_id = Column(
        String(100),
        ForeignKey("line_channels.channel_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="綁定的 LINE OA channel_id（選配；純官網彈窗組織可為空）",
    )
    site_name = Column(
        String(100),
        nullable=True,
        comment="顯示名稱（例：思偉達飯店｜雷恩館），方便後台識別",
    )
    last_seen_at = Column(
        DateTime,
        nullable=True,
        comment="最後一次 widget 被瀏覽器載入的時間（台灣時間）；用於基本設定狀態判定（有值=已開通）",
    )
    last_seen_url = Column(
        String(500),
        nullable=True,
        comment="最後一次 widget 載入時所在的頁面網址",
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False, comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True, comment="更新時間")
