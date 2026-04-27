"""add is_guest and guest_seq to members

Revision ID: a7f4c2b91e83
Revises: 6ecc195574fc
Create Date: 2026-04-27

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a7f4c2b91e83"
down_revision: Union[str, None] = "6ecc195574fc"
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

    # 訪客旗標：True 代表是匿名 webchat widget 訪客
    if not _column_exists(conn, "members", "is_guest"):
        op.add_column(
            "members",
            sa.Column(
                "is_guest",
                sa.Boolean(),
                nullable=False,
                server_default="0",
                comment="是否為匿名 webchat 訪客（未填寫資料）",
            ),
        )

    # 訪客流水號：只有 is_guest=1 的才填，用於顯示「訪客000001」
    if not _column_exists(conn, "members", "guest_seq"):
        op.add_column(
            "members",
            sa.Column(
                "guest_seq",
                sa.Integer(),
                nullable=True,
                comment="訪客流水號（顯示為 訪客{guest_seq:06d}）",
            ),
        )
        op.create_unique_constraint(
            "uq_members_guest_seq", "members", ["guest_seq"]
        )
        op.create_index("ix_members_is_guest", "members", ["is_guest"])


def downgrade() -> None:
    conn = op.get_bind()

    if _column_exists(conn, "members", "guest_seq"):
        try:
            op.drop_index("ix_members_is_guest", table_name="members")
        except Exception:
            pass
        try:
            op.drop_constraint("uq_members_guest_seq", "members", type_="unique")
        except Exception:
            pass
        op.drop_column("members", "guest_seq")

    if _column_exists(conn, "members", "is_guest"):
        op.drop_column("members", "is_guest")
