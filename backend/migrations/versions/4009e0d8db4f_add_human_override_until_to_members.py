"""add human_override_until to members

Revision ID: 4009e0d8db4f
Revises: 48f00ef7ab3d
Create Date: 2026-03-23 17:52:59.672365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '4009e0d8db4f'
down_revision: Union[str, None] = '48f00ef7ab3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('members', sa.Column('human_override_until', sa.DateTime(), nullable=True, comment='人工接管到期時間（UTC），非 NULL 且未過期時抑制所有自動回應'))


def downgrade() -> None:
    op.drop_column('members', 'human_override_until')
