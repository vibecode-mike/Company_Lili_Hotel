"""align staging db with dev (5 nullable + 3 table comments + 3 column comments)

Phase 2.8 — 收尾：補 staging-only drift。

背景：dev DB 跟 staging DB 歷史不同步，前面幾輪 model-only 修法（如 commit 356e13a9
把 5 個 booking_records/members 欄位走 model-only 放寬、commit 2900c698 把
FaqPmsConnection 3 個 Base 繼承欄位 comment override）只清掉 dev drift，
staging DB 沒被任何 migration 動到，所以 staging 還殘留 11 項 drift。

本 migration 用 information_schema 預檢做 idempotent：
  - Dev DB 跑 = 全 preflight 跳過、實際無 DDL 執行
  - Staging CI 跑 = 11 項實際 ALTER 補齊

三類修補：

A. 5 欄位 NOT NULL → NULL（model 期望 nullable=True、staging DB 為 NOT NULL）
  - booking_records.selected_rooms (JSON)
  - booking_records.member_name    (VARCHAR(100))
  - booking_records.member_phone   (VARCHAR(20))
  - booking_records.member_email   (VARCHAR(255))
  - members.gender                 (VARCHAR(1))

B. 3 table-level COMMENT 補上（model 有、staging DB 為空）
  - conversation_threads   = '對話串表'
  - conversation_messages  = '對話訊息表'
  - line_channels          = 'LINE 頻道設定表'

C. 3 個 faq_pms_connections column comment 對齊到 model override 後的值
  - id          = '唯一識別碼'        （staging 為 Base 預設 '主鍵ID'）
  - created_at  = '建立時間（UTC）'   （staging 為 Base 預設 '創建時間'）
  - updated_at  = '更新時間（UTC）'   （staging 為 Base 預設 '更新時間'）

downgrade 留空：對齊不還原（還原 = 把 staging 推回不一致狀態）。

教訓見 memory feedback_model_only_fix_misses_staging：對齊 model 元資料必須
配 idempotent migration，不能只改 model。

Revision ID: 8f0e360558ef
Revises: 202a4fa64332
Create Date: 2026-05-19 16:52:05.749955

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f0e360558ef'
down_revision: Union[str, None] = '202a4fa64332'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # ─── A. 5 欄位 nullable 放寬 (NOT NULL → NULL) ──────────────────────
    nullable_specs = [
        # (table, column, column_type_clause, comment)
        ('booking_records', 'selected_rooms', 'JSON',
         '多房型混搭快照陣列，格式 [{room_type_code, room_type_name, room_count, source}]'),
        ('booking_records', 'member_name', 'VARCHAR(100)',
         '訪客姓名快照（訂房當下的值）'),
        ('booking_records', 'member_phone', 'VARCHAR(20)',
         '訪客電話快照，10 位數字'),
        ('booking_records', 'member_email', 'VARCHAR(255)',
         '訪客 Email 快照，需含 @'),
        ('members', 'gender', 'VARCHAR(1)',
         '性別：0=不透漏/1=男/2=女'),
    ]
    for table, col, ctype, cmt in nullable_specs:
        row = bind.execute(sa.text("""
            SELECT IS_NULLABLE
            FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c
        """), {'t': table, 'c': col}).fetchone()
        if row and row[0] == 'NO':
            op.execute(
                f"ALTER TABLE `{table}` MODIFY COLUMN `{col}` {ctype} NULL "
                f"COMMENT '{cmt}'"
            )

    # ─── B. 3 table-level comment 補上 ───────────────────────────────
    table_comments = [
        ('conversation_threads', '對話串表'),
        ('conversation_messages', '對話訊息表'),
        ('line_channels', 'LINE 頻道設定表'),
    ]
    for table, expected in table_comments:
        row = bind.execute(sa.text("""
            SELECT TABLE_COMMENT
            FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = :t
        """), {'t': table}).fetchone()
        current = (row[0] if row else '') or ''
        if current != expected:
            op.execute(f"ALTER TABLE `{table}` COMMENT = '{expected}'")

    # ─── C. 3 個 faq_pms_connections column comment 對齊 ──────────────
    # 完整定義帶 type / nullable / default / extra，避免 MODIFY 把其他屬性弄掉
    column_specs = [
        ('faq_pms_connections', 'id',
         'BIGINT NOT NULL AUTO_INCREMENT', '唯一識別碼'),
        ('faq_pms_connections', 'created_at',
         'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP', '建立時間（UTC）'),
        ('faq_pms_connections', 'updated_at',
         'DATETIME NULL DEFAULT NULL', '更新時間（UTC）'),
    ]
    for table, col, def_clause, expected_cmt in column_specs:
        row = bind.execute(sa.text("""
            SELECT COLUMN_COMMENT
            FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c
        """), {'t': table, 'c': col}).fetchone()
        if row and row[0] != expected_cmt:
            op.execute(
                f"ALTER TABLE `{table}` MODIFY COLUMN `{col}` {def_clause} "
                f"COMMENT '{expected_cmt}'"
            )


def downgrade() -> None:
    # one-way：對齊不還原（還原 = 把 staging 推回跟 dev 不一致的狀態）
    pass
