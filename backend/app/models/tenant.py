"""
組織（Tenant）模型

系統的最頂層歸屬單位。一個「組織」= 一個客戶 / 一個館。
LINE 頻道、官網彈窗、FB、PMS 等都掛在組織底下，成為可有可無的「工具」。

設計目的：把資料的歸屬從「綁某個 LINE 帳號」抬到「綁組織」，
讓沒有 LINE 的客戶（純官網彈窗 / 純 FB）也能使用系統。
"""
from sqlalchemy import Column, String, Boolean
from app.models.base import Base


class Tenant(Base):
    """組織表（最頂層歸屬單位）"""

    __tablename__ = "tenants"
    __table_args__ = ({"comment": "組織（最頂層歸屬單位，一個組織=一個客戶/館）"},)

    # id / created_at / updated_at 由 Base 提供
    name = Column(String(100), nullable=False, comment="組織名稱")
    slug = Column(String(100), unique=True, nullable=True, comment="組織代碼（選填，唯一）")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否啟用")
