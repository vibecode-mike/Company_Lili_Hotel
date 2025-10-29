"""remove_archived_status_from_surveys

Revision ID: b3336667cde9
Revises: f996ad815656
Create Date: 2025-10-17 14:02:25.570279

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3336667cde9'
down_revision: Union[str, None] = 'f996ad815656'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 檢查是否有 ARCHIVED 狀態的資料,如果有則更新為 PUBLISHED
    op.execute(
        "UPDATE surveys SET status = 'published' WHERE status = 'archived'"
    )

    # 2. 更新 status 枚舉類型,移除 'archived' 值
    # MySQL ENUM: 需要使用 ALTER TABLE MODIFY COLUMN
    op.execute(
        "ALTER TABLE surveys MODIFY COLUMN status "
        "ENUM('draft', 'scheduled', 'published') NOT NULL COMMENT '狀態'"
    )


def downgrade() -> None:
    # 恢復 ARCHIVED 狀態
    op.execute(
        "ALTER TABLE surveys MODIFY COLUMN status "
        "ENUM('draft', 'scheduled', 'published', 'archived') NOT NULL COMMENT '狀態'"
    )
