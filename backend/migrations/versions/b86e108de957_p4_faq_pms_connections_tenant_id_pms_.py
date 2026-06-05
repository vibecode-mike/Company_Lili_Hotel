"""p4 faq_pms_connections tenant_id (pms binds to org)

Revision ID: b86e108de957
Revises: 23053ad49f73
Create Date: 2026-06-03 15:51:08.520061

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b86e108de957'
down_revision: Union[str, None] = '23053ad49f73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "faq_pms_connections"


def _has_column(bind, table, column):
    return bind.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.columns "
        "WHERE table_schema=DATABASE() AND table_name=:t AND column_name=:c"
    ), {"t": table, "c": column}).scalar() > 0


def _has_index(bind, table, idx):
    return bind.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.statistics "
        "WHERE table_schema=DATABASE() AND table_name=:t AND index_name=:i"
    ), {"t": table, "i": idx}).scalar() > 0


def _has_fk(bind, table, fk):
    return bind.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.table_constraints "
        "WHERE table_schema=DATABASE() AND table_name=:t AND constraint_name=:c "
        "AND constraint_type='FOREIGN KEY'"
    ), {"t": table, "c": fk}).scalar() > 0


def _is_nullable(bind, table, column):
    return bind.execute(sa.text(
        "SELECT IS_NULLABLE FROM information_schema.columns "
        "WHERE table_schema=DATABASE() AND table_name=:t AND column_name=:c"
    ), {"t": table, "c": column}).scalar() == "YES"


def upgrade() -> None:
    """PMS 設定改綁組織層級：加 tenant_id、channel_id 放寬可空、backfill、加 (category,tenant) 唯一鍵。"""
    bind = op.get_bind()

    if not _has_column(bind, TABLE, "tenant_id"):
        op.add_column(TABLE, sa.Column(
            "tenant_id", sa.BigInteger, nullable=True,
            comment="所屬組織 ID（PMS 綁組織層級；同組織所有渠道共用）",
        ))

    if not _has_index(bind, TABLE, "ix_faq_pms_connections_tenant_id"):
        op.create_index("ix_faq_pms_connections_tenant_id", TABLE, ["tenant_id"])

    if not _has_fk(bind, TABLE, "fk_faq_pms_connections_tenant"):
        op.create_foreign_key(
            "fk_faq_pms_connections_tenant", TABLE, "tenants",
            ["tenant_id"], ["id"], ondelete="CASCADE",
        )

    # 放寬 channel_id 可空（純官網彈窗組織無 LINE）
    if not _is_nullable(bind, TABLE, "channel_id"):
        op.alter_column(
            TABLE, "channel_id",
            existing_type=sa.String(100), nullable=True,
            existing_comment="所屬 LINE OA channel_id（多 OA 隔離）",
            comment="所屬 LINE OA channel_id（選配；純官網彈窗組織可為空，改用 tenant_id）",
        )

    # backfill：依 channel_id 對到組織
    # COLLATE：跨表字串欄位 collation 在 staging 不一致，強制統一避免 MySQL 1267。
    op.execute(f"""
        UPDATE {TABLE} fpc
        JOIN line_channels lc
          ON lc.channel_id COLLATE utf8mb4_unicode_ci = fpc.channel_id COLLATE utf8mb4_unicode_ci
        SET fpc.tenant_id = lc.tenant_id
        WHERE fpc.tenant_id IS NULL AND lc.tenant_id IS NOT NULL
    """)

    # 加 (faq_category_id, tenant_id) 唯一鍵（組織層級唯一）
    if not _has_index(bind, TABLE, "uq_faq_pms_category_tenant"):
        op.create_unique_constraint(
            "uq_faq_pms_category_tenant", TABLE, ["faq_category_id", "tenant_id"]
        )


def downgrade() -> None:
    bind = op.get_bind()
    if _has_index(bind, TABLE, "uq_faq_pms_category_tenant"):
        op.drop_constraint("uq_faq_pms_category_tenant", TABLE, type_="unique")
    if _has_fk(bind, TABLE, "fk_faq_pms_connections_tenant"):
        op.drop_constraint("fk_faq_pms_connections_tenant", TABLE, type_="foreignkey")
    if _has_index(bind, TABLE, "ix_faq_pms_connections_tenant_id"):
        op.drop_index("ix_faq_pms_connections_tenant_id", table_name=TABLE)
    if _has_column(bind, TABLE, "tenant_id"):
        op.drop_column(TABLE, "tenant_id")
