"""p1 create tenants table + line_channels.tenant_id

Revision ID: d3974c215245
Revises: 8f0e360558ef
Create Date: 2026-06-03 10:39:52.156023

組織重構 Phase 1（打地基，零行為變化）：
1. 建立 tenants（組織）表
2. line_channels 新增 tenant_id 欄位 + FK
3. Backfill：每個現有 line_channel → 對應一個組織，並回填 tenant_id

全程 idempotent（用 information_schema 預檢 + slug 當回填冪等鍵），
dev/staging 部分套用過也能安全重跑。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3974c215245'
down_revision: Union[str, None] = '8f0e360558ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(bind, table: str) -> bool:
    return bind.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema = DATABASE() AND table_name = :t"
        ),
        {"t": table},
    ).scalar() > 0


def _has_column(bind, table: str, column: str) -> bool:
    return bind.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    ).scalar() > 0


def _has_fk(bind, table: str, fk_name: str) -> bool:
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

    # 1) tenants 表
    if not _has_table(bind, "tenants"):
        op.create_table(
            "tenants",
            sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True, comment="主鍵ID"),
            sa.Column("name", sa.String(100), nullable=False, comment="組織名稱"),
            sa.Column("slug", sa.String(100), nullable=True, comment="組織代碼（選填，唯一）"),
            sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("1"), comment="是否啟用"),
            sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"), comment="創建時間"),
            sa.Column("updated_at", sa.DateTime, nullable=True, server_default=sa.text("CURRENT_TIMESTAMP"), comment="更新時間"),
            sa.UniqueConstraint("slug", name="uq_tenants_slug"),
            comment="組織（最頂層歸屬單位，一個組織=一個客戶/館）",
        )

    # 2) line_channels.tenant_id 欄位
    if not _has_column(bind, "line_channels", "tenant_id"):
        op.add_column(
            "line_channels",
            sa.Column("tenant_id", sa.BigInteger, nullable=True, comment="所屬組織 ID"),
        )

    # 3) FK（明確命名）
    if not _has_fk(bind, "line_channels", "fk_line_channels_tenant"):
        op.create_foreign_key(
            "fk_line_channels_tenant",
            "line_channels", "tenants",
            ["tenant_id"], ["id"],
            ondelete="SET NULL",
        )

    # 4) Backfill：每個 line_channel → 一個組織（slug=lc-<id> 當冪等鍵）
    op.execute(
        """
        INSERT INTO tenants (name, slug, is_active, created_at, updated_at)
        SELECT COALESCE(NULLIF(lc.channel_name, ''), lc.channel_id, CONCAT('組織-', lc.id)),
               CONCAT('lc-', lc.id), 1, NOW(), NOW()
        FROM line_channels lc
        WHERE lc.tenant_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.slug = CONCAT('lc-', lc.id))
        """
    )
    op.execute(
        """
        UPDATE line_channels lc
        JOIN tenants t ON t.slug = CONCAT('lc-', lc.id)
        SET lc.tenant_id = t.id
        WHERE lc.tenant_id IS NULL
        """
    )


def downgrade() -> None:
    bind = op.get_bind()

    if _has_fk(bind, "line_channels", "fk_line_channels_tenant"):
        op.drop_constraint("fk_line_channels_tenant", "line_channels", type_="foreignkey")

    if _has_column(bind, "line_channels", "tenant_id"):
        op.drop_column("line_channels", "tenant_id")

    # 注意：tenants 表整個移除會連帶丟失 backfill 的組織資料（單向）
    if _has_table(bind, "tenants"):
        op.drop_table("tenants")
