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


def upgrade() -> None:
    # booking_records: 卸 3 欄
    op.drop_column('booking_records', 'children')
    op.drop_column('booking_records', 'pms_cart_id')
    op.drop_column('booking_records', 'pms_booking_url')

    # line_channels: 卸 2 欄
    op.drop_column('line_channels', 'last_verified_at')
    op.drop_column('line_channels', 'connection_status')


def downgrade() -> None:
    # 還原結構（值無法復原）
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
    op.add_column(
        'line_channels',
        sa.Column(
            'last_verified_at',
            sa.DateTime(),
            nullable=True,
            comment='最後驗證時間',
        ),
    )

    op.add_column(
        'booking_records',
        sa.Column(
            'pms_booking_url',
            sa.Text(),
            nullable=True,
            comment='PMS 購物車 URL',
        ),
    )
    op.add_column(
        'booking_records',
        sa.Column(
            'pms_cart_id',
            sa.String(length=200),
            nullable=True,
            comment='PMS 端回傳的購物車 ID',
        ),
    )
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
