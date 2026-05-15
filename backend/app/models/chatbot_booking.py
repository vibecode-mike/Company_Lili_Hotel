"""
官網 AI 聊天機器人訂房相關模型
"""

from sqlalchemy import (
    Column,
    String,
    BigInteger,
    SmallInteger,
    Boolean,
    Date,
    DateTime,
    Text,
    JSON,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class ChatbotSession(Base):
    """官網 AI 聊天機器人 Session 追蹤表"""

    __tablename__ = "chatbot_sessions"
    __table_args__ = (
        Index("idx_chatbot_session_browser_key", "browser_key"),
        Index("idx_chatbot_session_browser_created", "browser_key", "created_at"),
    )

    id = Column(String(36), primary_key=True, comment="UUID，Session ID")
    browser_key = Column(
        String(100), nullable=False, comment="瀏覽器唯一識別碼（Web Key）"
    )
    hotel_id = Column(BigInteger, nullable=True, comment="飯店 ID（多租戶場景）")
    intent_state = Column(
        String(20),
        nullable=False,
        default="detecting",
        comment="訂房意圖狀態：detecting | confirmed | none",
    )
    turn_count = Column(
        SmallInteger, nullable=False, default=0, comment="本 Session 對話輪數"
    )
    booking_adults = Column(SmallInteger, nullable=True, comment="入住大人數")
    checkin_date = Column(Date, nullable=True, comment="入住日期")
    checkout_date = Column(Date, nullable=True, comment="退房日期")
    room_plan_requests = Column(
        JSON,
        nullable=True,
        comment="幾間幾人房請求陣列，格式 [{room_count, adults_per_room}]；rotate 時清空",
    )
    selected_rooms = Column(
        JSON,
        nullable=True,
        comment="訪客點選確認的房型與間數陣列，格式 [{room_type_code, room_type_name, room_count, source}]",
    )
    selected_room_type = Column(
        String(100),
        nullable=True,
        comment="向下相容欄位：selected_rooms[0].room_type_code",
    )
    selected_room_count = Column(
        SmallInteger,
        nullable=True,
        comment="向下相容欄位：selected_rooms[0].room_count",
    )
    member_name = Column(String(100), nullable=True, comment="訪客姓名（暫存）")
    member_phone = Column(String(20), nullable=True, comment="訪客電話（暫存）")
    member_email = Column(String(255), nullable=True, comment="訪客 Email（暫存）")
    crm_member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
        comment="寫入 CRM 後的 Member.id",
    )
    needs_human_followup = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="AI 無法回答時是否需要人工跟進",
    )
    created_at = Column(
        DateTime, nullable=False, server_default=func.now(), comment="建立時間（UTC）"
    )
    updated_at = Column(
        DateTime, nullable=True, onupdate=func.now(), comment="更新時間（UTC）"
    )

    # 關聯關係
    crm_member = relationship("Member", foreign_keys=[crm_member_id])
    booking_records = relationship(
        "BookingRecord",
        back_populates="session",
        cascade="all, delete-orphan",
    )


class FaqPmsConnection(Base):
    """FAQ 與 PMS 即時房況串接設定表"""

    __tablename__ = "faq_pms_connections"
    __table_args__ = (
        UniqueConstraint(
            "faq_category_id", "channel_id", name="uq_faq_pms_category_channel"
        ),
        Index("ix_faq_pms_connections_channel_id", "channel_id"),
    )

    faq_category_id = Column(
        BigInteger,
        ForeignKey("faq_categories.id", ondelete="CASCADE"),
        nullable=False,
        comment="關聯的 FAQ 大分類",
    )
    channel_id = Column(
        String(100),
        ForeignKey("line_channels.channel_id", ondelete="CASCADE"),
        nullable=False,
        comment="所屬 LINE OA channel_id（多 OA 隔離）",
    )
    api_endpoint = Column(
        String(500), nullable=False, comment="PMS 即時房況 API 端點 URL"
    )
    api_key_encrypted = Column(
        Text, nullable=False, comment="AES-256 加密儲存的 PMS API Key"
    )
    auth_type = Column(
        String(20), nullable=False, comment="認證方式：api_key | bearer_token"
    )
    status = Column(
        String(20),
        nullable=False,
        default="disabled",
        comment="串接狀態：enabled | disabled | failed",
    )
    last_synced_at = Column(DateTime, nullable=True, comment="最後連線成功時間")
    error_message = Column(String(500), nullable=True, comment="最後一次錯誤訊息")
    snapshot_completed = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="0",
        comment="PMS 快照是否已完成",
    )

    # 關聯關係
    faq_category = relationship("FaqCategory")


class BookingRecord(Base):
    """官網 AI 聊天機器人訂房紀錄表"""

    __tablename__ = "booking_records"
    __table_args__ = (
        Index("idx_booking_record_member", "crm_member_id"),
        Index("idx_booking_record_session", "session_id"),
        Index("idx_booking_record_created", "created_at"),
    )

    id = Column(
        String(36), primary_key=True, comment="UUID，訂房紀錄 ID（reservation_id）"
    )
    session_id = Column(
        String(36),
        ForeignKey("chatbot_sessions.id", ondelete="CASCADE"),
        nullable=False,
        comment="來源 ChatbotSession ID",
    )
    crm_member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
        comment="關聯的 CRM 會員 ID；ENABLE_DB=false 時為 null",
    )
    selected_rooms = Column(
        JSON,
        nullable=False,
        comment="多房型混搭快照陣列，格式 [{room_type_code, room_type_name, room_count, source}]",
    )
    room_type_code = Column(
        String(100),
        nullable=False,
        comment="向下相容：selected_rooms[0].room_type_code",
    )
    room_type_name = Column(
        String(200),
        nullable=False,
        comment="向下相容：selected_rooms[0].room_type_name",
    )
    room_count = Column(
        SmallInteger, nullable=False, comment="向下相容：selected_rooms[0].room_count"
    )
    checkin_date = Column(Date, nullable=False, comment="入住日期")
    checkout_date = Column(
        Date, nullable=False, comment="退房日期；必須晚於 checkin_date"
    )
    adults = Column(
        SmallInteger, nullable=False, comment="總大人數（由 selected_rooms 累加）"
    )
    member_name = Column(
        String(100), nullable=False, comment="訪客姓名快照（訂房當下的值）"
    )
    member_phone = Column(String(20), nullable=False, comment="訪客電話快照，10 位數字")
    member_email = Column(
        String(255), nullable=False, comment="訪客 Email 快照，需含 @"
    )
    cart_url = Column(
        String(500),
        nullable=True,
        comment="PMS 購物車 URL（booking-save 呼叫 PMS 建立購物車後儲存）",
    )
    session_log = Column(JSON, nullable=True, comment="完整 Session 對話紀錄 JSON")
    data_source = Column(
        String(20), nullable=False, comment="房型資料來源：pms | faq_static"
    )
    db_saved = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="true=正式 DB 寫入；false=測試模式 JSON 降級",
    )
    source = Column(
        String(20),
        nullable=False,
        default="Webchat",
        comment="訂房來源標識，固定為 Webchat",
    )
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        comment="建立時間（UTC），即訪客點擊「立即預訂」的時間",
    )

    # 關聯關係
    session = relationship("ChatbotSession", back_populates="booking_records")
    crm_member = relationship("Member", foreign_keys=[crm_member_id])
