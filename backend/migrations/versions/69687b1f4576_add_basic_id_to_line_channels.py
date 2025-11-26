"""add_basic_id_to_line_channels

Revision ID: 69687b1f4576
Revises: 5b26a1084eda
Create Date: 2025-11-25 15:15:15.855630

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69687b1f4576'
down_revision: Union[str, None] = '5b26a1084eda'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增 basic_id 欄位到 line_channels 表
    op.add_column('line_channels',
        sa.Column('basic_id', sa.String(100), nullable=True,
                  comment='LINE Bot Basic ID (format: @xxxxxxx)'))


def downgrade() -> None:
    # 回滾時移除 basic_id 欄位
    op.drop_column('line_channels', 'basic_id')
