"""add_image_click_fields_to_carousel_items

Revision ID: ee18a4b408e9
Revises: e49dc3bccf7e
Create Date: 2025-10-22 19:38:04.411048

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee18a4b408e9'
down_revision: Union[str, None] = 'e49dc3bccf7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增圖片點擊型相關欄位到 template_carousel_items 表
    op.add_column('template_carousel_items', sa.Column('image_aspect_ratio', sa.String(10), nullable=False, server_default='1:1', comment='圖片長寬比例'))
    op.add_column('template_carousel_items', sa.Column('image_click_action_type', sa.String(50), nullable=False, server_default='open_image', comment='圖片點擊動作類型'))
    op.add_column('template_carousel_items', sa.Column('image_click_action_value', sa.Text(), nullable=True, comment='圖片點擊動作值'))


def downgrade() -> None:
    # 移除圖片點擊型相關欄位
    op.drop_column('template_carousel_items', 'image_click_action_value')
    op.drop_column('template_carousel_items', 'image_click_action_type')
    op.drop_column('template_carousel_items', 'image_aspect_ratio')
