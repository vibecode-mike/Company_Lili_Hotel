"""rename_notification_preview_fields

Revision ID: ca22bd4ae94d
Revises: f8d00d8d42ed
Create Date: 2025-11-19 16:19:13.433339

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca22bd4ae94d'
down_revision: Union[str, None] = 'f8d00d8d42ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 重命名 message_templates 表的欄位
    op.alter_column('message_templates', 'notification_text',
                    new_column_name='notification_message',
                    existing_type=sa.String(100),
                    existing_nullable=True,
                    existing_comment='通知推播訊息')

    op.alter_column('message_templates', 'preview_text',
                    new_column_name='preview_message',
                    existing_type=sa.String(100),
                    existing_nullable=True,
                    existing_comment='聊天室預覽訊息')


def downgrade() -> None:
    # 還原欄位名稱
    op.alter_column('message_templates', 'notification_message',
                    new_column_name='notification_text',
                    existing_type=sa.String(100),
                    existing_nullable=True,
                    existing_comment='通知訊息')

    op.alter_column('message_templates', 'preview_message',
                    new_column_name='preview_text',
                    existing_type=sa.String(100),
                    existing_nullable=True,
                    existing_comment='訊息預覽')
