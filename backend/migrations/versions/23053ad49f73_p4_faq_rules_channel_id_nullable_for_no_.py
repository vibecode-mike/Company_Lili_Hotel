"""p4 faq_rules.channel_id nullable for no-line orgs

Revision ID: 23053ad49f73
Revises: fc8a3941ec26
Create Date: 2026-06-03 14:55:15.361644

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '23053ad49f73'
down_revision: Union[str, None] = 'fc8a3941ec26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _is_nullable(bind, table, column):
    return bind.execute(
        sa.text(
            "SELECT IS_NULLABLE FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    ).scalar() == "YES"


def upgrade() -> None:
    """放寬 faq_rules.channel_id 為可空 —— 純官網彈窗組織無 LINE，FAQ 改用 tenant_id 歸屬。

    放寬 NOT NULL 為安全方向，不會卡既有資料。FK 仍保留（NULL 值不受 FK 約束）。
    """
    bind = op.get_bind()
    if not _is_nullable(bind, "faq_rules", "channel_id"):
        op.alter_column(
            "faq_rules", "channel_id",
            existing_type=sa.String(100),
            nullable=True,
            existing_comment="所屬 LINE OA channel_id（多 OA 隔離）",
            comment="所屬 LINE OA channel_id（選配；純官網彈窗組織可為空，改用 tenant_id 歸屬）",
        )
    # 對齊 tenant_id comment（避免 model/DB drift）
    op.alter_column(
        "faq_rules", "tenant_id",
        existing_type=sa.BigInteger(),
        existing_nullable=True,
        comment="所屬組織 ID（組織重構；無 LINE 組織的 FAQ 主要歸屬）",
    )


def downgrade() -> None:
    # 還原 NOT NULL 會卡住 channel_id 為空的純官網組織 FAQ，視為單向；downgrade 不強制收回。
    pass
