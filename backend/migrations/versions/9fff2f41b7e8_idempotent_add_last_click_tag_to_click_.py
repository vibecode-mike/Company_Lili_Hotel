"""idempotent add last_click_tag to click_tracking_demo (schema drift)

Revision ID: 9fff2f41b7e8
Revises: c7aab6188ccc
Create Date: 2026-06-30 15:30:17.744289

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fff2f41b7e8'
down_revision: Union[str, None] = 'c7aab6188ccc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE = "click_tracking_demo"
COLUMN = "last_click_tag"


def _has_column() -> bool:
    bind = op.get_bind()
    row = bind.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c"
        ),
        {"t": TABLE, "c": COLUMN},
    ).scalar()
    return bool(row)


def upgrade() -> None:
    # 修復 schema drift：migration 8d3ee2588544 曾標記已套用，但這個 DB 快照沒帶到
    # click_tracking_demo.last_click_tag 欄位，導致 line_app /__track 寫入時 1054。
    # 欄位定義須與 8d3ee2588544 一致（Text, nullable=True, 無 comment）以免 alembic check 多一條 drift。
    if not _has_column():
        op.add_column(TABLE, sa.Column(COLUMN, sa.Text(), nullable=True))


def downgrade() -> None:
    # one-way：還原會把表帶回壞掉狀態（line_app 寫入再次 1054），不還原。
    pass
