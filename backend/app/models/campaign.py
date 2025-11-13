"""
群發訊息模型（Message）
注意：原 campaigns 表已重命名為 messages（語意變更）
新的 Campaign（活動管理）請參考 new_campaign.py

⚠️ 向後兼容性說明：
- Campaign 類別是 Message 的別名，用於向後兼容
- CampaignStatus 枚舉映射到 Message.send_status 的字串值
- 舊欄位名稱通過屬性（property）映射到新欄位
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DateTime,
    Date,
    Time,
    ForeignKey,
    JSON,
    UniqueConstraint,
    Text,
)
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
from enum import Enum


class CampaignStatus(str, Enum):
    """
    活動狀態枚舉（向後兼容）
    映射到 Message.send_status 的中文字串值
    """
    DRAFT = "草稿"
    SCHEDULED = "排程發送"
    SENT = "已發送"
    FAILED = "發送失敗"


class Message(Base):
    """群發訊息表"""

    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    template_id = Column(
        BigInteger,
        ForeignKey("message_templates.id", ondelete="RESTRICT"),
        nullable=False,
        comment="訊息模板ID",
    )
    message_content = Column(Text, comment="訊息內容（用於列表顯示）")
    thumbnail = Column(String(500), comment="縮圖 URL")
    send_time = Column(DateTime, comment="傳送時間")
    send_count = Column(Integer, default=0, comment="傳送人數")
    open_count = Column(Integer, default=0, comment="開啟次數（不重複）")
    click_count = Column(Integer, default=0, comment="點擊次數（不重複）")
    send_status = Column(
        String(20),
        nullable=False,
        default="草稿",
        comment="發送狀態：排程發送/已發送/草稿/發送失敗",
    )
    failure_reason = Column(Text, comment="發送失敗原因")

    # 發送對象設定（規格：兩欄位設計）
    target_type = Column(
        String(20), nullable=False, comment="傳送對象類型：所有好友/篩選目標對象"
    )
    target_filter = Column(JSON, comment="篩選條件（JSON格式）")

    # 排程設定（規格：分開儲存）
    scheduled_date = Column(Date, comment="排程發送日期")
    scheduled_time = Column(Time, comment="排程發送時間")

    trigger_condition = Column(JSON, comment="特定觸發條件")
    estimated_send_count = Column(Integer, default=0, comment="預計發送好友人數")
    available_quota = Column(Integer, default=0, comment="可用訊息配額用量")

    # 系統欄位
    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        comment="關聯活動ID（選填）",
    )
    created_by = Column(BigInteger, ForeignKey("users.id"), comment="創建者ID")
    flex_message_json = Column(MEDIUMTEXT, nullable=True, comment="Flex Message JSON 內容（最大 16MB）")

    # 相容 line_app/app.py 的欄位
    interaction_tags = Column(JSON, comment="互動標籤（相容舊程式）")

    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    template = relationship("MessageTemplate", back_populates="messages")
    campaign = relationship("Campaign", back_populates="messages")
    creator = relationship("User")
    recipients = relationship(
        "MessageRecipient", back_populates="message", cascade="all, delete-orphan"
    )
    member_tags = relationship(
        "MemberTag",
        foreign_keys="MemberTag.message_id",
        overlaps="message",
    )
    interaction_records = relationship(
        "MemberInteractionRecord", back_populates="message", cascade="all, delete-orphan"
    )
    tag_trigger_logs = relationship("TagTriggerLog", back_populates="message")
    interaction_logs = relationship(
        "ComponentInteractionLog", back_populates="message", cascade="all, delete-orphan"
    )

    # ============================================================
    # 向後兼容屬性：映射舊欄位名稱到新欄位
    # ============================================================

    @property
    def title(self) -> str:
        """向後兼容：title 映射到 message_content"""
        return self.message_content or ""

    @title.setter
    def title(self, value: str):
        """向後兼容：設置 title 時更新 message_content"""
        self.message_content = value

    @property
    def status(self) -> CampaignStatus:
        """向後兼容：status 映射到 send_status，返回 CampaignStatus 枚舉"""
        status_map = {
            "草稿": CampaignStatus.DRAFT,
            "排程發送": CampaignStatus.SCHEDULED,
            "已發送": CampaignStatus.SENT,
            "發送失敗": CampaignStatus.FAILED,
        }
        return status_map.get(self.send_status, CampaignStatus.DRAFT)

    @status.setter
    def status(self, value):
        """向後兼容：設置 status 時更新 send_status"""
        if isinstance(value, CampaignStatus):
            self.send_status = value.value
        elif isinstance(value, str):
            # 如果傳入字串，先嘗試轉換為 CampaignStatus
            try:
                status_enum = CampaignStatus(value)
                self.send_status = status_enum.value
            except ValueError:
                # 如果無法轉換，直接使用字串值
                self.send_status = value
        else:
            self.send_status = str(value)

    @property
    def sent_at(self):
        """向後兼容：sent_at 映射到 send_time"""
        return self.send_time

    @sent_at.setter
    def sent_at(self, value):
        """向後兼容：設置 sent_at 時更新 send_time"""
        self.send_time = value

    @property
    def sent_count(self) -> int:
        """向後兼容：sent_count 映射到 send_count"""
        return self.send_count or 0

    @sent_count.setter
    def sent_count(self, value: int):
        """向後兼容：設置 sent_count 時更新 send_count"""
        self.send_count = value

    @property
    def target_audience(self):
        """
        向後兼容：target_audience 映射到 target_type 和 target_filter
        返回格式：{"type": "all"|"filtered", "condition": "include"|"exclude", "tags": [...]}
        """
        if self.target_type == "所有好友":
            return {"type": "all", "condition": "include", "tags": []}
        else:
            # 從 target_filter 中提取條件和標籤
            filter_data = self.target_filter or {}
            return {
                "type": "filtered",
                "condition": filter_data.get("condition", "include"),
                "tags": filter_data.get("tags", []),
            }

    @target_audience.setter
    def target_audience(self, value):
        """向後兼容：設置 target_audience 時更新 target_type 和 target_filter"""
        if isinstance(value, dict):
            audience_type = value.get("type", "all")
            if audience_type == "all":
                self.target_type = "所有好友"
                self.target_filter = None
            else:
                self.target_type = "篩選目標對象"
                self.target_filter = {
                    "condition": value.get("condition", "include"),
                    "tags": value.get("tags", []),
                }
        elif isinstance(value, str):
            if value.lower() in ["all", "所有好友"]:
                self.target_type = "所有好友"
                self.target_filter = None
            else:
                self.target_type = "篩選目標對象"
                self.target_filter = {"condition": "include", "tags": []}

    @property
    def scheduled_at(self):
        """
        向後兼容：scheduled_at 映射到 scheduled_date 和 scheduled_time 的組合
        返回 datetime 或 None
        """
        if self.scheduled_date and self.scheduled_time:
            from datetime import datetime
            return datetime.combine(self.scheduled_date, self.scheduled_time)
        return None

    @scheduled_at.setter
    def scheduled_at(self, value):
        """向後兼容：設置 scheduled_at 時拆分為 scheduled_date 和 scheduled_time"""
        if value:
            self.scheduled_date = value.date()
            self.scheduled_time = value.time()
        else:
            self.scheduled_date = None
            self.scheduled_time = None


# 向後兼容別名：Campaign 指向 Message 類別
Campaign = Message


class MessageRecipient(Base):
    """推播對象記錄表"""

    __tablename__ = "message_recipients"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    message_id = Column(
        BigInteger,
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="群發訊息ID",
    )
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="會員ID",
    )
    sent_at = Column(DateTime, comment="發送時間")
    opened_at = Column(DateTime, comment="開啟時間")
    clicked_at = Column(DateTime, comment="點擊時間")
    status = Column(
        String(20),
        nullable=False,
        default="pending",
        comment="狀態：pending/sent/opened/clicked/failed",
    )
    error_message = Column(String(500), comment="錯誤訊息")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    message = relationship("Message", back_populates="recipients")
    member = relationship("Member", back_populates="message_recipients")

    __table_args__ = (
        UniqueConstraint("message_id", "member_id", name="uq_message_member"),
    )


# 向後兼容別名：CampaignRecipient 指向 MessageRecipient
CampaignRecipient = MessageRecipient
