"""add_bookings_table

Revision ID: 933134539669
Revises: 88b579277dbb
Create Date: 2026-04-21 16:00:00.000000

目的：為「完成訂單」KPI（數據洞察頁）新增 bookings 表
     閎運 callback status=paid 時寫入，order_id 當主鍵去重
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '933134539669'
down_revision: Union[str, None] = '88b579277dbb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'bookings',
        sa.Column('order_id', sa.String(64), primary_key=True, comment='閎運訂單編號，去重用'),
        sa.Column('line_uid', sa.String(100), nullable=True, comment='LINE 使用者 UID'),
        sa.Column('member_id', sa.BigInteger(), sa.ForeignKey('members.id', ondelete='SET NULL'),
                  nullable=True, comment='關聯會員 ID（lookup 失敗可為 NULL）'),
        sa.Column('checkin_date', sa.Date(), nullable=True, comment='入住日期'),
        sa.Column('rooms', sa.JSON(), nullable=True,
                  comment='訂房房型清單，格式：[{"roomtype": "WS", "quantity": 1}, ...]'),
        sa.Column('source', sa.String(20), nullable=False, server_default='LINE',
                  comment='訂房來源：LINE / Webchat / FB'),
        sa.Column('paid_at', sa.DateTime(), nullable=True, comment='付款完成時間（callback 抵達時刻）'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False,
                  comment='資料庫建立時間（台灣時間）'),
    )
    op.create_index('ix_bookings_paid_at', 'bookings', ['paid_at'])
    op.create_index('ix_bookings_line_uid', 'bookings', ['line_uid'])
    op.create_index('ix_bookings_member_id', 'bookings', ['member_id'])


def downgrade() -> None:
    op.drop_index('ix_bookings_member_id', table_name='bookings')
    op.drop_index('ix_bookings_line_uid', table_name='bookings')
    op.drop_index('ix_bookings_paid_at', table_name='bookings')
    op.drop_table('bookings')
