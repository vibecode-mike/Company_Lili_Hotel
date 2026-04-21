"""add_unanswered_to_conversation_messages

Revision ID: 88b579277dbb
Revises: 41bea5032f95
Create Date: 2026-04-21 10:00:00.000000

目的：為 AI 覆蓋率（數據洞察頁）新增 unanswered 旗標
      當 AI 呼叫 mark_unanswerable tool 表示無法回答時，設為 True
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88b579277dbb'
down_revision: Union[str, None] = '41bea5032f95'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """新增 unanswered 欄位與索引"""
    op.add_column(
        'conversation_messages',
        sa.Column(
            'unanswered',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
            comment='AI 是否答不出此訊息（mark_unanswerable tool 標記），僅 message_source=gpt 時有意義',
        ),
    )
    op.create_index(
        'ix_conversation_messages_unanswered_created',
        'conversation_messages',
        ['unanswered', 'created_at'],
    )


def downgrade() -> None:
    """移除 unanswered 欄位與索引"""
    op.drop_index('ix_conversation_messages_unanswered_created', table_name='conversation_messages')
    op.drop_column('conversation_messages', 'unanswered')
