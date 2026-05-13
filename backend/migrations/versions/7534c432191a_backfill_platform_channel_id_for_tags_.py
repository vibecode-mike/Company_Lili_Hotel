"""backfill_platform_channel_id_for_tags_and_logs

Revision ID: 7534c432191a
Revises: af6f9bd69674
Create Date: 2026-05-13 16:31:05.073743

回填 member_tags / member_interaction_tags / tag_trigger_logs / component_interaction_logs
這四張表的 platform + channel_id 欄位。

優先順序：
1. 透過 message_id → messages.platform / channel_id（最準）
2. 透過 member 反查：
   - line_uid 存在、其他空 → ('LINE', members.line_channel_id)
   - fb_customer_id 存在、其他空 → ('Facebook', NULL)  -- 暫無 fb_channel_id 欄位於 members 上
   - webchat_uid 存在、其他空 → ('Webchat', members.webchat_site_id)
3. 同時綁多平台或無法決定的 → 保留 NULL（容後再排查）

idempotent：所有 UPDATE 都加 `WHERE platform IS NULL`，重跑不會覆蓋既有資料。

平台字面值與 conversation_threads / messages 一致：'LINE' / 'Facebook' / 'Webchat'（首字大寫）。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7534c432191a'
down_revision: Union[str, None] = 'af6f9bd69674'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = ('member_tags', 'member_interaction_tags', 'tag_trigger_logs', 'component_interaction_logs')


def upgrade() -> None:
    connection = op.get_bind()

    # ---- Priority 1: 透過 message_id 反查 ----
    # 適用四張表中有 message_id 欄位的紀錄
    for table in TABLES:
        connection.execute(sa.text(f"""
            UPDATE {table} t
            JOIN messages m ON t.message_id = m.id
            SET t.platform = m.platform,
                t.channel_id = m.channel_id
            WHERE t.platform IS NULL
              AND t.message_id IS NOT NULL
              AND m.platform IS NOT NULL
        """))

    # ---- Priority 2a: member 只綁 LINE ----
    # 三張會員相關表（component_interaction_logs 用 line_id 反查）
    for table in ('member_tags', 'member_interaction_tags', 'tag_trigger_logs'):
        connection.execute(sa.text(f"""
            UPDATE {table} t
            JOIN members mem ON t.member_id = mem.id
            SET t.platform = 'LINE',
                t.channel_id = mem.line_channel_id
            WHERE t.platform IS NULL
              AND mem.line_uid IS NOT NULL
              AND mem.fb_customer_id IS NULL
              AND mem.webchat_uid IS NULL
        """))

    # component_interaction_logs 走 line_id → members
    connection.execute(sa.text("""
        UPDATE component_interaction_logs c
        JOIN members mem ON c.line_id = mem.line_uid
        SET c.platform = 'LINE',
            c.channel_id = mem.line_channel_id
        WHERE c.platform IS NULL
          AND mem.line_uid IS NOT NULL
          AND mem.fb_customer_id IS NULL
          AND mem.webchat_uid IS NULL
    """))

    # ---- Priority 2b: member 只綁 Facebook ----
    # members 沒有 fb_channel_id 欄位，先記 platform，channel_id 留 NULL
    for table in ('member_tags', 'member_interaction_tags', 'tag_trigger_logs'):
        connection.execute(sa.text(f"""
            UPDATE {table} t
            JOIN members mem ON t.member_id = mem.id
            SET t.platform = 'Facebook'
            WHERE t.platform IS NULL
              AND mem.fb_customer_id IS NOT NULL
              AND mem.line_uid IS NULL
              AND mem.webchat_uid IS NULL
        """))

    # ---- Priority 2c: member 只綁 Webchat ----
    for table in ('member_tags', 'member_interaction_tags', 'tag_trigger_logs'):
        connection.execute(sa.text(f"""
            UPDATE {table} t
            JOIN members mem ON t.member_id = mem.id
            SET t.platform = 'Webchat',
                t.channel_id = mem.webchat_site_id
            WHERE t.platform IS NULL
              AND mem.webchat_uid IS NOT NULL
              AND mem.line_uid IS NULL
              AND mem.fb_customer_id IS NULL
        """))


def downgrade() -> None:
    """
    Backfill 反向操作：把 platform/channel_id 設回 NULL。
    但這會丟失我們重建的資料，且本 migration 跟 Step 1/2 schema migration 分開，
    通常不需要 downgrade backfill。設為 no-op。
    """
    pass
