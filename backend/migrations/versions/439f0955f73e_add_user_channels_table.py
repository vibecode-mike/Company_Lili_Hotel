"""add user_channels table

Revision ID: 439f0955f73e
Revises: 7534c432191a
Create Date: 2026-05-14 10:20:40.211655

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '439f0955f73e'
down_revision: Union[str, None] = '7534c432191a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_channels',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('user_id', sa.BigInteger(), nullable=False, comment='users.id'),
        sa.Column(
            'line_channel_id',
            sa.String(length=100),
            nullable=False,
            comment='line_channels.channel_id',
        ),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'line_channel_id', name='uq_user_channel'),
    )
    op.create_index('ix_user_channels_user_id', 'user_channels', ['user_id'])
    op.create_index('ix_user_channels_line_channel_id', 'user_channels', ['line_channel_id'])
    op.create_foreign_key(
        'fk_user_channels_user_id',
        'user_channels', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_user_channels_line_channel_id',
        'user_channels', 'line_channels',
        ['line_channel_id'], ['channel_id'],
        ondelete='CASCADE',
    )

    # Backfill: 把所有現存 LineChannel 加給所有現存 ADMIN role 的 user
    op.execute("""
        INSERT INTO user_channels (user_id, line_channel_id, created_at)
        SELECT u.id, lc.channel_id, NOW()
        FROM users u
        CROSS JOIN line_channels lc
        WHERE u.role = 'ADMIN'
          AND lc.channel_id IS NOT NULL
          AND lc.channel_id != ''
    """)


def downgrade() -> None:
    op.drop_constraint('fk_user_channels_line_channel_id', 'user_channels', type_='foreignkey')
    op.drop_constraint('fk_user_channels_user_id', 'user_channels', type_='foreignkey')
    op.drop_index('ix_user_channels_line_channel_id', table_name='user_channels')
    op.drop_index('ix_user_channels_user_id', table_name='user_channels')
    op.drop_table('user_channels')
