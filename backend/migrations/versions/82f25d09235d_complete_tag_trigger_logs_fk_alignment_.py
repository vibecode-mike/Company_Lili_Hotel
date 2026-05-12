"""complete_tag_trigger_logs_fk_alignment_and_line_friends_comment

Revision ID: 82f25d09235d
Revises: 26d892fb5b82
Create Date: 2026-05-12 16:47:28.125603

補完 migration 7810b55a4479 沒成功 drop 的 FK + line_friends.updated_at comment 統一。

歷史脈絡：
- 7810b55a4479 設計上要 drop tag_trigger_logs.tag_id → interaction_tags FK
  （允許 member_tags 觸發時填 tag_id=NULL）
- 但該 migration 第 29 行寫死 'tag_trigger_logs_ibfk_4'，staging 實際是 'ibfk_2'
- 結果：migration 其他步驟生效，但 FK 沒被 drop，staging 落入半完成狀態
- 同時 model 期望 campaign_id → campaigns ON DELETE SET NULL，DB 上沒這條 FK

本 migration 設計為 idempotent：
- 用 information_schema 動態抓 FK 名稱（避開 ibfk_N 編號 dev/staging 不一致的問題）
- 條件式建立 campaign_id FK（dev 已存在則 skip、staging 才建）
- 建 FK 前 backfill 孤兒 campaign_id 為 NULL（避免 staging 累積的孤兒值卡死 FK 建立）
- line_friends.updated_at 強制 comment 為 '更新時間'（ALTER MODIFY 自然 idempotent）

預期：dev 上 near-no-op（dev DB 已對齊 model）、staging 上才會實際 drop/add FK。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '82f25d09235d'
down_revision: Union[str, None] = '26d892fb5b82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()

    # === 1. Drop tag_trigger_logs 上所有 reference interaction_tags 的 FK ===
    # staging 上叫 ibfk_2、dev 上已沒有此 FK → no-op
    fks_to_drop = connection.execute(sa.text("""
        SELECT CONSTRAINT_NAME
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tag_trigger_logs'
          AND REFERENCED_TABLE_NAME = 'interaction_tags'
    """)).fetchall()
    for (fk_name,) in fks_to_drop:
        op.drop_constraint(fk_name, 'tag_trigger_logs', type_='foreignkey')

    # === 2. 補建 tag_trigger_logs.campaign_id → campaigns FK（若不存在） ===
    # dev 已存在則 skip、staging 上會建立
    campaign_fk_exists = connection.execute(sa.text("""
        SELECT 1
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tag_trigger_logs'
          AND REFERENCED_TABLE_NAME = 'campaigns'
        LIMIT 1
    """)).fetchone()
    if not campaign_fk_exists:
        # 2a. 先把孤兒 campaign_id 設 NULL，避免 FK 建立時失敗
        # （staging 沒這條 FK 跑很久，可能累積出指向已刪除 campaign 的孤兒值）
        op.execute("""
            UPDATE tag_trigger_logs t
            LEFT JOIN campaigns c ON t.campaign_id = c.id
            SET t.campaign_id = NULL
            WHERE t.campaign_id IS NOT NULL AND c.id IS NULL
        """)
        # 2b. 建 FK，明確命名避免依賴 MySQL 自動編號的 ibfk_N
        op.create_foreign_key(
            'fk_tag_trigger_logs_campaign',
            'tag_trigger_logs', 'campaigns',
            ['campaign_id'], ['id'],
            ondelete='SET NULL'
        )

    # === 3. line_friends.updated_at 強制 comment 為 '更新時間' ===
    # 跟 SHOW CREATE TABLE 抓到的現行 DDL 一致（DEFAULT NULL 隱含 nullable）
    op.execute("""
        ALTER TABLE line_friends
        MODIFY COLUMN updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
        COMMENT '更新時間'
    """)


def downgrade() -> None:
    """
    不還原 FK 與 comment：
    - FK drop/add 還原會把 staging 推回「migration 半完成」的錯誤狀態
    - line_friends comment 還原沒語意（純 cleanup）
    downgrade 設為 no-op。
    """
    pass
