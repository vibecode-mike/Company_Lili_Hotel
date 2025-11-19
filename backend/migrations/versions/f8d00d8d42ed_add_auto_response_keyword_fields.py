"""add_auto_response_keyword_fields

Revision ID: f8d00d8d42ed
Revises: c418bae351e3
Create Date: 2025-11-19 15:07:11.892078

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8d00d8d42ed'
down_revision: Union[str, None] = 'c418bae351e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增 auto_response_keywords 表的欄位
    op.add_column('auto_response_keywords',
                  sa.Column('match_type', sa.String(20), server_default='exact', nullable=False,
                           comment='比對類型：exact（完全匹配）'))
    op.add_column('auto_response_keywords',
                  sa.Column('is_enabled', sa.Boolean(), server_default='1', nullable=False,
                           comment='是否啟用此關鍵字'))
    op.add_column('auto_response_keywords',
                  sa.Column('last_triggered_at', sa.DateTime(), nullable=True,
                           comment='最近觸發時間'))

    # 建立索引優化查詢效能
    op.create_index('idx_auto_response_trigger',
                    'auto_responses',
                    ['trigger_type', 'is_active', 'created_at'])
    op.create_index('idx_keyword_enabled',
                    'auto_response_keywords',
                    ['auto_response_id', 'is_enabled'])


def downgrade() -> None:
    # 刪除索引
    op.drop_index('idx_keyword_enabled', 'auto_response_keywords')
    op.drop_index('idx_auto_response_trigger', 'auto_responses')

    # 刪除欄位
    op.drop_column('auto_response_keywords', 'last_triggered_at')
    op.drop_column('auto_response_keywords', 'is_enabled')
    op.drop_column('auto_response_keywords', 'match_type')
