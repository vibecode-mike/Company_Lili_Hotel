"""merge heads

Revision ID: 17004499ac90
Revises: a1b2c3d4e5f7, sync_interaction_logs_001
Create Date: 2025-11-29 01:23:03.440993

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '17004499ac90'
down_revision: Union[str, None] = ('a1b2c3d4e5f7', 'sync_interaction_logs_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
