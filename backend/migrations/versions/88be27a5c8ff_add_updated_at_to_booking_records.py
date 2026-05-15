"""add_updated_at_to_booking_records

Revision ID: 88be27a5c8ff
Revises: 0d71d1b59ca7
Create Date: 2026-05-15 16:51:10.786876

加 booking_records.updated_at 欄位，對齊 Base 繼承的 model 設計。

歷史脈絡：
- BookingRecord(Base) 繼承自 Base 的 updated_at（@declared_attr 定義）
- 但原始 create_table（933134539669_add_bookings_table 之後系列）沒帶這欄
- 結果 model 期望這欄、DB 沒有 → alembic check 報 added_column drift

本 migration：
- op.add_column 加上欄位（nullable + 預設 NULL，跟其他 Base 子類同步）
- 既有 2 筆 booking_records 用 NOW() backfill（避免 NULL 看起來奇怪）
- 之後 SQLAlchemy ORM 透過 Base 的 onupdate=_now_taipei 自動填值

風險：零。純加欄位，不影響既有 ORM / raw SQL 行為。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88be27a5c8ff'
down_revision: Union[str, None] = '0d71d1b59ca7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 加 updated_at 欄位
    op.add_column(
        'booking_records',
        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=True,
            comment='更新時間',
        ),
    )
    # 2. 既有 row backfill 為當前時間
    op.execute(
        "UPDATE booking_records SET updated_at = NOW() WHERE updated_at IS NULL"
    )


def downgrade() -> None:
    op.drop_column('booking_records', 'updated_at')
