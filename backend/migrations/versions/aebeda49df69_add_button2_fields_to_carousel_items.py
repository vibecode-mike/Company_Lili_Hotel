"""add_button2_fields_to_carousel_items

Revision ID: aebeda49df69
Revises: e2e22070be00
Create Date: 2025-10-29 01:55:32.286010

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aebeda49df69'
down_revision: Union[str, None] = 'e2e22070be00'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加第二個動作按鈕欄位
    op.add_column('template_carousel_items', sa.Column('action_button2_text', sa.String(length=100), nullable=True, comment='第二個動作按鈕文字'))
    op.add_column('template_carousel_items', sa.Column('action_button2_enabled', sa.Boolean(), nullable=True, server_default='0', comment='第二個動作按鈕啟用'))
    op.add_column('template_carousel_items', sa.Column('action_button2_interaction_type', sa.String(length=50), nullable=True, comment='第二個動作按鈕互動類型'))
    op.add_column('template_carousel_items', sa.Column('action_button2_url', sa.String(length=500), nullable=True, comment='第二個動作按鈕網址'))
    op.add_column('template_carousel_items', sa.Column('action_button2_trigger_message', sa.Text(), nullable=True, comment='第二個動作按鈕觸發訊息'))
    op.add_column('template_carousel_items', sa.Column('action_button2_trigger_image_url', sa.String(length=500), nullable=True, comment='第二個動作按鈕觸發圖片URL'))


def downgrade() -> None:
    # 移除第二個動作按鈕欄位
    op.drop_column('template_carousel_items', 'action_button2_trigger_image_url')
    op.drop_column('template_carousel_items', 'action_button2_trigger_message')
    op.drop_column('template_carousel_items', 'action_button2_url')
    op.drop_column('template_carousel_items', 'action_button2_interaction_type')
    op.drop_column('template_carousel_items', 'action_button2_enabled')
    op.drop_column('template_carousel_items', 'action_button2_text')
