"""add_component_interaction_tracking

Revision ID: 372c174e7a57
Revises: ee18a4b408e9
Create Date: 2025-10-27 16:46:22.858792

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '372c174e7a57'
down_revision: Union[str, None] = 'ee18a4b408e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create component_interaction_logs table
    op.create_table(
        'component_interaction_logs',
        sa.Column('id', sa.BigInteger(), nullable=False, autoincrement=True),
        sa.Column('member_id', sa.BigInteger(), nullable=False),
        sa.Column('campaign_id', sa.BigInteger(), nullable=False),
        sa.Column('template_id', sa.BigInteger(), nullable=True),
        sa.Column('carousel_item_id', sa.BigInteger(), nullable=True),
        sa.Column('component_slot', sa.String(length=50), nullable=True),
        sa.Column('interaction_tag_id', sa.BigInteger(), nullable=True),
        sa.Column('interaction_type', sa.Enum('image_click', 'button_message', 'button_url', 'button_image', 'postback', name='interaction_type_enum'), nullable=False),
        sa.Column('interaction_value', sa.Text(), nullable=True),
        sa.Column('triggered_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('line_event_type', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['message_templates.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['carousel_item_id'], ['template_carousel_items.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['interaction_tag_id'], ['interaction_tags.id'], ondelete='SET NULL'),
    )

    # Create indexes for performance
    op.create_index('idx_member_campaign', 'component_interaction_logs', ['member_id', 'campaign_id'])
    op.create_index('idx_template_slot', 'component_interaction_logs', ['template_id', 'component_slot'])
    op.create_index('idx_campaign_item', 'component_interaction_logs', ['campaign_id', 'carousel_item_id'])
    op.create_index('idx_triggered_at', 'component_interaction_logs', ['triggered_at'])

    # Add tracking statistics columns to template_carousel_items
    op.add_column('template_carousel_items', sa.Column('click_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('template_carousel_items', sa.Column('unique_click_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('template_carousel_items', sa.Column('last_clicked_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove columns from template_carousel_items
    op.drop_column('template_carousel_items', 'last_clicked_at')
    op.drop_column('template_carousel_items', 'unique_click_count')
    op.drop_column('template_carousel_items', 'click_count')

    # Drop indexes
    op.drop_index('idx_triggered_at', 'component_interaction_logs')
    op.drop_index('idx_campaign_item', 'component_interaction_logs')
    op.drop_index('idx_template_slot', 'component_interaction_logs')
    op.drop_index('idx_member_campaign', 'component_interaction_logs')

    # Drop table
    op.drop_table('component_interaction_logs')

    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS interaction_type_enum')
