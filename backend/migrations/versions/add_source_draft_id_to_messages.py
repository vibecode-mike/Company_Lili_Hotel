"""add_source_draft_id_to_messages

Revision ID: a1b2c3d4e5f7
Revises: 69687b1f4576
Create Date: 2025-11-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, None] = '69687b1f4576'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增 source_draft_id 欄位到 messages 表
    op.add_column('messages',
        sa.Column('source_draft_id', sa.BigInteger(), nullable=True,
                  comment='來源草稿ID（從草稿發布時記錄原始草稿）'))

    # 建立外鍵約束
    op.create_foreign_key(
        'fk_messages_source_draft_id',
        'messages', 'messages',
        ['source_draft_id'], ['id'],
        ondelete='SET NULL'
    )

    # 建立索引
    op.create_index('ix_messages_source_draft_id', 'messages', ['source_draft_id'])


def downgrade() -> None:
    # 回滾時移除索引
    op.drop_index('ix_messages_source_draft_id', table_name='messages')

    # 移除外鍵約束
    op.drop_constraint('fk_messages_source_draft_id', 'messages', type_='foreignkey')

    # 移除 source_draft_id 欄位
    op.drop_column('messages', 'source_draft_id')
