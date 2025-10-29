"""add_tag_tracking_fields

Revision ID: 6b106e4b3eac
Revises: ce6cdeb6c784
Create Date: 2025-10-16 18:11:38.144541

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b106e4b3eac'
down_revision: Union[str, None] = 'ce6cdeb6c784'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add last_triggered_at to member_tags
    op.add_column('member_tags', sa.Column('last_triggered_at', sa.DateTime(), nullable=True, comment='最後觸發時間'))

    # Add last_triggered_at and member_count to interaction_tags
    op.add_column('interaction_tags', sa.Column('last_triggered_at', sa.DateTime(), nullable=True, comment='最後觸發時間'))
    op.add_column('interaction_tags', sa.Column('member_count', sa.Integer(), server_default='0', nullable=False, comment='觸發會員數'))


def downgrade() -> None:
    # Remove columns from interaction_tags
    op.drop_column('interaction_tags', 'member_count')
    op.drop_column('interaction_tags', 'last_triggered_at')

    # Remove column from member_tags
    op.drop_column('member_tags', 'last_triggered_at')
