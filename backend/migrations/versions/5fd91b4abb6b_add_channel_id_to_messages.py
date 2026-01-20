"""add_channel_id_to_messages

Revision ID: 5fd91b4abb6b
Revises: 766304391543
Create Date: 2026-01-20 16:30:40.844147

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5fd91b4abb6b'
down_revision: Union[str, None] = '766304391543'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 只添加 channel_id 欄位
    op.add_column('messages', sa.Column('channel_id', sa.String(length=100), nullable=True, comment='渠道ID（LINE channel_id 或 FB page_id）'))


def downgrade() -> None:
    op.drop_column('messages', 'channel_id')
