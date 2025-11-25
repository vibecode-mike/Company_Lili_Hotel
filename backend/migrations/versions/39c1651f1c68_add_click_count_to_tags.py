"""add_click_count_to_tags

Revision ID: 39c1651f1c68
Revises: eb962a42ab7a
Create Date: 2025-11-23 00:21:07.199426

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39c1651f1c68'
down_revision: Union[str, None] = 'eb962a42ab7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 為 member_tags 表新增 click_count 欄位
    op.add_column('member_tags', sa.Column('click_count', sa.Integer(), nullable=False, server_default='1', comment='點擊次數，>= 1。預設值：1（首次點擊）。重複點擊同一組合時執行 UPDATE click_count = click_count + 1，累計點擊次數不去重'))

    # 為 member_interaction_tags 表新增 click_count 欄位
    op.add_column('member_interaction_tags', sa.Column('click_count', sa.Integer(), nullable=False, server_default='1', comment='點擊次數，>= 1。預設值：1（首次點擊）。手動標籤此欄位固定為 1，不累加'))


def downgrade() -> None:
    # 移除 member_interaction_tags 表的 click_count 欄位
    op.drop_column('member_interaction_tags', 'click_count')

    # 移除 member_tags 表的 click_count 欄位
    op.drop_column('member_tags', 'click_count')
