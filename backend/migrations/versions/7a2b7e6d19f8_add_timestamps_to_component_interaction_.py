"""add_timestamps_to_component_interaction_logs

Revision ID: 7a2b7e6d19f8
Revises: 3fb1ed14fdbd
Create Date: 2025-10-27 17:57:03.257819

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a2b7e6d19f8'
down_revision: Union[str, None] = '3fb1ed14fdbd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add created_at and updated_at columns
    op.add_column('component_interaction_logs',
                  sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    op.add_column('component_interaction_logs',
                  sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')))


def downgrade() -> None:
    # Remove created_at and updated_at columns
    op.drop_column('component_interaction_logs', 'updated_at')
    op.drop_column('component_interaction_logs', 'created_at')
