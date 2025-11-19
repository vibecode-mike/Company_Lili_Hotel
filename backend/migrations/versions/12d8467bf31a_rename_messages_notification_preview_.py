"""rename_messages_notification_preview_fields

Revision ID: 12d8467bf31a
Revises: ca22bd4ae94d
Create Date: 2025-11-19 16:22:22.051523

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12d8467bf31a'
down_revision: Union[str, None] = 'ca22bd4ae94d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 重命名 messages 表的欄位
    op.alter_column('messages', 'notification_text',
                    new_column_name='notification_message',
                    existing_type=sa.String(200),
                    existing_nullable=True,
                    existing_comment='通知推播訊息（顯示在手機通知欄）')

    op.alter_column('messages', 'preview_text',
                    new_column_name='preview_message',
                    existing_type=sa.String(200),
                    existing_nullable=True,
                    existing_comment='聊天室預覽訊息（用於預覽顯示）')


def downgrade() -> None:
    # 還原欄位名稱
    op.alter_column('messages', 'notification_message',
                    new_column_name='notification_text',
                    existing_type=sa.String(200),
                    existing_nullable=True,
                    existing_comment='通知推播文字（顯示在手機通知欄）')

    op.alter_column('messages', 'preview_message',
                    new_column_name='preview_text',
                    existing_type=sa.String(200),
                    existing_nullable=True,
                    existing_comment='通知預覽文字（用於預覽顯示）')
