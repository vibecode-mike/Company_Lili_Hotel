"""rename_legacy_indexes_and_add_missing

Revision ID: a70b4cf1e0a3
Revises: 4a2f2db272a2
Create Date: 2026-05-15 18:07:46.420340

12 個 index drift 對齊 model：

Rename pairs（純改名，欄位不變）：
- uq_members_email          → ix_members_email          (unique)
- ix_members_fb_uid         → ix_members_fb_customer_id (unique)
- idx_members_line_channel_id → ix_members_line_channel_id

Composite replacement（新 index 涵蓋舊 index 的所有用途）：
- idx_auto_response_trigger (trigger_type)
    → ix_auto_responses_trigger_active_created (trigger_type, is_active, created_at)
- ix_conversation_threads_last_message_at (last_message_at)
    → ix_conversation_threads_member_last_msg (member_id, last_message_at)

Drop only（model 不再宣告，現有 query 無對應）：
- idx_keyword_enabled on auto_response_keywords (auto_response_id, is_enabled)

Create only（model 新增）：
- ix_member_tags_tag_name on (tag_name,)

Idempotent: 用 information_schema 預檢；index 存在才 drop、不存在才 create。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a70b4cf1e0a3'
down_revision: Union[str, None] = '4a2f2db272a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _index_exists(name: str, table: str) -> bool:
    """檢查 table 上有沒有名為 name 的 index。"""
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT COUNT(*) FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tbl
          AND INDEX_NAME = :name
    """), {"tbl": table, "name": name}).scalar()
    return result > 0


def upgrade() -> None:
    # === 1. Drop 舊 index ===
    drops = [
        ('idx_keyword_enabled', 'auto_response_keywords'),
        ('idx_auto_response_trigger', 'auto_responses'),
        ('ix_conversation_threads_last_message_at', 'conversation_threads'),
        ('idx_members_line_channel_id', 'members'),
        ('ix_members_fb_uid', 'members'),
        ('uq_members_email', 'members'),
    ]
    for name, tbl in drops:
        if _index_exists(name, tbl):
            op.drop_index(name, table_name=tbl)

    # === 2. Create 新 index ===
    if not _index_exists('ix_auto_responses_trigger_active_created', 'auto_responses'):
        op.create_index(
            'ix_auto_responses_trigger_active_created', 'auto_responses',
            ['trigger_type', 'is_active', 'created_at'],
        )
    if not _index_exists('ix_conversation_threads_member_last_msg', 'conversation_threads'):
        op.create_index(
            'ix_conversation_threads_member_last_msg', 'conversation_threads',
            ['member_id', 'last_message_at'],
        )
    if not _index_exists('ix_member_tags_tag_name', 'member_tags'):
        op.create_index('ix_member_tags_tag_name', 'member_tags', ['tag_name'])
    if not _index_exists('ix_members_email', 'members'):
        op.create_index('ix_members_email', 'members', ['email'], unique=True)
    if not _index_exists('ix_members_fb_customer_id', 'members'):
        op.create_index(
            'ix_members_fb_customer_id', 'members', ['fb_customer_id'], unique=True
        )
    if not _index_exists('ix_members_line_channel_id', 'members'):
        op.create_index('ix_members_line_channel_id', 'members', ['line_channel_id'])


def downgrade() -> None:
    """反向：drop 新 index、重建舊 index（idempotent）。"""
    # 1. Drop 新 index
    new_drops = [
        ('ix_auto_responses_trigger_active_created', 'auto_responses'),
        ('ix_conversation_threads_member_last_msg', 'conversation_threads'),
        ('ix_member_tags_tag_name', 'member_tags'),
        ('ix_members_email', 'members'),
        ('ix_members_fb_customer_id', 'members'),
        ('ix_members_line_channel_id', 'members'),
    ]
    for name, tbl in new_drops:
        if _index_exists(name, tbl):
            op.drop_index(name, table_name=tbl)

    # 2. Re-create 舊 index
    if not _index_exists('idx_keyword_enabled', 'auto_response_keywords'):
        op.create_index(
            'idx_keyword_enabled', 'auto_response_keywords',
            ['auto_response_id', 'is_enabled'],
        )
    if not _index_exists('idx_auto_response_trigger', 'auto_responses'):
        op.create_index('idx_auto_response_trigger', 'auto_responses', ['trigger_type'])
    if not _index_exists('ix_conversation_threads_last_message_at', 'conversation_threads'):
        op.create_index(
            'ix_conversation_threads_last_message_at', 'conversation_threads',
            ['last_message_at'],
        )
    if not _index_exists('idx_members_line_channel_id', 'members'):
        op.create_index('idx_members_line_channel_id', 'members', ['line_channel_id'])
    if not _index_exists('ix_members_fb_uid', 'members'):
        op.create_index('ix_members_fb_uid', 'members', ['fb_customer_id'], unique=True)
    if not _index_exists('uq_members_email', 'members'):
        op.create_index('uq_members_email', 'members', ['email'], unique=True)
