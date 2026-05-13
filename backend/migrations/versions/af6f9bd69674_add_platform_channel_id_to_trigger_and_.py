"""add_platform_channel_id_to_trigger_and_interaction_logs

Revision ID: af6f9bd69674
Revises: 47d475554203
Create Date: 2026-05-13 16:27:24.666600

為 tag_trigger_logs / component_interaction_logs 加上 platform + channel_id。

目的：讓統計與時段洞察能按 LINE OA 分館（未來 FB 粉專 / Webchat 站點）切分。

設計重點：
- 兩個新欄位都 nullable=True，Step 3 backfill 完再評估是否收緊
- platform 預期值：'LINE' / 'Facebook' / 'Webchat'
- 加 (platform, channel_id) 複合 index 給統計 query 用
- idempotent（用 information_schema 檢查欄位/index 存在性）
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af6f9bd69674'
down_revision: Union[str, None] = '47d475554203'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = ('tag_trigger_logs', 'component_interaction_logs')


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
        if not _column_exists(connection, table, 'platform'):
            op.add_column(
                table,
                sa.Column(
                    'platform',
                    sa.String(20),
                    nullable=True,
                    comment='平台：LINE / Facebook / Webchat'
                )
            )

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
