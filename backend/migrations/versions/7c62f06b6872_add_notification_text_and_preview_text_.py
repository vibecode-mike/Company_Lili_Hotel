"""add_notification_text_and_preview_text_to_messages

Revision ID: 7c62f06b6872
Revises: e4766837c13a
Create Date: 2025-11-13 17:45:50.741487

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c62f06b6872'
down_revision: Union[str, None] = 'e4766837c13a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加 notification_text 欄位（通知推播文字）
    op.execute('ALTER TABLE messages ADD COLUMN notification_text VARCHAR(200) COMMENT "通知推播文字（顯示在手機通知欄）"')

    # 添加 preview_text 欄位（通知預覽文字）
    op.execute('ALTER TABLE messages ADD COLUMN preview_text VARCHAR(200) COMMENT "通知預覽文字（用於預覽顯示）"')


def downgrade() -> None:
    # 回滾：刪除新增的欄位
    op.execute('ALTER TABLE messages DROP COLUMN preview_text')
    op.execute('ALTER TABLE messages DROP COLUMN notification_text')
