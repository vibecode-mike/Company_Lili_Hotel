"""add flex_message_json to campaigns

Revision ID: flex_msg_001
Revises: f80f60a69caa
Create Date: 2025-11-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'flex_msg_001'
down_revision: Union[str, None] = 'f80f60a69caa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add flex_message_json column to campaigns table
    op.add_column(
        'campaigns',
        sa.Column(
            'flex_message_json',
            sa.Text(),
            nullable=True,
            comment='Flex Message JSON 內容'
        )
    )


def downgrade() -> None:
    # Remove flex_message_json column from campaigns table
    op.drop_column('campaigns', 'flex_message_json')
