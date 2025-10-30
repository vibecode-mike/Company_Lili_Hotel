"""add_unique_constraint_ryan_click_demo_only

Revision ID: f80f60a69caa
Revises: 12b6db2cff7c
Create Date: 2025-10-30 13:35:31.711743

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f80f60a69caa'
down_revision: Union[str, None] = '12b6db2cff7c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 檢查並刪除舊的非唯一索引（如果存在）
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    indexes = inspector.get_indexes('ryan_click_demo')

    # 刪除舊的 uniq_user_campaign 索引（如果存在）
    for index in indexes:
        if index['name'] == 'uniq_user_campaign':
            op.drop_index('uniq_user_campaign', table_name='ryan_click_demo')
            break

    # 添加唯一性約束
    op.create_unique_constraint(
        'uq_line_source_campaign',
        'ryan_click_demo',
        ['line_id', 'source_campaign_id']
    )


def downgrade() -> None:
    # 刪除唯一性約束
    op.drop_constraint('uq_line_source_campaign', 'ryan_click_demo', type_='unique')

    # 恢復舊的索引
    op.create_index('uniq_user_campaign', 'ryan_click_demo', ['line_id', 'source_campaign_id'], unique=False)
