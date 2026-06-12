"""add broadcast_message_id to conversation_messages

群發訊息顯示於 1:1 聊天室：conversation_messages 以參照（FK → messages.id）
取得群發 Flex 內容，不複製 flex JSON 本體。

Revision ID: 6c3c9fbc8076
Revises: 2b2c9d28ff86
Create Date: 2026-06-12 15:55:11.729693

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '6c3c9fbc8076'
down_revision: Union[str, None] = '2b2c9d28ff86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(conn, table: str, column: str) -> bool:
    return bool(conn.execute(sa.text("""
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :t AND COLUMN_NAME = :c
    """), {"t": table, "c": column}).scalar())


def _fk_exists(conn, table: str, fk_name: str) -> bool:
    return bool(conn.execute(sa.text("""
        SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = :t AND CONSTRAINT_NAME = :n
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    """), {"t": table, "n": fk_name}).scalar())


def upgrade() -> None:
    # idempotent：dev/staging 可能部分套用過，先以 information_schema 預檢
    conn = op.get_bind()

    if not _column_exists(conn, "conversation_messages", "broadcast_message_id"):
        op.add_column(
            "conversation_messages",
            sa.Column(
                "broadcast_message_id",
                sa.BigInteger(),
                nullable=True,
                comment="若為群發訊息，指向 messages.id（用於還原 Flex 內容）",
            ),
        )

    if not _fk_exists(conn, "conversation_messages", "fk_conversation_messages_broadcast"):
        op.create_foreign_key(
            "fk_conversation_messages_broadcast",
            "conversation_messages",
            "messages",
            ["broadcast_message_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    conn = op.get_bind()

    if _fk_exists(conn, "conversation_messages", "fk_conversation_messages_broadcast"):
        op.drop_constraint(
            "fk_conversation_messages_broadcast",
            "conversation_messages",
            type_="foreignkey",
        )

    if _column_exists(conn, "conversation_messages", "broadcast_message_id"):
        op.drop_column("conversation_messages", "broadcast_message_id")
