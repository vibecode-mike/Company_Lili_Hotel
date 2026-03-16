"""merge question/response columns into content

Revision ID: 003
Revises: 002
Create Date: 2026-03-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add content column
    op.add_column('conversation_messages', sa.Column('content', sa.Text(), nullable=True, comment='訊息內容'))

    # 2. Merge data: content = COALESCE(question, response)
    op.execute("UPDATE conversation_messages SET content = COALESCE(question, response)")

    # 3. Drop old columns
    op.drop_column('conversation_messages', 'question')
    op.drop_column('conversation_messages', 'response')


def downgrade() -> None:
    # 1. Re-add question and response columns
    op.add_column('conversation_messages', sa.Column('question', sa.Text(), nullable=True, comment='問題內容'))
    op.add_column('conversation_messages', sa.Column('response', sa.Text(), nullable=True, comment='回應內容'))

    # 2. Split content back based on direction
    op.execute("UPDATE conversation_messages SET question = content WHERE direction = 'incoming'")
    op.execute("UPDATE conversation_messages SET response = content WHERE direction = 'outgoing'")

    # 3. Drop content column
    op.drop_column('conversation_messages', 'content')
