"""
基礎模型類
"""
from datetime import datetime
from sqlalchemy import Column, BigInteger, DateTime
from sqlalchemy.ext.declarative import declared_attr
from app.database import Base as SQLAlchemyBase


class Base(SQLAlchemyBase):
    """所有模型的基類"""

    __abstract__ = True

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主鍵ID")

    @declared_attr
    def created_at(cls):
        """創建時間"""
        return Column(DateTime, default=datetime.utcnow, nullable=False, comment="創建時間")

    @declared_attr
    def updated_at(cls):
        """更新時間"""
        return Column(
            DateTime,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
            comment="更新時間",
        )
