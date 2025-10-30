"""add_index_to_ryan_click_demo_source_campaign_id

Revision ID: 12b6db2cff7c
Revises: aebeda49df69
Create Date: 2025-10-29 23:05:04.697491

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12b6db2cff7c'
down_revision: Union[str, None] = 'aebeda49df69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add index on source_campaign_id for efficient GROUP BY queries
    op.create_index(
        'idx_source_campaign_id',
        'ryan_click_demo',
        ['source_campaign_id'],
        unique=False
    )


def downgrade() -> None:
    # Remove the index
    op.drop_index('idx_source_campaign_id', table_name='ryan_click_demo')
