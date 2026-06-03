"""p4 webchat_site_channels tenant_id + line_channel_id nullable

Revision ID: fc8a3941ec26
Revises: 9dc77a2ba1c3
Create Date: 2026-06-03 12:48:35.577109

組織重構 Phase 4（鬆綁官網彈窗）：
- webchat_site_channels 新增 tenant_id（site 改綁「組織」）
- line_channel_id 由 NOT NULL 放寬為可空（純官網彈窗組織可不接 LINE）
- backfill：既有 site 依 line_channel_id 對到組織

全程 idempotent；放寬 NOT NULL 為安全方向（不會卡既有資料）。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc8a3941ec26'
down_revision: Union[str, None] = '9dc77a2ba1c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


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


def _has_index(bind, table, index_name):
    return bind.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.statistics "
            "WHERE table_schema = DATABASE() AND table_name = :t AND index_name = :i"
        ),
        {"t": table, "i": index_name},
    ).scalar() > 0


def _is_nullable(bind, table, column):
    return bind.execute(
        sa.text(
            "SELECT IS_NULLABLE FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    ).scalar() == "YES"


def upgrade() -> None:
    bind = op.get_bind()
    table = "webchat_site_channels"

    if not _has_column(bind, table, "tenant_id"):
        op.add_column(
            table,
            sa.Column("tenant_id", sa.BigInteger, nullable=True, comment="所屬組織 ID（組織重構 Phase 4，site 的主要歸屬）"),
        )

    if not _has_index(bind, table, "ix_webchat_site_channels_tenant_id"):
        op.create_index("ix_webchat_site_channels_tenant_id", table, ["tenant_id"])

    if not _has_fk(bind, table, "fk_webchat_site_channels_tenant"):
        op.create_foreign_key(
            "fk_webchat_site_channels_tenant", table, "tenants",
            ["tenant_id"], ["id"],
            ondelete="CASCADE",
        )

    # 放寬 line_channel_id 為可空（純官網彈窗組織可不接 LINE）
    if not _is_nullable(bind, table, "line_channel_id"):
        op.alter_column(
            table, "line_channel_id",
            existing_type=sa.String(100),
            nullable=True,
            existing_comment="綁定的 LINE OA channel_id",
            comment="綁定的 LINE OA channel_id（選配；純官網彈窗組織可為空）",
        )

    # backfill：既有 site 依 line_channel_id 對到組織
    op.execute(
        """
        UPDATE webchat_site_channels w
        JOIN line_channels lc ON lc.channel_id = w.line_channel_id
        SET w.tenant_id = lc.tenant_id
        WHERE w.tenant_id IS NULL AND lc.tenant_id IS NOT NULL
        """
    )


def downgrade() -> None:
    bind = op.get_bind()
    table = "webchat_site_channels"

    # 還原 NOT NULL 前，孤兒（line_channel_id 為空的純官網彈窗 site）會卡住；
    # 此 migration 視為單向，downgrade 僅移除新增物，不強制收回 NOT NULL。
    if _has_fk(bind, table, "fk_webchat_site_channels_tenant"):
        op.drop_constraint("fk_webchat_site_channels_tenant", table, type_="foreignkey")
    if _has_index(bind, table, "ix_webchat_site_channels_tenant_id"):
        op.drop_index("ix_webchat_site_channels_tenant_id", table_name=table)
    if _has_column(bind, table, "tenant_id"):
        op.drop_column(table, "tenant_id")
