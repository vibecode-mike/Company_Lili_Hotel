"""remove_message_records_table

Revision ID: 97c1b3771116
Revises: db0c6e876c08
Create Date: 2025-11-22 22:32:11.075565

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97c1b3771116'
down_revision: Union[str, None] = 'db0c6e876c08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """移除 message_records 表（已由 conversation_messages 取代）"""
    op.drop_table('message_records')


def downgrade() -> None:
    """恢復 message_records 表結構（僅結構，不包含資料）"""
    op.create_table(
        'message_records',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('member_id', sa.BigInteger(), nullable=False),
        sa.Column('message_content', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(length=20), nullable=False),
        sa.Column('message_status', sa.String(length=20), nullable=True),
        sa.Column('send_time', sa.Time(), nullable=True),
        sa.Column('message_source', sa.String(length=50), nullable=True),
        sa.Column('conversation_date', sa.Date(), nullable=True),
        sa.Column('scheduled_send', sa.Boolean(), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=True),
        sa.Column('scheduled_time', sa.Time(), nullable=True),
        sa.Column('direction', sa.String(length=20), nullable=True),
        sa.Column('campaign_id', sa.BigInteger(), nullable=True),
        sa.Column('sender_type', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['campaign_id'], ['messages.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_message_records_member_id', 'message_records', ['member_id'])
