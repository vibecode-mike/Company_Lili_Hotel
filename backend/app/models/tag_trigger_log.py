"""
標籤觸發日誌模型
"""
from sqlalchemy import Column, BigInteger, DateTime, Enum as SQLEnum, ForeignKey, Index, String
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime
import enum


class TriggerSource(str, enum.Enum):
    """觸發來源"""

    CLICK = "click"  # 點擊（圖片/按鈕，→「互動」tab）
    INTERACTION = "interaction"  # 對話（AI 自動打標，→「對話」tab）
    MANUAL = "manual"  # 手動（後台管理員操作，不在三個 tab 內）
    CONVERSION = "conversion"  # 轉單（訂單成立時的房型標籤，→「轉單」tab）


class TagType(str, enum.Enum):
    """標籤類型"""

    MEMBER = "member"  # 會員標籤
    INTERACTION = "interaction"  # 互動標籤


class TagTriggerLog(Base):
    """
    標籤觸發日誌表
    每次會員被貼標或觸發既有標籤都寫一筆，供「時段洞察」等統計使用
    """

    __tablename__ = "tag_trigger_logs"
    __table_args__ = (
        Index("ix_tag_trigger_logs_member_triggered", "member_id", "triggered_at"),
        Index("ix_tag_trigger_logs_platform_channel", "platform", "channel_id"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="會員ID",
    )
    # 原有 FK→interaction_tags 已放寬（migration 7810b55a4479），tag_id 可填 null
    tag_id = Column(
        BigInteger,
        nullable=True,
        index=True,
    )
    tag_type = Column(
        SQLEnum(TagType),
        nullable=False,
        default=TagType.INTERACTION,
        server_default="interaction",
        comment="標籤類型：member（會員標籤）/ interaction（互動標籤）",
    )
    tag_name = Column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="標籤名稱快照",
    )
    message_id = Column(
        BigInteger,
        ForeignKey("messages.id", ondelete="CASCADE"),
        index=True,
        comment="群發訊息ID",
    )
    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="活動ID（選填）",
    )
    trigger_source = Column(SQLEnum(TriggerSource), nullable=False, comment="觸發來源")
    triggered_at = Column(DateTime, default=datetime.now, nullable=False, comment="觸發時間")
    platform = Column(String(20), nullable=True, comment="平台：LINE / Facebook / Webchat")
    channel_id = Column(String(100), nullable=True, comment="頻道識別：LINE channel_id / FB page_id / Webchat site_id")

    # 關聯關係（tag_id 不再硬連 FK）
    member = relationship("Member")
    message = relationship("Message", back_populates="tag_trigger_logs")
    campaign = relationship("Campaign")
