"""add_sent_by_to_conversation_messages

Revision ID: 766304391543
Revises: fa40436b732e
Create Date: 2026-01-12 13:18:47.823720

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '766304391543'
down_revision: Union[str, None] = 'fa40436b732e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增 sent_by 欄位到 conversation_messages 表
    op.add_column(
        'conversation_messages',
        sa.Column(
            'sent_by',
            sa.BigInteger(),
            nullable=True,
            comment='發送人員ID（僅 manual 訊息有值）'
        )
    )
    # 新增外鍵約束
    op.create_foreign_key(
        'fk_conversation_messages_sent_by_users',
        'conversation_messages',
        'users',
        ['sent_by'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # 移除外鍵約束
    op.drop_constraint(
        'fk_conversation_messages_sent_by_users',
        'conversation_messages',
        type_='foreignkey'
    )
    # 移除欄位
    op.drop_column('conversation_messages', 'sent_by')
