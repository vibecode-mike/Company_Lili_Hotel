"""add_template_library_fields

Revision ID: b74208cf303c
Revises: 5bd3e4df787d
Create Date: 2025-11-15 19:18:51.301340

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'b74208cf303c'
down_revision: Union[str, None] = '5bd3e4df787d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add template library management fields to message_templates table
    op.add_column('message_templates', sa.Column('is_in_library', sa.Boolean(), nullable=True, comment='是否在模板庫中'))
    op.add_column('message_templates', sa.Column('source_template_id', sa.BigInteger(), nullable=True, comment='來源模板ID（複製時記錄）'))
    op.add_column('message_templates', sa.Column('usage_count', sa.Integer(), nullable=True, comment='使用次數（複製/使用計數）'))
    op.add_column('message_templates', sa.Column('storage_type', sa.String(length=10), nullable=True, comment='儲存類型：database | cdn'))
    op.add_column('message_templates', sa.Column('flex_message_url', sa.String(length=500), nullable=True, comment='Flex Message CDN URL（>10KB時使用）'))
    op.create_foreign_key('fk_message_templates_source', 'message_templates', 'message_templates', ['source_template_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Remove template library management fields from message_templates table
    op.drop_constraint('fk_message_templates_source', 'message_templates', type_='foreignkey')
    op.drop_column('message_templates', 'flex_message_url')
    op.drop_column('message_templates', 'storage_type')
    op.drop_column('message_templates', 'usage_count')
    op.drop_column('message_templates', 'source_template_id')
    op.drop_column('message_templates', 'is_in_library')
