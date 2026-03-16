"""add_data_source_type_to_faq_categories

Revision ID: 005
Revises: 004
Create Date: 2026-03-13 00:38:08.770269

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('faq_categories', sa.Column(
        'data_source_type',
        sa.String(length=20),
        nullable=False,
        server_default='custom_faq',
        comment='資料來源類型：pms（PMS 串接）、custom_faq（自訂 FAQ）',
    ))


def downgrade() -> None:
    op.drop_column('faq_categories', 'data_source_type')
