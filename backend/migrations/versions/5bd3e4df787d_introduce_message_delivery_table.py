"""introduce_message_delivery_table

Revision ID: 5bd3e4df787d
Revises: e17f96433862
Create Date: 2025-11-15 05:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import uuid


# revision identifiers, used by Alembic.
revision: str = '5bd3e4df787d'
down_revision: Union[str, None] = 'e17f96433862'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _generate_delivery_ids(connection):
    deliveries = sa.table(
        'message_deliveries',
        sa.column('id', sa.BigInteger()),
        sa.column('delivery_id', sa.String(length=50)),
    )

    rows = connection.execute(sa.select(deliveries.c.id)).fetchall()
    for row in rows:
        connection.execute(
            deliveries.update()
            .where(deliveries.c.id == row.id)
            .values(delivery_id=uuid.uuid4().hex)
        )


def upgrade() -> None:
    op.rename_table('message_recipients', 'message_deliveries')

    # Rename existing columns to align with spec wording
    op.alter_column(
        'message_deliveries',
        'status',
        new_column_name='delivery_status',
        existing_type=sa.String(length=20),
        nullable=False,
        server_default='pending',
    )
    op.alter_column(
        'message_deliveries',
        'error_message',
        new_column_name='failure_reason',
        existing_type=sa.String(length=500),
    )

    # Drop legacy constraints first (foreign keys before indexes)
    # Note: After rename_table, MySQL auto-renames constraints from message_recipients_* to message_deliveries_*
    with op.batch_alter_table('message_deliveries') as batch_op:
        # Drop foreign key constraints first (MySQL auto-renamed them after table rename)
        batch_op.drop_constraint('message_deliveries_ibfk_1', type_='foreignkey')
        batch_op.drop_constraint('message_deliveries_ibfk_2', type_='foreignkey')
        # Drop unique constraint
        batch_op.drop_constraint('uq_message_member', type_='unique')
        # Now safe to drop indexes
        batch_op.drop_index('ix_message_recipients_member_id')
        batch_op.drop_index('ix_message_recipients_message_id')

    # Add delivery_id surrogate and backfill data
    op.add_column('message_deliveries', sa.Column('delivery_id', sa.String(length=50), nullable=True))
    connection = op.get_bind()
    _generate_delivery_ids(connection)
    op.alter_column('message_deliveries', 'delivery_id',
                    existing_type=sa.String(length=50),
                    nullable=False)

    # Switch primary key from legacy integer id to delivery_id
    inspector = sa.inspect(connection)
    pk = inspector.get_pk_constraint('message_deliveries')
    if pk and pk.get('name'):
        op.drop_constraint(pk['name'], 'message_deliveries', type_='primary')
    op.drop_column('message_deliveries', 'id')
    op.create_primary_key('pk_message_deliveries', 'message_deliveries', ['delivery_id'])

    # Recreate foreign key constraints
    op.create_foreign_key(
        'fk_message_deliveries_message',
        'message_deliveries',
        'messages',
        ['message_id'],
        ['id'],
        ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_message_deliveries_member',
        'message_deliveries',
        'members',
        ['member_id'],
        ['id'],
        ondelete='CASCADE',
    )

    # Recreate constraints/indexes with new naming + additional performance indexes
    op.create_unique_constraint(
        'uq_message_delivery_member',
        'message_deliveries',
        ['message_id', 'member_id'],
    )
    op.create_index('ix_message_deliveries_message_id', 'message_deliveries', ['message_id'])
    op.create_index('ix_message_deliveries_member_id', 'message_deliveries', ['member_id'])
    op.create_index(
        'ix_message_deliveries_member_status',
        'message_deliveries',
        ['member_id', 'delivery_status'],
    )
    op.create_index('ix_message_deliveries_sent_at', 'message_deliveries', ['sent_at'])


def downgrade() -> None:
    # Recreate legacy table structure and move data back
    op.rename_table('message_deliveries', 'message_deliveries_tmp')

    op.create_table(
        'message_recipients',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('message_id', sa.BigInteger(), nullable=False, comment='群發訊息ID'),
        sa.Column('member_id', sa.BigInteger(), nullable=False, comment='會員ID'),
        sa.Column('sent_at', sa.DateTime(), nullable=True, comment='發送時間'),
        sa.Column('opened_at', sa.DateTime(), nullable=True, comment='開啟時間'),
        sa.Column('clicked_at', sa.DateTime(), nullable=True, comment='點擊時間'),
        sa.Column('status', sa.String(length=20), nullable=False, comment='狀態：pending/sent/opened/clicked/failed'),
        sa.Column('error_message', sa.String(length=500), nullable=True, comment='錯誤訊息'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True, comment='建立時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
    )
    op.create_unique_constraint('uq_message_member', 'message_recipients', ['message_id', 'member_id'])
    op.create_index('ix_message_recipients_message_id', 'message_recipients', ['message_id'])
    op.create_index('ix_message_recipients_member_id', 'message_recipients', ['member_id'])

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            INSERT INTO message_recipients (
                message_id, member_id, sent_at, opened_at, clicked_at,
                status, error_message, created_at, updated_at
            )
            SELECT
                message_id, member_id, sent_at, opened_at, clicked_at,
                delivery_status, failure_reason, created_at, updated_at
            FROM message_deliveries_tmp
            """
        )
    )

    op.drop_table('message_deliveries_tmp')
