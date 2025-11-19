"""remove_click_count_from_messages

Revision ID: dcbae3a2bbce
Revises: 485cd5cdd0ce
Create Date: 2025-11-18 18:41:46.740589

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dcbae3a2bbce'
down_revision: Union[str, None] = '485cd5cdd0ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 刪除 messages 表的 click_count 欄位
    op.drop_column('messages', 'click_count')


def downgrade() -> None:
    # 重新創建 click_count 欄位（如需回滾）
    op.add_column('messages',
        sa.Column('click_count', sa.Integer(), nullable=True, default=0, comment='點擊次數（不重複）')
    )
