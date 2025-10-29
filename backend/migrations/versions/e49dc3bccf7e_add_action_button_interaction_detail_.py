"""add action button interaction detail fields

Revision ID: e49dc3bccf7e
Revises: 738f0c51752d
Create Date: 2025-10-21 10:49:14.174925

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e49dc3bccf7e'
down_revision: Union[str, None] = '738f0c51752d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增動作按鈕互動詳細資料欄位到 template_carousel_items 表
    op.add_column('template_carousel_items', sa.Column('action_button_url', sa.String(500), nullable=True, comment='動作按鈕網址'))
    op.add_column('template_carousel_items', sa.Column('action_button_trigger_message', sa.Text(), nullable=True, comment='動作按鈕觸發訊息'))
    op.add_column('template_carousel_items', sa.Column('action_button_trigger_image_url', sa.String(500), nullable=True, comment='動作按鈕觸發圖片URL'))


def downgrade() -> None:
    # 移除動作按鈕互動詳細資料欄位
    op.drop_column('template_carousel_items', 'action_button_trigger_image_url')
    op.drop_column('template_carousel_items', 'action_button_trigger_message')
    op.drop_column('template_carousel_items', 'action_button_url')
