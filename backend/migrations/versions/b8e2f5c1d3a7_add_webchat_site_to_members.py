"""add webchat_site_id and webchat_site_name to members

Revision ID: b8e2f5c1d3a7
Revises: a7f4c2b91e83
Create Date: 2026-04-28

用途：分辨同一個 widget JS 嵌在不同網站時的來源。
- webchat_site_id：英文代號（穩定 key，例：'starbit-ryan'）
- webchat_site_name：中文顯示名（會員管理 UI 顯示，例：'思偉達飯店｜雷恩館'）

兩欄都 nullable — 嵌入方未設或舊訪客都是 NULL，此時前端顯示純「Web Chat」。
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b8e2f5c1d3a7"
down_revision: Union[str, None] = "a7f4c2b91e83"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(
        sa.text(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table
              AND COLUMN_NAME = :column
            """
        ),
        {"table": table, "column": column},
    ).fetchone()
    return bool(result and result[0])


def upgrade() -> None:
    conn = op.get_bind()

    if not _column_exists(conn, "members", "webchat_site_id"):
        op.add_column(
            "members",
            sa.Column(
                "webchat_site_id",
                sa.String(50),
                nullable=True,
                comment="Webchat widget 嵌入站點英文代號（例：starbit-ryan）",
            ),
        )
        op.create_index("ix_members_webchat_site_id", "members", ["webchat_site_id"])

    if not _column_exists(conn, "members", "webchat_site_name"):
        op.add_column(
            "members",
            sa.Column(
                "webchat_site_name",
                sa.String(100),
                nullable=True,
                comment="Webchat widget 嵌入站點顯示名（例：思偉達飯店｜雷恩館）",
            ),
        )


def downgrade() -> None:
    conn = op.get_bind()

    if _column_exists(conn, "members", "webchat_site_name"):
        op.drop_column("members", "webchat_site_name")

    if _column_exists(conn, "members", "webchat_site_id"):
        try:
            op.drop_index("ix_members_webchat_site_id", table_name="members")
        except Exception:
            pass
        op.drop_column("members", "webchat_site_id")
