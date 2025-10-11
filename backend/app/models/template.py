"""
消息模板模型
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Enum as SQLEnum,
    ForeignKey,
    JSON,
    Text,
    Numeric,
)
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


class TemplateType(str, enum.Enum):
    """模板類型"""

    TEXT = "text"  # 純文字
    TEXT_BUTTON = "text_button"  # 文字按鈕確認型
    IMAGE_CLICK = "image_click"  # 圖片點擊型
    IMAGE_CARD = "image_card"  # 圖卡按鈕型


class MessageTemplate(Base):
    """消息模板表"""

    __tablename__ = "message_templates"

    type = Column(SQLEnum(TemplateType), nullable=False, comment="類型")
    name = Column(String(100), comment="模板名稱")
    content = Column(Text, comment="文字內容")
    buttons = Column(JSON, comment="按鈕配置")
    notification_text = Column(String(100), comment="通知訊息")
    preview_text = Column(String(100), comment="訊息預覽")
    interaction_tag_id = Column(BigInteger, ForeignKey("interaction_tags.id"), comment="互動標籤ID")
    interaction_result = Column(JSON, comment="互動結果配置")

    # 關聯關係
    interaction_tag = relationship("InteractionTag")
    carousel_items = relationship(
        "TemplateCarouselItem",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="TemplateCarouselItem.sort_order",
    )
    campaigns = relationship("Campaign", back_populates="template")


class TemplateCarouselItem(Base):
    """輪播圖卡片表"""

    __tablename__ = "template_carousel_items"

    template_id = Column(
        BigInteger,
        ForeignKey("message_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="模板ID",
    )
    image_url = Column(String(500), nullable=False, comment="圖片URL")
    title = Column(String(100), comment="標題")
    description = Column(String(200), comment="描述")
    price = Column(Numeric(10, 2), comment="金額")
    action_url = Column(String(500), comment="動作URL")
    interaction_tag_id = Column(BigInteger, ForeignKey("interaction_tags.id"), comment="互動標籤ID")
    sort_order = Column(Integer, default=0, comment="排序")

    # 關聯關係
    template = relationship("MessageTemplate", back_populates="carousel_items")
    interaction_tag = relationship("InteractionTag")
