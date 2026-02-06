"""drop_chat_logs_table

Revision ID: fec53deadf8b
Revises: 51ebf14ca5e0
Create Date: 2025-12-11 18:13:05.270826

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fec53deadf8b'
down_revision: Union[str, None] = '51ebf14ca5e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """刪除已棄用的 chat_logs 表，資料已遷移至 conversation_messages"""
    op.drop_table('chat_logs')


def downgrade() -> None:
    """重建 chat_logs 表（僅結構，資料無法還原）"""
    op.create_table(
        'chat_logs',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('platform', sa.String(50), nullable=False, comment='來源平台：LINE/LIFF/後台等'),
        sa.Column('user_id', sa.String(100), nullable=False, index=True, comment='平台使用者識別'),
        sa.Column('direction', sa.String(20), nullable=False, comment='方向：incoming/outgoing'),
        sa.Column('message_type', sa.String(20), nullable=False, comment='訊息類型：text/postback/其他'),
        sa.Column('text', sa.Text(), comment='純文字資訊'),
        sa.Column('content', sa.Text(), comment='完整 payload JSON 字串'),
        sa.Column('event_id', sa.String(100), index=True, comment='事件 ID'),
        sa.Column('status', sa.String(20), comment='狀態：received/sent/failed'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), onupdate=sa.func.now()),
    )
