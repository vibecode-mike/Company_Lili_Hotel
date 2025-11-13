"""create_all_missing_tables

Revision ID: a80107455d2f
Revises: 1c225ce3e68a
Create Date: 2025-11-13 13:16:43.217460

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a80107455d2f'
down_revision: Union[str, None] = '1c225ce3e68a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    建立缺少的資料表：auto_response_keywords（如果不存在）

    注意：其他表（admins, roles, permissions, line_oa_configs 等）
    已由先前的 migration (25ed166f31de) 建立
    """

    # 檢查表是否存在
    from sqlalchemy import inspect
    from alembic import context

    conn = context.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    # 只有在表不存在時才建立
    if 'auto_response_keywords' not in existing_tables:
        # 建立 auto_response_keywords 表
        op.create_table(
            'auto_response_keywords',
            sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('response_id', sa.BigInteger(), nullable=False, comment='所屬自動回應'),
            sa.Column('keyword_text', sa.String(length=50), nullable=False, comment='關鍵字文字，不區分大小寫'),
            sa.Column('match_type', sa.String(length=20), nullable=False, comment='比對類型：包含匹配/完全匹配'),
            sa.Column('is_enabled', sa.Boolean(), server_default='1', nullable=False, comment='是否啟用'),
            sa.Column('trigger_count', sa.Integer(), server_default='0', nullable=False, comment='觸發次數'),
            sa.Column('last_triggered_at', sa.DateTime(), nullable=True, comment='最近觸發時間'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True, comment='建立時間'),
            sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
            sa.ForeignKeyConstraint(['response_id'], ['auto_responses.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('response_id', 'keyword_text', name='uq_response_keyword'),
            comment='自動回應關鍵字表'
        )

        # 建立索引
        op.create_index(
            op.f('ix_auto_response_keywords_response_id'),
            'auto_response_keywords',
            ['response_id'],
            unique=False
        )


def downgrade() -> None:
    """
    移除 auto_response_keywords 表
    """
    op.drop_index(op.f('ix_auto_response_keywords_response_id'), table_name='auto_response_keywords')
    op.drop_table('auto_response_keywords')
