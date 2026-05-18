"""drop 5 orphan columns (booking_records 3 + line_channels 2)

孤兒欄位清理（drift cleanup）：

booking_records:
  - children            (SMALLINT NOT NULL DEFAULT 0)  — 10 筆全 0，BookingRecord constructor 沒傳，PMS URL 參數不落地
  - pms_cart_id         (VARCHAR(200) NULL)            — 全 codebase 0 引用，10 筆全 NULL
  - pms_booking_url     (TEXT NULL)                    — 全 codebase 0 引用，10 筆全 NULL（被 cart_url 取代）

line_channels:
  - last_verified_at    (DATETIME NULL)                — FB 端 mirror 過來但 LINE 沒接，0 LINE-side 引用
  - connection_status   (VARCHAR(20) NOT NULL …)      — 同上；LINE token 是 long-lived，不需要定期驗證

注意：DROP 是 one-way，downgrade 只還原欄位結構，欄位值無法復原（已確認可接受）。

歷史插曲：
- 首次 push 在 staging 上炸 1091 Can't DROP 'children' check that column/key
  exists — staging DB 不知為何沒這些欄位（典型 dev-vs-staging schema 不同步）。
- Dev 端 alembic_version 已是 09056438428d、不會重跑；本次 amend 加上
  information_schema 預檢，讓 staging 重試時能跳過已不存在的欄位 →
  邏輯 idempotent（同 88be27a5c8ff fix 的模式）。

Revision ID: 09056438428d
Revises: a70b4cf1e0a3
Create Date: 2026-05-18 13:06:06.097558

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09056438428d'
down_revision: Union[str, None] = 'a70b4cf1e0a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    """檢查 table.column 是否存在於當前 DB（information_schema）。"""
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tbl
          AND COLUMN_NAME = :col
    """), {"tbl": table, "col": column}).scalar()
    return result > 0


def upgrade() -> None:
    # booking_records: 卸 3 欄（idempotent — 跳過已不存在的欄位）
    for col in ('children', 'pms_cart_id', 'pms_booking_url'):
        if _column_exists('booking_records', col):
            op.drop_column('booking_records', col)

    # line_channels: 卸 2 欄
    for col in ('last_verified_at', 'connection_status'):
        if _column_exists('line_channels', col):
            op.drop_column('line_channels', col)


def downgrade() -> None:
    # 還原結構（值無法復原），idempotent：只在欄位不存在時 add
    if not _column_exists('line_channels', 'connection_status'):
        op.add_column(
            'line_channels',
            sa.Column(
                'connection_status',
                sa.String(length=20),
                nullable=False,
                server_default='disconnected',
                comment='連結狀態: connected/expired/disconnected',
            ),
        )
    if not _column_exists('line_channels', 'last_verified_at'):
        op.add_column(
            'line_channels',
            sa.Column(
                'last_verified_at',
                sa.DateTime(),
                nullable=True,
                comment='最後驗證時間',
            ),
        )

    if not _column_exists('booking_records', 'pms_booking_url'):
        op.add_column(
            'booking_records',
            sa.Column(
                'pms_booking_url',
                sa.Text(),
                nullable=True,
                comment='PMS 購物車 URL',
            ),
        )
    if not _column_exists('booking_records', 'pms_cart_id'):
        op.add_column(
            'booking_records',
            sa.Column(
                'pms_cart_id',
                sa.String(length=200),
                nullable=True,
                comment='PMS 端回傳的購物車 ID',
            ),
        )
    if not _column_exists('booking_records', 'children'):
        op.add_column(
            'booking_records',
            sa.Column(
                'children',
                sa.SmallInteger(),
                nullable=False,
                server_default='0',
                comment='小孩數',
            ),
        )
