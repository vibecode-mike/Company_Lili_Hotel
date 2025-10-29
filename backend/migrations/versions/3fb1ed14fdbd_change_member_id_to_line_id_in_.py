"""change_member_id_to_line_id_in_component_interaction_logs

Revision ID: 3fb1ed14fdbd
Revises: 004b8e4d006a
Create Date: 2025-10-27 17:47:55.832717

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3fb1ed14fdbd'
down_revision: Union[str, None] = '004b8e4d006a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add new line_id column (nullable temporarily)
    op.add_column('component_interaction_logs',
                  sa.Column('line_id', sa.String(100), nullable=True))

    # Step 2: Populate line_id from members table
    op.execute("""
        UPDATE component_interaction_logs cil
        INNER JOIN members m ON cil.member_id = m.id
        SET cil.line_id = m.line_uid
    """)

    # Step 3: Make line_id NOT NULL
    op.alter_column('component_interaction_logs', 'line_id',
                    existing_type=sa.String(100),
                    nullable=False)

    # Step 4: Drop foreign key constraint
    op.drop_constraint('component_interaction_logs_ibfk_1',
                      'component_interaction_logs',
                      type_='foreignkey')

    # Step 5: Drop old index
    op.drop_index('idx_member_campaign', 'component_interaction_logs')

    # Step 6: Drop member_id column
    op.drop_column('component_interaction_logs', 'member_id')

    # Step 7: Create new index
    op.create_index('idx_line_campaign', 'component_interaction_logs',
                    ['line_id', 'campaign_id'])


def downgrade() -> None:
    # Step 1: Add back member_id column (nullable temporarily)
    op.add_column('component_interaction_logs',
                  sa.Column('member_id', sa.BigInteger(), nullable=True))

    # Step 2: Populate member_id from members table
    op.execute("""
        UPDATE component_interaction_logs cil
        INNER JOIN members m ON cil.line_id = m.line_uid
        SET cil.member_id = m.id
    """)

    # Step 3: Make member_id NOT NULL
    op.alter_column('component_interaction_logs', 'member_id',
                    existing_type=sa.BigInteger(),
                    nullable=False)

    # Step 4: Drop new index
    op.drop_index('idx_line_campaign', 'component_interaction_logs')

    # Step 5: Drop line_id column
    op.drop_column('component_interaction_logs', 'line_id')

    # Step 6: Create old index
    op.create_index('idx_member_campaign', 'component_interaction_logs',
                    ['member_id', 'campaign_id'])

    # Step 7: Add back foreign key constraint
    op.create_foreign_key('component_interaction_logs_ibfk_1',
                         'component_interaction_logs', 'members',
                         ['member_id'], ['id'],
                         ondelete='CASCADE')
