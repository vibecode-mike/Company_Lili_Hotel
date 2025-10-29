"""add_survey_scheduled_status_and_sent_at

Revision ID: f996ad815656
Revises: 6b106e4b3eac
Create Date: 2025-10-17 13:54:21.909677

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f996ad815656'
down_revision: Union[str, None] = '6b106e4b3eac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 新增 sent_at 欄位 (如果不存在)
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('surveys')]

    if 'sent_at' not in columns:
        op.add_column('surveys',
            sa.Column('sent_at', sa.DateTime(), nullable=True, comment='實際發送時間')
        )

    # 2. 更新 status 枚舉類型,新增 'scheduled' 值
    # MySQL ENUM: 需要使用 ALTER TABLE MODIFY COLUMN
    op.execute(
        "ALTER TABLE surveys MODIFY COLUMN status "
        "ENUM('draft', 'scheduled', 'published', 'archived') NOT NULL COMMENT '狀態'"
    )


def downgrade() -> None:
    # 1. 移除 sent_at 欄位
    op.drop_column('surveys', 'sent_at')

    # 注意: PostgreSQL 不支援直接刪除枚舉值
    # 如需完整回退,需要重建整個枚舉類型和相關欄位
    # 這裡僅移除新增的欄位,保留 'scheduled' 枚舉值
