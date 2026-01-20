"""add_line_channel_id_to_members

Revision ID: bc93abf5b7fd
Revises: 5fd91b4abb6b
Create Date: 2026-01-21 00:21:09.669534

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc93abf5b7fd'
down_revision: Union[str, None] = '5fd91b4abb6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 加欄位
    op.add_column('members',
        sa.Column('line_channel_id', sa.String(100), nullable=True,
                  comment='LINE 官方 Channel ID，對應 line_channels.channel_id')
    )

    # 2. 建立索引
    op.create_index('idx_members_line_channel_id', 'members', ['line_channel_id'])

    # 3. 回填現有資料：將有 line_uid 的會員指派到目前啟用的 channel
    op.execute("""
        UPDATE members
        SET line_channel_id = (
            SELECT channel_id
            FROM line_channels
            WHERE is_active = 1
            LIMIT 1
        )
        WHERE line_uid IS NOT NULL
          AND line_channel_id IS NULL
    """)


def downgrade() -> None:
    op.drop_index('idx_members_line_channel_id', 'members')
    op.drop_column('members', 'line_channel_id')
