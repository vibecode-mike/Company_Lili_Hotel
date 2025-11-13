"""create_line_and_conversation_tables

Revision ID: 0fa2372e1ea1
Revises: a80107455d2f
Create Date: 2025-11-13 13:28:02.152636

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0fa2372e1ea1'
down_revision: Union[str, None] = 'a80107455d2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    建立 LINE 和對話相關的表：
    1. line_channels - LINE 頻道設定
    2. conversation_threads - 對話串
    3. conversation_messages - 對話訊息
    """
    from sqlalchemy import inspect
    from alembic import context

    conn = context.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. 建立 line_channels 表
    if 'line_channels' not in existing_tables:
        op.create_table(
            'line_channels',
            sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('channel_access_token', sa.String(length=500), nullable=False, comment='頻道存取權杖'),
            sa.Column('channel_secret', sa.String(length=100), nullable=False, comment='頻道密鑰'),
            sa.Column('liff_id_open', sa.String(length=100), nullable=True, comment='LIFF ID'),
            sa.Column('channel_name', sa.String(length=100), nullable=True, comment='頻道名稱'),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False, comment='是否啟用'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True, comment='建立時間'),
            sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
            sa.PrimaryKeyConstraint('id'),
            comment='LINE 頻道設定表'
        )

    # 2. 建立 conversation_threads 表
    if 'conversation_threads' not in existing_tables:
        op.create_table(
            'conversation_threads',
            sa.Column('id', sa.String(length=100), nullable=False, comment='對話串ID（使用 LINE userId）'),
            sa.Column('conversation_name', sa.String(length=200), nullable=True, comment='對話名稱'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True, comment='建立時間'),
            sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
            sa.PrimaryKeyConstraint('id'),
            comment='對話串表'
        )

    # 3. 建立 conversation_messages 表
    if 'conversation_messages' not in existing_tables:
        op.create_table(
            'conversation_messages',
            sa.Column('id', sa.String(length=100), nullable=False, comment='訊息ID'),
            sa.Column('thread_id', sa.String(length=100), nullable=False, comment='所屬對話串'),
            sa.Column('role', sa.String(length=20), nullable=True, comment='角色'),
            sa.Column('direction', sa.String(length=20), nullable=True, comment='方向：incoming/outgoing'),
            sa.Column('message_type', sa.String(length=50), nullable=True, comment='訊息類型'),
            sa.Column('question', sa.Text(), nullable=True, comment='問題內容'),
            sa.Column('response', sa.Text(), nullable=True, comment='回應內容'),
            sa.Column('event_id', sa.String(length=100), nullable=True, comment='事件ID'),
            sa.Column('status', sa.String(length=20), nullable=True, comment='狀態'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True, comment='建立時間'),
            sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
            sa.ForeignKeyConstraint(['thread_id'], ['conversation_threads.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            comment='對話訊息表'
        )

        # 建立索引
        op.create_index(
            op.f('ix_conversation_messages_thread_id'),
            'conversation_messages',
            ['thread_id'],
            unique=False
        )


def downgrade() -> None:
    """
    移除 LINE 和對話相關的表
    """
    op.drop_index(op.f('ix_conversation_messages_thread_id'), table_name='conversation_messages')
    op.drop_table('conversation_messages')
    op.drop_table('conversation_threads')
    op.drop_table('line_channels')
