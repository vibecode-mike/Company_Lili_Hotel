"""
消息模板模型
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Boolean,
    Enum as SQLEnum,
    ForeignKey,
    JSON,
    Text,
    Numeric,
    DateTime,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), comment="模板名稱")
    template_type = Column(
        String(20), comment="模板類型：Template01/Template02/Template03/Template04"
    )

    # 內容欄位
    text_content = Column(Text, comment="文字內容")
    image_url = Column(String(500), comment="圖片 URL")
    title = Column(String(100), comment="標題")
    description = Column(Text, comment="內文描述")
    amount = Column(Integer, comment="金額數值")

    # 按鈕設定
    button_text = Column(String(50), comment="按鈕文字")
    button_count = Column(Integer, default=0, comment="顯示的文字按鈕數量")
    buttons = Column(JSON, comment="按鈕配置（JSON）")

    # 互動設定
    interaction_tag = Column(String(50), comment="互動標籤")
    interaction_tag_id = Column(
        BigInteger, ForeignKey("interaction_tags.id", ondelete="SET NULL"), nullable=True
    )
    interaction_result = Column(JSON, comment="互動結果配置")

    # 動作設定
    action_type = Column(String(20), comment="動作按鈕互動類型：開啟網址/觸發文字/觸發圖片")
    action_url = Column(String(500), comment="URL 網址")
    action_text = Column(Text, comment="觸發的訊息文字")
    action_image = Column(String(500), comment="觸發的圖片檔案")

    # 通知設定
    notification_message = Column(String(100), comment="通知推播訊息")
    preview_message = Column(String(100), comment="聊天室預覽訊息")

    # 輪播設定
    carousel_count = Column(Integer, comment="輪播圖卡數量（2-9張）")

    # 模板庫管理欄位
    is_in_library = Column(Boolean, default=False, comment="是否在模板庫中")
    source_template_id = Column(
        BigInteger,
        ForeignKey("message_templates.id", ondelete="SET NULL"),
        nullable=True,
        comment="來源模板ID（複製時記錄）",
    )
    usage_count = Column(Integer, default=0, comment="使用次數（複製/使用計數）")
    storage_type = Column(
        String(10), default="database", comment="儲存類型：database | cdn"
    )
    flex_message_url = Column(String(500), comment="Flex Message CDN URL（>10KB時使用）")

    # 系統欄位
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    interaction_tag_relation = relationship("InteractionTag")
    carousel_items = relationship(
        "TemplateCarouselItem",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="TemplateCarouselItem.sort_order",
    )
    messages = relationship("Message", back_populates="template")


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
    action_button_text = Column(String(100), comment="動作按鈕文字")
    action_button_enabled = Column(Boolean, default=False, comment="動作按鈕啟用")
    action_button_interaction_type = Column(String(50), comment="動作按鈕互動類型")
    action_button_url = Column(String(500), comment="動作按鈕網址")
    action_button_trigger_message = Column(Text, comment="動作按鈕觸發訊息")
    action_button_trigger_image_url = Column(String(500), comment="動作按鈕觸發圖片URL")
    action_button2_text = Column(String(100), comment="第二個動作按鈕文字")
    action_button2_enabled = Column(Boolean, default=False, comment="第二個動作按鈕啟用")
    action_button2_interaction_type = Column(String(50), comment="第二個動作按鈕互動類型")
    action_button2_url = Column(String(500), comment="第二個動作按鈕網址")
    action_button2_trigger_message = Column(Text, comment="第二個動作按鈕觸發訊息")
    action_button2_trigger_image_url = Column(String(500), comment="第二個動作按鈕觸發圖片URL")
    image_aspect_ratio = Column(String(10), default="1:1", nullable=False, comment="圖片長寬比例")
    image_click_action_type = Column(String(50), default="open_image", nullable=False, comment="圖片點擊動作類型")
    image_click_action_value = Column(Text, comment="圖片點擊動作值")
    sort_order = Column(Integer, default=0, comment="排序")

    # 追蹤統計欄位
    click_count = Column(Integer, default=0, comment="點擊次數")
    unique_click_count = Column(Integer, default=0, comment="唯一點擊次數")
    last_clicked_at = Column(DateTime, comment="最後點擊時間")

    # 關聯關係
    template = relationship("MessageTemplate", back_populates="carousel_items")
    interaction_tag = relationship("InteractionTag")
    interaction_logs = relationship(
        "ComponentInteractionLog",
        back_populates="carousel_item",
        cascade="all, delete-orphan",
    )
