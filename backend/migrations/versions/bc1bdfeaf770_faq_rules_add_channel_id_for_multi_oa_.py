"""faq_rules add channel_id for multi-OA isolation

Revision ID: bc1bdfeaf770
Revises: 439f0955f73e
Create Date: 2026-05-14 15:30:40.341976

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc1bdfeaf770'
down_revision: Union[str, None] = '439f0955f73e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# 預設把所有現存的 FAQ rule 都歸給「思偉達飯店」(line_channels.channel_id = 2005363092)
# 這假設目前所有 FAQ 資料都是思偉達建立的，產設帳號是新加入。
DEFAULT_CHANNEL_ID = "2005363092"


def upgrade() -> None:
    # 1) 先加 nullable 欄位
    op.add_column(
        "faq_rules",
        sa.Column(
            "channel_id",
            sa.String(length=100),
            nullable=True,
            comment="所屬 LINE OA channel_id（多 OA 隔離）",
        ),
    )

    # 2) Backfill：現存 rule 全部歸給思偉達
    op.execute(
        f"""
        UPDATE faq_rules
        SET channel_id = '{DEFAULT_CHANNEL_ID}'
        WHERE channel_id IS NULL
        """
    )

    # 3) 收緊為 NOT NULL
    op.alter_column(
        "faq_rules",
        "channel_id",
        existing_type=sa.String(length=100),
        nullable=False,
    )

    # 4) 加索引 + FK
    op.create_index("ix_faq_rules_channel_id", "faq_rules", ["channel_id"])
    op.create_foreign_key(
        "fk_faq_rules_channel_id",
        "faq_rules",
        "line_channels",
        ["channel_id"],
        ["channel_id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_faq_rules_channel_id", "faq_rules", type_="foreignkey")
    op.drop_index("ix_faq_rules_channel_id", table_name="faq_rules")
    op.drop_column("faq_rules", "channel_id")
