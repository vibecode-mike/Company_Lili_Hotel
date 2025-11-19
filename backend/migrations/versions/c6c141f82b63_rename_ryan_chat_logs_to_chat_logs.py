"""Rename ryan_chat_logs to chat_logs"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'c6c141f82b63'
down_revision = 'b74208cf303c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if inspector.has_table('ryan_chat_logs'):
        op.rename_table('ryan_chat_logs', 'chat_logs')
    elif not inspector.has_table('chat_logs'):
        op.create_table(
            'chat_logs',
            sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column('platform', sa.String(length=50), nullable=False),
            sa.Column('user_id', sa.String(length=100), nullable=False),
            sa.Column('direction', sa.String(length=20), nullable=False),
            sa.Column('message_type', sa.String(length=20), nullable=False),
            sa.Column('text', sa.Text(), nullable=True),
            sa.Column('content', sa.Text(), nullable=True),
            sa.Column('event_id', sa.String(length=100), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.Index('ix_chat_logs_user_id', 'user_id'),
            sa.Index('ix_chat_logs_event_id', 'event_id'),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    has_chat = inspector.has_table('chat_logs')
    has_ryan = inspector.has_table('ryan_chat_logs')

    if has_chat and not has_ryan:
        op.rename_table('chat_logs', 'ryan_chat_logs')
    elif has_chat:
        op.drop_table('chat_logs')
