"""drop faq_rule_versions table

Revision ID: 48f00ef7ab3d
Revises: 006
Create Date: 2026-03-18 11:23:57.506290

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '48f00ef7ab3d'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('faq_rule_versions')


def downgrade() -> None:
    op.create_table(
        'faq_rule_versions',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('rule_id', sa.BigInteger(), nullable=False),
        sa.Column('content_json', sa.Text(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False, default=1),
        sa.Column('snapshot_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['rule_id'], ['faq_rules.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_faq_rule_versions_rule_id', 'faq_rule_versions', ['rule_id'])
    op.create_index('ix_faq_rule_versions_rule_version', 'faq_rule_versions', ['rule_id', 'version_number'])
