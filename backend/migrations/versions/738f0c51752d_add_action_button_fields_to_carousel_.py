"""add_action_button_fields_to_carousel_items

Revision ID: 738f0c51752d
Revises: b3336667cde9
Create Date: 2025-10-21 02:22:19.238698

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '738f0c51752d'
down_revision: Union[str, None] = 'b3336667cde9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增動作按鈕相關欄位到 template_carousel_items 表
    op.add_column('template_carousel_items', sa.Column('action_button_text', sa.String(100), nullable=True, comment='動作按鈕文字'))
    op.add_column('template_carousel_items', sa.Column('action_button_enabled', sa.Boolean(), nullable=False, server_default='0', comment='動作按鈕啟用'))
    op.add_column('template_carousel_items', sa.Column('action_button_interaction_type', sa.String(50), nullable=True, comment='動作按鈕互動類型'))


def downgrade() -> None:
    # 移除動作按鈕相關欄位
    op.drop_column('template_carousel_items', 'action_button_interaction_type')
    op.drop_column('template_carousel_items', 'action_button_enabled')
    op.drop_column('template_carousel_items', 'action_button_text')
