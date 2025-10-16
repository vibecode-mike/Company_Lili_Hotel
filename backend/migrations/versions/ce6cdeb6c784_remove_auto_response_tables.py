"""remove_auto_response_tables

Revision ID: ce6cdeb6c784
Revises: a696d3d03a32
Create Date: 2025-10-16 11:15:01.270257

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce6cdeb6c784'
down_revision: Union[str, None] = 'a696d3d03a32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove auto_response_keywords table (dependent on auto_responses)
    op.drop_table('auto_response_keywords')

    # Remove auto_responses table
    op.drop_table('auto_responses')


def downgrade() -> None:
    # Recreate auto_responses table
    op.create_table(
        'auto_responses',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('trigger_type', sa.Enum('welcome', 'keyword', name='triggertype'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('trigger_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('success_rate', sa.Numeric(5, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Recreate auto_response_keywords table
    op.create_table(
        'auto_response_keywords',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('auto_response_id', sa.BigInteger(), nullable=False),
        sa.Column('keyword', sa.String(100), nullable=False),
        sa.Column('match_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['auto_response_id'], ['auto_responses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_auto_response_keywords_auto_response_id'), 'auto_response_keywords', ['auto_response_id'], unique=False)
    op.create_index(op.f('ix_auto_response_keywords_keyword'), 'auto_response_keywords', ['keyword'], unique=False)
