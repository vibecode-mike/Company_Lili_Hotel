"""add_multichannel_fields_to_conversation_tables

多渠道支援欄位新增（方案 A：單表 + platform 欄位）

變更說明：
1. conversation_threads 表：
   - 擴展 id 欄位長度 100 → 150（支援 {platform}:{uid} 格式）
   - 新增 member_id（關聯會員，跨渠道整合用）
   - 新增 platform（渠道類型）
   - 新增 platform_uid（渠道原始 UID）
   - 新增 last_message_at（最後訊息時間）
   - 新增 3 個索引

2. conversation_messages 表：
   - 擴展 thread_id 欄位長度 100 → 150
   - 新增 platform（冗餘欄位，方便查詢）
   - 新增 3 個索引

3. 現有資料遷移：
   - 現有資料 platform 預設為 'LINE'
   - 現有資料 platform_uid 從 id 複製

Revision ID: 51ebf14ca5e0
Revises: 0be79d86e643
Create Date: 2025-12-11 01:26:06.855092

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51ebf14ca5e0'
down_revision: Union[str, None] = '0be79d86e643'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================================
    # conversation_threads 表變更
    # =========================================================================

    # 1. 擴展 id 欄位長度（100 → 150）以支援 {platform}:{uid} 格式
    op.alter_column(
        'conversation_threads',
        'id',
        existing_type=sa.String(100),
        type_=sa.String(150),
        existing_nullable=False
    )

    # 2. 新增欄位
    op.add_column(
        'conversation_threads',
        sa.Column('member_id', sa.BigInteger(), nullable=True,
                  comment='關聯會員ID（跨渠道整合用）')
    )
    op.add_column(
        'conversation_threads',
        sa.Column('platform', sa.String(20), nullable=True,
                  comment='渠道類型：LINE / Facebook / Webchat')
    )
    op.add_column(
        'conversation_threads',
        sa.Column('platform_uid', sa.String(100), nullable=True,
                  comment='渠道原始 UID')
    )
    op.add_column(
        'conversation_threads',
        sa.Column('last_message_at', sa.DateTime(), nullable=True,
                  comment='最後訊息時間（用於找最近互動渠道）')
    )

    # 3. 現有資料遷移：設定 platform='LINE'，platform_uid=id
    op.execute("""
        UPDATE conversation_threads
        SET platform = 'LINE',
            platform_uid = id
        WHERE platform IS NULL
    """)

    # 4. 新增外鍵約束
    op.create_foreign_key(
        'fk_conversation_threads_member_id',
        'conversation_threads', 'members',
        ['member_id'], ['id'],
        ondelete='SET NULL'
    )

    # 5. 新增索引
    op.create_index(
        'ix_conversation_threads_member_platform',
        'conversation_threads',
        ['member_id', 'platform']
    )
    op.create_index(
        'ix_conversation_threads_platform_uid',
        'conversation_threads',
        ['platform', 'platform_uid']
    )
    op.create_index(
        'ix_conversation_threads_last_message_at',
        'conversation_threads',
        ['last_message_at']
    )

    # =========================================================================
    # conversation_messages 表變更
    # =========================================================================

    # 1. 擴展 thread_id 欄位長度（100 → 150）
    op.alter_column(
        'conversation_messages',
        'thread_id',
        existing_type=sa.String(100),
        type_=sa.String(150),
        existing_nullable=False
    )

    # 2. 新增 platform 欄位（冗餘欄位，方便查詢）
    op.add_column(
        'conversation_messages',
        sa.Column('platform', sa.String(20), nullable=True,
                  comment='渠道類型（冗餘欄位，方便查詢）')
    )

    # 3. 現有資料遷移：設定 platform='LINE'
    op.execute("""
        UPDATE conversation_messages
        SET platform = 'LINE'
        WHERE platform IS NULL
    """)

    # 4. 新增索引
    op.create_index(
        'ix_conversation_messages_platform',
        'conversation_messages',
        ['platform']
    )
    op.create_index(
        'ix_conversation_messages_created_at',
        'conversation_messages',
        ['created_at']
    )
    op.create_index(
        'ix_conversation_messages_thread_created',
        'conversation_messages',
        ['thread_id', 'created_at']
    )


def downgrade() -> None:
    # =========================================================================
    # conversation_messages 表回滾
    # =========================================================================

    # 1. 移除索引
    op.drop_index('ix_conversation_messages_thread_created', 'conversation_messages')
    op.drop_index('ix_conversation_messages_created_at', 'conversation_messages')
    op.drop_index('ix_conversation_messages_platform', 'conversation_messages')

    # 2. 移除 platform 欄位
    op.drop_column('conversation_messages', 'platform')

    # 3. 還原 thread_id 欄位長度
    op.alter_column(
        'conversation_messages',
        'thread_id',
        existing_type=sa.String(150),
        type_=sa.String(100),
        existing_nullable=False
    )

    # =========================================================================
    # conversation_threads 表回滾
    # =========================================================================

    # 1. 移除索引
    op.drop_index('ix_conversation_threads_last_message_at', 'conversation_threads')
    op.drop_index('ix_conversation_threads_platform_uid', 'conversation_threads')
    op.drop_index('ix_conversation_threads_member_platform', 'conversation_threads')

    # 2. 移除外鍵約束
    op.drop_constraint('fk_conversation_threads_member_id', 'conversation_threads', type_='foreignkey')

    # 3. 移除欄位
    op.drop_column('conversation_threads', 'last_message_at')
    op.drop_column('conversation_threads', 'platform_uid')
    op.drop_column('conversation_threads', 'platform')
    op.drop_column('conversation_threads', 'member_id')

    # 4. 還原 id 欄位長度
    op.alter_column(
        'conversation_threads',
        'id',
        existing_type=sa.String(150),
        type_=sa.String(100),
        existing_nullable=False
    )
