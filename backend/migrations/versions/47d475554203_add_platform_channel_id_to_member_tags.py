"""add_platform_channel_id_to_member_tags

Revision ID: 47d475554203
Revises: 82f25d09235d
Create Date: 2026-05-13 16:24:27.421728

為 member_tags / member_interaction_tags 加上 platform + channel_id，
目的：標籤可以按 LINE OA 分館（或未來 FB 粉專 / Webchat 站點）隔離。

設計重點：
- 兩個新欄位都先 nullable=True，等 Step 3 backfill 歷史資料後再評估是否收緊
- platform 預期值：'LINE' / 'Facebook' / 'Webchat'（與 conversation_threads.platform 一致）
- channel_id：LINE 用 line_channels.channel_id（10 位數字）、FB 用 page_id、Webchat 用 site_id
- 加 (platform, channel_id) 複合 index，撈某 channel 的標籤時用
- 不動既有 unique constraint，沿用 (member_id, tag_name, message_id)

idempotent：先用 information_schema 檢查欄位是否存在，避免 staging 重跑時炸。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47d475554203'
down_revision: Union[str, None] = '82f25d09235d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = ('member_tags', 'member_interaction_tags')


def _column_exists(connection, table: str, column: str) -> bool:
    result = connection.execute(sa.text("""
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table
          AND COLUMN_NAME = :column
        LIMIT 1
    """), {"table": table, "column": column}).fetchone()
    return result is not None


def _index_exists(connection, table: str, index: str) -> bool:
    result = connection.execute(sa.text("""
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table
          AND INDEX_NAME = :index
        LIMIT 1
    """), {"table": table, "index": index}).fetchone()
    return result is not None


def upgrade() -> None:
    connection = op.get_bind()

    for table in TABLES:
        # 1. 加 platform 欄位
        if not _column_exists(connection, table, 'platform'):
            op.add_column(
                table,
                sa.Column(
                    'platform',
                    sa.String(20),
                    nullable=True,
                    comment='平台：LINE / Facebook / Webchat。Step 3 backfill 後再評估是否收緊 NOT NULL'
                )
            )

        # 2. 加 channel_id 欄位
        if not _column_exists(connection, table, 'channel_id'):
            op.add_column(
                table,
                sa.Column(
                    'channel_id',
                    sa.String(100),
                    nullable=True,
                    comment='頻道識別：LINE channel_id / FB page_id / Webchat site_id'
                )
            )

        # 3. 加 (platform, channel_id) 複合 index，篩選查詢用
        idx_name = f'ix_{table}_platform_channel'
        if not _index_exists(connection, table, idx_name):
            op.create_index(idx_name, table, ['platform', 'channel_id'])


def downgrade() -> None:
    connection = op.get_bind()

    for table in TABLES:
        idx_name = f'ix_{table}_platform_channel'
        if _index_exists(connection, table, idx_name):
            op.drop_index(idx_name, table_name=table)

        if _column_exists(connection, table, 'channel_id'):
            op.drop_column(table, 'channel_id')

        if _column_exists(connection, table, 'platform'):
            op.drop_column(table, 'platform')
