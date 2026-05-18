"""backfill platform direction + tighten 5 cols not null

Phase 2.5 NOT NULL drift 清理：5 個欄位收緊到 NOT NULL，配合 model 已宣告 nullable=False。

第 1 類（DB 已無 NULL，直接收緊）：
  - component_interaction_logs.message_id  (BigInt, 0 NULL)
  - conversation_messages.direction        (String(20), 0 NULL)

第 2 類（backfill 後收緊）：
  - conversation_threads.platform         (1 NULL → 'LINE'，row id 'U13ce...' 是 LINE UID 格式)
  - conversation_threads.platform_uid     (1 NULL → 同 row id，LINE 端 thread.id == line_uid)
  - conversation_messages.platform        (62 NULL → 'LINE'，已確認全部隸屬 thread.platform='LINE')

backfill 用 JOIN 推導，不寫死值；idempotent — 重跑等於 no-op。

另：booking_records.member_name/phone/email/selected_rooms + members.gender
是「大量 NULL」類，走 model 放寬路線（不在此 migration），直接改 model 即可
讓 drift 消失。

Revision ID: 1399bb6c7b2e
Revises: cbc986eda16c
Create Date: 2026-05-18 17:17:52.219756

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1399bb6c7b2e'
down_revision: Union[str, None] = 'cbc986eda16c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── Step 1: backfill ─────────────────────────────────────────────
    # conversation_threads: NULL platform 用 'LINE' 補（legacy 推測 + id 是 U 開頭 LINE UID）
    op.execute("""
        UPDATE conversation_threads
        SET platform = 'LINE'
        WHERE platform IS NULL
    """)
    # 同 row 的 platform_uid 用 thread.id 補（LINE 端 thread.id 就是 line_uid）
    op.execute("""
        UPDATE conversation_threads
        SET platform_uid = id
        WHERE platform_uid IS NULL
    """)
    # conversation_messages: NULL platform 從同 thread 的 thread.platform 推回去
    op.execute("""
        UPDATE conversation_messages cm
        JOIN conversation_threads ct ON ct.id = cm.thread_id
        SET cm.platform = ct.platform
        WHERE cm.platform IS NULL
    """)

    # ─── Step 2: tighten NOT NULL ─────────────────────────────────────
    op.alter_column('component_interaction_logs', 'message_id',
                    existing_type=sa.BigInteger(),
                    nullable=False,
                    existing_comment='群發訊息ID')
    op.alter_column('conversation_messages', 'direction',
                    existing_type=sa.String(length=20),
                    nullable=False,
                    existing_comment='方向：incoming/outgoing')
    op.alter_column('conversation_messages', 'platform',
                    existing_type=sa.String(length=20),
                    nullable=False,
                    existing_comment='渠道類型（冗餘欄位，方便查詢）')
    op.alter_column('conversation_threads', 'platform',
                    existing_type=sa.String(length=20),
                    nullable=False,
                    existing_comment='渠道類型：LINE / Facebook / Webchat')
    op.alter_column('conversation_threads', 'platform_uid',
                    existing_type=sa.String(length=100),
                    nullable=False,
                    existing_comment='渠道原始 UID')


def downgrade() -> None:
    # 放鬆 NOT NULL（資料 backfill 不還原 — NULL 本來就是 legacy）
    op.alter_column('conversation_threads', 'platform_uid',
                    existing_type=sa.String(length=100),
                    nullable=True,
                    existing_comment='渠道原始 UID')
    op.alter_column('conversation_threads', 'platform',
                    existing_type=sa.String(length=20),
                    nullable=True,
                    existing_comment='渠道類型：LINE / Facebook / Webchat')
    op.alter_column('conversation_messages', 'platform',
                    existing_type=sa.String(length=20),
                    nullable=True,
                    existing_comment='渠道類型（冗餘欄位，方便查詢）')
    op.alter_column('conversation_messages', 'direction',
                    existing_type=sa.String(length=20),
                    nullable=True,
                    existing_comment='方向：incoming/outgoing')
    op.alter_column('component_interaction_logs', 'message_id',
                    existing_type=sa.BigInteger(),
                    nullable=True,
                    existing_comment='群發訊息ID')
