"""add_click_tracking_fields_to_carousel_items

Revision ID: e2e22070be00
Revises: a1b2c3d4e5f6
Create Date: 2025-10-28 18:34:01.528784

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2e22070be00'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加點擊追蹤統計欄位
    op.add_column('template_carousel_items', sa.Column('click_count', sa.Integer(), nullable=True, comment='點擊次數'))
    op.add_column('template_carousel_items', sa.Column('unique_click_count', sa.Integer(), nullable=True, comment='唯一點擊次數'))
    op.add_column('template_carousel_items', sa.Column('last_clicked_at', sa.DateTime(), nullable=True, comment='最後點擊時間'))

    # 設置默認值為 0
    op.execute('UPDATE template_carousel_items SET click_count = 0 WHERE click_count IS NULL')
    op.execute('UPDATE template_carousel_items SET unique_click_count = 0 WHERE unique_click_count IS NULL')


def downgrade() -> None:
    # 移除點擊追蹤統計欄位
    op.drop_column('template_carousel_items', 'last_clicked_at')
    op.drop_column('template_carousel_items', 'unique_click_count')
    op.drop_column('template_carousel_items', 'click_count')
