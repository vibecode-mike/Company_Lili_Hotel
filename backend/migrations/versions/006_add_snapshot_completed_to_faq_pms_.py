"""add_snapshot_completed_to_faq_pms_connections

Revision ID: 006
Revises: 005
Create Date: 2026-03-13 02:27:23.647048

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'faq_pms_connections',
        sa.Column(
            'snapshot_completed',
            sa.Boolean(),
            server_default='0',
            nullable=False,
            comment='PMS 快照是否已完成',
        ),
    )


def downgrade() -> None:
    op.drop_column('faq_pms_connections', 'snapshot_completed')
