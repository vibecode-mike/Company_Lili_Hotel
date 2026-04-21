"""remove booking_children from chatbot_sessions

Revision ID: 41bea5032f95
Revises: 4009e0d8db4f
Create Date: 2026-04-14 19:06:58.803902

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '41bea5032f95'
down_revision: Union[str, None] = '4009e0d8db4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('chatbot_sessions', 'booking_children')


def downgrade() -> None:
    op.add_column('chatbot_sessions', sa.Column('booking_children', sa.SmallInteger(), nullable=False, server_default='0', comment='入住小孩數'))
