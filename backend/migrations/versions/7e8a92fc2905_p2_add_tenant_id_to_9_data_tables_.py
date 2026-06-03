"""p2 add tenant_id to 9 data tables + backfill

Revision ID: 7e8a92fc2905
Revises: d3974c215245
Create Date: 2026-06-03 10:52:41.984286

組織重構 Phase 2（搬資料，零行為變化）：
為 9 張資料表各加 tenant_id 欄位 + 命名 FK，並 backfill 既有資料。

對應規則：用 line_channels.channel_id 或 basic_id 對到組織 tenant_id。
對不到的（FB 粉專 id、已刪除的舊頻道、NULL）留空不硬塞 —— 它們不屬於現有
任何組織的 LINE 資料，留空是正確的（之後 FB/Webchat 成為一等公民時再處理）。

全程 idempotent（information_schema 預檢；backfill 只動 tenant_id IS NULL 的列）。
nullable + ondelete SET NULL，可安全回退（drop column）。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e8a92fc2905'
down_revision: Union[str, None] = 'd3974c215245'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (table, partition_column) — members 用 line_channel_id，其餘用 channel_id
DATA_TABLES = [
    ("members", "line_channel_id"),
    ("faq_rules", "channel_id"),
    ("member_tags", "channel_id"),
    ("member_interaction_tags", "channel_id"),
    ("auto_responses", "channel_id"),
    ("messages", "channel_id"),
    ("ai_token_usages", "channel_id"),
    ("tag_trigger_logs", "channel_id"),
    ("component_interaction_logs", "channel_id"),
]


def _has_column(bind, table, column):
    return bind.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    ).scalar() > 0


def _has_fk(bind, table, fk_name):
    return bind.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.table_constraints "
            "WHERE table_schema = DATABASE() AND table_name = :t "
            "AND constraint_name = :c AND constraint_type = 'FOREIGN KEY'"
        ),
        {"t": table, "c": fk_name},
    ).scalar() > 0


def upgrade() -> None:
    bind = op.get_bind()

    for table, col in DATA_TABLES:
        fk_name = f"fk_{table}_tenant"

        if not _has_column(bind, table, "tenant_id"):
            op.add_column(
                table,
                sa.Column("tenant_id", sa.BigInteger, nullable=True, comment="所屬組織 ID（組織重構 Phase 2）"),
            )

        if not _has_fk(bind, table, fk_name):
            op.create_foreign_key(
                fk_name, table, "tenants",
                ["tenant_id"], ["id"],
                ondelete="SET NULL",
            )

        # backfill：用 channel_id 或 basic_id 對到組織；只動還沒分配的列
        op.execute(
            f"""
            UPDATE {table} d
            JOIN line_channels lc
              ON lc.channel_id = d.{col} OR lc.basic_id = d.{col}
            SET d.tenant_id = lc.tenant_id
            WHERE d.tenant_id IS NULL AND lc.tenant_id IS NOT NULL
            """
        )


def downgrade() -> None:
    bind = op.get_bind()

    for table, _col in DATA_TABLES:
        fk_name = f"fk_{table}_tenant"
        if _has_fk(bind, table, fk_name):
            op.drop_constraint(fk_name, table, type_="foreignkey")
        if _has_column(bind, table, "tenant_id"):
            op.drop_column(table, "tenant_id")
