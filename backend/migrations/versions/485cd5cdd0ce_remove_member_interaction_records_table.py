"""remove_member_interaction_records_table

Revision ID: 485cd5cdd0ce
Revises: c6c141f82b63
Create Date: 2025-11-18 18:26:58.780078

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '485cd5cdd0ce'
down_revision: Union[str, None] = 'c6c141f82b63'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 刪除 member_interaction_records 表
    op.drop_table('member_interaction_records')


def downgrade() -> None:
    # 重新創建 member_interaction_records 表（如需回滾）
    op.create_table(
        'member_interaction_records',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('member_id', sa.BigInteger(), nullable=False),
        sa.Column('tag_id', sa.BigInteger(), nullable=False),
        sa.Column('message_id', sa.BigInteger(), nullable=True),
        sa.Column('triggered_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['interaction_tags.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('member_id', 'tag_id', 'message_id', name='uq_member_tag_msg_interaction'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('ix_member_interaction_records_member_id', 'member_interaction_records', ['member_id'])
    op.create_index('ix_member_interaction_records_tag_id', 'member_interaction_records', ['tag_id'])
    op.create_index('ix_member_interaction_records_message_id', 'member_interaction_records', ['message_id'])
