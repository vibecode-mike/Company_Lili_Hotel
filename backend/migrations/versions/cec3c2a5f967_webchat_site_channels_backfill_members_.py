"""webchat_site_channels + backfill members line_channel_id

Revision ID: cec3c2a5f967
Revises: 439a290f014e
Create Date: 2026-05-14 16:40:19.350697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cec3c2a5f967'
down_revision: Union[str, None] = '439a290f014e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# 已知站點綁定
SIWAEDA_CHANNEL = "2005363092"   # 思偉達飯店
CHANSER_CHANNEL = "2010071832"   # 產設-測試帳號1


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

    # 2) Seed 已知站點
    op.execute(
        f"""
        INSERT INTO webchat_site_channels (site_id, line_channel_id, site_name, created_at)
        VALUES
          ('starbit-mike', '{SIWAEDA_CHANNEL}', '思偉達飯店｜漢堂館', NOW()),
          ('starbit-ryan', '{CHANSER_CHANNEL}', '思偉達飯店｜雷恩館', NOW())
        """
    )

    # 3) Backfill 既有 webchat 會員的 line_channel_id（依 site_id 對應）
    op.execute(
        """
        UPDATE members m
        JOIN webchat_site_channels wsc ON wsc.site_id = m.webchat_site_id
        SET m.line_channel_id = wsc.line_channel_id
        WHERE m.webchat_uid IS NOT NULL
          AND m.line_channel_id IS NULL
        """
    )

    # 4) 雷恩館訪客資料先清掉（重新開始）
    op.execute(
        """
        DELETE cm FROM conversation_messages cm
        JOIN members m ON m.webchat_uid = cm.thread_id
        WHERE m.webchat_site_id = 'starbit-ryan' AND m.is_guest = 1
        """
    )
    op.execute(
        """
        DELETE ct FROM conversation_threads ct
        JOIN members m ON m.webchat_uid = ct.id
        WHERE m.webchat_site_id = 'starbit-ryan' AND m.is_guest = 1
        """
    )
    op.execute(
        """
        DELETE FROM members
        WHERE webchat_site_id = 'starbit-ryan' AND is_guest = 1
        """
    )


def downgrade() -> None:
    op.drop_constraint("fk_webchat_site_channels_line_channel_id", "webchat_site_channels", type_="foreignkey")
    op.drop_index("ix_webchat_site_channels_line_channel_id", table_name="webchat_site_channels")
    op.drop_table("webchat_site_channels")
    # 不還原刪掉的訪客（一次性清理）
