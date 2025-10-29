"""add_template_id_and_component_slot_to_tracking

Revision ID: 004b8e4d006a
Revises: 372c174e7a57
Create Date: 2025-10-27 16:57:38.029290

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004b8e4d006a'
down_revision: Union[str, None] = '372c174e7a57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add template_id column
    op.add_column('component_interaction_logs',
        sa.Column('template_id', sa.BigInteger(), nullable=True, comment='模板ID')
    )

    # Add component_slot column
    op.add_column('component_interaction_logs',
        sa.Column('component_slot', sa.String(50), nullable=True, comment='模板元件槽位')
    )

    # Add foreign key for template_id
    op.create_foreign_key(
        'fk_component_logs_template',
        'component_interaction_logs',
        'message_templates',
        ['template_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Add indexes
    op.create_index('idx_template_id', 'component_interaction_logs', ['template_id'])
    op.create_index('idx_component_slot', 'component_interaction_logs', ['component_slot'])
    op.create_index('idx_template_slot', 'component_interaction_logs', ['template_id', 'component_slot'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_template_slot', 'component_interaction_logs')
    op.drop_index('idx_component_slot', 'component_interaction_logs')
    op.drop_index('idx_template_id', 'component_interaction_logs')

    # Drop foreign key
    op.drop_constraint('fk_component_logs_template', 'component_interaction_logs', type_='foreignkey')

    # Drop columns
    op.drop_column('component_interaction_logs', 'component_slot')
    op.drop_column('component_interaction_logs', 'template_id')
