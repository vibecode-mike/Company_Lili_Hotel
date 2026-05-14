"""webchat_site_channels + backfill members line_channel_id

Revision ID: cec3c2a5f967
Revises: 439a290f014e
Create Date: 2026-05-14 16:40:19.350697

注意：本 migration 只做 schema 變更，不 seed 任何環境特定資料。
- site_id ↔ channel_id 的對應是每個環境 ops 自己手動 INSERT（dev / staging / prod
  的 line_channels.channel_id 本來就不一樣，不該全環境寫死）。
- 訪客資料的一次性清理也已拿掉，那是 dev 端在做架構切換時的清理動作，
  不該每個環境都跑。

各環境 ops 手動 seed 範例（依該環境實際 line_channels 為準）：

    INSERT INTO webchat_site_channels (site_id, line_channel_id, site_name, created_at)
    VALUES
      ('starbit-mike', '<該環境思偉達 channel_id>', '思偉達飯店｜漢堂館', NOW()),
      ('starbit-ryan', '<該環境產設 channel_id>',   '思偉達飯店｜雷恩館', NOW());
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cec3c2a5f967'
down_revision: Union[str, None] = '439a290f014e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) 建表 webchat_site_channels
    op.create_table(
        "webchat_site_channels",
        sa.Column(
            "site_id",
            sa.String(length=50),
            primary_key=True,
            comment="Webchat widget 嵌入站點代號（例：starbit-ryan）",
        ),
        sa.Column(
            "line_channel_id",
            sa.String(length=100),
            nullable=False,
            comment="綁定的 LINE OA channel_id",
        ),
        sa.Column(
            "site_name",
            sa.String(length=100),
            nullable=True,
            comment="顯示名稱（例：思偉達飯店｜雷恩館）",
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False, comment="建立時間"),
        sa.Column("updated_at", sa.DateTime(), nullable=True, comment="更新時間"),
    )
    op.create_index("ix_webchat_site_channels_line_channel_id", "webchat_site_channels", ["line_channel_id"])
    op.create_foreign_key(
        "fk_webchat_site_channels_line_channel_id",
        "webchat_site_channels",
        "line_channels",
        ["line_channel_id"],
        ["channel_id"],
        ondelete="CASCADE",
    )

    # 2) Backfill 既有 webchat 會員的 line_channel_id（依 site_id 對應）
    #    對於 webchat_site_channels 還沒 seed 的環境，這段是 no-op（沒 join 到任何 row），安全。
    op.execute(
        """
        UPDATE members m
        JOIN webchat_site_channels wsc ON wsc.site_id = m.webchat_site_id
        SET m.line_channel_id = wsc.line_channel_id
        WHERE m.webchat_uid IS NOT NULL
          AND m.line_channel_id IS NULL
        """
    )


def downgrade() -> None:
    op.drop_constraint("fk_webchat_site_channels_line_channel_id", "webchat_site_channels", type_="foreignkey")
    op.drop_index("ix_webchat_site_channels_line_channel_id", table_name="webchat_site_channels")
    op.drop_table("webchat_site_channels")
