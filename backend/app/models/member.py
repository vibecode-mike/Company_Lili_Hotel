"""
會員模型
"""
from sqlalchemy import Column, String, Boolean, Date, DateTime, Text, BigInteger, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class Member(Base):
    """會員表"""

    __tablename__ = "members"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # LINE 相關資訊
    line_uid = Column(String(100), unique=True, index=True, comment="LINE UID")
    line_channel_id = Column(String(100), index=True, comment="LINE 官方 Channel ID，對應 line_channels.channel_id")
    line_avatar = Column(String(500), comment="LINE 會員頭像 CDN URL（儲存 LINE 提供的完整 URL，如 https://profile.line-scdn.net/xxxxx），若無頭像或 URL 失效則顯示預設頭像。URL 來源：會員加入時從 LINE Profile API 取得，儲存後不定期更新。前端顯示時直接載入此 URL")
    line_display_name = Column(String(100), comment="LINE 顯示名稱")

    # Facebook 相關資訊
    fb_customer_id = Column(String(100), unique=True, index=True, comment="Facebook Customer ID，透過 Facebook OAuth 登入時取得")
    fb_avatar = Column(String(500), comment="Facebook 會員頭像 URL")
    fb_customer_name = Column(String(100), comment="Facebook 顯示名稱")

    # Webchat 相關資訊
    webchat_uid = Column(String(100), unique=True, index=True, comment="Webchat 訪客 ID，系統自動生成或透過 OAuth 關聯取得")
    webchat_avatar = Column(String(500), comment="Webchat 會員頭像 URL")
    webchat_name = Column(String(100), comment="Webchat 顯示名稱")
    webchat_site_id = Column(String(50), index=True, comment="Webchat widget 嵌入站點英文代號（例：starbit-ryan）")
    webchat_site_name = Column(String(100), comment="Webchat widget 嵌入站點顯示名（例：思偉達飯店｜雷恩館）")

    # 基本資訊
    name = Column(String(32), comment="會員姓名（統一單欄位）")
    gender = Column(String(1), nullable=False, default="0", server_default="0", comment="性別：0=不透漏/1=男/2=女")
    birthday = Column(Date, comment="生日")
    email = Column(String(255), unique=True, index=True, comment="電子信箱")
    phone = Column(String(20), index=True, comment="手機號碼")
    id_number = Column(String(20), unique=True, index=True, comment="身分證字號")
    passport_number = Column(String(50), comment="護照號碼")
    residence = Column(String(100), comment="居住地")
    address_detail = Column(String(255), comment="詳細地址")

    # 系統資訊
    join_source = Column(
        String(20),
        nullable=False,
        default="LINE",
        comment="加入來源：LINE/CRM/PMS/ERP/系統/Webchat",
        index=True,
    )
    receive_notification = Column(Boolean, default=True, comment="是否接收優惠通知")
    gpt_enabled = Column(Boolean, default=True, comment="是否啟用 GPT 自動回應")
    # 訪客（未加入會員的 webchat widget 使用者）
    is_guest = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="0",
        comment="是否為匿名 webchat 訪客（未填寫資料）",
        index=True,
    )
    guest_seq = Column(
        Integer,
        unique=True,
        nullable=True,
        comment="訪客流水號（顯示為 訪客{guest_seq:06d}）",
    )
    human_override_until = Column(DateTime, nullable=True, comment="人工接管到期時間（UTC），非 NULL 且未過期時抑制所有自動回應")
    internal_note = Column(Text, comment="內部備註")
    last_interaction_at = Column(DateTime, index=True, comment="最後互動時間")
    is_following = Column(
        Boolean,
        nullable=True,
        default=True,
        server_default="1",
        comment="是否正在關注 LINE OA（從 line_friends 同步）",
    )

    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    member_tags = relationship(
        "MemberTag", back_populates="member", cascade="all, delete-orphan"
    )
    member_interaction_tags = relationship(
        "MemberInteractionTag", back_populates="member", cascade="all, delete-orphan"
    )
    consumption_records = relationship(
        "ConsumptionRecord", back_populates="member", cascade="all, delete-orphan"
    )
    pms_integrations = relationship(
        "PMSIntegration", back_populates="member", cascade="all, delete-orphan"
    )
    message_deliveries = relationship(
        "MessageDelivery", back_populates="member", cascade="all, delete-orphan"
    )

    @property
    def message_recipients(self):
        """向後兼容舊屬性名稱"""
        return self.message_deliveries

    @message_recipients.setter
    def message_recipients(self, value):
        self.message_deliveries = value
