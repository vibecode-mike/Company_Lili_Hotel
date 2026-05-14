"""ai_token_usages add channel_id for multi-OA quota

Revision ID: 8b770f5d4f20
Revises: bc1bdfeaf770
Create Date: 2026-05-14 16:06:05.908207

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b770f5d4f20'
down_revision: Union[str, None] = 'bc1bdfeaf770'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# 現有 1 筆 (industry_id=391, used=4.7M) 全部歸給「思偉達飯店」
DEFAULT_CHANNEL_ID = "2005363092"


def upgrade() -> None:
    # 1) 加 nullable channel_id
    op.add_column(
        "ai_token_usages",
        sa.Column(
            "channel_id",
            sa.String(length=100),
            nullable=True,
            comment="所屬 LINE OA channel_id（多 OA 隔離）",
        ),
    )

    # 2) Backfill：現有 usage 都歸給思偉達
    op.execute(
        f"""
        UPDATE ai_token_usages
        SET channel_id = '{DEFAULT_CHANNEL_ID}'
        WHERE channel_id IS NULL
        """
    )

    # 3) 收緊 NOT NULL
    op.alter_column(
        "ai_token_usages",
        "channel_id",
        existing_type=sa.String(length=100),
        nullable=False,
    )

    # 4) Index + FK + Unique
    op.create_index("ix_ai_token_channel_id", "ai_token_usages", ["channel_id"])
    op.create_foreign_key(
        "fk_ai_token_channel_id",
        "ai_token_usages",
        "line_channels",
        ["channel_id"],
        ["channel_id"],
        ondelete="CASCADE",
    )
    op.create_unique_constraint(
        "uq_ai_token_industry_channel",
        "ai_token_usages",
        ["industry_id", "channel_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_ai_token_industry_channel", "ai_token_usages", type_="unique")
    op.drop_constraint("fk_ai_token_channel_id", "ai_token_usages", type_="foreignkey")
    op.drop_index("ix_ai_token_channel_id", table_name="ai_token_usages")
    op.drop_column("ai_token_usages", "channel_id")
