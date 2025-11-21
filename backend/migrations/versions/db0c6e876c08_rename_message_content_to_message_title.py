"""rename_message_content_to_message_title

Revision ID: db0c6e876c08
Revises: 1f9c8e7c2c2a
Create Date: 2025-11-21 18:44:51.869397

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'db0c6e876c08'
down_revision: Union[str, None] = '1f9c8e7c2c2a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 重命名 messages 表的 message_content 欄位為 message_title
    op.alter_column('messages', 'message_content',
                    new_column_name='message_title',
                    existing_type=sa.String(500),
                    existing_nullable=True)


def downgrade() -> None:
    # 回滾：將 message_title 改回 message_content
    op.alter_column('messages', 'message_title',
                    new_column_name='message_content',
                    existing_type=sa.String(500),
                    existing_nullable=True)
