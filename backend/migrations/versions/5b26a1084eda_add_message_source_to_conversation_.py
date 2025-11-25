"""add message_source to conversation_messages

Revision ID: 5b26a1084eda
Revises: 39c1651f1c68
Create Date: 2025-11-25 02:32:11.622187

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b26a1084eda'
down_revision: Union[str, None] = '39c1651f1c68'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增 message_source 欄位
    op.add_column('conversation_messages',
        sa.Column('message_source', sa.String(20), nullable=True,
                  comment='訊息來源：manual|gpt|keyword|welcome|always'))

    # 更新現有資料（根據現有欄位推測來源）
    op.execute("""
        UPDATE conversation_messages
        SET message_source = CASE
            WHEN direction = 'incoming' THEN NULL
            WHEN direction = 'outgoing' AND message_type = 'text' THEN 'manual'
            WHEN direction = 'outgoing' AND message_type = 'chat' THEN 'gpt'
            ELSE NULL
        END
        WHERE message_source IS NULL
    """)


def downgrade() -> None:
    op.drop_column('conversation_messages', 'message_source')
