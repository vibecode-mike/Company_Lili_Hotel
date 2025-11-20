"""remove_preview_message_columns

Revision ID: 1c0f68649016
Revises: e5fbd73c2ab2
Create Date: 2025-11-21 01:59:17.892883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c0f68649016'
down_revision: Union[str, None] = 'e5fbd73c2ab2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove preview_message column from messages table
    op.drop_column('messages', 'preview_message')

    # Remove preview_message column from message_templates table
    op.drop_column('message_templates', 'preview_message')


def downgrade() -> None:
    # Add back preview_message column to messages table
    op.add_column('messages',
        sa.Column('preview_message', sa.String(length=200), nullable=True, comment='聊天室預覽訊息（用於預覽顯示）')
    )

    # Add back preview_message column to message_templates table
    op.add_column('message_templates',
        sa.Column('preview_message', sa.String(length=100), nullable=True, comment='聊天室預覽訊息')
    )
