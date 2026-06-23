"""add last_seen_at/last_seen_url to webchat_site_channels

Revision ID: 657b81b6854d
Revises: 6c3c9fbc8076
Create Date: 2026-06-23 14:57:40.586653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '657b81b6854d'
down_revision: Union[str, None] = '6c3c9fbc8076'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "webchat_site_channels"


def _has_column(col: str) -> bool:
    bind = op.get_bind()
    row = bind.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c"
        ),
        {"t": TABLE, "c": col},
    ).scalar()
    return bool(row)


def upgrade() -> None:
    # idempotent：dev/staging 可能已部分套用，先查 information_schema 再決定是否新增
    if not _has_column("last_seen_at"):
        op.add_column(
            TABLE,
            sa.Column(
                "last_seen_at",
                sa.DateTime(),
                nullable=True,
                comment="最後一次 widget 被瀏覽器載入的時間（台灣時間）；用於基本設定狀態判定（有值=已開通）",
            ),
        )
    if not _has_column("last_seen_url"):
        op.add_column(
            TABLE,
            sa.Column(
                "last_seen_url",
                sa.String(length=500),
                nullable=True,
                comment="最後一次 widget 載入時所在的頁面網址",
            ),
        )


def downgrade() -> None:
    if _has_column("last_seen_url"):
        op.drop_column(TABLE, "last_seen_url")
    if _has_column("last_seen_at"):
        op.drop_column(TABLE, "last_seen_at")
