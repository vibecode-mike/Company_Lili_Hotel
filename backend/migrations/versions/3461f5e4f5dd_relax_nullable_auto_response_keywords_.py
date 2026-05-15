"""relax_nullable_auto_response_keywords_pms_sync_status

Revision ID: 3461f5e4f5dd
Revises: 88be27a5c8ff
Create Date: 2026-05-15 17:25:16.332635

放寬 2 個欄位的 nullable 限制，對齊 model 設計意圖：

- auto_response_keywords.created_at：DB NOT NULL → nullable=True
- pms_integrations.sync_status：DB NOT NULL → nullable=True

Model 已宣告 nullable=True 一段時間，但 DB 還是 NOT NULL。本 migration
讓 DB 跟上。

風險：
- 既有資料不動（純改 nullable 屬性）
- 既有 code 沒人 INSERT 這 2 欄寫 NULL（全 grep 過）
- Base default 仍會自動填值；改 nullable 只是讓未來「允許」 NULL，
  目前沒 code path 真的會塞 NULL

Idempotent 設計（基於 88be27a5c8ff 的 staging duplicate 教訓）：
- 用 information_schema 預檢，欄位已是 nullable 就跳過
- 避免重跑同一個 alter 對 staging 造成意外副作用
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3461f5e4f5dd'
down_revision: Union[str, None] = '88be27a5c8ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_is_nullable(table: str, column: str) -> bool:
    """檢查 table.column 當前 IS_NULLABLE。回傳 True 代表已是 nullable。"""
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT IS_NULLABLE FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tbl
          AND COLUMN_NAME = :col
    """), {"tbl": table, "col": column}).scalar()
    return result == 'YES'


def upgrade() -> None:
    # 1. auto_response_keywords.created_at NOT NULL → nullable
    if not _column_is_nullable('auto_response_keywords', 'created_at'):
        op.alter_column(
            'auto_response_keywords', 'created_at',
            existing_type=sa.DateTime(),
            nullable=True,
            existing_comment='建立時間',
        )
    # 2. pms_integrations.sync_status NOT NULL → nullable
    if not _column_is_nullable('pms_integrations', 'sync_status'):
        op.alter_column(
            'pms_integrations', 'sync_status',
            existing_type=sa.String(length=20),
            nullable=True,
            existing_comment='同步狀態：active/failed/disabled',
        )


def downgrade() -> None:
    """收緊回 NOT NULL — 若期間有寫入 NULL 會失敗，需先 backfill。"""
    if _column_is_nullable('auto_response_keywords', 'created_at'):
        op.alter_column(
            'auto_response_keywords', 'created_at',
            existing_type=sa.DateTime(),
            nullable=False,
            existing_comment='建立時間',
        )
    if _column_is_nullable('pms_integrations', 'sync_status'):
        op.alter_column(
            'pms_integrations', 'sync_status',
            existing_type=sa.String(length=20),
            nullable=False,
            existing_comment='同步狀態：active/failed/disabled',
        )
