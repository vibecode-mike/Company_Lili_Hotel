"""enforce_member_message_constraints

Revision ID: e17f96433862
Revises: 7c62f06b6872
Create Date: 2025-11-14 23:46:09.901920

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e17f96433862'
down_revision: Union[str, None] = '7c62f06b6872'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Member constraints & indexes ---
    op.drop_index(op.f('ix_members_email'), table_name='members')
    op.alter_column(
        'members',
        'email',
        existing_type=sa.String(length=100),
        type_=sa.String(length=255),
        existing_nullable=True,
        existing_comment='電子信箱',
    )
    op.create_unique_constraint('uq_members_email', 'members', ['email'])

    op.alter_column(
        'members',
        'id_number',
        existing_type=sa.String(length=50),
        type_=sa.String(length=20),
        existing_nullable=True,
        existing_comment='身分證/護照號碼',
    )
    op.alter_column(
        'members',
        'residence',
        existing_type=sa.String(length=100),
        type_=sa.String(length=10),
        existing_nullable=True,
        existing_comment='居住地',
    )

    op.create_index(op.f('ix_members_join_source'), 'members', ['join_source'], unique=False)
    op.create_index(op.f('ix_members_last_interaction_at'), 'members', ['last_interaction_at'], unique=False)

    # --- Message scheduling/indexes ---
    op.add_column(
        'messages',
        sa.Column('scheduled_datetime_utc', sa.DateTime(), nullable=True, comment='排程發送時間（UTC）')
    )
    op.execute(
        sa.text(
            """
            UPDATE messages
            SET scheduled_datetime_utc = CASE
                WHEN scheduled_date IS NOT NULL AND scheduled_time IS NOT NULL
                    THEN TIMESTAMP(scheduled_date, scheduled_time)
                ELSE scheduled_datetime_utc
            END
            """
        )
    )
    op.drop_column('messages', 'scheduled_date')
    op.drop_column('messages', 'scheduled_time')
    op.create_index(op.f('ix_messages_scheduled_datetime_utc'), 'messages', ['scheduled_datetime_utc'], unique=False)
    op.create_index(op.f('ix_messages_send_status'), 'messages', ['send_status'], unique=False)
    op.create_index(op.f('ix_messages_send_time'), 'messages', ['send_time'], unique=False)
    op.create_index(op.f('ix_messages_campaign_id'), 'messages', ['campaign_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_messages_campaign_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_send_time'), table_name='messages')
    op.drop_index(op.f('ix_messages_send_status'), table_name='messages')
    op.drop_index(op.f('ix_messages_scheduled_datetime_utc'), table_name='messages')
    op.add_column('messages', sa.Column('scheduled_date', sa.Date(), nullable=True, comment='排程發送日期'))
    op.add_column('messages', sa.Column('scheduled_time', sa.Time(), nullable=True, comment='排程發送時間'))
    op.execute(
        sa.text(
            """
            UPDATE messages
            SET
                scheduled_date = CASE
                    WHEN scheduled_datetime_utc IS NOT NULL THEN DATE(scheduled_datetime_utc)
                    ELSE NULL
                END,
                scheduled_time = CASE
                    WHEN scheduled_datetime_utc IS NOT NULL THEN TIME(scheduled_datetime_utc)
                    ELSE NULL
                END
            """
        )
    )
    op.drop_column('messages', 'scheduled_datetime_utc')

    op.drop_index(op.f('ix_members_last_interaction_at'), table_name='members')
    op.drop_index(op.f('ix_members_join_source'), table_name='members')
    op.alter_column(
        'members',
        'residence',
        existing_type=sa.String(length=10),
        type_=sa.String(length=100),
        existing_nullable=True,
        existing_comment='居住地',
    )
    op.alter_column(
        'members',
        'id_number',
        existing_type=sa.String(length=20),
        type_=sa.String(length=50),
        existing_nullable=True,
        existing_comment='身分證/護照號碼',
    )
    op.drop_constraint('uq_members_email', 'members', type_='unique')
    op.alter_column(
        'members',
        'email',
        existing_type=sa.String(length=255),
        type_=sa.String(length=100),
        existing_nullable=True,
        existing_comment='電子信箱',
    )
    op.create_index(op.f('ix_members_email'), 'members', ['email'], unique=False)
