"""p3 auto-fill tenant_id triggers on 9 data tables

Revision ID: 9dc77a2ba1c3
Revises: 7e8a92fc2905
Create Date: 2026-06-03 12:19:11.118776

組織重構 Phase 3（後端寫入：自動補組織歸屬）：
為 9 張資料表各建 BEFORE INSERT / BEFORE UPDATE trigger，
任何寫入路徑（Backend / line_app / 獨立指令碼）新增或更新資料時，
若 tenant_id 還是空、且帶了館別值（channel_id/line_channel_id），
就自動依 line_channels 對應補上 tenant_id。

設計重點：
- 只在 tenant_id IS NULL 時填 → 不覆蓋程式明確指定的值（P4 無 LINE 組織會直接帶 tenant_id）
- channel_id 或 basic_id 都能對（auto_responses 用 basic_id）
- 對不到組織就維持 NULL（FB 粉專、舊頻道等孤兒資料）
- 與 members 既有的 AFTER INSERT/UPDATE line_friend 同步 trigger 時序不同，互不干擾
- 全程 idempotent（DROP TRIGGER IF EXISTS 先清再建），可安全重跑/回退
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from textwrap import dedent


# revision identifiers, used by Alembic.
revision: str = '9dc77a2ba1c3'
down_revision: Union[str, None] = '7e8a92fc2905'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (table, partition_column) — members 用 line_channel_id，其餘用 channel_id
DATA_TABLES = [
    ("members", "line_channel_id"),
    ("faq_rules", "channel_id"),
    ("member_tags", "channel_id"),
    ("member_interaction_tags", "channel_id"),
    ("auto_responses", "channel_id"),
    ("messages", "channel_id"),
    ("ai_token_usages", "channel_id"),
    ("tag_trigger_logs", "channel_id"),
    ("component_interaction_logs", "channel_id"),
]


def _trigger_body(col: str) -> str:
    # COLLATE：staging 上 data 表與 line_channels 字串欄位 collation 不一致
    # （utf8mb4_0900_ai_ci vs utf8mb4_unicode_ci）→ 觸發時比較會爆 MySQL 1267，
    # 導致該表 INSERT/UPDATE 全部失敗。兩側強制 utf8mb4_unicode_ci。
    return dedent(
        f"""
        BEGIN
            IF NEW.tenant_id IS NULL AND NEW.{col} IS NOT NULL THEN
                SET NEW.tenant_id = (
                    SELECT lc.tenant_id FROM line_channels lc
                    WHERE (lc.channel_id COLLATE utf8mb4_unicode_ci = NEW.{col} COLLATE utf8mb4_unicode_ci
                        OR lc.basic_id COLLATE utf8mb4_unicode_ci = NEW.{col} COLLATE utf8mb4_unicode_ci)
                      AND lc.tenant_id IS NOT NULL
                    LIMIT 1
                );
            END IF;
        END;
        """
    ).strip()


def upgrade() -> None:
    conn = op.get_bind()
    for table, col in DATA_TABLES:
        body = _trigger_body(col)
        for timing in ("INSERT", "UPDATE"):
            suffix = "bi" if timing == "INSERT" else "bu"
            name = f"trg_{table}_{suffix}_tenant"
            conn.execute(sa.text(f"DROP TRIGGER IF EXISTS {name}"))
            conn.execute(
                sa.text(
                    f"CREATE TRIGGER {name} BEFORE {timing} ON {table} FOR EACH ROW {body}"
                )
            )


def downgrade() -> None:
    conn = op.get_bind()
    for table, _col in DATA_TABLES:
        for suffix in ("bi", "bu"):
            conn.execute(sa.text(f"DROP TRIGGER IF EXISTS trg_{table}_{suffix}_tenant"))
