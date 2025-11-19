"""add_last_click_tag_to_click_tracking_demo

Revision ID: 8d3ee2588544
Revises: dcbae3a2bbce
Create Date: 2025-11-18 20:26:07.703755

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d3ee2588544'
down_revision: Union[str, None] = 'dcbae3a2bbce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加 last_click_tag 字段到 click_tracking_demo 表
    op.add_column('click_tracking_demo',
                  sa.Column('last_click_tag', sa.Text(), nullable=True))

    # 添加索引以提高查询性能
    op.create_index('idx_line_source_campaign',
                    'click_tracking_demo',
                    ['line_id', 'source_campaign_id'])


def downgrade() -> None:
    # 删除索引
    op.drop_index('idx_line_source_campaign', 'click_tracking_demo')

    # 删除字段
    op.drop_column('click_tracking_demo', 'last_click_tag')
