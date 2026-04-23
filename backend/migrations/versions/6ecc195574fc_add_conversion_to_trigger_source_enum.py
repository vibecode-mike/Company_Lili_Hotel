"""add_conversion_to_trigger_source_enum

Revision ID: 6ecc195574fc
Revises: 7810b55a4479
Create Date: 2026-04-22 18:01:13.413014

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ecc195574fc'
down_revision: Union[str, None] = '7810b55a4479'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 在現有 enum 後新增 'CONVERSION'，供「轉單」分類使用
    op.execute(
        "ALTER TABLE tag_trigger_logs MODIFY COLUMN trigger_source "
        "ENUM('CLICK','INTERACTION','MANUAL','CONVERSION') NOT NULL "
        "COMMENT '觸發來源'"
    )


def downgrade() -> None:
    # 還原為原始 3 值；若已有 CONVERSION 資料會在 downgrade 時失敗，需先清除
    op.execute(
        "ALTER TABLE tag_trigger_logs MODIFY COLUMN trigger_source "
        "ENUM('CLICK','INTERACTION','MANUAL') NOT NULL "
        "COMMENT '觸發來源'"
    )
