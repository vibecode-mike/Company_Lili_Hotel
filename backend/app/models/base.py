"""
基礎模型類
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, BigInteger, DateTime
from sqlalchemy.ext.declarative import declared_attr
from app.database import Base as SQLAlchemyBase

TAIPEI_TZ = timezone(timedelta(hours=8))


def _now_taipei():
    """取得台灣時間（UTC+8），不帶 tzinfo 以相容 MySQL DateTime"""
    return datetime.now(TAIPEI_TZ).replace(tzinfo=None)


class Base(SQLAlchemyBase):
    """所有模型的基類"""

    __abstract__ = True

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主鍵ID")

    @declared_attr
    def created_at(cls):
        """創建時間（台灣時間）"""
        return Column(DateTime, default=_now_taipei, nullable=False, comment="創建時間")

    @declared_attr
    def updated_at(cls):
        """更新時間（台灣時間）"""
        return Column(
            DateTime,
            default=_now_taipei,
            onupdate=_now_taipei,
            comment="更新時間",
        )
