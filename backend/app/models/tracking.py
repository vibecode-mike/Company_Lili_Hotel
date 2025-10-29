"""
元件互動追蹤模型
"""
from sqlalchemy import (
    Column,
    String,
    BigInteger,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum
from datetime import datetime


class InteractionType(str, enum.Enum):
    """互動類型"""

    IMAGE_CLICK = "image_click"  # 圖片點擊
    BUTTON_MESSAGE = "button_message"  # 按鈕訊息
    BUTTON_URL = "button_url"  # 按鈕網址
    BUTTON_IMAGE = "button_image"  # 按鈕圖片
    POSTBACK = "postback"  # Postback事件


class ComponentInteractionLog(Base):
    """元件互動記錄表"""

    __tablename__ = "component_interaction_logs"

    # 關聯維度
    line_id = Column(
        String(100),
        nullable=False,
        index=True,
        comment="LINE 用戶 UID",
    )
    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="活動ID",
    )
    template_id = Column(
        BigInteger,
        ForeignKey("message_templates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="模板ID",
    )
    carousel_item_id = Column(
        BigInteger,
        ForeignKey("template_carousel_items.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="輪播圖卡片ID",
    )
    interaction_tag_id = Column(
        BigInteger,
        ForeignKey("interaction_tags.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="互動標籤ID",
    )
    component_slot = Column(
        String(50),
        nullable=True,
        index=True,
        comment="模板元件槽位",
    )
    interaction_type = Column(
        SQLEnum(InteractionType, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
        comment="互動類型",
    )
    interaction_value = Column(Text, comment="互動值（如URL、訊息內容等）")
    triggered_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="觸發時間",
    )
    line_event_type = Column(String(50), comment="LINE事件類型")
    user_agent = Column(Text, comment="用戶代理")

    # 關聯關係
    campaign = relationship("Campaign", back_populates="interaction_logs")
    template = relationship("MessageTemplate")
    carousel_item = relationship(
        "TemplateCarouselItem", back_populates="interaction_logs"
    )
    interaction_tag = relationship("InteractionTag", back_populates="interaction_logs")
