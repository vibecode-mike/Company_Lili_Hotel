"""add_updated_at_to_booking_records

Revision ID: 88be27a5c8ff
Revises: 0d71d1b59ca7
Create Date: 2026-05-15 16:51:10.786876

加 booking_records.updated_at 欄位，對齊 Base 繼承的 model 設計。

歷史脈絡：
- BookingRecord(Base) 繼承自 Base 的 updated_at（@declared_attr 定義）
- 但原始 create_table（933134539669_add_bookings_table 之後系列）沒帶這欄
- 結果 model 期望這欄、DB 沒有 → alembic check 報 added_column drift

歷史插曲：
- 首次 push（commit 753b555f）在 staging 上炸了 1060 Duplicate column —
  staging DB 不知為何先有了 updated_at 欄位（疑似有人手動 ALTER 過、或
  歷史 migration 路徑不同）。Dev 端 alembic_version 已是 88be27a5c8ff，
  不會重跑；本次 amend 加上 information_schema 預檢，讓 staging 重試時
  能跳過 add_column → 邏輯 idempotent。

本 migration：
- 用 information_schema 預檢欄位存在；不存在才 op.add_column
- 不論欄位是新加還是早就在，backfill 仍是 NULL 的 row（safe no-op）
- 之後 SQLAlchemy ORM 透過 Base 的 onupdate=_now_taipei 自動填值

風險：零。純加欄位、idempotent，不影響既有 ORM / raw SQL 行為。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88be27a5c8ff'
down_revision: Union[str, None] = '0d71d1b59ca7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    """檢查 table.column 是否已存在於當前 DB（information_schema）。"""
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tbl
          AND COLUMN_NAME = :col
    """), {"tbl": table, "col": column}).scalar()
    return result > 0


def upgrade() -> None:
    # 1. 加 updated_at 欄位（idempotent — 跳過已存在的欄位）
    if not _column_exists('booking_records', 'updated_at'):
        op.add_column(
            'booking_records',
            sa.Column(
                'updated_at',
                sa.DateTime(),
                nullable=True,
                comment='更新時間',
            ),
        )
    # 2. Backfill NULL 的 row 為當前時間（safe no-op when nothing is NULL）
    op.execute(
        "UPDATE booking_records SET updated_at = NOW() WHERE updated_at IS NULL"
    )


def downgrade() -> None:
    # idempotent：只在欄位存在時 drop
    if _column_exists('booking_records', 'updated_at'):
        op.drop_column('booking_records', 'updated_at')
