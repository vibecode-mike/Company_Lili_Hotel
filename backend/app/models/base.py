"""
基礎模型類
"""
from sqlalchemy import Column, BigInteger, DateTime
from sqlalchemy.ext.declarative import declared_attr
from app.database import Base as SQLAlchemyBase
from app.core.timezone import now_utc as _now_utc  # 單一來源，避免兩份同義實作分叉


class Base(SQLAlchemyBase):
    """所有模型的基類"""

    __abstract__ = True

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主鍵ID")

    @declared_attr
    def created_at(cls):
        """創建時間（UTC）"""
        return Column(DateTime, default=_now_utc, nullable=False, comment="創建時間")

    @declared_attr
    def updated_at(cls):
        """更新時間（UTC）"""
        return Column(
            DateTime,
            default=_now_utc,
            onupdate=_now_utc,
            comment="更新時間",
        )
